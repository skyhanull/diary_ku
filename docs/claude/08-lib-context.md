# Lib Context Guide

## Purpose
This guide applies when working in `src/lib/*`.
The lib layer should stay focused on shared utilities and external service boundaries.

## What Lib Owns
- shared helper functions
- service/client setup
- low-level reusable utilities

## What Lib Should Avoid
- feature-specific orchestration
- editor workflow logic
- dumping unrelated utilities into one file without cohesion

## Current Lib Shape
- `utils.ts`: shared className utility
- `supabase.ts`: Supabase client setup and configuration state

## Rules
- keep modules small and explicit
- group only truly shared logic here
- prefer feature-local helpers unless reuse is cross-feature
- keep environment variable access centralized when tied to service setup
- make nullability and configuration state explicit

## Service Boundary Rules
- external client initialization belongs here or in a similarly clear boundary
- do not hardcode secrets
- do not spread environment-dependent setup across random components
- if a service can be unavailable, expose that state clearly

## Utility Rules
- utility functions should be generic and unsurprising
- avoid storing domain assumptions in generic helpers
- prefer one clear utility over a bag of loosely related helpers

## Good Outcome Standard
A good lib-layer change:
- clarifies a shared concern
- reduces duplication without hiding domain meaning
- keeps feature logic inside the feature layer
