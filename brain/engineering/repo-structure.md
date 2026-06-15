# Repo Structure

## Purpose

Documents required repository conventions.

## Current Structure

- `apps/desktop`
  - `src/components` (includes baseline components for sidebar, sign-out, modals, sheets, tables, forms, and onboarding)
  - `src/hooks`
  - `src/store`
- `packages/brain-core`
- `packages/desktop-client`
- `brain`

## Planned Structure

The implementation roadmap may add these folders while preserving the current package boundaries:

- `apps/desktop/src-tauri/src`
- optional shadcn `components.json`

## Required UI Conventions

- `components/modals/...`
- `components/sheets/global-sheets.tsx`
- `components/sheets/global-sheets-provider.tsx`
- `components/sheets/...`
- `components/tables/core`
- `components/tables/<domain>/...`
- `components/forms/...`
- `components/onboarding/...`
- `components/sidebar.tsx`
- `components/sign-out.tsx`
- `app/[...slug]/page.tsx`
- `(sidebar)/layout.tsx`
- `(sidebar)/error.tsx`

## Desktop App Conventions

- Keep React app entrypoints thin.
- Put Tauri invoke wrappers in `packages/desktop-client`.
- Put shared Brain state types in `packages/brain-core`.
- Put native side effects in Rust modules under `apps/desktop/src-tauri/src`.
