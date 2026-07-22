import { useState } from "react";
import { useAppStore } from "../../../state/appStore";
import { useIdentity, useSetIdentity } from "../../../state/queries";
import { toast } from "../../../state/toastStore";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { SectionTitle, Hint } from "./_shared";
import { useT } from "../../../i18n";

const fieldLabelStyle = { fontSize: "var(--fs-btn)", fontWeight: "var(--fw-semibold)", color: "var(--text2)" } as const;

export function GitIdentity() {
  const t = useT();
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
      <SectionTitle>{t("settings.git.title")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label={<span style={fieldLabelStyle}>{t("settings.git.name")}</span>}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.git.namePlaceholder")} />
        </FormField>
        <FormField label={<span style={fieldLabelStyle}>{t("settings.git.email")}</span>}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("settings.git.emailPlaceholder")} />
        </FormField>
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
                onSuccess: () => { toast(t("settings.git.identitySaved")); setNameEdit(null); setEmailEdit(null); },
                onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("settings.git.saveFailed"), "error"),
              },
            )
          }
          style={changed ? undefined : { opacity: 0.5, cursor: "default", background: "var(--btn)", color: "var(--muted)", border: "1px solid var(--btnB)" }}
        >
          {save.isPending ? t("settings.git.saving") : t("settings.git.saveIdentity")}
        </Button>
        <Hint>{t("settings.git.usedInCommits")}</Hint>
      </div>
    </div>
  );
}
