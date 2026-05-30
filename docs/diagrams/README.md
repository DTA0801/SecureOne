# Diagrams

Every architecture/flow diagram exists in two forms:

- **Mermaid** — embedded inline in the relevant doc; renders automatically on GitHub.
- **`.drawio`** — editable source in this folder; open in [draw.io / diagrams.net](https://app.diagrams.net) or the **VS Code "Draw.io Integration"** extension (`hediet.vscode-drawio`). Export to PNG/SVG for slide decks.

## Index

| Diagram | Source | Used in |
|---|---|---|
| Logical architecture | [`logical-architecture.drawio`](logical-architecture.drawio) | [03-architecture](../03-architecture.md) |
| Auth flow — Authorization Code + PKCE | [`auth-flow-authorization-code-pkce.drawio`](auth-flow-authorization-code-pkce.drawio) | [03-architecture](../03-architecture.md) |
| Auth flow — Client Credentials (M2M) | [`auth-flow-client-credentials.drawio`](auth-flow-client-credentials.drawio) | [03-architecture](../03-architecture.md) |
| Auth flow — Refresh token rotation | [`auth-flow-refresh-rotation.drawio`](auth-flow-refresh-rotation.drawio) | [03-architecture](../03-architecture.md) |
| Deployment — MVP | [`deployment-mvp.drawio`](deployment-mvp.drawio) | [03-architecture](../03-architecture.md) |
| Deployment — Production | [`deployment-production.drawio`](deployment-production.drawio) | [03-architecture](../03-architecture.md) |
| Data-layer layering | [`data-layer-layering.drawio`](data-layer-layering.drawio) | [06-database](../06-database.md) |
| Tenant isolation (defense in depth) | [`tenant-isolation.drawio`](tenant-isolation.drawio) | [06-database](../06-database.md), [03-architecture](../03-architecture.md) |

## Editing notes

- `.drawio` files here are stored as **uncompressed XML** so diffs are reviewable in Git.
- When you change a diagram, also update the matching Mermaid block in the doc (or vice-versa) to keep them in sync.
- Suggested palette: clients `#dae8fc`, UI `#d5e8d4`, auth-server `#ffe6cc`, datastores `#f8cecc`, security/infra `#e1d5e7`.
