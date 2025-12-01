# Sonda

**Navigate JSON, don't just stare at it.**

A modern JSON explorer that keeps you oriented. Unlike tools that generate infinite sprawling diagrams where you lose context, Sonda lets you navigate progressively with full awareness of where you are.

## Features

- **Tree Inspector** - Hierarchical navigation with expandable nodes
- **Relation Graph** - Visual diagram of JSON structure with Mermaid
- **JSON Compare** - Side-by-side diff with added/removed/modified highlighting
- **JMESPath Filtering** - Advanced query language for filtering data
- **Context Awareness** - Breadcrumbs, inspector panel, and path copying
- **Dark/Light Mode** - Full theme support
- **Tools** - Sort keys, minify, repair, format, download

## Why Sonda?

| Other Tools | Sonda |
|-------------|-------|
| Infinite sprawling graphs | Progressive navigation |
| Lose context quickly | Breadcrumbs + Inspector panel |
| View only | Compare two JSONs |
| Basic filtering | JMESPath queries |

## Tech Stack

- Angular 21 (Signals, Standalone Components, Zoneless)
- Tailwind CSS
- Mermaid (Graph rendering)
- JMESPath (Filtering)
- TypeScript

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## License

MIT
