import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useBranchActions, useBranches, useStashActions, useTagActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Chip, CheckSquare } from "../../components/ui/misc";

const mono = "'JetBrains Mono', monospace";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>{label}</div>
      {children}
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
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
      <Button onClick={onClose}>Cancelar</Button>
      <Button variant="primary" onClick={disabled ? undefined : onConfirm} style={disabled ? { opacity: 0.5, cursor: "default" } : busy ? { opacity: 0.7 } : undefined}>
        {label}
      </Button>
    </div>
  );
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
    if (!name.trim()) return;
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
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    create.mutate(
      { message, keepIndex: !includeStaged },
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
    if (!name.trim()) return;
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
      onSuccess: () => { toast(`${name} integrada em ${repo.current_branch}`); onClose(); },
      onError: (e: unknown) => setError((e as { message?: string })?.message ?? "conflito ou erro no merge"),
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
        <Button onClick={onClose}>Fechar</Button>
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
  return null;
}
