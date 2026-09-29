# Graph Report - optimizador_de_cortes  (2026-09-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 116 nodes · 208 edges · 9 communities (2 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5521aa1b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- UIManager
- app.js
- Sheet
- App
- Scene3D
- devDependencies
- PDFService

## God Nodes (most connected - your core abstractions)
1. `UIManager` - 22 edges
2. `Sheet` - 15 edges
3. `App` - 13 edges
4. `CutPiece` - 10 edges
5. `Scene3D` - 10 edges
6. `NestingEngine` - 8 edges
7. `PDFService` - 7 edges
8. `ToastService` - 5 edges
9. `scripts` - 4 edges
10. `webpack-merge` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (9 total, 6 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.08
Nodes (24): author, description, keywords, license, name, private, scripts, build (+16 more)

### Community 6 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, copy-webpack-plugin, html-webpack-plugin, webpack, webpack-cli, webpack-dev-server, webpack-merge

## Knowledge Gaps
- **26 isolated node(s):** `author`, `description`, `keywords`, `license`, `name` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 43 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UIManager` connect `UIManager` to `app.js`, `App`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `Sheet` connect `Sheet` to `app.js`, `App`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `Scene3D` connect `Scene3D` to `app.js`, `App`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `author`, `description`, `keywords` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._