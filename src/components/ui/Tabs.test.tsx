import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Tabs, TabPanel } from "./Tabs";

afterEach(cleanup);

const items = [
  { id: "history", label: "Histórico" },
  { id: "branches", label: "Branches" },
  { id: "stashes", label: "Stashes", disabled: true },
  { id: "tags", label: "Tags" },
];

describe("Tabs", () => {
  it("marks the active tab with role=tab and aria-selected", () => {
    render(<Tabs items={items} activeId="branches" onChange={() => {}} ariaLabel="Secções" />);
    expect(screen.getByRole("tablist", { name: "Secções" })).toBeTruthy();
    const branches = screen.getByRole("tab", { name: "Branches" });
    const history = screen.getByRole("tab", { name: "Histórico" });
    expect(branches.getAttribute("aria-selected")).toBe("true");
    expect(history.getAttribute("aria-selected")).toBe("false");
  });

  it("gives the active tab roving tabindex 0 and the rest -1", () => {
    render(<Tabs items={items} activeId="branches" onChange={() => {}} />);
    expect((screen.getByRole("tab", { name: "Branches" }) as HTMLButtonElement).tabIndex).toBe(0);
    expect((screen.getByRole("tab", { name: "Histórico" }) as HTMLButtonElement).tabIndex).toBe(-1);
  });

  it("ArrowRight/ArrowLeft move focus between tabs, skipping disabled ones", () => {
    render(<Tabs items={items} activeId="history" onChange={() => {}} />);
    const history = screen.getByRole("tab", { name: "Histórico" });
    const branches = screen.getByRole("tab", { name: "Branches" });
    const tags = screen.getByRole("tab", { name: "Tags" });
    history.focus();
    fireEvent.keyDown(history, { key: "ArrowRight" });
    expect(document.activeElement).toBe(branches);
    // Stashes is disabled: ArrowRight from Branches must skip straight to Tags.
    fireEvent.keyDown(branches, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tags);
    fireEvent.keyDown(tags, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(branches);
  });

  it("Home/End jump to the first/last enabled tab", () => {
    render(<Tabs items={items} activeId="history" onChange={() => {}} />);
    const branches = screen.getByRole("tab", { name: "Branches" });
    branches.focus();
    fireEvent.keyDown(branches, { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Tags" }));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Tags" }), { key: "Home" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Histórico" }));
  });

  it("Enter and Space activate the focused tab via onChange", () => {
    const onChange = vi.fn();
    render(<Tabs items={items} activeId="history" onChange={onChange} />);
    const branches = screen.getByRole("tab", { name: "Branches" });
    branches.focus();
    fireEvent.keyDown(branches, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("branches");
    fireEvent.keyDown(branches, { key: " " });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("does not activate a disabled tab", () => {
    const onChange = vi.fn();
    render(<Tabs items={items} activeId="history" onChange={onChange} />);
    const stashes = screen.getByRole("tab", { name: "Stashes" });
    expect((stashes as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(stashes);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("tabs keep a visible focus ring (do not disable the outline inline)", () => {
    render(<Tabs items={items} activeId="history" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Histórico" }).style.outline).not.toBe("none");
  });
});

describe("TabPanel", () => {
  it("renders only the panel matching the active id, wired via aria-labelledby", () => {
    const { rerender } = render(
      <>
        <TabPanel id="history" activeId="history">
          Conteúdo histórico
        </TabPanel>
        <TabPanel id="branches" activeId="history">
          Conteúdo branches
        </TabPanel>
      </>,
    );
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toBe("Conteúdo histórico");
    expect(panel.id).toBe("tabpanel-history");
    expect(panel.getAttribute("aria-labelledby")).toBe("tab-history");

    rerender(
      <>
        <TabPanel id="history" activeId="branches">
          Conteúdo histórico
        </TabPanel>
        <TabPanel id="branches" activeId="branches">
          Conteúdo branches
        </TabPanel>
      </>,
    );
    expect(screen.getByRole("tabpanel").textContent).toBe("Conteúdo branches");
  });

  it("keeps a visible focus ring on the focusable panel (no inline outline:none)", () => {
    render(
      <TabPanel id="history" activeId="history">
        Conteúdo
      </TabPanel>,
    );
    const panel = screen.getByRole("tabpanel");
    expect((panel as HTMLElement).tabIndex).toBe(0);
    expect((panel as HTMLElement).style.outline).not.toBe("none");
  });
});
