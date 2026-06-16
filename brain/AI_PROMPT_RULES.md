# AI Prompt Rules

## Purpose

Captures durable rules for prompts, handoffs, and AI implementation work.

## Non-Negotiable Architecture Rules

- Midday is the primary standard for pages, tables, modals, sheets, sidebar, forms, onboarding, layouts, tRPC calls, loading states, error states, and caching patterns.
- Use shadcn standard components and patterns for UI. Never directly modify shadcn source components; create wrapper components for project-specific behavior.
- Use GND as the reference for the standard notification package system.
- Use Plot Keys as the reference for local URL handling, portless/proxy support, and generated links.
- Add `app/[...slug]/page.tsx` as a catch-all route that redirects to `/` unless the repository has an explicit reason to diverge.

## Brain Loop Rules

- The desktop app is an orchestrator, not the source of truth.
- Brain state under `~/.brain-loop` remains authoritative: `settings.toml` plus JSON project, queue, thread, lock, workspace, and log metadata files.
- Rust owns process control, PTY sessions, file locks, and atomic state-file writes.
- React renders state and sends explicit commands to Rust.
