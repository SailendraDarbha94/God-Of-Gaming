# Figma board of the player app

This folder draws `apps/player` in a Figma file: one frame for every state of every route, the flow between them as arrows and as a clickable prototype, and the design tokens as local styles. Nothing is traced from screenshots. Each builder here mirrors one React Native component of the app, with the same nesting, tokens, strings and conditions, and reads the same sample data the app shows on fixtures. So the board shows what the code renders, including what looks wrong in it.

It is a tool to run on demand. It is not part of `pnpm check` or CI.

## Drawing the board

```bash
pnpm board:build
```

writes `scripts/figma-board/out/board.json` and a copy of `renderer.js` next to it (both ignored by git). Then, in a desktop browser:

1. Open the Figma design file, on the page the board should be drawn on.
2. Open the JavaScript console on that tab, paste the whole of [`loader.js`](loader.js) and press Enter.
3. Click the button that appears at the bottom left and choose both files from `out/`.

Figma exposes its plugin API as the global `figma` to scripts run in the tab of an open design file; no plugin is installed. The board takes about ten seconds to draw.

**A redraw replaces the board.** The renderer removes every section named `<number> · <title>` on the page and draws them again, so anything edited by hand inside those sections is lost. It also updates the local styles named `Color/…` and `Type/…`. To keep hand edits, move them out of those sections first, or draw on a new page.

## What is drawn

| Section                  | Holds                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 1 · Browse, book, cancel | The main path: Explore, a cafe, Pick a time, Review, the hold, the confirmed booking; sign-in and cancelling aside |
| 2 · Bookings tab         | The list in each state, cancelling from a card, and the other states of a booking's own screen                     |
| 3 · Profile and sign-in  | Both profile states and every state of the sign-in sheet                                                           |
| 4 · Every other state    | Loading, error and empty states of Explore, a cafe, Pick a time and Review, one row per route                      |
| 5 · Foundations          | Colours, the type scale, spacing, radii and the core components                                                    |

Under each frame are its name, the route file it draws and a note on what state it is and how the player gets there. Green arrows follow one player's story; grey dashed arrows are side paths. Controls that navigate carry prototype links, and the flow starts at Explore.

The story is fixed in [`scenario.ts`](scenario.ts): Saturday 21 November 2026, 6:05 pm in Bengaluru; a player opens Pixel Den, picks the Standard PC tier and holds four seats for Sunday evening, then confirms. The bookings are made through the fixture repositories of `@gog/data` on a clock that file controls, so every price, seat label, countdown and status is what the app would hold at that moment.

## How it works

| File                       | Role                                                                                                                                                                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dsl.ts`                   | The layout language: `box`, `row`, text, and props named after React Native's (`gap`, `pad`, `align`, `justify`, `grow`, `self`, margins, borders). Its header comment is the reference.                                                                                         |
| `ui.ts`                    | `src/components`: Text, Button, Card, Chip, TabIcon.                                                                                                                                                                                                                             |
| `components/shared.ts`     | The rest of `src/components`: EmptyState, ErrorState, ListRow, Notice, Section, Skeleton, Countdown.                                                                                                                                                                             |
| `components/*.ts`          | One file per feature folder of `src/features` (`catalog`, `booking`, `auth`), one builder per component.                                                                                                                                                                         |
| `chrome.ts`                | What the app does not draw itself: the phone frame, status bar, navigation header, tab bar, modal sheet, keyboard and system alert. Also `Screen()` and `ScrollView()`.                                                                                                          |
| `screens/*.ts`             | One file per route; each returns one `Phone()` per state. `screens/foundations.ts` holds the reference sheets.                                                                                                                                                                   |
| `scenario.ts`              | The sample data and the story, as one `Scenario` object every screen receives.                                                                                                                                                                                                   |
| `board.ts`                 | Where each frame sits (sections, rows, columns) and the arrows between them.                                                                                                                                                                                                     |
| `lower.ts`                 | Resolves React Native's layout rules into what Figma auto-layout needs spelled out: a sizing mode per axis for every node, wrapper frames for margins and `alignSelf`, borders counted in layout.                                                                                |
| `build.ts`                 | Runs every screen, validates the trees (`tools/validate.ts`), lowers them and writes `out/board.json`.                                                                                                                                                                           |
| `renderer.js`, `loader.js` | Run in the Figma tab. The renderer creates the styles, sections, frames, captions, prototype links and arrows, and makes the few layout fixes that need measuring (cells of a wrapped row sharing a height, wrapped text centred as a block). The loader hands it the two files. |
| `run.mjs`                  | Runs a TypeScript file here with [jiti](https://github.com/unjs/jiti), with `@app` (the player's `src`), `@gog/domain`, `@gog/data` and `@board` (this folder) on the import path.                                                                                               |

Builders import the app's own modules wherever those are free of `react`, `react-native` and `expo-*` imports: the theme, the copy constants, the formatters, the slot and booking-history logic, and `app.config.ts`. A string or a price is never retyped here.

## Keeping it current

When a component or a route changes, change its builder the same way, then:

```bash
pnpm board:check                        # type-checks against the app's real types, then lints
pnpm board:preview screens/explore.ts   # validates one file's trees and prints the layer outline
pnpm board:build
```

A rename or a signature change in the app that a builder depends on fails `board:check`. A change to a style or to JSX does not: the builder has to be read against its source.

### Rules for a builder

**Mirror the source. Do not design.** Same nesting, order, strings, tokens and conditions. If the source renders nothing in some state, render nothing. If the source looks wrong, draw it wrong the same way.

- Styles: translate each StyleSheet entry line by line, with the tokens (`spacing.md`, `colors.border`, `radii.lg`), never the number they stand for. `flex: 1` is `grow: true`; `alignItems` is `align`; `justifyContent` is `justify`; `alignSelf` is `self`; `flexWrap: 'wrap'` is `wrap: true`; `marginTop` is `mt`; `borderWidth` and `borderColor` are `strokeW` and `stroke`; `overflow: 'hidden'` is `clip: true`. A percentage width or an `aspectRatio` becomes the number it works out to on the 393 pt phone.
- A builder takes the props of its React component, minus the callbacks. For each press handler it takes a `Link` (`go`, `goHow`, `back`), so a screen can turn the control into a prototype link. Where the component reads a hook, the builder takes the value as a prop.
- `View` is `box` or `row`; `Text` is `Text()`; a `Pressable` is the box that carries its style plus the link; an `Image` is a box with `image`; `ScrollView` and `FlatList` are `ScrollView()`; `ActivityIndicator` is `Spinner()`; a `TextInput` is a box in the input's style holding its value or placeholder; `Alert.alert` is `SystemAlert()` in the `overlay` of its own state.
- Each `box` is named after its component or its style (`styles.footer` is `name: 'footer'`). The names become the layer names in Figma.
- A screen file returns the story's state first, then one frame for each other distinct state the route can render. A frame's `key` is what links and arrows refer to: the route's key (`explore`, `cafe`, `pick`, `review`, `booking-held`, `bookings`, `profile`, `sign-in`) or that key with a suffix for another state (`explore-empty`, `sign-in-code`).
- Not supported: negative margins, transforms, shadows, `zIndex`.

## What is approximate

- **The font.** The app uses the system font. The board sets text in Inter: San Francisco was listed by Figma in the browser but drew nothing through its API when this was built. Line breaks can differ from a device by a word.
- **System chrome.** The status bar, the back button, the modal sheet, the keyboards and the alert are drawn to match iOS and React Navigation's defaults. The app only sets their colours.
- **Photos.** Covers and gallery images are the picsum placeholders of the sample data, which Figma fetches while drawing.
- **The prototype.** A link leads to the settled state, not to the moment in between (Hold seats goes to the hold, not to the spinner). Each booking in the story has one frame, so a frame's back button can lead somewhere else than in the app when it was reached another way. Cards of bookings that have no frame of their own are not linked.
- **Scrolling.** A frame in `full` mode is as tall as its content, so the whole screen can be read on the canvas; in the prototype it is taller than a phone.
