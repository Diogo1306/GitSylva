Centered dialog shell (new branch, push/pull, discard confirm…). Scrim-click and ✕ close; provide `actionLabel`+`onAction` for the footer. Use `danger` for destructive confirms.

```jsx
<Modal title="Descartar alterações" danger actionLabel="Descartar" onAction={discard} onClose={close}>
  <div>Descartar 4 arquivos?</div>
</Modal>
```