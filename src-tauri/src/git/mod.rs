pub mod repo;
pub mod status;
pub mod stage;
pub mod commit;
pub mod log;
pub mod diff;
pub mod hunk;
pub mod detail;
pub mod branches;
pub mod stashes;
pub mod tags;
pub mod sync;
pub mod config;
pub mod rewrite;
pub mod blame;
pub mod conflict;

use crate::error::GitError;
use std::collections::HashMap;
use std::io::Write;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Instant;

// ── Execução fora da main thread ─────────────────────────────────────────────
//
// Comandos #[tauri::command] síncronos correm NA MAIN THREAD da janela (o
// handler IPC do wry vive no event loop). Um `git fetch` de 10s congelava a UI
// inteira e o Windows marcava a janela como "não responde". Por isso todos os
// comandos são wrappers `async fn` finos que despacham o trabalho bloqueante
// para a blocking pool do tokio via `run_blocking`/`run_mutating`.

thread_local! {
    // Nome da operação em curso nesta thread — lido pelo panic hook para o log.
    pub static CURRENT_OP: std::cell::Cell<Option<&'static str>> = const { std::cell::Cell::new(None) };
}

/// Corre um trabalho git/filesystem bloqueante na blocking pool. Mede a
/// duração, regista comandos lentos e converte um panic do trabalho num
/// GitError (o processo NUNCA aborta por causa de um comando).
pub async fn run_blocking<T, F>(name: &'static str, job: F) -> Result<T, GitError>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, GitError> + Send + 'static,
{
    let started = Instant::now();
    let joined = tauri::async_runtime::spawn_blocking(move || {
        CURRENT_OP.with(|op| op.set(Some(name)));
        let out = job();
        CURRENT_OP.with(|op| op.set(None));
        out
    })
    .await;
    let ms = started.elapsed().as_millis();
    match &joined {
        Ok(Ok(_)) if ms >= 500 => ::log::warn!("{name}: concluído em {ms}ms (lento)"),
        Ok(Ok(_)) => ::log::debug!("{name}: concluído em {ms}ms"),
        Ok(Err(e)) => ::log::warn!("{name}: falhou em {ms}ms — {}", e.code),
        Err(e) => ::log::error!("{name}: PANIC após {ms}ms — {e}"),
    }
    joined.map_err(|e| GitError {
        code: "internal_panic".into(),
        message: format!("falha interna em {name}: {e}"),
    })?
}

/// Uma entrada de lock por repositório: operações que ESCREVEM no repo entram
/// em fila em vez de disputarem o .git/index.lock (duplo clique, fetch do
/// atalho durante um pull, etc.). Leituras continuam concorrentes.
fn repo_lock(path: &str) -> Arc<Mutex<()>> {
    static LOCKS: OnceLock<Mutex<HashMap<String, Arc<Mutex<()>>>>> = OnceLock::new();
    // Normalização barata; canonicalize() pode pendurar num caminho de rede morto.
    let key = path.replace('\\', "/").to_lowercase();
    let mut map = LOCKS
        .get_or_init(Default::default)
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    map.entry(key).or_default().clone()
}

/// `run_blocking` serializado por repositório — para operações mutantes.
pub async fn run_mutating<T, F>(name: &'static str, repo: String, job: F) -> Result<T, GitError>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, GitError> + Send + 'static,
{
    run_blocking(name, move || {
        let lock = repo_lock(&repo);
        // Um panic anterior com o lock preso não pode bloquear o repo para sempre.
        let _guard = lock.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        job()
    })
    .await
}

/// Esconde a janela de consola dos processos filho no Windows. Sem isto, cada
/// spawn de git abre um terminal visível QUE ROUBA O FOCO à janela — além do
/// flicker, as animações ambientais pausam a cada ação (data-win-hidden é
/// ativado no blur). CREATE_NO_WINDOW = 0x08000000.
#[cfg(windows)]
pub fn hide_console(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(0x0800_0000);
}
#[cfg(not(windows))]
pub fn hide_console(_cmd: &mut Command) {}

/// Diffs acima deste tamanho são cortados antes do IPC (o utilizador pode
/// pedir o diff completo). Transferir e desenhar 20MB num só passo era um
/// freeze de vários segundos no WebView.
pub const PATCH_CAP_BYTES: usize = 1_500_000;

/// Linha-marcador anexada a um patch cortado. Linhas de conteúdo de um diff
/// nunca começam por `\`, por isso é inequívoca; o frontend remove-a e mostra
/// "Carregar diff completo" (ver diffLimits.ts).
pub const PATCH_TRUNCATED_MARKER: &str = "\\ gitsylva:truncated";

/// Corta um patch em ~`max` bytes, numa fronteira de linha (e de char UTF-8),
/// e anexa o marcador. Patches pequenos passam intactos.
pub fn cap_patch(patch: String, max: usize) -> String {
    if patch.len() <= max {
        return patch;
    }
    let mut end = max;
    while end > 0 && !patch.is_char_boundary(end) {
        end -= 1;
    }
    let cut = patch[..end].rfind('\n').unwrap_or(0);
    format!("{}\n{}\n", &patch[..cut], PATCH_TRUNCATED_MARKER)
}

/// Trim git's raw stderr for a failed command.
///
/// This used to prepend a hardcoded Portuguese hint sentence ahead of the raw
/// text. That is now redundant AND an i18n bug: the frontend classifies and
/// localizes auth/network/conflict guidance itself in the user's chosen
/// language (see `classifySyncError` in src/lib/errors.ts and
/// `SyncFailurePanel` in src/features/shell/Modals.tsx), so a hardcoded-PT
/// hint from the backend would render verbatim Portuguese prose under an
/// English UI. Return the raw stderr (trimmed) instead — this keeps the
/// stable English substrings ("Authentication failed", "could not read
/// Username", "Could not resolve host", "CONFLICT", "Automatic merge
/// failed", …) that `classifySyncError` matches on, unchanged. Non-sync
/// error surfaces now show this raw, technical (English) text directly,
/// which is the intended outcome — never a hidden or empty message.
fn friendly(stderr: &str) -> String {
    let trimmed = stderr.trim();
    if trimmed.is_empty() {
        "git command failed with no error output".to_owned()
    } else {
        trimmed.to_owned()
    }
}

/// Combine git's STDOUT into the failure message alongside STDERR. Most git
/// failures put the actionable text on stderr, but a merge-mode `git pull`
/// conflict prints "CONFLICT (content): ..." and "Automatic merge failed; ..."
/// to STDOUT while stderr only carries the fetch summary. stderr is kept
/// FIRST so the auth/network/lock substrings (all on stderr) stay at the top
/// of the message; stdout is appended when it adds anything, so a conflict
/// stays visible and classifiable downstream.
pub fn combine_git_streams(stdout: &str, stderr: &str) -> String {
    let err = stderr.trim();
    let out = stdout.trim();
    match (err.is_empty(), out.is_empty()) {
        (false, false) => format!("{err}\n{out}"),
        (true, false) => out.to_owned(),
        _ => err.to_owned(),
    }
}

/// Run the system git in `repo` with `args`. Returns stdout on success.
///
/// GIT_TERMINAL_PROMPT=0 makes network operations fail fast instead of hanging
/// on a credential prompt. GIT_EDITOR=true stops merge/rebase --continue from
/// opening an editor and blocking. A GUI must never block on either.
pub fn run_git(repo: &str, args: &[&str]) -> Result<String, GitError> {
    run_git_capturing(repo, args, false)
}

/// Like `run_git`, but on failure the error message includes git's STDOUT as
/// well as STDERR (see `combine_git_streams`). Used by `pull`: a merge-mode
/// conflict's "CONFLICT ..."/"Automatic merge failed ..." text is on STDOUT,
/// which `run_git` discards — the frontend would otherwise receive only the
/// fetch summary and never classify the failure as a conflict.
pub fn run_git_full(repo: &str, args: &[&str]) -> Result<String, GitError> {
    run_git_capturing(repo, args, true)
}

fn run_git_capturing(repo: &str, args: &[&str], include_stdout_on_error: bool) -> Result<String, GitError> {
    let started = Instant::now();
    let mut cmd = Command::new("git");
    cmd.arg("-C")
        .arg(repo)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_EDITOR", "true");
    hide_console(&mut cmd);
    let output = cmd.output().map_err(|e| GitError {
        code: "spawn_failed".into(),
        message: format!("could not run git: {e}"),
    })?;
    // Só o subcomando: os args completos podem conter mensagens de commit ou
    // URLs com credenciais embebidas — nunca vão para o log.
    let sub = args.first().copied().unwrap_or("");
    let ms = started.elapsed().as_millis();
    if ms >= 1000 {
        ::log::warn!("git {sub}: {ms}ms (lento), exit {:?}", output.status.code());
    } else {
        ::log::debug!("git {sub}: {ms}ms, exit {:?}", output.status.code());
    }
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message = if include_stdout_on_error {
            friendly(&combine_git_streams(&String::from_utf8_lossy(&output.stdout), &stderr))
        } else {
            friendly(&stderr)
        };
        Err(GitError { code: "git_failed".into(), message })
    }
}

/// Como `run_git`, mas mata o processo git se exceder `secs`. Usado em
/// operações de rede idempotentes (fetch): uma ligação em buraco negro não
/// pode deixar um "A verificar origin…" pendurado para sempre. NÃO usar em
/// pull/clone — matá-los a meio pode deixar estado parcial.
pub fn run_git_timeout(repo: &str, args: &[&str], secs: u64) -> Result<String, GitError> {
    run_git_timeout_inner(repo, args, secs, false)
}

fn run_git_timeout_inner(repo: &str, args: &[&str], secs: u64, hold_stdin: bool) -> Result<String, GitError> {
    let started = Instant::now();
    let mut cmd = Command::new("git");
    cmd.arg("-C")
        .arg(repo)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_EDITOR", "true")
        .stdin(if hold_stdin { Stdio::piped() } else { Stdio::null() })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    hide_console(&mut cmd);
    let mut child = cmd.spawn().map_err(|e| GitError {
        code: "spawn_failed".into(),
        message: format!("could not run git: {e}"),
    })?;
    // Ler stdout/stderr em threads evita deadlock se o git encher os pipes
    // antes de terminar.
    fn drain(pipe: Option<impl std::io::Read + Send + 'static>) -> std::thread::JoinHandle<String> {
        std::thread::spawn(move || {
            let mut s = String::new();
            if let Some(mut p) = pipe {
                let _ = p.read_to_string(&mut s);
            }
            s
        })
    }
    let out_thread = drain(child.stdout.take());
    let err_thread = drain(child.stderr.take());
    let sub = args.first().copied().unwrap_or("").to_string();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let stdout = out_thread.join().unwrap_or_default();
                let stderr = err_thread.join().unwrap_or_default();
                let ms = started.elapsed().as_millis();
                ::log::debug!("git {sub}: {ms}ms, exit {:?}", status.code());
                return if status.success() {
                    Ok(stdout)
                } else {
                    Err(GitError { code: "git_failed".into(), message: friendly(&stderr) })
                };
            }
            Ok(None) => {}
            Err(e) => {
                return Err(GitError { code: "wait_failed".into(), message: format!("wait failed: {e}") });
            }
        }
        if started.elapsed().as_secs() >= secs {
            let _ = child.kill();
            let _ = child.wait();
            ::log::warn!("git {sub}: TIMEOUT após {secs}s — processo terminado");
            return Err(GitError {
                code: "timeout".into(),
                message: format!("a operação excedeu {secs}s e foi cancelada — verifica a ligação ao remoto"),
            });
        }
        std::thread::sleep(std::time::Duration::from_millis(120));
    }
}

/// Run git in `repo` feeding `input` to stdin. Used for `git apply`, which reads
/// a patch from stdin. Same environment guards as `run_git`.
pub fn run_git_stdin(repo: &str, args: &[&str], input: &str) -> Result<String, GitError> {
    let mut cmd = Command::new("git");
    cmd.arg("-C")
        .arg(repo)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_EDITOR", "true")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    hide_console(&mut cmd);
    let mut child = cmd.spawn().map_err(|e| GitError {
        code: "spawn_failed".into(),
        message: format!("could not run git: {e}"),
    })?;
    child
        .stdin
        .take()
        .ok_or_else(|| GitError { code: "spawn_failed".into(), message: "no stdin".into() })?
        .write_all(input.as_bytes())
        .map_err(|e| GitError { code: "spawn_failed".into(), message: format!("write failed: {e}") })?;
    let output = child.wait_with_output().map_err(|e| GitError {
        code: "spawn_failed".into(),
        message: format!("could not run git: {e}"),
    })?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        Err(GitError {
            code: "git_failed".into(),
            message: String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-test-{}-{name}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "test@test.com"]).unwrap();
        run_git(&p, &["config", "user.name", "Test"]).unwrap();
        p
    }

    #[test]
    fn run_git_reports_current_branch_error_free() {
        let repo = temp_repo("branch");
        let out = run_git(&repo, &["rev-parse", "--is-inside-work-tree"]).unwrap();
        assert_eq!(out.trim(), "true");
    }

    #[test]
    fn run_git_returns_error_on_bad_command() {
        let repo = temp_repo("badcmd");
        let err = run_git(&repo, &["not-a-command"]).unwrap_err();
        assert_eq!(err.code, "git_failed");
    }

    #[test]
    fn run_mutating_serializes_writes_to_the_same_repo() {
        let p = temp_repo("mutlock");
        for i in 0..12 {
            fs::write(format!("{p}/f{i}.txt"), "x").unwrap();
        }
        // 12 `git add` concorrentes: sem o lock por repositório, vários
        // processos disputam .git/index.lock e alguns falham. Com o lock,
        // entram em fila e todos têm de suceder.
        let results = tauri::async_runtime::block_on(async {
            let mut handles = Vec::new();
            for i in 0..12 {
                let repo = p.clone();
                handles.push(tauri::async_runtime::spawn(async move {
                    let file = format!("f{i}.txt");
                    run_mutating("test_stage", repo.clone(), move || {
                        run_git(&repo, &["add", "--", &file]).map(|_| ())
                    })
                    .await
                }));
            }
            let mut out = Vec::new();
            for h in handles {
                out.push(h.await.unwrap());
            }
            out
        });
        assert!(results.iter().all(|r| r.is_ok()), "{results:?}");
        let staged = run_git(&p, &["diff", "--cached", "--name-only"]).unwrap();
        assert_eq!(staged.lines().count(), 12);
    }

    #[test]
    fn cap_patch_keeps_small_patches_and_cuts_on_line_boundary() {
        // Pequeno: intacto.
        let small = "diff --git a/x b/x\n+um\n".to_string();
        assert_eq!(cap_patch(small.clone(), 1000), small);

        // Grande: cortado em fronteira de linha, com o marcador no fim.
        // Conteúdo multibyte garante que o corte respeita UTF-8.
        let mut big = String::new();
        for i in 0..200 {
            big.push_str(&format!("+linha çãé {i}\n"));
        }
        let capped = cap_patch(big, 300);
        assert!(capped.len() < 400);
        assert!(capped.ends_with(&format!("{PATCH_TRUNCATED_MARKER}\n")));
        // Todas as linhas de conteúdo continuam completas.
        for l in capped.lines() {
            assert!(l.starts_with('+') || l == PATCH_TRUNCATED_MARKER, "linha cortada: {l:?}");
        }
    }

    #[test]
    fn run_git_timeout_kills_a_hung_process() {
        let repo = temp_repo("timeout");
        // `hash-object --stdin` com o stdin aberto (e nunca fechado) bloqueia
        // até ser morto — determinístico, sem depender de rede.
        let t0 = std::time::Instant::now();
        let err = run_git_timeout_inner(&repo, &["hash-object", "--stdin"], 1, true).unwrap_err();
        assert_eq!(err.code, "timeout");
        assert!(t0.elapsed().as_secs() < 10);
    }

    #[test]
    fn run_git_timeout_passes_output_through() {
        let repo = temp_repo("timeout-ok");
        let out = run_git_timeout(&repo, &["rev-parse", "--is-inside-work-tree"], 30).unwrap();
        assert_eq!(out.trim(), "true");
    }

    #[test]
    fn combine_git_streams_keeps_stdout_conflict_text_after_stderr() {
        // A merge-mode pull conflict: fetch summary on stderr, the conflict
        // text on stdout. run_git discards stdout, so `pull` uses run_git_full
        // which combines them — both halves must survive, stderr first.
        let stderr = "From /tmp/remote\n * branch            main       -> FETCH_HEAD";
        let stdout = "Auto-merging a.txt\nCONFLICT (content): Merge conflict in a.txt\nAutomatic merge failed; fix conflicts and then commit the result.";
        let combined = combine_git_streams(stdout, stderr);
        assert!(combined.contains("CONFLICT"), "{combined:?}");
        assert!(combined.contains("Automatic merge failed"), "{combined:?}");
        // stderr stays first so the auth/network detection substrings (all on
        // stderr) stay ahead of the conflict text.
        assert!(combined.find("From /tmp/remote").unwrap() < combined.find("CONFLICT").unwrap());
    }

    #[test]
    fn friendly_returns_raw_stderr_trimmed_without_any_hint() {
        // Regression for the i18n leak: friendly() must NOT prepend any
        // hardcoded-language prose (the frontend now owns that guidance).
        let raw = "  fatal: Authentication failed for 'https://github.com/x/y.git'\n";
        let out = friendly(raw);
        assert_eq!(out, "fatal: Authentication failed for 'https://github.com/x/y.git'");
        assert!(!out.contains("Autenticação"), "{out:?}");
        assert!(!out.contains("Sem ligação"), "{out:?}");
    }

    #[test]
    fn friendly_preserves_raw_substrings_the_frontend_classifier_matches_on() {
        // src/lib/errors.ts classifySyncError matches on these RAW git
        // strings — friendly() must keep them byte-for-byte.
        let cases = [
            "fatal: Authentication failed for 'https://github.com/x/y.git'",
            "fatal: could not read Username for 'https://github.com': terminal prompts disabled",
            "fatal: unable to access 'https://x': Could not resolve host: github.com",
            "git@github.com: Permission denied (publickey).",
            "CONFLICT (content): Merge conflict in a.txt\nAutomatic merge failed; fix conflicts and then commit the result.",
        ];
        for raw in cases {
            assert_eq!(friendly(raw), raw, "friendly() altered a raw substring in {raw:?}");
        }
    }

    #[test]
    fn friendly_falls_back_to_a_neutral_message_when_stderr_is_empty() {
        // git can exit non-zero with nothing on stderr; the caller must never
        // see an empty error message.
        let out = friendly("");
        assert!(!out.is_empty());
        let out2 = friendly("   \n  ");
        assert!(!out2.is_empty());
    }

    #[test]
    fn combine_git_streams_falls_back_to_a_single_stream() {
        assert_eq!(combine_git_streams("", "só stderr"), "só stderr");
        assert_eq!(combine_git_streams("só stdout", ""), "só stdout");
        assert_eq!(combine_git_streams("  ", "  "), "");
    }

    #[test]
    fn run_blocking_converts_panic_into_error() {
        // Um panic num comando tem de virar GitError — nunca abortar o processo.
        let err = tauri::async_runtime::block_on(run_blocking::<(), _>("test_panic", || {
            panic!("boom de teste")
        }))
        .unwrap_err();
        assert_eq!(err.code, "internal_panic");
    }
}
