import { cloneElement, useEffect, useId, useState, type ReactElement } from "react";
import { useAppStore } from "../../state/appStore";
import { useThemeStore } from "../../state/themeStore";
import { useBranchActions, useBranches, useStashActions, useTagActions, useSyncActions, useSyncStatus, useOutgoing, useIncoming } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { notify } from "../../state/notificationStore";
import { Modal } from "../../components/ui/Modal";
import { useModalClose } from "../../components/ui/modalClose";
import { Tooltip } from "../../components/ui/Tooltip";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Chip, CheckSquare } from "../../components/ui/misc";
import { initials, avatarColor, relativeTime } from "../../lib/format";
import { errMsg, classifySyncError, type SyncErrorKind } from "../../lib/errors";
import { PULL_MODES } from "../../lib/pullModes";
import type { Commit } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

// Real <label htmlFor> bound to the wrapped control's id (generated with
// useId), so every modal field is reachable via getByLabelText and announced
// by assistive tech — not just visually associated by proximity.
function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

function Check({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13 }}>
      <CheckSquare on={on} />
      <span>{children}</span>
    </div>
  );
}

function Actions({ onClose, onConfirm, label, busy, disabled }: { onClose: () => void; onConfirm: () => void; label: string; busy?: boolean; disabled?: boolean }) {
  // Cancel plays the modal's exit animation (context from the Modal shell).
  const requestClose = useModalClose(onClose);
  // `busy` really blocks the click — a double-click must not run the git
  // operation twice.
  const blocked = disabled || busy;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
      <Button onClick={requestClose}>Cancelar</Button>
      <Button variant="primary" onClick={blocked ? undefined : onConfirm} style={disabled ? { opacity: 0.5, cursor: "default" } : busy ? { opacity: 0.7, cursor: "default" } : undefined}>
        {label}
      </Button>
    </div>
  );
}

/** "Fechar" button that exits through the modal's close animation. */
function CloseButton({ onClose }: { onClose: () => void }) {
  const requestClose = useModalClose(onClose);
  return <Button onClick={requestClose}>Fechar</Button>;
}

function Err({ msg }: { msg: string | null }) {
  return msg ? <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{msg}</div> : null;
}

function BranchModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const { create } = useBranchActions(repo.path);
  const [name, setName] = useState("");
  const [checkout, setCheckout] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim() || create.isPending) return;
    setError(null);
    create.mutate(
      { name: name.trim(), checkout },
      {
        onSuccess: () => { toast(checkout ? `Em ${name.trim()}` : `Branch ${name.trim()} criada`); onClose(); },
        onError: (e: unknown) => setError((e as { message?: string })?.message ?? "não foi possível criar a branch"),
      },
    );
  }

  return (
    <Modal title="Nova branch" onClose={onClose}>
      <Field label="Nome da branch">
        <Input autoFocus mono value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="feature/…" />
      </Field>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)" }}>
        <span>A partir de</span>
        <Chip bg="var(--l0bg)" color="var(--l0)" border="var(--l0bd)">{repo.current_branch}</Chip>
      </div>
      <Check on={checkout} onToggle={() => setCheckout((v) => !v)}>Fazer checkout da nova branch</Check>
      <Err msg={error} />
      <Actions onClose={onClose} onConfirm={submit} disabled={!name.trim()} busy={create.isPending} label={create.isPending ? "A criar…" : "Criar branch"} />
    </Modal>
  );
}

function StashModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const setView = useAppStore((s) => s.setView);
  const { create } = useStashActions(repo.path);
  const [message, setMessage] = useState("");
  const [includeStaged, setIncludeStaged] = useState(true);
  const [includeUntracked, setIncludeUntracked] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (create.isPending) return;
    setError(null);
    create.mutate(
      { message, keepIndex: !includeStaged, includeUntracked },
      {
        onSuccess: () => { toast("Alterações guardadas no stash"); onClose(); setView("stashes"); },
        onError: (e: unknown) => setError((e as { message?: string })?.message ?? "não foi possível guardar"),
      },
    );
  }

  return (
    <Modal title="Guardar stash" onClose={onClose}>
      <Field label="Mensagem (opcional)">
        <Input autoFocus value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={`WIP em ${repo.current_branch}`} />
      </Field>
      <Check on={includeStaged} onToggle={() => setIncludeStaged((v) => !v)}>Incluir alterações preparadas</Check>
      <Check on={includeUntracked} onToggle={() => setIncludeUntracked((v) => !v)}>Incluir ficheiros não rastreados</Check>
      <Err msg={error} />
      <Actions onClose={onClose} onConfirm={submit} busy={create.isPending} label={create.isPending ? "A guardar…" : "Guardar"} />
    </Modal>
  );
}

function TagModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const { create } = useTagActions(repo.path);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!name.trim() || create.isPending) return;
    setError(null);
    create.mutate(
      { name: name.trim(), message },
      {
        onSuccess: () => { toast(`Tag ${name.trim()} criada`); onClose(); },
        onError: (e: unknown) => setError((e as { message?: string })?.message ?? "não foi possível criar a tag"),
      },
    );
  }

  return (
    <Modal title="Nova tag" onClose={onClose}>
      <Field label="Nome"><Input autoFocus mono value={name} onChange={(e) => setName(e.target.value)} placeholder="v1.0.0" /></Field>
      <Field label="Mensagem (opcional · cria uma tag anotada)"><Input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Release…" /></Field>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)" }}>
        <span>Em</span>
        <Chip bg="var(--l0bg)" color="var(--l0)" border="var(--l0bd)">{repo.current_branch}</Chip>
      </div>
      <Err msg={error} />
      <Actions onClose={onClose} onConfirm={submit} disabled={!name.trim()} busy={create.isPending} label={create.isPending ? "A criar…" : "Criar tag"} />
    </Modal>
  );
}

function MergeModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useBranches(repo.path);
  const { merge } = useBranchActions(repo.path);
  const [error, setError] = useState<string | null>(null);
  const candidates = (data ?? []).filter((b) => !b.is_remote && !b.is_current);

  function run(name: string) {
    setError(null);
    merge.mutate(name, {
      onSuccess: () => { notify("Merge concluído", `${name} → ${repo.current_branch}`); onClose(); },
      onError: (e: unknown) => {
        const msg = (e as { message?: string })?.message ?? "conflito ou erro no merge";
        setError(msg);
        if (/conflict|conflito/i.test(msg)) notify("Conflitos no merge", "Resolve os ficheiros marcados na Cópia de trabalho", "error", "conflict");
      },
    });
  }

  return (
    <Modal title={`Merge para ${repo.current_branch}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: "var(--text2)" }}>Escolhe a branch a integrar na atual.</div>
      {candidates.length === 0 ? (
        <div style={{ padding: 16, border: "1px dashed var(--btnB)", borderRadius: 10, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>Não há outras branches locais.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
          {candidates.map((b) => (
            <div key={b.name} onClick={() => !merge.isPending && run(b.name)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--panel)", cursor: "pointer" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--l1bg)", border: "1.5px solid var(--l1)", boxSizing: "border-box" }} />
              <span style={{ flex: 1, fontFamily: mono, fontSize: 13 }}>{b.name}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>integrar →</span>
            </div>
          ))}
        </div>
      )}
      <Err msg={error} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <CloseButton onClose={onClose} />
      </div>
    </Modal>
  );
}

function CommitList({ commits, empty }: { commits: Commit[]; empty: string }) {
  if (commits.length === 0) return <div style={{ padding: 16, border: "1px dashed var(--btnB)", borderRadius: 10, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>{empty}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 260, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
      {commits.map((c) => {
        const av = avatarColor(c.author);
        return (
          <div key={c.hash} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 7 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, background: av.bg, color: av.color, flexShrink: 0 }}>{initials(c.author)}</span>
            <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)" }}>{c.hash.slice(0, 7)}</span>
            <span style={{ fontSize: 11, color: "var(--muted)", width: 74, textAlign: "right" }}>{relativeTime(c.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Classified sync failure (auth/network/conflict), distinct from a plain
// unclassified error. The raw git message is always kept visible below the
// guidance — never hidden, same principle as the backend's `friendly()`.
type SyncFailure = { kind: SyncErrorKind; message: string };

const SYNC_FAILURE_COPY: Record<Exclude<SyncErrorKind, "other">, { title: string; body: string }> = {
  auth: {
    title: "Autenticação necessária",
    body: "Configura as credenciais Git para origin (credential manager ou uma chave SSH com o ssh-agent a correr).",
  },
  network: {
    title: "Sem ligação ao remoto",
    body: "Verifica a internet ou o URL do remoto e tenta novamente.",
  },
  conflict: {
    title: "Conflito ao integrar",
    body: "Resolve os ficheiros marcados na Cópia de trabalho e depois continua.",
  },
};

function SyncFailurePanel({ failure }: { failure: SyncFailure }) {
  if (failure.kind === "other") return <Err msg={failure.message} />;
  const copy = SYNC_FAILURE_COPY[failure.kind];
  const tone = failure.kind === "conflict" ? "var(--ddT)" : "var(--stMT)";
  return (
    <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderRadius: 9, border: `1px solid ${tone}`, background: "var(--panel2)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: tone }}>{copy.title}</div>
      <div style={{ fontSize: 12.5, color: "var(--text2)" }}>{copy.body}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: mono, whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>{failure.message}</div>
    </div>
  );
}

function PullModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const sync = useSyncActions(repo.path);
  const { data: status } = useSyncStatus(repo.path);
  const inc = useIncoming(repo.path, true);
  const pullMode = useThemeStore((s) => s.pullMode);
  const [failure, setFailure] = useState<SyncFailure | null>(null);
  const [fetchFailure, setFetchFailure] = useState<SyncFailure | null>(null);

  // Fetch on open so the preview reflects the remote. A failed fetch must NOT
  // read as "up to date" — surface it and mark the preview as stale.
  useEffect(() => {
    sync.fetch.mutate(undefined, {
      onError: (e: unknown) => {
        const msg = errMsg(e, "não foi possível contactar o remoto");
        setFetchFailure({ kind: classifySyncError(msg), message: msg });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commits = inc.data ?? [];
  const count = commits.length || status?.behind || 0;
  const upstream = status?.upstream ?? `origin/${repo.current_branch}`;
  const activeMode = PULL_MODES.find((m) => m.key === pullMode) ?? PULL_MODES[0];

  return (
    <Modal title="Pull de origin" onClose={onClose} width={520}>
      <div style={{ fontSize: 13, color: "var(--text2)" }}>
        {sync.fetch.isPending
          ? "A verificar origin…"
          : fetchFailure
            ? "Não foi possível verificar o remoto — a lista pode estar desatualizada."
            : count > 0
              ? `Pull vai integrar ${count} commit(s) de ${upstream} em ${repo.current_branch}.`
              : `${repo.current_branch} está atualizado com ${upstream}.`}
      </div>
      {fetchFailure && <SyncFailurePanel failure={fetchFailure} />}
      <CommitList commits={commits} empty={fetchFailure ? "Não foi possível obter a lista do remoto." : "Nada para integrar. Estás em dia."} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text2)" }}>
        <span>Modo</span>
        <Chip bg="var(--l0bg)" color="var(--l0)" border="var(--l0bd)" mono={false}>{activeMode.name}</Chip>
        <Tooltip content={activeMode.hint}>
          <span
            tabIndex={0}
            aria-label={`Sobre o modo ${activeMode.name}`}
            style={{ display: "inline-grid", placeItems: "center", width: 15, height: 15, borderRadius: "50%", border: "1px solid var(--btnB)", color: "var(--muted)", fontSize: 10, fontWeight: 700, cursor: "default" }}
          >
            ?
          </span>
        </Tooltip>
      </div>
      {failure && <SyncFailurePanel failure={failure} />}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <CloseButton onClose={onClose} />
        <Button
          variant="primary"
          onClick={() =>
            !sync.pull.isPending &&
            sync.pull.mutate(undefined, {
              onSuccess: () => {
                notify("Pull concluído", `${count} commit(s) integrados em ${repo.current_branch}`, "info", "push");
                onClose();
              },
              onError: (e: unknown) => {
                const msg = errMsg(e, "não foi possível fazer pull");
                const kind = classifySyncError(msg);
                setFailure({ kind, message: msg });
                if (kind === "conflict") notify("Conflitos no pull", "Resolve os ficheiros marcados na Cópia de trabalho", "error", "conflict");
              },
            })
          }
          style={sync.pull.isPending ? { opacity: 0.7, cursor: "default" } : undefined}
        >
          {sync.pull.isPending ? "A integrar…" : "Fazer pull"}
        </Button>
      </div>
    </Modal>
  );
}

function PushModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const sync = useSyncActions(repo.path);
  const { data: status } = useSyncStatus(repo.path);
  const out = useOutgoing(repo.path, true);
  const [failure, setFailure] = useState<SyncFailure | null>(null);
  const commits = out.data ?? [];
  const upstream = status?.upstream ?? `origin/${repo.current_branch}`;

  return (
    <Modal title="Push para origin" onClose={onClose} width={520}>
      <div style={{ fontSize: 13, color: "var(--text2)" }}>
        {commits.length > 0
          ? `Push vai enviar ${commits.length} commit(s) de ${repo.current_branch} para ${upstream}.`
          : `Nada para enviar — ${repo.current_branch} está atualizado com ${upstream}.`}
      </div>
      <CommitList commits={commits} empty="Nada para enviar." />
      {failure && <SyncFailurePanel failure={failure} />}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <CloseButton onClose={onClose} />
        <Button
          variant="primary"
          onClick={() =>
            !sync.push.isPending &&
            sync.push.mutate(undefined, {
              onSuccess: () => { notify("Push concluído", `origin · ${commits.length} commit(s) · ${repo.current_branch}`, "success", "push"); onClose(); },
              onError: (e: unknown) => {
                const msg = errMsg(e, "não foi possível fazer push");
                setFailure({ kind: classifySyncError(msg), message: msg });
              },
            })
          }
          style={sync.push.isPending ? { opacity: 0.7, cursor: "default" } : undefined}
        >
          {sync.push.isPending ? "A enviar…" : "Fazer push"}
        </Button>
      </div>
    </Modal>
  );
}

export function Modals() {
  const modal = useAppStore((s) => s.modal);
  const setModal = useAppStore((s) => s.setModal);
  const close = () => setModal(null);
  if (modal === "branch") return <BranchModal onClose={close} />;
  if (modal === "stash") return <StashModal onClose={close} />;
  if (modal === "tag") return <TagModal onClose={close} />;
  if (modal === "merge") return <MergeModal onClose={close} />;
  if (modal === "pull") return <PullModal onClose={close} />;
  if (modal === "push") return <PushModal onClose={close} />;
  return null;
}
