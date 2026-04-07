# Stack And Commands

## Core Stack
- Next.js `^15.2.4`
- React `^19.0.0`
- TypeScript `^5.8.2`
- Tailwind CSS `^3.4.17`
- Supabase JS `^2.49.1`
- Tiptap `^3.19.0`
- ESLint `^9.20.1`

## Runtime Model
- App Router based Next.js application
- Client-heavy interactive editor flow
- External data/service integration through Supabase
- AI sticker generation through Cloudflare Worker

## Important Dependencies
- `@supabase/supabase-js`
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-task-item`
- `@tiptap/extension-task-list`
- `lucide-react`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

## Folder Landmarks
```txt
src/app/                  route entry points
src/components/ui/        reusable UI primitives
src/features/editor/      editor domain
src/lib/                  shared utils and service setup
docs/                     product and architecture docs
cloudflare/sticker-worker AI sticker worker
```

## Commands
Local setup:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Main validation:

```bash
npm run lint
npm run typecheck
npm run build
```

## Script Meanings
- `npm run dev`: local development server
- `npm run lint`: ESLint validation
- `npm run typecheck`: Next type generation plus TypeScript check
- `npm run build`: production build validation

## Command Usage Rules
- Prefer the existing npm scripts over custom ad-hoc commands.
- Use project scripts for validation instead of introducing alternate tooling.
- Do not add deployment commands to CLAUDE guidance.
- Do not assume additional test runners exist if they are not in `package.json`.

## Environment Notes
- Supabase values live in `.env.local`
- AI sticker generation expects `NEXT_PUBLIC_CF_WORKER_URL`
- Never hardcode secrets into source files

## Version Awareness
- Next.js 15 and React 19 assumptions matter in implementation decisions.
- Do not write guidance that assumes Pages Router.
- Do not write older React-era patterns unless the current codebase already uses them intentionally.

## Tooling Expectations
- TypeScript strictness should be respected
- ESLint findings should be treated as real constraints
- Tailwind is the primary styling system
- Import alias `@/* -> src/*` should be used consistently
