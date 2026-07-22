import { useMemo, useState } from "react";
import { DiffLines } from "./DiffLines";
import { DiffSplit } from "./DiffSplit";
import { DIFF_PAGE_LINES, TRUNCATED_MARKER } from "../lib/diffLimits";
import { useT } from "../i18n";
import { activateOnKeyDown } from "./ui/keys";

// Diff with a unified/side-by-side toggle. The mode is remembered per session
// (sessionStorage) so switching files keeps the chosen view.
//
// Large patches render in pages of DIFF_PAGE_LINES: the first paint costs the
// same no matter how big the diff is (a 50k-line patch used to be one 4–6s
// task that froze the window). The footer loads more pages, and when the
// backend capped the patch (TRUNCATED_MARKER) it offers the full diff.
type DiffMode = "unified" | "split";
const MODE_KEY = "gitsylva-diff-mode";

export function DiffView({
  patch,
  fontSize,
  onStageHunk,
  stageLabel,
  onLoadFull,
}: {
  patch: string;
  fontSize?: number;
  onStageHunk?: (hunkPatch: string) => void;
  stageLabel?: string;
  /** Present when the backend capped this patch; requests the uncapped one. */
  onLoadFull?: () => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<DiffMode>(() =>
    sessionStorage.getItem(MODE_KEY) === "split" ? "split" : "unified",
  );
  const set = (m: DiffMode) => {
    sessionStorage.setItem(MODE_KEY, m);
    setMode(m);
  };

  const lines = useMemo(() => {
    const all = patch.replace(/\n$/, "").split("\n");
    if (all[all.length - 1] === TRUNCATED_MARKER) all.pop();
    return all;
  }, [patch]);
  const backendCapped = useMemo(
    () => patch.replace(/\n$/, "").endsWith(TRUNCATED_MARKER),
    [patch],
  );

  // Pages reset when the patch changes (derive-on-change, no effect).
  const [pages, setPages] = useState(1);
  const [prevPatch, setPrevPatch] = useState(patch);
  if (patch !== prevPatch) {
    setPrevPatch(patch);
    setPages(1);
  }

  const visibleCount = Math.min(lines.length, pages * DIFF_PAGE_LINES);
  const hidden = lines.length - visibleCount;
  // True when the LAST rendered hunk may be missing lines (paging or backend
  // cap) — staging it would apply a corrupt patch, so the button is skipped.
  const partialTail = hidden > 0 || backendCapped;
  const visiblePatch = useMemo(
    () => (visibleCount === lines.length ? lines.join("\n") : lines.slice(0, visibleCount).join("\n")),
    [lines, visibleCount],
  );

  // Real buttons (not bare divs) so the mode pill is keyboard-operable
  // (Enter/Space) and announces its state, matching the DiffPane toggles.
  const tab = (m: "unified" | "split", label: string) => (
    <button
      type="button"
      onClick={() => set(m)}
      onKeyDown={activateOnKeyDown}
      aria-pressed={mode === m}
      style={{ padding: "3px 10px", margin: 0, border: "none", borderRadius: 6, fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: mode === m ? "var(--win)" : "transparent", color: mode === m ? "var(--text)" : "var(--muted)" }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 10px 6px" }}>
        <div role="group" aria-label={t("components.diff.modeGroupLabel")} style={{ display: "inline-flex", gap: 3, padding: 3, borderRadius: 8, background: "var(--panel2)", border: "1px solid var(--border)" }}>
          {tab("unified", t("components.diff.unified"))}
          {tab("split", t("components.diff.split"))}
        </div>
      </div>
      {/* Diff text IS content — it stays selectable/copyable (R5.12). */}
      <div className="gs-selectable" style={{ display: "contents" }}>
        {mode === "split" ? (
          <DiffSplit patch={visiblePatch} />
        ) : (
          <DiffLines patch={visiblePatch} fontSize={fontSize} onStageHunk={onStageHunk} stageLabel={stageLabel} partialTail={partialTail} />
        )}
      </div>
      {hidden > 0 && (
        <div
          onClick={() => setPages((p) => p + 1)}
          className="gs-row"
          style={{ padding: "10px 14px", textAlign: "center", fontSize: 12.5, color: "var(--l0)", cursor: "pointer", fontWeight: 600 }}
        >
          {t("components.diff.showMoreLines", { count: Math.min(hidden, DIFF_PAGE_LINES) })} {t("components.diff.hiddenCount", { count: hidden })}
        </div>
      )}
      {hidden === 0 && backendCapped && (
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12.5, color: "var(--muted)" }}>
          <span>{t("components.diff.tooLarge")}</span>
          {onLoadFull && (
            <span onClick={onLoadFull} className="gs-row" style={{ color: "var(--l0)", cursor: "pointer", fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
              {t("components.diff.loadFull")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
