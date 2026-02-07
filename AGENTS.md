# Agent Guide for nsite-homepage

This document provides coding agents with essential information about this codebase.

## Project Overview

**Type:** React 18 + TypeScript 5.9 SPA
**Build Tool:** Vite 6.4 with SWC
**Package Manager:** pnpm 9.14.4
**UI Framework:** TailwindCSS 4.1 + DaisyUI 5.5
**State Management:** RxJS 7.8 + React hooks
**Core Libraries:** Applesauce (Nostr), nostr-tools, Blossom SDK

**Purpose:** Homepage for nsite - a decentralized static website hosting platform built on Nostr protocol and Blossom file storage.

## Build Commands

```bash
# Development
pnpm dev              # Start Vite dev server (http://localhost:5173)

# Production
pnpm build            # TypeScript check + Vite build → dist/
pnpm preview          # Preview production build locally

# Formatting
pnpm format           # Format all files with Prettier

# Type Checking
pnpm exec tsc -b      # Run TypeScript compiler (no emit, check only)
```

### Testing

**Status:** No test framework currently configured.

**Recommendation:** If adding tests, use Vitest (pairs well with Vite):

```bash
# Future commands (not yet implemented)
# pnpm test           # Run all tests
# pnpm test:watch     # Run tests in watch mode
# pnpm test -- <file> # Run single test file
```

## Code Style Guidelines

### TypeScript

**Configuration:** Strict mode enabled with comprehensive linting

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`

**Rules:**

- Always use explicit types for function parameters and return types when not obvious
- Prefer `interface` over `type` for object shapes
- Use type imports: `import type { Event } from 'nostr-tools'`
- No `any` types unless absolutely necessary (prefer `unknown` or specific types)
- Enable strict null checks - handle `null`/`undefined` explicitly

### Imports

**Order (within each group, alphabetize):**

1. External libraries (applesauce-\*, react, rxjs, nostr-tools)
2. Internal modules (../const, ../nostr, ../settings)
3. Components (./Settings, ./SiteCard)

**Style:**

```typescript
// Named imports - destructure on separate lines if many
import { useState, useEffect, useMemo } from "react";
import type { Event } from "nostr-tools";

// Group related imports
import { mapEventsToStore } from "applesauce-core";
import { getEventUID } from "applesauce-core/helpers/event";
import { ReplaceableModel } from "applesauce-core/models";
```

### Formatting

**Prettier Config:**

- Tab width: 2 spaces
- No tabs (spaces only)
- Run `pnpm format` before committing

**Manual rules:**

- Max line length: ~80-100 chars (soft limit)
- Single quotes for strings (Prettier default)
- Trailing commas in multiline (Prettier default)

### Naming Conventions

**Files:**

- Components: PascalCase (e.g., `SiteCard.tsx`, `Settings.tsx`)
- Utilities/Helpers: camelCase (e.g., `open-graph.ts`, `settings.ts`)
- Constants: lowercase (e.g., `const.ts`, `nostr.ts`)

**Variables/Functions:**

- camelCase: `searchTerm`, `setShowAll`, `useDarkModeState`
- Constants: SCREAMING_SNAKE_CASE: `FEATURED_SITES_LIST`, `DEFAULT_RELAYS`
- Boolean flags: prefix with `is`, `has`, `should`, `hide` (e.g., `hideUnknown`, `showAll`)

**Components:**

- PascalCase: `SiteCard`, `Settings`, `App`
- Props interfaces: `{ComponentName}Props` (e.g., `SiteCardProps`)

**Observables (RxJS):**

- Suffix with `$` or descriptive noun: `appRelays`, `sites$`

### React Patterns

**Component Structure:**

```typescript
// 1. Imports
import { useState, useEffect } from "react";

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Component definition
function MyComponent({ title, onAction }: MyComponentProps) {
  // 4. Hooks (state, context, custom hooks)
  const [state, setState] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 6. Handlers
  const handleClick = () => {
    // ...
  };

  // 7. Render
  return (
    <div>...</div>
  );
}

// 8. Export
export default MyComponent;
```

**Best Practices:**

- Functional components only (no class components)
- Use hooks for state and side effects
- Extract reusable logic into custom hooks (e.g., `useDarkModeState`)
- Memoize expensive computations with `useMemo`
- Use `useCallback` for callback props to prevent rerenders
- Early returns for conditional rendering
- Props destructuring with default values

### State Management

**Local State:** `useState` for component-specific state
**Global State:** RxJS `BehaviorSubject` + `useObservableState` hook
**Nostr Data:** Applesauce models (`TimelineModel`, `ReplaceableModel`) + hooks

**Pattern:**

```typescript
// Global observable state (settings.ts)
export const appRelays = new BehaviorSubject<string[]>(DEFAULT_RELAYS);

// Usage in component
const relays = useObservableState(appRelays);

// Update state
appRelays.next(newRelays);
```

### Styling

**Framework:** TailwindCSS 4.1 + DaisyUI 5.5

**Classes:**

- Use DaisyUI component classes: `btn`, `card`, `modal`, `input`, `badge`, etc.
- Modifiers: `btn-primary`, `btn-lg`, `card-bordered`
- TailwindCSS utilities for spacing, layout, colors
- Responsive: `md:grid-cols-2`, `lg:max-w-4xl`
- Theme colors: `bg-base-100`, `text-base-content`, `link-primary`

**Themes:**

- Light: `winter` (data-theme="winter")
- Dark: `sunset` (data-theme="sunset")
- Set on `document.documentElement`

### Error Handling

**Try-Catch:**

```typescript
try {
  const cached = localStorage.getItem("key");
  if (cached) return JSON.parse(cached);
} catch (error) {
  console.warn("Failed to load from localStorage:", error);
  // Fallback behavior
}
```

**Rules:**

- Always handle localStorage failures (may be disabled)
- Log errors with `console.warn` or `console.error`
- Provide fallback values/behavior
- Don't let errors crash the app

### Async Patterns

**Prefer:**

- `async/await` over `.then()/.catch()`
- Observable streams (RxJS) for real-time data
- Applesauce loaders for Nostr event fetching

**Example:**

```typescript
useEffect(() => {
  (async () => {
    const events = await cacheRequest([{ kinds: NSITE_KINDS }]);
    for (let event of events) eventStore.add(event);
  })();
}, []);
```

## Project Structure

```
src/
├── components/      # React components
│   ├── App.tsx     # Main app component (223 lines)
│   ├── Settings.tsx # Settings modal (197 lines)
│   └── SiteCard.tsx # Site display card (220 lines)
├── helpers/         # Utility functions
│   └── open-graph.ts # OG metadata fetching
├── const.ts         # App constants (relays, kinds)
├── darkmode.tsx     # Dark mode custom hook
├── index.tsx        # App entry point
├── nostr.ts         # Nostr client setup
├── settings.ts      # App settings state
├── index.css        # Global styles
└── *.d.ts           # Type definitions
```

## Nostr-Specific Guidelines

**Event Kinds:**

- `15128`: Site manifest (addressable)
- `35128`: Site metadata (addressable)
- See `NSITE_KINDS` in `const.ts`

**Event Store:**

- Central store: `eventStore` from `nostr.ts`
- Add events: `eventStore.add(event)`
- Query with models: `useEventModel(TimelineModel, [filters])`

**Relay Pool:**

- Global pool: `pool` from `nostr.ts`
- Subscribe: `pool.subscription(relays, filters)`
- Use RxJS operators: `onlyEvents()`, `mapEventsToStore()`

**Loaders:**

- `addressLoader()` for addressable events (kinds 30000-39999)
- `cacheRequest()` for local NostrDB cache

## Key Dependencies

- **applesauce-\***: Nostr client library suite
- **nostr-tools**: Nostr protocol utilities
- **window.nostrdb.js**: Local event caching
- **rxjs**: Reactive programming

## Deployment

- **Trigger:** Push to `master` branch
- **Workflow:** `.github/workflows/nsite.yml`
- **Action:** Build with Vite → deploy to Nostr via nsite-action
- **Output:** Static files on Blossom servers, metadata as Nostr events
