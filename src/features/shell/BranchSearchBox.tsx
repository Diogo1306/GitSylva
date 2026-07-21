import { Input } from "../../components/ui/Input";
import { FormField } from "../../components/ui/FormField";
import { useT } from "../../i18n";

export function BranchSearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <div style={{ padding: "0 10px 8px" }}>
      <FormField label={t("shell.branch.searchLabel")} hideLabel>
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("shell.branch.searchPlaceholder")}
          mono
          style={{ width: "100%", fontSize: 12.5, padding: "6px 10px" }}
        />
      </FormField>
    </div>
  );
}
