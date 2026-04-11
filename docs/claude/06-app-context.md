# App Context Guide

## Purpose
This guide applies when working in `src/app/*`.
The app layer is the route and composition layer, not the main home for product logic.

## What App Layer Owns
- route entry points
- page-level composition
- metadata
- server/client boundary decisions
- param loading

## What App Layer Should Avoid
- dense domain logic
- repeated feature state management
- duplicating domain types
- embedding large interactive behavior directly in route files

## Current App Structure
- `src/app/layout.tsx`: root shell and metadata
- `src/app/page.tsx`: landing page
- `src/app/auth/page.tsx`: auth UI route
- `src/app/auth/callback/route.ts`: auth callback route handler
- `src/app/editor/[pageId]/page.tsx`: editor route entry

## Page File Rules
- keep page files easy to scan
- delegate complex UI to feature components
- keep route params handling near the entry
- avoid turning a page file into a feature dump

## Route Handler Rules
- keep handlers focused on request/response behavior
- avoid pushing unrelated UI concerns into route files
- keep environment assumptions explicit

## Styling Rules For App Layer
- global styles belong in `src/app/globals.css`
- page-specific visuals belong in page/feature components, not in globals by default

## When To Move Logic Out
Move code out of `src/app/*` when:
- it is interactive and non-trivial
- it belongs to a feature workflow
- it needs reuse across routes
- it introduces state that is better owned by a feature

## Good Outcome Standard
A good app-layer change:
- keeps the route readable
- preserves routing clarity
- does not absorb feature complexity unnecessarily
