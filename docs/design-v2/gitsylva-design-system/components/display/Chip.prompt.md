Branch/tag label on commit rows. `lane` picks the branch color; `tag` renders an outlined version for version tags.

```jsx
<Chip label="main" lane={0} />
<Chip label="feature/graph" lane={1} />
<Chip label="v0.4.0" tag />
```