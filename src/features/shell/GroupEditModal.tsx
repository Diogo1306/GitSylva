import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { GROUP_COLORS, groupColor } from "../../lib/groupColors";

// Edit a tab group's name and color (user request R5). Shared by the tab bar
// and the rail — both open it from the group's right-click menu.
export function GroupEditModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const group = useAppStore((s) => s.groups.find((g) => g.id === groupId));
  const renameGroup = useAppStore((s) => s.renameGroup);
  const setGroupColor = useAppStore((s) => s.setGroupColor);
  const [name, setName] = useState(group?.name ?? "");

  if (!group) return null;
  const save = () => {
    if (name.trim()) renameGroup(group.id, name.trim());
    onClose();
  };
  return (
    <Modal title="Editar grupo" onClose={onClose} width={380}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Nome</div>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
            placeholder="Nome do grupo"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Cor</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GROUP_COLORS.map((c, i) => {
              const active = group.color === i;
              return (
                <div
                  key={c.name}
                  onClick={() => setGroupColor(group.id, i)}
                  title={c.name}
                  className="gs-lift"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: groupColor(i).bg,
                    border: `2px solid ${active ? c.hex : "var(--btnB)"}`,
                    boxSizing: "border-box",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex }} />
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
