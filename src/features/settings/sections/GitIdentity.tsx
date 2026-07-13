import { useState } from "react";
import { useAppStore } from "../../../state/appStore";
import { useIdentity, useSetIdentity } from "../../../state/queries";
import { toast } from "../../../state/toastStore";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { SectionTitle, Hint } from "./_shared";

export function GitIdentity() {
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useIdentity(repo.path);
  const save = useSetIdentity(repo.path);
  // null = "not edited yet": the fields show the identity from git until the
  // user types, so no effect is needed to sync server data into local state.
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const name = nameEdit ?? data?.name ?? "";
  const email = emailEdit ?? data?.email ?? "";
  const setName = setNameEdit;
  const setEmail = setEmailEdit;

  const changed = !!data && (name !== data.name || email !== data.email);

  return (
    <div id="set-git" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>GIT</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Nome</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="O teu nome" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Email</div>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@exemplo.dev" />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button
          variant="primary"
          onClick={() =>
            changed &&
            !save.isPending &&
            save.mutate(
              { name, email },
              {
                onSuccess: () => { toast("Identidade guardada"); setNameEdit(null); setEmailEdit(null); },
                onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível guardar a identidade", "error"),
              },
            )
          }
          style={changed ? undefined : { opacity: 0.5, cursor: "default", background: "var(--btn)", color: "var(--muted)", border: "1px solid var(--btnB)" }}
        >
          {save.isPending ? "A guardar…" : "Guardar identidade"}
        </Button>
        <Hint>Usada nos commits deste repositório.</Hint>
      </div>
    </div>
  );
}
