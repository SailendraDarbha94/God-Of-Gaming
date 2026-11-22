# Player app: what drawing it in Figma found

21 November 2026. Code: `main` at `5e328b9`. Scope: `apps/player`.

The Figma board of the player app (`scripts/figma-board`) was made by translating every component and route of the app, line by line, into a drawing. Reading the code that closely turned up things that look unintended, inconsistent or unfinished. This is the list. Nine entries were fixed on 22 November 2026 and say so; the rest are open. **Nothing was run on a device**, the fixes included: the app had not yet had its first run on a simulator when this was written.

Every entry was checked twice after it was first noted: one reader went back to the code and tried to refute it, and another looked for what the spec, the ADRs and the code comments say about it. Of 105 notes, 8 turned out to be about the drawing and are left out, none was refuted, and 13 had a detail corrected. The rest are merged where several screens showed the same thing, which leaves 69 entries, plus 14 that need no action.

## How to read an entry

- **Severity** is a judgement, not a measurement. High: a player can get stuck, lose a booking or be misled about one. Medium: visible and confusing, or plainly unpolished. Low: cosmetic, or rare.
- **Where** is the code the entry rests on, relative to `apps/player` unless it names another folder. Line numbers are those of `5e328b9`.
- An entry is read from the code unless it says otherwise. Sizes that were **worked out** come from the styles and an estimate of text width, not from a screen. Entries that **need a device** say what to look at.
- **Documents** appears only when a spec, an ADR or a code comment speaks to the entry: the behaviour is deliberate, a planned milestone changes it, or the documents say something else. Without that line, the documents are silent.

## Look at these first

- **9. A cafe opened from a link at a cold start has no way back** (high, needs a device)
- **35. On the live database the hold screen may stay on "ON HOLD, 0:00"** (medium, needs a device)
- **1. Buttons sit at the left under centred text in every empty and error state** (medium, fixed 22 November)
- **50. Privacy, Terms and Website can open localhost in a release build** (medium)
- **10. A failed refresh replaces a loaded cafe with the error screen** (medium, fixed 22 November)
- **44. A failed refresh replaces the loaded bookings with the error screen** (medium, fixed 22 November)
- **38. An ended confirmed booking still says "You are booked" and offers Cancel** (medium)
- **43. A finished session keeps its CONFIRMED badge** (medium)
- **36. A refused Confirm shows two red notices at once** (medium)
- **37. "Pick a time again" has no button** (medium)
- **11. Nothing shows that the photo gallery swipes** (medium)
- **20. Starts after midnight wrap to two lines and make their row taller** (medium)
- **57. "Resend code" gives no confirmation** (medium)
- **45. The other cards' cancel buttons stay live during a cancel** (medium)
- **51. A failed sign-out shows nothing** (medium)
- **2. "Try again" on Explore reloads the cafes but not the areas** (medium, fixed 22 November)
- **39. Back after holding returns to Pick a time** (medium)

In all: 1 high, 16 medium, 52 low.

## Every screen

### 1. Buttons sit at the left under centred text in every empty and error state

Medium · layout

The shared empty-state block centres its title and message, but its button keeps the shared button's own alignment to the start, so the button sits at the left of the block under centred text (40 pt in from the screen edge on a padded screen). It shows wherever an empty or error state has a button, which is 18 of the states on the board: Explore (could not load), a cafe (could not load, not listed), Pick a time (four states), Review (three), a booking (four), the Bookings tab (signed out, empty, could not load) and Not found.

- Where: src/components/EmptyState.tsx:26,33-44; src/components/Button.tsx:54-61,75-87; src/components/ErrorState.tsx:16-21; app/(tabs)/index.tsx:58
- **Fixed on 22 November 2026:** the empty-state block now centres its button (`src/components/EmptyState.tsx`, `styles.action`).

## Explore (`app/(tabs)/index.tsx`)

### 2. "Try again" on Explore reloads the cafes but not the areas

Medium · state handling

The "Try again" button on the Explore error state reloads only the cafes, not the areas. If both failed on a cold start, tapping it can bring the cafes back while the area row still shows only "All areas", so the player cannot filter by area until they pull to refresh or leave the app and come back to it (the Explore tab stays mounted for the whole session, so nothing else reloads the areas).

- Where: app/(tabs)/index.tsx:23-32,58; src/providers/QueryProvider.tsx:9-25; app/(tabs)/_layout.tsx:8-28; node_modules/@tanstack/query-core/build/modern/query.js:245-250; node_modules/@tanstack/query-core/build/modern/queryObserver.js:491-497
- **Fixed on 22 November 2026:** "Try again" reloads the areas and the cafes (`app/(tabs)/index.tsx`, `retry`).

### 3. The area chips have no loading or error state

Low · state handling

The Explore screen treats the list of areas as empty until it arrives and has no loading or error treatment for it. While the areas are loading, or if that load fails with nothing cached, the area row shows only the "All areas" chip, with nothing to say more areas are coming or could not be loaded; the cafe list below has its own skeletons and error message, the area row has neither.

- Where: app/(tabs)/index.tsx:20,48; src/features/catalog/ExploreFilters.tsx:36-52; src/features/catalog/queries.ts:22-28

### 4. A failed refresh of a loaded list says nothing

Low · state handling

The "Could not load cafes" message is shown only in place of an empty list. If a reload fails while cafes are already on screen (pull to refresh, or the automatic reload when the app returns to the foreground), the refresh spinner simply stops and the old list stays, with nothing telling the player it is out of date.

- Where: app/(tabs)/index.tsx:23-28,37,50-65,68-70

### 5. Chips are offered for areas and kinds that have no cafe

Low · behaviour

The area row lists all 18 Bengaluru areas (19 chips with "All areas") and the kind row lists all 7 station kinds, regardless of whether any cafe matches. With the six sample cafes sitting in six areas, 12 of the 18 area chips lead straight to "No cafes here yet"; of the kind chips only "Other" is empty on its own, while "Xbox" and "Nintendo Switch" each find one cafe.

- Where: src/features/catalog/ExploreFilters.tsx:36-52,60-76; packages/domain/src/enums.ts:3,23-31; packages/data/src/fixtures/bengaluru.ts:48-67,165-381; packages/data/src/testing/catalog-contract.ts:59-61,116-135; supabase/migrations/20261117115900_reference_data.sql:3,24

### 6. Each new filter clears the list to placeholders

Low · behaviour

Each combination of area and kind is fetched and cached separately, and the previous results are not kept on screen while a new one loads. Tapping a chip for a combination not loaded in the last few minutes clears the list and shows three skeleton cards until the answer arrives; the header and chips stay in place, and combinations already loaded appear at once.

- Where: src/features/catalog/queries.ts:12-18,30-42; app/(tabs)/index.tsx:21,37,50-56

### 7. The area row does not scroll to the selected chip

Low · behaviour

The area chips sit in a plain sideways-scrolling row that never moves itself to show the selected chip. A filter is only ever set by tapping its chip, so the chip is in view at that moment, but if the player then scrolls the row back to the start, the filter stays on with its chip out of sight and the only clue is that "All areas" is not highlighted. The kind row works the same way.

- Where: src/features/catalog/ExploreFilters.tsx:31-53,55-77; app/(tabs)/index.tsx:18,47-49

### 8. The cafe card placeholder is shorter than the card

Low · layout · worked out from the styles, not measured on a device

The loading placeholder for a cafe card on Explore is shorter than the real card: its text area works out to 96 pt against 131 pt for a real card (name, area, station kinds, price row), so each card grows by about 35 pt when the list arrives and the cards below jump down. For a cafe with no station kinds listed the real card is 109 pt and the jump is about 13 pt.

- Where: src/features/catalog/CafeCardSkeleton.tsx:12-16,22-25; src/features/catalog/CafeCard.tsx:43-55,72-81; src/lib/theme.ts:30-53; app/(tabs)/index.tsx:50-56,86-91
- On a device: Open Explore on a slow or throttled connection and watch the three placeholder cards as the cafes load: each card's bottom edge should move down by roughly 35 pt at the swap (default text size).

## Cafe (`app/cafe/[slug].tsx`, `app/cafes/*`)

### 9. A cafe opened from a link at a cold start has no way back

High · behaviour · read from the code; needs a device to settle

When a cafe link opens the app from closed, the redirect swaps itself for the cafe screen and nothing sits beneath it, because the root layout names no anchor screen. The cafe then has no back button and no tab bar; the only way on is to book (the booking screen's "My bookings" button leads to the tabs) or the not-listed state's "Back to Explore". If the app is already running, the link is pushed on top of the current screen and the back button is there.

- Where: app/cafes/[slug].tsx:10-16; app/_layout.tsx:28-60 (no unstable_settings); app/cafe/[slug].tsx:38-40,114-119; app/booking/[id].tsx:47-49,218; node_modules/expo-router/build/getReactNavigationConfig.js:84-89; node_modules/expo-router/build/fork/useLinking.native.js:108-131; node_modules/expo-router/build/link/Redirect.js:15-31; node_modules/expo-router/build/react-navigation/native-stack/views/NativeStackView.native.js:183
- On a device: Force-quit the app, then open gog://cafes/<a live cafe slug> (or the https cafe link on a build with a verified host). Check whether the cafe header shows a back arrow and whether there is any way to reach Explore on iOS; on Android check what system back does. Then repeat with the app already open on Explore and confirm the back arrow returns there.

### 10. A failed refresh replaces a loaded cafe with the error screen

Medium · state handling

The cafe screen checks for an error before it looks at the data it already has. When a cafe is on screen and a later refresh fails (for example the player returns to the app after more than five minutes with a bad connection), the whole page is replaced by "Could not load this cafe". Tapping "Try again" then shows no sign of working until the request and its one automatic retry finish, because the loading skeleton only comes back when there is no earlier data. This needs the live backend; the sample data never fails.

- Where: app/cafe/[slug].tsx:49-71; src/features/catalog/queries.ts:20,45-51; src/providers/QueryProvider.tsx:11,17-25; src/components/ErrorState.tsx:10-22; node_modules/@tanstack/query-core/build/modern/query.js:504-534,566-576 (v5.105.3); packages/data/src/catalog/supabase-catalog.ts:99-109; packages/data/src/fixtures/settle.ts
- **Fixed on 22 November 2026:** the error screen now shows only when there is nothing loaded to show, here and on Pick a time and Review, which read the same cafe. A refresh that fails keeps the cafe on screen; it is still not announced (entry 4 describes the same silence on Explore).

### 11. Nothing shows that the photo gallery swipes

Medium · layout · worked out from the styles, not measured on a device

Each cafe photo is exactly as wide as the visible gallery area (screen width minus the page's 16 pt side padding on each side, a figure the gallery repeats rather than receives), with the next photo 8 pt beyond the edge. No part of the next photo shows, the scroll bar is hidden, and there are no dots or counter, so a cafe with several photos looks like it has one unless the player happens to swipe. The sample cafes each have three photos.

- Where: src/features/catalog/Gallery.tsx:16,23-41,60-62; src/components/Screen.tsx:23-32,42-45; app/cafe/[slug].tsx:79-80; app.config.ts:48; supabase/seed.sql:59-67
- On a device: Open a cafe with three photos: confirm no sliver of the second photo is visible at the right edge and nothing (dots, counter, scroll bar) hints that the strip swipes.

### 12. A paused cafe reads "not listed"

Low · copy

A paused cafe is never returned to the app (both the sample catalog and the database rules hand out live cafes only), so a player opening one sees "This cafe is not listed. It may have paused bookings, or the link is out of date." The in-page notice "This cafe is not taking bookings right now." can therefore only appear for a live cafe that has no tiers or no active stations in any tier, and no sample cafe is like that, so the notice is never seen today.

- Where: app/cafe/[slug].tsx:30-44,73,98-102; packages/domain/src/entities.ts:140-143; packages/data/src/catalog/fixture-catalog.ts:72-77,110-115; packages/data/src/catalog/supabase-catalog.ts:99-109; packages/data/src/catalog/mappers.ts:62,175; supabase/migrations/20261104120500_cafes.sql:36-40; supabase/migrations/20261104120900_stations.sql:25-37; packages/data/src/fixtures/bengaluru.ts (stationCount values, status at 485)
- Documents (a planned change): Today's behaviour matches the documents (ADR 0011: "Draft or paused cafes are invisible"; ADR 0016: "`cafe_status = 'paused'` keeps its iteration-1 meaning: hidden"; spec 02 defines isBookable as live with a tier that has stations), and iteration 2's M2 changes isBookable to also require `appBookingsEnabled` and a pledged station and has the player app read "Not taking app bookings" with the cafe's WhatsApp link, which makes the in-page notice an ordinary state for listed-only cafes and replaces its copy; the not-found wording "It may have paused bookings" is not addressed anywhere, and iteration 2's sample data keeps app bookings on for all six live cafes (iteration-2/08-sample-data.md:13). Source: docs/spec/iteration-2/04-packages.md:63 (Changed public entities, M2) and docs/spec/iteration-2/01-scope.md:65 and :93-98 (M2); current behaviour per docs/adr/0011-security-posture.md:13, docs/adr/0016 Decision (line 21) and docs/spec/02-domain-model.md:62

### 13. The header has no title while a cafe loads or fails to load

Low · layout

While a cafe loads for the first time, and if that first load fails, the header has no title: the layout sets it to blank and only the loaded cafe (its name) and the not-listed state ("Cafe") set one. If the error appears after the cafe had already been shown, the header keeps the cafe's name, because a title once set stays.

- Where: app/_layout.tsx:44; app/cafe/[slug].tsx:32,49-67,78; node_modules/expo-router/build/views/Screen.js (setOptions in a layout effect, no cleanup); node_modules/expo-router/build/layouts/stack-utils/StackScreen.js:48-65

### 14. The /cafes redirect is not registered in the layout

Low · layout · read from the code; needs a device to settle

The redirect for a cafe link hides its header, but the redirect for the bare cafes list link is not registered in the layout, so it gets the default header, whose title falls back to the route name ("cafes/index"). The redirect to Explore only fires after that screen has mounted, so a player following such a link may see that header for a moment; whether it is actually noticeable is not known.

- Where: app/_layout.tsx:35-54; app/cafes/index.tsx:9-11; app/cafes/[slug].tsx:10-16; app.config.ts:63-76; node_modules/expo-router/build/link/Redirect.js:15-31
- On a device: With the app already open on Explore, open gog://cafes (on Android also https://<host>/cafes/ with a trailing slash) and watch the transition: does a header reading "cafes/index" with a back arrow show before Explore appears? Repeat from a force-quit app to see whether the splash covers it.
- **Fixed on 22 November 2026:** `cafes/index` is registered without a header, like `cafes/[slug]` (`app/_layout.tsx`).

### 15. An empty tier reads "0 stations" and "Not bookable"

Low · copy

A tier's button is disabled and reads 'Not bookable' whenever the tier has no active stations, and its caption still reads, for example, 'PC · 0 stations'. The code also disables it when the cafe as a whole is not bookable, but the app only ever receives live cafes, so that happens only when every tier is empty, and then a notice above the list says the cafe is not taking bookings. A single empty tier among bookable ones gets no explanation beyond the '0 stations' caption.

- Where: src/features/catalog/TierRow.tsx:19,26-28,40-44; packages/domain/src/entities.ts:140-143; packages/domain/src/counts.ts:5-7; app/cafe/[slug].tsx:73,98-102; packages/data/src/catalog/mappers.ts:175; packages/data/src/catalog/fixture-catalog.ts:72-77,110-115; supabase/migrations/20261104120500_cafes.sql:36-40; supabase/migrations/20261104120900_stations.sql:25-37

### 16. Tier specs show values without their names

Low · copy

A tier's specs line shows only the values, joined with dots, never their names: 'RTX 4060 · 165 Hz', or just '55" 4K' for PS5 Lounge. The order is whatever order the keys arrive in, which the cafe does not control: the built-in sample data keeps the written order, while the live database stores specs as jsonb, which does not preserve the written order, so a three-spec tier can read in a different order there.

- Where: src/features/catalog/TierRow.tsx:18,34; packages/domain/src/entities.ts:46; packages/data/src/catalog/mappers.ts:70,176; supabase/migrations/20261104120800_station_tiers.sql:10,21; supabase/seed.sql:89-110; packages/data/src/fixtures/bengaluru.ts:182,200
- Documents (deliberate): No comment sits on TierRow.tsx:18 itself and spec 06 is silent, but the website's twin of this line is commented "Specs are free-form key/value pairs (\"RTX 4060\", \"165 Hz\"); the values read fine on their own" and spec 08 lists each tier's specs as bare values ("RTX 4060, 165 Hz", "55\" 4K"), so values-without-keys is stated as deliberate for the website only; nothing addresses the order of the values. Source: apps/web/src/lib/format.ts:85-87 (comment on `formatSpecs`, the website's identical `Object.values(specs).join(' · ')`); docs/spec/08-sample-data.md Cafes table (specs column)

### 17. Specs and description on a tier card have no space between them

Low · layout

On a tier card the specs line and the description sit directly under one another with no spacing between them; only the colour differs (specs in normal text, description muted). The card adds no gap between its children: only the header has space below it (8 pt) and the button space above it (12 pt).

- Where: src/features/catalog/TierRow.tsx:34-39,52-65; src/components/Card.tsx:14-24; src/lib/theme.ts:51

### 18. A cafe with no amenities leaves extra space

Low · layout

A cafe with no amenities shows nothing where the amenity chips would be, while a cafe with no games shows 'No games listed yet.' under its Games heading. The amenities have no heading, so showing nothing is reasonable; the only trace is that the description's 12 pt bottom margin remains, leaving 36 pt instead of 24 pt before the Hours heading (28 pt before the not-taking-bookings notice).

- Where: src/features/catalog/AmenityChips.tsx:13-15; src/features/catalog/GameChips.tsx:13-15; app/cafe/[slug].tsx:95-106,138-144; src/components/Section.tsx:25-28

### 19. A repeated amenity would give React two items with one key

Low · code only

Amenity chips are keyed by the amenity text itself, and nothing in the database or the data checks stops a cafe from listing the same amenity twice. If that happens React gets two items with the same key: a development warning, and the chip appears twice (which is the data's fault, not the key's). No sample cafe has a duplicate.

- Where: src/features/catalog/AmenityChips.tsx:18-20; packages/domain/src/entities.ts:104; packages/data/src/catalog/mappers.ts:92,196; supabase/migrations/20261104120500_cafes.sql:14

## Pick a time (`app/book/[tierId]/index.tsx`)

### 20. Starts after midnight wrap to two lines and make their row taller

Medium · layout · worked out from the styles, not measured on a device

A start after midnight shows the next date with the free count, for example "Sun, 22 Nov · 12 free". That is about 128 pt of text at caption size against 97 pt of room inside a normal three-per-row cell, so it wraps to two lines and the whole row becomes taller than the others (about 88 pt against 70). It happens in the app's own sample data: on a Friday or Saturday most sample cafes stay open past midnight, and on the Saturday evening of the story with a 1 h session the 12:00 am cell sits in a three-wide row, while 12:30 am and 1:00 am land in a stretched last row where the text fits.

- Where: src/features/booking/SlotGrid.tsx:27-34,55-57,71-82; packages/domain/src/time.ts:157-161; src/lib/theme.ts:51; packages/data/src/fixtures/bengaluru.ts:117-136; packages/domain/src/hours.ts:91-110; packages/domain/src/booking.ts:145; scripts/figma-board/scenario.ts:246-282
- On a device: On a Saturday evening open pick-a-time for Pixel Den's Standard PC with a 1 h session and look at the 12:00 am cell: whether its caption wraps to two lines, where the line breaks, how the two lines are aligned, and whether that row is taller than the rest.

### 21. The last row of the start grid stretches

Low · layout · worked out from the styles, not measured on a device

The start-time grid lays out three cells per row and lets every cell grow to fill its row, so a last row with fewer than three starts is stretched: on a 393 pt wide phone full rows have 115 pt cells, a last row of two has 176.5 pt cells and a last row of one is a single 361 pt cell. The loading placeholder grid does the same. Example from the sample data: Pixel Den on a Sunday with a 2 h session has 23 starts, so 8:30 pm and 9:00 pm appear as two wide cells.

- Where: src/features/booking/SlotGrid.tsx:66-82; src/features/booking/SlotGridSkeleton.tsx:25-33; src/components/Screen.tsx:42-45; app/book/[tierId]/index.tsx:126-153; packages/domain/src/hours.ts:91-110; packages/data/src/fixtures/bengaluru.ts:117-122
- On a device: Open pick-a-time for a day whose number of starts is not a multiple of three and compare the width of the last row's cells with the rows above.
- **Fixed on 22 November 2026:** the grid and its placeholder complete the last row with empty cells, so every start keeps the width of a full row's (`emptyCellsInLastRow` in `src/features/booking/slots.ts`, with a test).

### 22. Changing the day drops the chosen start without a word

Low · behaviour

The chosen start is remembered as an exact moment and only counts while it is in the grid on screen and still bookable. Switching to another day leaves nothing selected and Continue goes grey with no message; raising seats above that start's free count greys the cell and Continue the same way (a message appears only when no start at all has enough seats). The choice is not thrown away: going back to the original day or lowering the seats brings it back, and changing the duration keeps it once the new grid has loaded, provided that start still fits.

- Where: src/features/booking/useBookingDraft.ts:52-55, 78-87, 94; src/features/booking/slots.ts:111-129; src/features/booking/queries.ts:21-45; app/book/[tierId]/index.tsx:136-158; packages/domain/src/hours.ts:91-110
- Documents (deliberate): The hook documents the drop as deliberate ("The chosen start, only while it is still selectable with the current seats and duration") and spec 06 orders the step as day, duration, seats, "then slot grid"; no document addresses the missing message when the selection is dropped, nor the day-change case specifically. Source: apps/player/src/features/booking/useBookingDraft.ts:40 (doc comment on selectedSlot); docs/spec/06-player-app.md:15 (Screens, book/[tierId]/index.tsx row)

### 23. "Start time" shows a bare heading when no day fits

Low · state handling

When no opening day in the next two weeks can fit the chosen duration, the Day section says so, but the Start time section still shows its heading with nothing under it, directly above a greyed-out Continue. The player can still recover by picking a shorter duration.

- Where: app/book/[tierId]/index.tsx:110-116, 126-127, 155-161; src/components/Section.tsx:13-21; src/features/booking/useBookingDraft.ts:73-78

### 24. The free-seats error is the full-page error block inside the form

Low · layout · worked out from the styles, not measured on a device

When free seats fail to load, the Start time section shows the app's general-purpose error block: a centred title "Could not load free seats", a centred line of help and a "Try again" button, with 32 pt of space above and below. It is about 183 pt tall on a 393 pt wide phone, roughly the height of two and a half rows of start times, and its centred text sits inside an otherwise left-aligned form.

- Where: app/book/[tierId]/index.tsx:129-135; src/components/ErrorState.tsx:10-22; src/components/EmptyState.tsx:32-44; src/components/Button.tsx:75-84
- On a device: Make the availability request fail (network off after the cafe has loaded) and look at the Start time section: the error block's height and its centred text against the left-aligned sections above it.

### 25. A missing cafe and a missing tier show the same message

Low · copy

On Pick a time and on Review, a cafe that no longer exists and a tier that is no longer in its cafe show the same single line, "This station tier is no longer listed", with a "Back to Explore" button and no second line. When it is the whole cafe that is gone, the wording points at the wrong thing.

- Where: app/book/[tierId]/index.tsx:27-30, 37-47, 72-82; src/features/catalog/queries.ts:45-51; packages/data/src/catalog/repository.ts:35

### 26. The seat stepper stops at 10 without saying why

Low · copy

The seat stepper explains its limit only when the tier has fewer than 10 stations: at the top it shows "This tier has N stations." When the limit is the booking rule's own 10 seats (any tier with 10 or more stations), the + button simply greys out at "10 seats" and nothing on the screen says that 10 is the most one booking can hold.

- Where: src/features/booking/SeatStepper.tsx:16-19,49-53; src/features/booking/useBookingDraft.ts:58-63; packages/domain/src/constants.ts:12-17; app/book/[tierId]/index.tsx:122-124
- Documents (deliberate): Spec 06 ties the caption to the tier cap only - "seats (1 to 10, capped at the tier's station count with a \"This tier has N stations\" caption)" (INTEGRATION.md: "the seat stepper is capped at the tier's station count with a caption") - and no document asks for an explanation when the stepper stops at the rule's own maximum of 10; iteration 2 M2 (01-scope.md line 65) changes the cap to pledged stations but adds nothing about this. Source: docs/spec/06-player-app.md, Screens, book/[tierId]/index.tsx row (line 15); apps/player/src/features/booking/SeatStepper.tsx:10 and :15 comments; useBookingDraft.ts:58 comment; docs/spec/INTEGRATION.md line 76

### 27. The day and duration rows are cut off at the page margin

Low · layout · worked out from the styles, not measured on a device

The day and duration rows scroll sideways, but each strip ends at the screen's 16 pt side margin, so chips are cut off there instead of sliding out under the screen edge. There are up to 14 day chips (15 when a "Late night" chip is added) and 12 duration chips; on a 393 pt wide phone about three days and four durations are fully visible, with the next one cut. Everything is reachable by scrolling.

- Where: src/features/booking/DayPicker.tsx:16-20, 35-39; src/features/booking/DurationPicker.tsx:14-22; src/components/Screen.tsx:23-32, 42-45; src/components/Chip.tsx:30-37; src/features/booking/slots.ts:43, 88-108, 132-142; packages/domain/src/constants.ts:13-15
- On a device: On the Pick a time screen, look at the right end of the Day and Duration rows and scroll them: chips should disappear at a line 16 pt in from each screen edge rather than at the edge itself.

### 28. The start grid's placeholder cells are shorter than real cells

Low · layout · worked out from the styles, not measured on a device

While free seats load, each placeholder cell is 64 pt tall, but a real start-time cell is 70 pt tall at the default text size (1 border, 12 padding, 22 time line, 4 gap, 18 caption line, 12 padding, 1 border). When the real grid replaces the placeholder it grows by 6 pt per row, so everything below it, including the Continue button, jumps down (30 pt for five rows, 48 pt for eight).

- Where: src/features/booking/SlotGridSkeleton.tsx:17; src/features/booking/SlotGrid.tsx:71-82; src/lib/theme.ts:30-53; src/components/Skeleton.tsx:13-33
- On a device: On pick-a-time, change the day or duration and watch the Continue button as the placeholder grid is replaced by the real one; it should shift down a little.

### 29. Pick a time's loading placeholder does not match the screen

Low · layout

While the cafe loads, the screen shows two short placeholder lines and two full-width 44 pt bars, which do not line up with what replaces them (tier name, cafe and rate line, four titled sections and a Continue button), so the content visibly rearranges when it arrives. Players coming from the cafe page normally never see it, because the cafe is already loaded there; it shows when the screen is opened directly, for example from a link.

- Where: app/book/[tierId]/index.tsx:49-60, 103-162, 166-169; src/features/catalog/queries.ts:45-51; app/cafe/[slug].tsx:28, 115-118

## Review (`app/book/[tierId]/review.tsx`)

### 30. Back still works while "Hold seats" is running

Low · state handling

While 'Hold seats' is working, the 'Change time' button is switched off but the header back arrow, the iOS back swipe and the Android back key are not. A player who goes back in that moment still gets the hold, and when it arrives the app swaps whichever screen is then showing (normally Pick a time) for the Booking screen, so the screen jumps under them and Pick a time is gone from the back stack.

- Where: app/book/[tierId]/review.tsx:103-129,153-170; app/_layout.tsx:35-48 (no back or gesture lock on the review screen); src/features/booking/queries.ts:97-105; node_modules/expo-router/build/global-state/router.js (replaceImpl, linkToImpl); node_modules/expo-router/build/global-state/routingQueueContext.js (RoutingQueueProvider, app-wide queue); node_modules/expo-router/build/global-state/resolveNavigationDestination.js (REPLACE resolved against the current state, no source route)

### 31. "Hold seats" stays enabled after the start has become too soon

Low · state handling

When the chosen start no longer passes the booking rules (typically the 5-minute lead time has run out while the player sat on Review), pressing 'Hold seats' shows the red 'Pick a start at least 5 minutes from now and within 30 days.' notice and leaves 'Hold seats' enabled, so pressing it again just shows the same notice. The player leaves with 'Change time' or the header back arrow. The same start-time wording is shown whichever rule failed.

- Where: app/book/[tierId]/review.tsx:103-110,148-170; src/features/booking/copy.ts:16; packages/domain/src/booking.ts:92-161; packages/domain/src/constants.ts:12-25; app/_layout.tsx:47

### 32. Closing the sign-in sheet leaves no hint on Review

Low · copy

If a signed-out player presses 'Hold seats' and then closes the sign-in sheet ('Not now' or swiping it away), they are back on Review with nothing changed and no message that holding seats needs sign-in. The 'Sign in to hold seats.' wording exists but on this screen it can only appear if the server itself rejects the hold for lack of a session, never after the sheet is dismissed; the sheet itself does not say why it opened either. The silent stop is how the session code is designed to be used.

- Where: app/book/[tierId]/review.tsx:111-114,126-128; src/providers/SessionProvider.tsx:26-30,122-139; app/auth/sign-in.tsx:24-30,89-98; src/features/booking/copy.ts:15,28-32; src/features/auth/PhoneForm.tsx:34-35
- Documents (deliberate): The spec says requireSession() resolves with null when the sheet is dismissed ("Not now"), "so a caller such as 'Hold seats' stops instead of waiting forever", and the code comment says "so callers can simply stop"; no document asks for a hint afterwards, and auth_required copy is specified only as the BookingErrorCode mapping (spec 06 line 29, copy.ts:13). Source: docs/spec/06-player-app.md, Data and session, line 28 (recorded in docs/spec/CHANGELOG.md line 157); apps/player/src/providers/SessionProvider.tsx:27-28

### 33. "Pick a time first" offers no way to Pick a time

Low · copy

When Review is opened with missing or malformed details, it shows 'Nothing to review' and 'Pick a time first.', but the only button is 'Back to Explore', which goes to the cafe list. Nothing on the page leads to Pick a time, and the screen treats every bad link the same way even when the tier and cafe in it are valid. Going through the app normally never produces this state, so it is seen only from a broken or hand-edited link.

- Where: app/book/[tierId]/review.tsx:31,41-56; src/features/booking/params.ts:5-15; src/lib/params.ts:11-19; app/book/[tierId]/index.tsx:87-101

### 34. Review's loading state has no heading

Low · layout

While the cafe is loading, the Review screen shows one grey 220 pt placeholder block and nothing else; the 'Review your hold' heading and the line about the 10-minute hold appear only once the cafe has loaded (the navigation bar still says 'Review'). Coming from Pick a time the cafe is already loaded, so this is seen only when the screen is opened cold, for example from a link.

- Where: app/book/[tierId]/review.tsx:57-63,131-137; src/components/Skeleton.tsx:13-35; src/features/catalog/queries.ts:20,45-51; app/book/[tierId]/index.tsx:26; app/_layout.tsx:47

## Booking (`app/booking/[id].tsx`)

### 35. On the live database the hold screen may stay on "ON HOLD, 0:00"

Medium · state handling · read from the code; needs a device to settle

On the hold screen only the countdown text updates each second. When it reaches 0:00 the app reloads the bookings, but on the live database the row still says 'held' until the once-a-minute sweep, the reloaded data is identical, and nothing redraws the screen. It stays on 'ON HOLD / Seats held for 0:00' with Confirm and Release seats until the player taps one of them or leaves and comes back. On sample data the reload returns 'expired' and the screen changes at once.

- Where: app/booking/[id].tsx:42-45, 105-107, 142-162; src/components/Countdown.tsx:36-50; src/features/booking/queries.ts:48-61; src/providers/QueryProvider.tsx:9-25; node_modules/@tanstack/query-core/build/modern/queryObserver.js:421-429; supabase/migrations/20261104122600_cron_expire_holds.sql:9; packages/data/src/booking/fixture-booking.ts:87-105, 248-261
- Documents (they say otherwise): The documents expect a lapsed hold to read expired on the app clock ahead of the sweep ("the row still reads `held` until the sweeper ... so the screens derive this themselves"; the changelog lists "a running countdown on a lapsed one" as the defect fixed), so a screen left on ON HOLD at 0:00 would go against them; none describes what re-renders this screen at zero (`useNow` is offered only "for screens that derive lists from the time"). Source: code comment at apps/player/src/features/booking/history.ts:10-13 and 22-26; docs/spec/INTEGRATION.md line 58; docs/spec/CHANGELOG.md line 62; docs/spec/06-player-app.md lines 17 and 24
- On a device: With the app pointed at Supabase (not sample data), hold seats and leave the Booking screen open without touching it until the countdown reaches 0:00. Watch for 20 to 30 seconds: does the badge stay 'ON HOLD' with the 'Seats held for 0:00' card, or does it switch to 'HOLD EXPIRED' with the 'timer has run out' notice? Then tap Confirm and note what appears.

### 36. A refused Confirm shows two red notices at once

Medium · state handling

When the server refuses a Confirm because the hold is no longer live, the app marks the booking as expired and also keeps the refusal message, so the player sees two red notices at once: 'This hold expired before it was confirmed. Pick a time again.' above the summary and 'This booking can no longer be changed.' below it. The lower one never clears while the screen stays open, because the buttons that would reset it are gone. This happens on sample data and on the live database alike.

- Where: app/booking/[id].tsx:116-123, 179-186, 202-206; src/features/booking/queries.ts:87-95, 107-120; src/features/booking/copy.ts:23; packages/data/src/booking/fixture-booking.ts:208-222; supabase/migrations/20261104122300_confirm_booking.sql:34-38

### 37. "Pick a time again" has no button

Medium · behaviour

Both the 'timer has run out' notice and the 'hold expired' notice tell the player to pick a time again, but the screen has no button for that: a lapsed hold offers Confirm and Release seats, an expired one offers only My bookings. The header back arrow does lead to Pick a time when the player arrived straight from the booking flow; when the booking was opened from the Bookings tab it leads back to the list, and the player has to find the cafe again.

- Where: app/booking/[id].tsx:47-49, 158-162, 179-186, 208-230; app/book/[tierId]/review.tsx:119-125; app/(tabs)/bookings.tsx:99-101

### 38. An ended confirmed booking still says "You are booked" and offers Cancel

Medium · state handling

A confirmed booking whose session has already ended still shows 'You are booked. Show this screen at the counter and pay there.' and still offers Cancel booking, because the booking screen looks only at the status and never at the end time. The Bookings list hides Cancel for the same booking. Nothing in the app or database moves a booking to completed yet, and the server accepts a cancel at any time, so every past session reads this way and can be turned into 'Cancelled' after it was played.

- Where: app/booking/[id].tsx:109-110, 170-177, 220-229; src/features/booking/history.ts:31-37; src/features/booking/BookingCard.tsx:31, 52-60; supabase/migrations/20261104122400_cancel_booking.sql:43-49; packages/data/src/booking/fixture-booking.ts:228-245
- Documents (deliberate): Spec 06 says the cancel action on this screen follows `booking.status`, "never the phone clock", and confirmCancel.ts says the server answers `invalid_state` if a stale screen tries; iteration 2 M1 makes `cancel_booking` refuse from the start and moves the list's `isCancellable` to `startsAt` ("Cancel disappears at the start") without naming the booking screen, and no document addresses the "You are booked" wording after the session has ended. Source: docs/spec/06-player-app.md line 17 (Screens, `booking/[id].tsx`); code comments at apps/player/src/features/booking/history.ts:22-26 and confirmCancel.ts:6-12; docs/spec/iteration-2/01-scope.md line 65 and iteration-2/03-database.md line 366 (M1)

### 39. Back after holding returns to Pick a time

Medium · behaviour

Holding seats swaps the Review step for the Booking screen, leaving Pick a time underneath it. So after holding, and still after confirming, the back arrow (or Android back) returns to Pick a time with the day, duration and seat count as they were left, and the chosen start too if it is still free, rather than to the cafe or to the bookings list.

- Where: app/book/[tierId]/review.tsx:115-125; app/book/[tierId]/index.tsx:87-101; app/cafe/[slug].tsx:115-118; src/features/booking/useBookingDraft.ts:52-55, 94; app/_layout.tsx:43-48

### 40. A cancelled booking shows no explanation

Low · copy

A live hold shows a countdown card, a lapsed hold, a confirmed booking and an expired hold each show an explanatory notice, but a cancelled, completed or no-show booking shows none: just the badge, the cafe name, the summary and a My bookings button.

- Where: app/booking/[id].tsx:142-186, 208-219

### 41. The error notice touches the summary card

Low · layout

When a Confirm or a cancel fails on the booking screen, the red error notice appears directly under the summary card with no space between the two boxes, and then 40 pt of space (16 + 24) before the buttons. The notices above the summary are spaced normally; only this one touches the card.

- Where: app/booking/[id].tsx:188-208, 248-254; src/features/booking/BookingSummary.tsx:41, 72-74; src/components/Screen.tsx:23-32; app/book/[tierId]/review.tsx:148-152, 180-182 (the same notice there has a top margin)

### 42. The message-only booking screens sit at the top of the screen

Low · layout

The message-only screens of the booking route (invalid link, signed out, load failed, not found) are not centred vertically: the title starts about 48 pt below the header and the rest of the screen is empty.

- Where: app/booking/[id].tsx:51-100; src/components/Screen.tsx:34, 38-46; src/components/EmptyState.tsx:33-38

## Bookings tab (`app/(tabs)/bookings.tsx`)

### 43. A finished session keeps its CONFIRMED badge

Medium · state handling

The app only rewrites one status on its own: a hold whose timer has run out reads "Hold expired". A confirmed session that has already finished keeps its green CONFIRMED badge; it is moved to the Past section by its end time and loses the cancel button, but nothing in the app, the sample data or the current database ever turns it into "Completed". In the sample data the Thursday Respawn Room session shows this way. The planned iteration-2 sweeper would complete only sessions that were checked in at the counter, so others would still read CONFIRMED.

- Where: src/features/booking/history.ts:14-55; src/features/booking/BookingCard.tsx:30-31,45,52; src/features/booking/StatusBadge.tsx:12-19; src/features/booking/copy.ts:34-41; packages/data/src/booking/fixture-booking.ts:248-261; supabase/migrations (no statement sets status to completed); docs/spec/iteration-2/03-database.md:386; scripts/figma-board/scenario.ts:179-188
- Documents (a planned change): Today's behaviour is as documented (history.ts:23 "the server's status, except that a lapsed hold reads `expired`"; spec 06 names only the lapsed hold; INTEGRATION.md item 13 says the card "offers Cancel only while the session is live and has not ended"), and iteration 2's M5 adds a sweeper so "A sweeper marks finished sessions completed" (ADR 0016) - only partly resolving it, since "App bookings that ended without a check-in stay `confirmed`" until staff mark a no-show, and no player-side change to the badge is planned. Source: docs/adr/0016-keeping-app-availability-true-at-the-counter.md line 26; docs/spec/iteration-2/03-database.md "Sweeper (M5)" (settle_finished_bookings, line 386) and 01-scope.md "M5. The counter lifecycle"; current behaviour per apps/player/src/features/booking/history.ts:22-25 and docs/spec/06-player-app.md bookings.tsx row

### 44. A failed refresh replaces the loaded bookings with the error screen

Medium · state handling

If a background reload of the bookings fails (for example on returning to the app with a bad connection), the whole list is replaced by the full-screen 'Could not load your bookings' message even though the bookings loaded earlier are still held in memory. Tapping 'Try again' then shows no spinner or skeleton: the screen stays on the error for the whole retry (two attempts about a second apart) and only changes if the reload succeeds.

- Where: app/(tabs)/bookings.tsx:44-66; src/features/booking/queries.ts:48-54; src/providers/QueryProvider.tsx:9-21; node_modules/@tanstack/query-core/build/modern/query.js:504-508,522-534,566-576
- **Fixed on 22 November 2026:** the error screen now shows only when there is nothing loaded to show, here and on a booking's own screen. A refresh that fails keeps the list on screen; it is still not announced.

### 45. The other cards' cancel buttons stay live during a cancel

Medium · behaviour

While one cancel is in flight, the cancel buttons on the other cards stay active. Tapping a second one starts a second request and the spinner moves to that card, while the first card's button goes back to normal although its request is still running. If that first request then fails, no error is shown for it, because the error message is only wired to the most recent cancel; if it succeeds the card still updates.

- Where: app/(tabs)/bookings.tsx:74-83,102-105; src/features/booking/queries.ts:122-130; src/components/Button.tsx:47-53; node_modules/@tanstack/query-core/build/modern/mutationObserver.js:136-142,155-160

### 46. A failed cancel's message cannot be dismissed

Low · state handling

When a cancel fails, a red error message appears above the list and has no close control. It is only cleared when the player starts another cancel, so it stays there through data reloads, visits to other tabs and to a booking's detail, until then or until the app restarts. The list has no pull-to-refresh, so there is no other gesture that would clear it either.

- Where: app/(tabs)/bookings.tsx:26,74-83,108; src/components/Notice.tsx:20-32; app/(tabs)/_layout.tsx:8-18 (tabs stay mounted)

### 47. "Release seats" acts on one tap, inside a tappable card

Low · behaviour

The cancel button sits inside the tappable booking card, and on a hold 'Release seats' acts on a single tap with no prompt (deliberate; cancelling a confirmed session does ask first). The button's touch area is its whole padded box, 16 pt wider than the label on each side and at least 48 pt tall, but it is invisible because the button has no background or border. A tap inside that box releases the hold; a tap anywhere else on the card opens the booking.

- Where: src/features/booking/BookingCard.tsx:34-62,82-85; src/features/booking/confirmCancel.ts:6-28; src/components/Button.tsx:31-35,49-61,75-84; src/lib/theme.ts:58

### 48. The Bookings list spaces its rows twice

Low · layout · worked out from the styles, not measured on a device

The Bookings list spaces its rows twice: the list container adds 8 pt between every cell, and separate 8 pt separators are also rendered between cards and around each section. With the empty footer cell React Native adds to every section, the gaps come out uneven: 20 pt from a section heading to its first card, 16 pt between cards, 24 pt from the last Upcoming card to the PAST heading, and 48 pt below the last card.

- Where: app/(tabs)/bookings.tsx:90-94,119-121,133-144; node_modules/@react-native/virtualized-lists/Lists/VirtualizedSectionList.js:200-202,368-376,386-390,456-468,629-639; node_modules/@react-native/virtualized-lists/Lists/VirtualizedListCellRenderer.js:214-221; src/lib/theme.ts:30-37
- On a device: On the Bookings tab with at least two upcoming and one past booking, measure the vertical gaps: UPCOMING heading to first card (expect 20), card to card (16), last upcoming card to PAST heading (24), and the space under the last card (48).

### 49. The status badge sits at the top of a two-line card header

Low · layout

On a booking card the status badge carries its own top alignment, which wins over the header row's centre alignment, so the badge sits level with the first line of the cafe name instead of being centred against the name. With a one-line name there is nothing to see (the badge is 24 pt tall and sets the row height); it only shows when a cafe name is long enough to wrap to two lines, which none of the six sample cafe names do.

- Where: src/features/booking/StatusBadge.tsx:31-38; src/features/booking/BookingCard.tsx:41-46,73-81; src/lib/theme.ts:49,52; packages/data/src/fixtures/bengaluru.ts:166-380

## Profile (`app/(tabs)/profile.tsx`)

### 50. Privacy, Terms and Website can open localhost in a release build

Medium · behaviour

The Privacy, Terms and Website rows open addresses built from the website URL setting, which falls back to http://localhost:3000 when it is not set; unlike the sample-data setting, nothing stops a release build from shipping with that fallback, and the build profiles do not set it. On such a build all three rows open a localhost address in the phone's browser, which loads nothing. Separately, if the phone cannot open a link at all, the failure is not caught and the player sees nothing happen.

- Where: app/(tabs)/profile.tsx:39-41, 76-78; src/lib/site.ts:4-8; src/lib/env.ts:40, 42-68; eas.json:6-20

### 51. A failed sign-out shows nothing

Medium · state handling

If signing out fails, the error is only written to the developer log. The player sees the Sign out button spin and then come back, still signed in, with no message saying it did not work.

- Where: app/(tabs)/profile.tsx:28-37; src/providers/SessionProvider.tsx:117-120; packages/data/src/auth/supabase-auth.ts:56-61

### 52. Sign out asks nothing

Low · behaviour

Tapping Sign out signs the player out straight away, with no "are you sure" step. Getting back in needs a fresh SMS code.

- Where: app/(tabs)/profile.tsx:28-37, 64-70

### 53. Two quick taps on Sign in can open two sheets

Low · behaviour · read from the code; needs a device to settle

The Profile tab's Sign in button opens the sign-in sheet directly instead of going through the session helper that refuses to open a second sheet while one is already open. Nothing in the app's own code stops two quick taps from opening the sheet twice; whether a second tap can actually land before the sheet covers the button has to be tried on a phone.

- Where: app/(tabs)/profile.tsx:49-55; src/providers/SessionProvider.tsx:122-133; app/book/[tierId]/review.tsx:111
- On a device: Signed out, on the Profile tab, double-tap "Sign in" as fast as possible several times. Then tap "Not now" once: if another sign-in sheet is still showing underneath, two were opened.

### 54. Sign in and Sign out hug their labels at the left of the card

Low · layout

On the Profile tab, the "Sign in" and "Sign out" buttons are only as wide as their labels and sit at the left edge of their card, because the shared button hugs its label unless told to span the width and these two are not told to.

- Where: app/(tabs)/profile.tsx:49-55, 64-70; src/components/Button.tsx:43, 57, 75-87

### 55. The last row of each card has a divider under it

Low · layout

Every list row draws a thin line under itself, including the last row of a card. So on the Profile tab there is a line under "Display name" 16 pt above the Sign out button, and a line under "Website" 16 pt above the About card's own bottom border.

- Where: src/components/ListRow.tsx:49-57; app/(tabs)/profile.tsx:58-71, 75-79, 89-95; src/components/Card.tsx:15-24

### 56. Display name always reads "Not set"

Low · copy

The Display name row on the Profile tab is fixed text: it always says "Not set" with the hint "Editable in a later release." The app never reads the player's profile, so the row would say "Not set" even if a name were stored. The spec lists display name as "editable later", so this is a known placeholder.

- Where: app/(tabs)/profile.tsx:63; docs/spec/06-player-app.md:13; supabase/migrations/20261104121300_profiles.sql:5
- Documents (deliberate): Spec 06 lists "display name (editable later)" and ADR 0017 says "Players cannot set a display name yet: the player app's profile shows it as 'editable later'"; no milestone M0-M7 schedules the edit (iteration-2/01-scope.md line 55 leaves it until "Players can set a display name"). Source: docs/spec/06-player-app.md, Screens table, `(tabs)/profile.tsx` row (line 13); docs/adr/0017-cafes-see-bookings-not-players.md, Context (line 17)

## Sign-in sheet (`app/auth/sign-in.tsx`)

### 57. "Resend code" gives no confirmation

Medium · state handling

A successful Resend code gives no confirmation: the screen stays on the code step with the typed digits intact and no message, apart from clearing any error that was showing. The only sign is the brief busy state, in which the Verify button shows a spinner as if a code were being checked. If the resend fails for any reason other than no connection (including asking again too quickly), the code step shows 'Could not send the code. Check the number and try again.', advice that fits the phone step rather than this one.

- Where: src/features/auth/OtpForm.tsx:58-62; app/auth/sign-in.tsx:32-44,73-82; src/features/auth/copy.ts:10-26; packages/data/src/auth/supabase-auth.ts:23-29,38-43; supabase/config.toml:267-268

### 58. A pasted code with a separator loses a digit

Low · behaviour

The code field caps the raw text at six characters before non-digits are stripped, the very thing the phone field deliberately avoids. A code pasted with a space, dash or leading space ('123 456', '123-456', ' 123456') is cut to its first six characters and ends up as five digits, leaving Verify greyed out until the player types the missing digit. SMS autofill, which delivers digits only, is not affected.

- Where: src/features/auth/OtpForm.tsx:19,45-47,52; src/features/auth/PhoneForm.tsx:43-44; node_modules/react-native/React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputComponentView.mm:469-486; node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextInputManager.kt:626-647; supabase/config.toml:266
- **Fixed on 22 November 2026:** the six-character cap on the raw text is gone; the cap applies to the digits (`src/features/auth/OtpForm.tsx`).

### 59. "Change number" empties the field

Low · behaviour

Pressing Change number on the code step returns to an empty phone field. The number just entered is not carried back, so correcting a single digit means entering all ten again (or picking the number from the keyboard's autofill suggestion, if offered).

- Where: src/features/auth/OtpForm.tsx:62; src/features/auth/PhoneForm.tsx:10-19; app/auth/sign-in.tsx:14,64-71,83-86

### 60. A keyboard's done key can submit a second time

Low · state handling · read from the code; needs a device to settle

While a send or verify is running, the on-screen buttons are disabled but the text field stays live, and neither the forms nor the sign-in screen refuse a second submit, so the keyboard's done key can start a second request. On Android the numeric keyboards normally carry that key; a doubled send can leave 'Could not send the code...' showing on the code step even though a code went out (the second request trips the resend rate limit), and a doubled verify can flash a wrong-code message just before the sheet closes. On an iPhone the number pads have no such key, so there it only happens with a hardware keyboard.

- Where: src/features/auth/PhoneForm.tsx:22-30,40-57,61; src/features/auth/OtpForm.tsx:32-36,42-57,59; app/auth/sign-in.tsx:32-59; src/components/Screen.tsx:28; app.config (supportsTablet: false, line 54); node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactEditText.kt:1009-1010; supabase/config.toml:267-268
- On a device: On an Android phone with the default keyboard: enter a valid number, tap Send code, and while the spinner shows press the keyboard's tick/done key (the keyboard stays up after the button tap). Check whether a second request goes out: two SMS, or the 'Could not send the code...' notice appearing on the code step. Repeat on the code step with Verify. On an iPhone, confirm the pads show no return key.
- **Fixed on 22 November 2026:** both forms ignore a submit while a request is running (`PhoneForm.tsx`, `OtpForm.tsx`). The fields themselves stay editable, as the entry on that says.

### 61. Two error notices can stack on the phone step

Low · state handling

On the phone step, a failed send leaves its error message on screen until the next send actually starts. If the player then presses Send code with a number that is not a valid 10-digit Indian mobile, the form stops before sending, so the old message is not cleared and two red notices show at once: 'Enter a 10-digit Indian mobile number.' above the stale 'Could not send the code...' (or connection) message.

- Where: src/features/auth/PhoneForm.tsx:22-30,59-60; app/auth/sign-in.tsx:32-44,65-71

### 62. Error messages stay on screen while the player retypes

Low · state handling

Editing the phone number clears the 'Enter a 10-digit...' notice but not a failed-send message, and editing the code does not clear a failed-verify message. Either message stays on screen while the player retypes and only goes away when the next send, resend or verify starts (or, on the code step, when Change number is pressed).

- Where: src/features/auth/PhoneForm.tsx:45-48,60; src/features/auth/OtpForm.tsx:45-47,58; app/auth/sign-in.tsx:34,48,84

### 63. "Resend code" spins the Verify button

Low · state handling

The sign-in sheet has one "busy" flag for both sending and verifying. When the player taps Resend code, it is the Verify button that turns into a spinner, while Resend code and Change number just go dim.

- Where: app/auth/sign-in.tsx:21, 32-44, 73-82; src/features/auth/OtpForm.tsx:59-62; src/components/Button.tsx:47, 63-69

### 64. The fields stay editable while a request runs

Low · state handling

While a code is being sent or checked, the number and code fields stay editable; only the buttons are disabled. Edits made in that moment do not change the request already sent, and the code step shows the number the code actually went to.

- Where: src/features/auth/PhoneForm.tsx:40-57, 61; src/features/auth/OtpForm.tsx:42-57, 59-62; app/auth/sign-in.tsx:32-37, 74

### 65. The code step shows the number as one unbroken string

Low · copy

The code step shows the number exactly as it is sent to the sign-in service, as one unbroken run: 'Sent by SMS to +919876543210.' There is no space after +91 or inside the ten digits, which makes a mistyped digit harder to spot, the stated reason for showing it.

- Where: src/features/auth/OtpForm.tsx:10-11,41; src/features/auth/phone.ts:29-32; app/auth/sign-in.tsx:37,74
- **Fixed on 22 November 2026:** the code step shows the number grouped, as the Profile tab does: "+91 98765 43210" (`src/features/auth/OtpForm.tsx`).

### 66. The typed number loses the spacing its placeholder shows

Low · copy

The phone field's hint is written with a space ('98765 43210'), but whatever the player types, pastes or autofills is reduced to bare digits and shown as '9876543210' with no space.

- Where: src/features/auth/PhoneForm.tsx:42-53; src/features/auth/phone.ts:15-23
- Documents (deliberate): The bare-digit value is documented as deliberate: the normaliser makes `+91 98765 43210`, `098765 43210`, `9876543210` "all become the ten local digits"; no document specifies the placeholder's format or says the typed value should be grouped to match it. Source: docs/spec/06-player-app.md, Data and session, 'Phone entry' bullet (line 30); apps/player/src/features/auth/PhoneForm.tsx:43-44 comment; apps/player/src/features/auth/phone.ts:7-14 doc comment

### 67. Send code and Verify treat incomplete input differently

Low · behaviour

The two sign-in forms handle incomplete input differently. Send code can be pressed at any time (except while a request is running) and answers a bad number with a red notice; Verify is greyed out until exactly six digits are entered and never explains why, and submitting a short code from the keyboard silently does nothing.

- Where: src/features/auth/PhoneForm.tsx:22-30,59,61; src/features/auth/OtpForm.tsx:30-36,59; src/components/Button.tsx:47-53

### 68. "Resend code" and "Change number" sit inset from the edges

Low · layout · worked out from the styles, not measured on a device

"Resend code" and "Change number" are text-only buttons pushed to the two ends of a row, but each keeps the standard button padding, so their labels start and end about 16 pt (17 pt counting the invisible 1 pt border) inside the edges of the code field and the Verify button above them rather than lining up with those edges.

- Where: src/features/auth/OtpForm.tsx:60-63, 84-87; src/components/Button.tsx:34, 75-84
- On a device: On the code step, compare the left edge of the words "Resend code" and the right edge of "Change number" with the left and right edges of the Verify button: the words should sit visibly inside them.

### 69. The keyboard may cover the sheet's lower buttons

Low · layout · read from the code; needs a device to settle

The sign-in sheet's keyboard-avoiding wrapper is placed inside the scrolling content instead of around it, so it cannot move anything out of the keyboard's way. Whether the lower buttons (Resend code, Change number, Not now) end up hidden behind the number pad on a small phone, especially with an error box showing, has to be checked on a device.

- Where: app/auth/sign-in.tsx:62-63, 99-100; src/components/Screen.tsx:23-33
- On a device: On the smallest phone supported, open the code step, enter a wrong code so the error box shows, and with the number pad up check whether Resend code, Change number and Not now are fully visible, and if not whether the sheet can be scrolled to reach them.

## Checked, and no action needed

Redundant code, or behaviour that is deliberate and reads fine. Listed so nobody has to find them again.

- The cafe page's loading placeholder hard-codes the photo strip height as 220, a second copy of the gallery's own private height constant. The two match today, so a player sees no difference; if one is changed without the other the page will jump when it loads. (The cafe card placeholder, by contrast, imports its height from the card.) (src/features/catalog/CafeDetailSkeleton.tsx:9)
- The photo strip sets both 'paging' and a snap interval. In the installed React Native (0.88.1) the snap interval wins on both platforms: on iPhone paging is switched off whenever a snap interval is given, and on Android it is switched on by the snap interval anyway. The paging setting is redundant; photos snap one photo-width plus the 8 pt gap either way. (src/features/catalog/Gallery.tsx:25,29-30)
- The gallery defines the same style twice, once for a photo and once for the empty-gallery block (same height, corner radius and background). Redundant code only; nothing a player sees. (src/features/catalog/Gallery.tsx:19,36,50-59)
- The booking card checks twice that a booking is on hold or confirmed before showing the cancel button. The second check can never change the outcome, because the first one already only passes for those two statuses at the same instant; it is there so the code can look up the right button label. Players see no effect. (src/features/booking/BookingCard.tsx:30-31,52-54)
- The cafe heading block asks its children to align to the start, but the "Open in Maps" button already does that by itself and the two text lines are left-aligned with no background, so removing the setting would change nothing a player can see. (app/cafe/[slug].tsx:81-93,133-137)
- The check for "no start chosen" inside the Continue handler can never be reached from the screen, because Continue is disabled in exactly that case. It is not dead weight, though: it is what lets the type checker know a start exists before its time is read, so it is deliberate and nothing a player can see. (app/book/[tierId]/index.tsx:85-101, 155-161)
- On 'Hold seats' the booking rules are checked first and sign-in is asked for second, and the request checked before sign-in is the one that is sent afterwards. If a signed-out player takes long enough in the sign-in sheet for the start to fall inside the 5-minute lead time, the app does not notice; the server refuses the hold and the player gets the same 'Pick a start at least 5 minutes from now…' notice, one request later. Nothing wrong is booked. (app/book/[tierId]/review.tsx:103-128)
- When a hold's timer has run out but the server still lists it as held, the badge reads 'HOLD EXPIRED' while Confirm and Release seats stay available, with a notice saying to confirm now in case the seats are still held. This is deliberate and stated in the code: the badge follows the clock, the buttons follow the server, and a refused Confirm then turns the booking to expired. (app/booking/[id].tsx:102-110, 137, 158-162, 208-229)
- The 'Explore cafes' button on the empty Bookings tab switches to the Explore tab with a replace, while the signed-out 'Sign in' button opens the sign-in sheet with a push. Inside the tab bar a replace is just a tab switch (Bookings stays loaded and Explore is the first tab, so back behaviour is the same), so the player sees no difference; the two calls differ because one changes tab and the other opens a new screen. (app/(tabs)/bookings.tsx:36-38,114-116)
- The Phone row can show "Not available" when a signed-in session has no phone number. Sign-in is by phone code only, and both the live and the sample sign-in paths always attach the number, so a player should never see it; it is a safety fallback. (app/(tabs)/profile.tsx:26, 59-62)
- When a code verifies, the sheet's "busy" state is never switched off; the code relies on the sheet closing straight after. The player sees the Verify spinner keep spinning as the sheet slides away, which looks normal. The busy state is only reset when verification fails. (app/auth/sign-in.tsx:46-59)
- The header title "Not found" is set in two places with the same text, once in the app's main navigation setup and once on the screen itself. The player sees no difference; one of the two is redundant. (app/_layout.tsx:53)
- "Back to Explore" does not step back to the previous screen; it replaces the Not found screen with the Explore tab. The player always lands on Explore, which matches the label, so this is not a fault in the app. (app/+not-found.tsx:15-18)
- On the Not found screen the page's own 16 pt side padding and the empty-state block's 24 pt side padding add up, so the text sits 40 pt in from each edge, and it starts 48 pt below the header (16 pt page padding plus 32 pt block padding). This is just how the two paddings stack; nothing looks wrong. (app/+not-found.tsx:11)
