# UI Context Guide

## Purpose
This guide applies when working in `src/components/ui/*`.
This folder should stay a home for reusable primitives, not feature-specific widgets.

## What UI Primitives Own
- shared button/input/card-like building blocks
- low-level variant systems
- styling consistency
- composable presentational foundations

## What UI Primitives Should Avoid
- feature-specific business logic
- assumptions about the editor only
- embedding workflow behavior that belongs to a feature
- accidental divergence in interaction patterns

## Current UI Shape
- `button.tsx`
- `input.tsx`
- `card.tsx`

These are lightweight building blocks and should remain easy to reuse.

## Rules
- keep APIs small and predictable
- prefer composition over many one-off props
- do not add props for only one screen unless that pattern is likely reusable
- use `cn()` and existing variant patterns consistently
- preserve accessibility-sensitive behavior when editing focus, disabled, or interactive states

## Variant Rules
- if a new variant is added, it should represent a reusable visual pattern
- avoid adding variants that exist only to patch one page quickly
- prefer feature-level wrappers when a page needs special presentation

## Styling Rules
- keep primitives visually neutral enough to reuse
- do not encode diary-editor-only styling as a global primitive default
- respect existing Tailwind and `cva` patterns

## Good Outcome Standard
A good shared UI change:
- benefits multiple screens or preserves primitive consistency
- keeps component APIs understandable
- avoids coupling shared components to one feature
