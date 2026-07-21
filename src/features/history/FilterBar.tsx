import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Tabs } from "../../components/ui/Tabs";
import { hasActiveFilters, EMPTY_HISTORY_FILTERS, type HistoryFilters, type MergeFilter } from "../../lib/historyFilters";
import type { BranchInfo } from "../../lib/types";
import { useT } from "../../i18n";

const mono = "'JetBrains Mono', monospace";

// Compact filter-bar controls (Task 11) share the same input skin, sized
// individually so the bar wraps sanely at narrower widths.
function filterInputStyle(width: number): CSSProperties {
  return {
    width,
    background: "var(--input)",
    border: "1px solid var(--btnB)",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12.5,
    color: "var(--text)",
    fontFamily: "var(--font)",
    boxSizing: "border-box",
  };
}

export function FilterBar({
  filters,
  setFilters,
  filtersOpen,
  setFiltersOpen,
  detailOpen,
  setDetailOpen,
  branches,
  resolving,
  filteredCount,
}: {
  filters: HistoryFilters;
  setFilters: Dispatch<SetStateAction<HistoryFilters>>;
  filtersOpen: boolean;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  detailOpen: boolean;
  setDetailOpen: (v: boolean) => void;
  branches: BranchInfo[] | undefined;
  resolving: boolean;
  filteredCount: number;
}) {
  const t = useT();
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FormField label={t("history.filter.label")} hideLabel>
            <input
              value={filters.text}
              onChange={(e) => setFilters((f) => ({ ...f, text: e.target.value }))}
              placeholder={t("history.filter.placeholder")}
              style={{
                width: "100%",
                background: "var(--input)",
                border: "1px solid var(--btnB)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--text)",
                fontFamily: "var(--font)",
                boxSizing: "border-box",
              }}
            />
          </FormField>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: mono, whiteSpace: "nowrap" }}>
          {resolving ? t("history.filter.applyingInline") : t("history.commitsCount", { count: filteredCount })}
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-pressed={filtersOpen}
          aria-expanded={filtersOpen}
          title={filtersOpen ? t("history.filter.hideAdvanced") : t("history.filter.showAdvanced")}
          className="gs-lift"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 32,
            padding: "5px 11px",
            borderRadius: 7,
            background: filtersOpen ? "var(--sel)" : "var(--btn)",
            border: "1px solid var(--btnB)",
            fontSize: 12,
            color: "var(--btnT)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        >
          {t("history.filter.filters")} {hasActiveFilters({ ...filters, text: "" }) ? "•" : ""}
        </button>
        <button
          type="button"
          onClick={() => setDetailOpen(!detailOpen)}
          aria-pressed={detailOpen}
          title={detailOpen ? t("history.detail.hidePanel") : t("history.detail.showPanel")}
          className="gs-lift"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 32,
            padding: "5px 11px",
            borderRadius: 7,
            background: detailOpen ? "var(--sel)" : "var(--btn)",
            border: "1px solid var(--btnB)",
            fontSize: 12,
            color: "var(--btnT)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        >
          Diff {detailOpen ? "✓" : ""}
        </button>
      </div>

      {filtersOpen && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10 }}>
          <FormField label={t("history.filter.author")} hideLabel>
            <input
              value={filters.author}
              onChange={(e) => setFilters((f) => ({ ...f, author: e.target.value }))}
              placeholder={t("history.filter.author")}
              style={filterInputStyle(140)}
            />
          </FormField>

          <FormField label="Branch" hideLabel>
            <select
              value={filters.branch}
              onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
              style={filterInputStyle(180)}
            >
              <option value="">{t("history.filter.allBranches")}</option>
              {(branches ?? []).some((b) => !b.is_remote) && (
                <optgroup label={t("history.filter.local")}>
                  {(branches ?? [])
                    .filter((b) => !b.is_remote)
                    .map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                </optgroup>
              )}
              {(branches ?? []).some((b) => b.is_remote) && (
                <optgroup label={t("history.filter.remote")}>
                  {(branches ?? [])
                    .filter((b) => b.is_remote)
                    .map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </FormField>

          <FormField label={t("history.filter.dateFrom")} hideLabel>
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              style={filterInputStyle(140)}
            />
          </FormField>
          <FormField label={t("history.filter.dateTo")} hideLabel>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              style={filterInputStyle(140)}
            />
          </FormField>

          <Tabs
            ariaLabel={t("history.filter.commitTypeAria")}
            activeId={filters.merge}
            onChange={(id) => setFilters((f) => ({ ...f, merge: id as MergeFilter }))}
            items={[
              { id: "all", label: t("history.filter.commitAll") },
              { id: "normal", label: t("history.filter.commitNormal") },
              { id: "merges", label: "Merges" },
            ]}
          />

          <FormField label={t("history.filter.path")} hideLabel>
            <input
              value={filters.path}
              onChange={(e) => setFilters((f) => ({ ...f, path: e.target.value }))}
              placeholder={t("history.filter.pathPlaceholder")}
              style={filterInputStyle(160)}
            />
          </FormField>

          <Button
            variant="ghost"
            size="sm"
            title={t("history.filter.resetAllTitle")}
            disabled={!hasActiveFilters(filters)}
            onClick={() => setFilters(EMPTY_HISTORY_FILTERS)}
          >
            {t("history.filter.reset")}
          </Button>
        </div>
      )}
    </div>
  );
}
