Primary action control — use `primary` for the one main action, `secondary` for toolbar/dialog actions, `ghost` for low-emphasis, `danger` for destructive.

```jsx
<Button variant="primary" onClick={commit}>Commit</Button>
<Button variant="secondary" iconLeft={<span>⟳</span>} loading>Fetch</Button>
<Button variant="danger">Descartar</Button>
```

Hover lifts the button (translateY −1.5px). Set `loading` to show the spinner. Colors come from theme tokens, so it adapts to all four themes automatically.