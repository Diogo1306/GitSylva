/** The invisible-until-hover grab area for usePanelWidth; the host panel needs position:relative. */
export function PanelHandle({ edge, handleProps }: { edge: "left" | "right"; handleProps: React.HTMLAttributes<HTMLDivElement> }) {
  return (
    <div
      {...handleProps}
      className="gs-resize"
      title="Arrastar para redimensionar"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [edge]: -3,
        width: 7,
        cursor: "ew-resize",
        zIndex: 5,
        touchAction: "none",
      }}
    />
  );
}
