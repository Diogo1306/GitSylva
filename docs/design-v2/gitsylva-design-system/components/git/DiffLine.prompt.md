One line of a unified diff. Compose many inside a scroll container.

```jsx
<DiffLine kind="hunk">@@ -42,7 +42,9 @@</DiffLine>
<DiffLine kind="del">-  return x;</DiffLine>
<DiffLine kind="add">+  return y;</DiffLine>
```