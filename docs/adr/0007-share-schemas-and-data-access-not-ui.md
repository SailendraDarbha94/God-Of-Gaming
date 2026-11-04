# 0007. Share schemas and data access between apps, not UI

Date: 2026-11-04
Status: Accepted

## Context

The website is a content site rendered on the server; the player app is a native booking app. Universal UI layers (react-native-web, Tamagui and friends) would let one component tree serve both, at the price of styling compromises, heavier bundles on the web and a steeper toolchain, for two surfaces that have little in common visually or behaviourally.

## Decision

- Shared: `@gog/domain` (Zod schemas, types, pure rules) and `@gog/data` (repositories, mappers, generated database types).
- Not shared: components, styling, navigation. `apps/web` uses React Server Components and Tailwind CSS; `apps/player` uses React Native primitives with a small theme module.
- Design tokens (colours, spacing, type scale) may be shared later as a plain JSON package if the two apps need to look like one brand; that is a new, small decision when it comes.

## Consequences

- Two implementations of any visual element, by design. The number of such elements is small and the two surfaces evolve on different schedules anyway.
- Business rules exist once, are tested once, and cannot drift between apps.
