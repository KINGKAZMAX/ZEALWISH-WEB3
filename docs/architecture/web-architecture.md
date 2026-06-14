# ZEALWISH Web Architecture

## Purpose

This document defines the clean web-product structure for ZEALWISH. It keeps every iteration reproducible, English-first, and aligned with the preview that users actually see in the browser.

## Current Preview Contract

The current browser preview is served from:

```text
frontend-v4/index.html
```

Recommended local preview command:

```bash
python3 -m http.server 8789 --bind 127.0.0.1 --directory frontend-v4
```

Preview URL:

```text
http://127.0.0.1:8789/index.html
```

If the browser preview changes, the source files listed below must be updated in the same branch and verified before pushing:

```text
frontend-v4/index.html
frontend-v4/src/v5/zealwish-landing.jsx
frontend-v4/assets/zealwish-main-character.png
```

## Product Language Rules

- All user-facing product copy must be English.
- Do not add Chinese product copy, Chinese comments, or Chinese file names to committed product code.
- Web3 language must explain ownership, identity, portability, and persistence.
- Do not frame ZEALWISH as a speculative NFT project.
- The approved product principle is: `NFT is not the product. Ownership is.`

## Clean Branch Rules

- Each iteration must use a clearly named branch under the `codex/` prefix.
- Each branch should contain one scoped product change or one scoped architecture change.
- Do not stage generated folders, screenshots, local uploads, temporary files, or unrelated dirty files.
- Commit only the files required to reproduce the preview or the architecture change.
- Run tests and build before pushing.

## Current Directory Responsibilities

```text
frontend-v4/
  Public static web preview for the current ZEALWISH landing page.
  This is what the user currently sees at http://127.0.0.1:8789/index.html.

src/
  Vite React renderer source for the desktop/web app shell.
  This should contain UI components, hooks, styles, and frontend state only.

electron/
  Electron host process and local backend services.
  This layer owns IPC, local model adapters, storage, memory services, voice services, and OS integration.

cli/
  Command-line entry points and routing.

tests/
  Unit and integration tests for frontend contracts, backend services, and runtime adapters.

docs/
  Product, architecture, strategy, and delivery documentation.
```

## Frontend / Backend Separation

The frontend should own:

- Screens, components, layout, navigation, product copy, visual states, and accessibility.
- Browser-safe state management and view models.
- Requests through typed client adapters only.

The backend or host layer should own:

- Model provider calls.
- Voice input and output adapters.
- Memory persistence and recall logic.
- File system access.
- External SDK integration.
- IPC contracts and security boundaries.

The frontend must not import backend services directly. It should call a typed facade exposed through the browser, preload bridge, HTTP API, or SDK adapter.

## Target Monorepo Shape

The current repository can evolve toward this structure without changing the product narrative:

```text
apps/
  web/
    Public browser product: landing page, web onboarding, wallet-owned character passport UX.
  desktop/
    Electron desktop shell and desktop-only UI composition.

packages/
  ui/
    Shared design tokens, primitive components, icons, and layout components.
  domain/
    Character, memory, ownership, relationship, and world domain models.
  api-client/
    Typed frontend clients for host APIs, remote APIs, and SDK integrations.
  config/
    Shared TypeScript, lint, test, and build configuration.

services/
  agent/
    Agent orchestration and model provider adapters.
  memory/
    Memory vault, recall, merge, and persistence services.
  voice/
    ASR, TTS, and voice session services.
  ownership/
    Wallet, character passport, NFT, and blockchain adapter interfaces.
```

## Current Homepage Information Architecture

The homepage intro should communicate the product in this order:

1. ZEALWISH is a wallet-owned AI character platform.
2. Users create and grow a living AI companion.
3. The character identity becomes a passport, not a disposable profile.
4. Memory creates continuity.
5. Blockchain anchors ownership and portability.
6. NFT is only the ownership representation, not the product itself.

## Verification Checklist

Before pushing a branch:

```bash
npx vitest run tests/frontend-v4-zealwish.test.ts
npm run build
```

Also verify:

- The local browser preview matches the committed files.
- There is no horizontal overflow at mobile width.
- The changed user-facing files contain no Chinese characters.
- The branch does not stage unrelated local artifacts.
