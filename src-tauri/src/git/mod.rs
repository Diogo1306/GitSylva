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

// Tauri sync commands run on the main thread; heavy git work must go through
// run_blocking/run_mutating or the UI freezes.

thread_local! {
    // Current op name, read by the panic hook for logging.
    pub static CURRENT_OP: std::cell::Cell<Option<&'static str>> = const { std::cell::Cell::new(None) };
}

/// Runs blocking git/filesystem work on the blocking pool; converts a panic into a GitError instead of aborting the process.
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

/// Per-repo write lock: mutating operations queue instead of racing on .git/index.lock; reads stay concurrent.
fn repo_lock(path: &str) -> Arc<Mutex<()>> {
    static LOCKS: OnceLock<Mutex<HashMap<String, Arc<Mutex<()>>>>> = OnceLock::new();
    // Cheap normalization; canonicalize() can hang on a dead network path.
    let key = path.replace('\\', "/").to_lowercase();
    let mut map = LOCKS
        .get_or_init(Default::default)
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    map.entry(key).or_default().clone()
}

/// `run_blocking` serialized per repository, for mutating operations.
pub async fn run_mutating<T, F>(name: &'static str, repo: String, job: F) -> Result<T, GitError>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, GitError> + Send + 'static,
{
    run_blocking(name, move || {
        let lock = repo_lock(&repo);
        // A poisoned lock from an earlier panic must not block the repo forever.
        let _guard = lock.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        job()
    })
    .await
}

/// Hides the child console window on Windows; an unhidden window steals focus and pauses ambient animations on blur. CREATE_NO_WINDOW = 0x08000000.
#[cfg(windows)]
pub fn hide_console(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(0x0800_0000);
}
#[cfg(not(windows))]
pub fn hide_console(_cmd: &mut Command) {}

/// Diffs above this size are truncated before IPC (the frontend can request the full diff); transferring/drawing 20MB in one shot froze the WebView for seconds.
pub const PATCH_CAP_BYTES: usize = 1_500_000;

/// Marker appended to a truncated patch. Diff content lines never start with `\`, so this is unambiguous; the frontend strips it (see diffLimits.ts).
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

/// Trims git's raw stderr. Must NOT prepend any hardcoded-language hint —
/// the frontend classifies/localizes errors itself (see `classifySyncError`
/// in src/lib/errors.ts), which relies on matching raw English substrings.
fn friendly(stderr: &str) -> String {
    let trimmed = stderr.trim();
    if trimmed.is_empty() {
        "git command failed with no error output".to_owned()
    } else {
        trimmed.to_owned()
    }
}

/// Combines STDOUT into the failure message alongside STDERR: a pull conflict's
/// "CONFLICT ..." text lands on STDOUT. stderr stays first so its auth/network substrings stay on top.
pub fn combine_git_streams(stdout: &str, stderr: &str) -> String {
    let err = stderr.trim();
    let out = stdout.trim();
    match (err.is_empty(), out.is_empty()) {
        (false, false) => format!("{err}\n{out}"),
        (true, false) => out.to_owned(),
        _ => err.to_owned(),
    }
}

/// Runs system git in `repo`. GIT_TERMINAL_PROMPT=0 fails fast instead of
/// hanging on a credential prompt; GIT_EDITOR=true stops --continue from
/// opening an editor and blocking.
pub fn run_git(repo: &str, args: &[&str]) -> Result<String, GitError> {
    run_git_capturing(repo, args, false)
}

/// Like `run_git`, but the error message also includes STDOUT (see
/// `combine_git_streams`) — used by `pull`, whose conflict text lands there.
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
    // Log only the subcommand: full args may contain commit messages or credential-embedded URLs.
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

/// Like `run_git`, but kills the process after `secs`. Only for idempotent
/// network ops (fetch) — killing pull/clone mid-write can leave partial state.
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
    // Drain stdout/stderr on threads: avoids deadlock if git fills the pipes before exiting.
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

/// Runs git in `repo` feeding `input` to stdin (used by `git apply`).
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
        // 12 concurrent `git add`s: without the per-repo lock some would race
        // .git/index.lock and fail; the lock queues them so all succeed.
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
        // Small: passes through untouched.
        let small = "diff --git a/x b/x\n+um\n".to_string();
        assert_eq!(cap_patch(small.clone(), 1000), small);

        // Large: cut on a line boundary; multibyte content exercises the UTF-8-safe cut.
        let mut big = String::new();
        for i in 0..200 {
            big.push_str(&format!("+linha çãé {i}\n"));
        }
        let capped = cap_patch(big, 300);
        assert!(capped.len() < 400);
        assert!(capped.ends_with(&format!("{PATCH_TRUNCATED_MARKER}\n")));
        // Every content line stays intact.
        for l in capped.lines() {
            assert!(l.starts_with('+') || l == PATCH_TRUNCATED_MARKER, "linha cortada: {l:?}");
        }
    }

    #[test]
    fn run_git_timeout_kills_a_hung_process() {
        let repo = temp_repo("timeout");
        // `hash-object --stdin` blocks until killed (stdin left open) — deterministic, no network needed.
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
        // Merge conflict text lands on stdout; both streams must survive, stderr first.
        let stderr = "From /tmp/remote\n * branch            main       -> FETCH_HEAD";
        let stdout = "Auto-merging a.txt\nCONFLICT (content): Merge conflict in a.txt\nAutomatic merge failed; fix conflicts and then commit the result.";
        let combined = combine_git_streams(stdout, stderr);
        assert!(combined.contains("CONFLICT"), "{combined:?}");
        assert!(combined.contains("Automatic merge failed"), "{combined:?}");
        assert!(combined.find("From /tmp/remote").unwrap() < combined.find("CONFLICT").unwrap());
    }

    #[test]
    fn friendly_returns_raw_stderr_trimmed_without_any_hint() {
        // Regression: friendly() must not prepend a hardcoded-language hint.
        let raw = "  fatal: Authentication failed for 'https://github.com/x/y.git'\n";
        let out = friendly(raw);
        assert_eq!(out, "fatal: Authentication failed for 'https://github.com/x/y.git'");
        assert!(!out.contains("Autenticação"), "{out:?}");
        assert!(!out.contains("Sem ligação"), "{out:?}");
    }

    #[test]
    fn friendly_preserves_raw_substrings_the_frontend_classifier_matches_on() {
        // classifySyncError (src/lib/errors.ts) matches these substrings byte-for-byte.
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
        // git can exit non-zero with empty stderr; the caller must never see an empty message.
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
        // A panic inside a command must become a GitError, never abort the process.
        let err = tauri::async_runtime::block_on(run_blocking::<(), _>("test_panic", || {
            panic!("boom de teste")
        }))
        .unwrap_err();
        assert_eq!(err.code, "internal_panic");
    }
}
