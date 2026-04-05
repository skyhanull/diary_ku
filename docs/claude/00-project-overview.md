# Project Overview

## Product
- Name: DearMe
- Type: digital diary web app
- Stage: MVP
- Core value: users should be able to decorate, save, and revisit diary pages with minimal friction

## Product Intent
DearMe is not a generic memo app.
It is a decorating-first diary product where visual editing matters as much as data persistence.
The product should feel warm, approachable, and expressive, while still remaining easy to use.

## What Matters Most
1. The diary writing and decorating flow must not break.
2. Editor interactions must feel predictable.
3. Save and restore expectations must remain trustworthy.
4. The codebase should stay easy to extend during MVP.

## User Experience Priorities
- Quick onboarding into writing and decorating
- Clear manipulation of text, stickers, and images
- Stable daily page editing
- A diary-like visual tone rather than an admin dashboard feel

## MVP Scope Summary
- Login flow
- Calendar and daily page flow
- Diary page editor
- Stickers, text, and photo placement
- Save and restore behavior
- Share/public-private basics

Detailed scope lives in:
- [docs/PRD.md](../PRD.md)
- [docs/EDITOR_MVP_PLAN.md](../EDITOR_MVP_PLAN.md)

## Repository Intent
This repository is expected to evolve during MVP.
That means contributors should optimize for:
- safe incremental changes
- clear boundaries
- minimal surprise
- preservation of existing product direction

## How To Read The Rules
- Product and coding rules start in this doc set.
- Architecture-specific judgment lives in [04-architecture-and-boundaries.md](./04-architecture-and-boundaries.md).
- Editor-specific rules live in [src/features/editor/CLAUDE.md](/Users/an-yungyeong/Downloads/회사%20폴더/diary_ku/src/features/editor/CLAUDE.md).

## Non-Goals For Routine Tasks
- Do not perform broad redesigns during small feature work.
- Do not replace patterns just because they are imperfect.
- Do not introduce new architectural layers unless the change clearly needs them.

## Working Mindset
- Read before editing.
- Respect current behavior before proposing cleaner structure.
- Improve locally, not destructively.
- Leave the project more understandable than before.
