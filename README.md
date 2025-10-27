# Flow Map Story Widget

Custom widget for SAP Analytics Cloud (Optimized Story).
Visualizes movement of inventory or flow between countries (source → target) using animated lines and moving bullets.

## Files
- `manifest.json` → Story widget definition (data binding + resources)
- `Component.js` → Widget logic (amCharts-based flow animation)
- `libs/amcharts5/` → amCharts core JS files
- `libs/geodata/worldLow.js` → World map geodata (low-res)

## Data Binding
Binding name: `flows`
| Field | Type | Description |
|--------|--------|----------------|
| `source` | dimension | Source country (ISO-2/ISO-3) |
| `target` | dimension | Target country (ISO-2/ISO-3) |
| `value`  | measure   | Quantity or flow volume |

## Upload Steps
1. Select all files in this folder (so that `manifest.json` is at ZIP root).
2. Compress them into a `.zip` file.
3. In **SAP Analytics Cloud (Story Builder)** → Custom Widgets → Upload ZIP.
4. Add widget to Story → Bind model fields to `source`, `target`, and `value`.
