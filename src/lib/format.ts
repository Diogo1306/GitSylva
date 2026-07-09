// Presentation helpers for the history view: relative times, author avatars
// and branch/tag ref chips.

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, (Date.now() - then) / 1000);
  if (secs < 45) return "agora";
  const mins = secs / 60;
  if (mins < 60) return `há ${Math.round(mins)} min`;
  const hours = mins / 60;
  if (hours < 24) return `há ${Math.round(hours)} h`;
  const days = hours / 24;
  if (days < 7) return `há ${Math.round(days)} dias`;
  const weeks = days / 7;
  if (weeks < 5) return `há ${Math.round(weeks)} sem`;
  return new Date(iso).toLocaleDateString();
}

export function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministically map an author to one of the three lane colour slots so the
// same person keeps the same avatar colour across the session.
export function avatarColor(name: string): { bg: string; color: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const slot = hash % 3;
  return { bg: `var(--l${slot}bg)`, color: `var(--l${slot})` };
}

export type RefChip = {
  label: string;
  kind: "head" | "branch" | "remote" | "tag";
};

// Parse git's %D ref decoration ("HEAD -> main, origin/main, tag: v1.0").
export function parseRefs(refs: string): RefChip[] {
  if (!refs.trim()) return [];
  const chips: RefChip[] = [];
  for (const raw of refs.split(",")) {
    const ref = raw.trim();
    if (!ref) continue;
    if (ref.startsWith("tag:")) {
      chips.push({ label: ref.slice(4).trim(), kind: "tag" });
    } else if (ref.startsWith("HEAD ->")) {
      chips.push({ label: ref.slice(7).trim(), kind: "head" });
    } else if (ref === "HEAD") {
      chips.push({ label: "HEAD", kind: "head" });
    } else if (ref.includes("/")) {
      chips.push({ label: ref, kind: "remote" });
    } else {
      chips.push({ label: ref, kind: "branch" });
    }
  }
  return chips;
}

export function chipStyle(kind: RefChip["kind"]): { bg: string; color: string; border: string } {
  switch (kind) {
    case "head":
      return { bg: "var(--l0bg)", color: "var(--l0)", border: "var(--l0bd)" };
    case "remote":
      return { bg: "var(--l1bg)", color: "var(--l1)", border: "var(--l1bd)" };
    case "tag":
      return { bg: "var(--badge)", color: "var(--badgeT)", border: "var(--tagbd)" };
    case "branch":
    default:
      return { bg: "var(--l2bg)", color: "var(--l2)", border: "var(--l2bd)" };
  }
}
