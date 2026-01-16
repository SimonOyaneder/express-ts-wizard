# express-ts-wizard

> Create production-ready Express.js + TypeScript projects in seconds

The fastest way to bootstrap an Express 5.0 API with TypeScript. Zero config, interactive CLI, multiple strictness levels.

<p align="center">
  <a href="https://www.npmjs.com/package/express-ts-wizard"><img src="https://img.shields.io/npm/v/express-ts-wizard.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/express-ts-wizard"><img src="https://img.shields.io/npm/dm/express-ts-wizard.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/SimonOyaneder/express-ts-wizard/actions"><img src="https://img.shields.io/github/actions/workflow/status/SimonOyaneder/express-ts-wizard/ci.yml?branch=main&style=flat-square" alt="CI status"></a>
  <a href="https://github.com/SimonOyaneder/express-ts-wizard/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/express-ts-wizard.svg?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/node/v/express-ts-wizard.svg?style=flat-square" alt="node version">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/SimonOyaneder/express-ts-wizard/main/.github/demo.gif" alt="express-ts-wizard demo" width="600">
</p>

---

## Install

```bash
# Run directly with npx (recommended)
npx express-ts-wizard

# Or install globally
npm install -g express-ts-wizard
express-ts-wizard
```

---

## Why express-ts-wizard?

Setting up a new Express.js project with TypeScript involves a lot of boilerplate: configuring `tsconfig.json`, setting up hot-reload, adding proper types, handling graceful shutdown... **express-ts-wizard** does all of this for you in one command.

## Features

- **Express 5.0** - Latest version with improved async error handling
- **TypeScript** - Full type safety out of the box
- **3 Strictness Levels** - Choose your TypeScript configuration: relaxed, moderate, or strict
- **Hot Reload** - Development server with instant restarts via `tsx`
- **Production Ready** - Graceful shutdown, health check endpoint, proper error handling
- **Deterministic Builds** - Generates `package-lock.json` for reproducible installs
- **Git Ready** - Optional Git initialization with initial commit
- **Zero Config** - Works immediately after creation, no setup required

## Quick Start

```bash
npx express-ts-wizard
```

That's it! Answer 3 simple questions and your project is ready.

```bash
cd my-express-app
npm run dev
# Server running at http://localhost:3000
```

## Interactive Prompts

The wizard will ask you:

| Prompt | Description | Default |
|--------|-------------|---------|
| **Project name** | Directory name for your project | `my-express-app` |
| **TypeScript strictness** | How strict should TypeScript be? | `moderate` |
| **Initialize Git?** | Create a Git repo with initial commit | `yes` |

## Generated Project Structure

```
my-express-app/
├── src/
│   └── index.ts        # Express server with health check
├── package.json        # Dependencies and scripts
├── package-lock.json   # Lock file for deterministic installs
├── tsconfig.json       # TypeScript configuration
└── .gitignore          # Standard Node.js ignores
```

## Available Scripts

After creating your project, you can run:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run the compiled production server |
| `npm run type-check` | Check types without compiling |

## TypeScript Strictness Levels

Choose the level that fits your project:

### Relaxed

```json
{
  "strict": false
}
```

Minimal type checking. Good for quick prototypes or migrating JavaScript projects.

### Moderate (Recommended)

```json
{
  "strict": true
}
```

Enables TypeScript's `strict` flag, which includes:
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitAny`
- `noImplicitThis`
- `alwaysStrict`

### Strict

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noImplicitOverride": true
}
```

Maximum type safety. Catches more potential bugs at compile time.

## What's Included

The generated Express server comes with:

```typescript
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Graceful shutdown handling
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

## Requirements

- **Node.js** >= 18.0.0
- **npm** (comes with Node.js)
- **Git** (optional, for repository initialization)

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Comparison

| Feature | express-ts-wizard | express-generator | create-express-api |
|---------|-------------------|-------------------|-------------------|
| TypeScript | Yes | No | Varies |
| Express 5.0 | Yes | No (4.x) | No |
| Interactive CLI | Yes | No | Varies |
| Strictness levels | 3 options | N/A | N/A |
| Hot reload | Yes (tsx) | No | Varies |
| Graceful shutdown | Yes | No | No |
| Zero config | Yes | No | Varies |

## Related

- [Express.js](https://expressjs.com/) - Fast, unopinionated, minimalist web framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at any scale
- [tsx](https://github.com/privatenumber/tsx) - TypeScript execute with hot-reload

## License

MIT © [Simon Oyaneder](https://github.com/SimonOyaneder)

---

If this project helped you, consider giving it a star on [GitHub](https://github.com/SimonOyaneder/express-ts-wizard)!
