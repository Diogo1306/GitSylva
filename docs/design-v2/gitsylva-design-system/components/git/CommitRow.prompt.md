A history list row: message + branch/tag chips + author avatar + short hash + relative time. The branch-graph SVG column is drawn separately to the left (this row leaves left padding for it in the app).

```jsx
<CommitRow message="Animate lane transitions" chips={[{label:'feature/graph',lane:1}]} initials="MD" tone="MD" hash="f83b1d0" time="há 4 h" selected />
```