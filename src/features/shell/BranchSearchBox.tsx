import { Input } from "../../components/ui/Input";
import { FormField } from "../../components/ui/FormField";
import { useT } from "../../i18n";

export function BranchSearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <div style={{ padding: "0 var(--sp-4) var(--sp-3)" }}>
      <FormField label={t("shell.branch.searchLabel")} hideLabel>
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("shell.branch.searchPlaceholder")}
          mono
          style={{ width: "100%", fontSize: "var(--fs-btn)", padding: "var(--sp-2) var(--sp-4)" }}
        />
      </FormField>
    </div>
  );
}
