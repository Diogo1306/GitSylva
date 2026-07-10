import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useBranchActions, useStashActions, useTagActions } from "../../state/queries";
import { toast } from "../../state/toastStore";

const mono = "'JetBrains Mono', monospace";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", animation: "fadeIn 0.18s ease both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, boxSizing: "border-box", background: "var(--win)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "0 24px 80px rgba(0,0,0,0.35)", padding: 20, display: "flex", flexDirection: "column", gap: 14, color: "var(--text)", animation: "popIn 0.22s cubic-bezier(0.2,0.9,0.3,1) both" }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{title}</div>
          <div onClick={onClose} className="gs-row" style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--muted)", fontSize: 14 }}>✕</div>
        </div>
        {children}
      </div>
    </div>
  );
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
        onSuccess: () => {
          toast(checkout ? `Criada e em ${name.trim()}` : `Branch ${name.trim()} criada`);
          onClose();
        },
        onError: (e: unknown) => setError((e as { message?: string })?.message ?? "não foi possível criar a branch"),
      },
    );
  }

  return (
    <ModalShell title="Nova branch" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Nome da branch</div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="feature/…"
          style={{ background: "var(--input)", border: "1px solid var(--btnB)", borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: mono, boxSizing: "border-box" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)" }}>
        <span>A partir de</span>
        <span style={{ fontFamily: mono, fontSize: 12, color: "var(--l0)", background: "var(--l0bg)", border: "1px solid var(--l0bd)", padding: "2px 9px", borderRadius: 999 }}>{repo.current_branch}</span>
      </div>
      <div onClick={() => setCheckout((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13 }}>
        <span style={{ width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: checkout ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 11, fontWeight: 800 }}>
          {checkout ? "✓" : ""}
        </span>
        <span>Fazer checkout da nova branch</span>
      </div>
      {error && <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
        <div onClick={onClose} className="gs-lift" style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid var(--btnB)", background: "var(--btn)", color: "var(--btnT)", fontSize: 13, cursor: "pointer" }}>Cancelar</div>
        <div
          onClick={submit}
          className="gs-press"
          style={{ padding: "9px 18px", borderRadius: 9, background: name.trim() ? "var(--accent)" : "var(--btn)", color: name.trim() ? "var(--accentT)" : "var(--muted)", border: name.trim() ? "none" : "1px solid var(--btnB)", fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default", opacity: create.isPending ? 0.7 : 1 }}
        >
          {create.isPending ? "A criar…" : "Criar branch"}
        </div>
      </div>
    </ModalShell>
  );
}

function StashModal({ onClose }: { onClose: () => void }) {
  const repo = useAppStore((s) => s.repo)!;
  const setView = useAppStore((s) => s.setView);
  const { create } = useStashActions(repo.path);
  const [message, setMessage] = useState("");
  // "include staged" = normal stash; unchecked keeps staged in the index.
  const [includeStaged, setIncludeStaged] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    create.mutate(
      { message, keepIndex: !includeStaged },
      {
        onSuccess: () => {
          toast("Alterações guardadas no stash");
          onClose();
          setView("stashes");
        },
        onError: (e: unknown) => setError((e as { message?: string })?.message ?? "não foi possível guardar"),
      },
    );
  }

  return (
    <ModalShell title="Guardar stash" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Mensagem (opcional)</div>
        <input
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`WIP em ${repo.current_branch}`}
          style={{ background: "var(--input)", border: "1px solid var(--btnB)", borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: "var(--font)", boxSizing: "border-box" }}
        />
      </div>
      <div onClick={() => setIncludeStaged((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13 }}>
        <span style={{ width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: includeStaged ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 11, fontWeight: 800 }}>
          {includeStaged ? "✓" : ""}
        </span>
        <span>Incluir alterações preparadas</span>
      </div>
      {error && <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
        <div onClick={onClose} className="gs-lift" style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid var(--btnB)", background: "var(--btn)", color: "var(--btnT)", fontSize: 13, cursor: "pointer" }}>Cancelar</div>
        <div onClick={submit} className="gs-press" style={{ padding: "9px 18px", borderRadius: 9, background: "var(--accent)", color: "var(--accentT)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: create.isPending ? 0.7 : 1 }}>
          {create.isPending ? "A guardar…" : "Guardar"}
        </div>
      </div>
    </ModalShell>
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
        onSuccess: () => {
          toast(`Tag ${name.trim()} criada`);
          onClose();
        },
        onError: (e: unknown) => setError((e as { message?: string })?.message ?? "não foi possível criar a tag"),
      },
    );
  }

  return (
    <ModalShell title="Nova tag" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Nome</div>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="v1.0.0" style={{ background: "var(--input)", border: "1px solid var(--btnB)", borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: mono, boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Mensagem (opcional · cria uma tag anotada)</div>
        <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Release…" style={{ background: "var(--input)", border: "1px solid var(--btnB)", borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: "var(--font)", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)" }}>
        <span>Em</span>
        <span style={{ fontFamily: mono, fontSize: 12, color: "var(--l0)", background: "var(--l0bg)", border: "1px solid var(--l0bd)", padding: "2px 9px", borderRadius: 999 }}>{repo.current_branch}</span>
      </div>
      {error && <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
        <div onClick={onClose} className="gs-lift" style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid var(--btnB)", background: "var(--btn)", color: "var(--btnT)", fontSize: 13, cursor: "pointer" }}>Cancelar</div>
        <div onClick={submit} className="gs-press" style={{ padding: "9px 18px", borderRadius: 9, background: name.trim() ? "var(--accent)" : "var(--btn)", color: name.trim() ? "var(--accentT)" : "var(--muted)", border: name.trim() ? "none" : "1px solid var(--btnB)", fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default", opacity: create.isPending ? 0.7 : 1 }}>
          {create.isPending ? "A criar…" : "Criar tag"}
        </div>
      </div>
    </ModalShell>
  );
}

export function Modals() {
  const modal = useAppStore((s) => s.modal);
  const setModal = useAppStore((s) => s.setModal);
  const close = () => setModal(null);
  if (modal === "branch") return <BranchModal onClose={close} />;
  if (modal === "stash") return <StashModal onClose={close} />;
  if (modal === "tag") return <TagModal onClose={close} />;
  return null;
}
