# 0016. Keeping app availability true at the counter

Date: 2026-11-16
Status: Accepted
Amends: ADR 0005 (which stays in force except where this record says otherwise)

## Context

`get_availability` and `create_booking` count every active station of a tier, a booking may start five minutes from now, and each account is capped at three live holds and ten upcoming bookings. Cafes, however, mostly take walk-ins, and larger ones also take phone and WhatsApp bookings and sell the same seats on other apps; in Bengaluru, Lucid Arena is on both Playo and District (partner research, 16 Nov 2026, over the notes in `research_notes/Gaming cafe booking aggregator research/`: `owner_player_voice.md` §2, `india_competitors.md`; [Playo PlayStation venues](https://playo.co/venues/bangalore/sports/play_station), [District listing](https://www.district.in/events/lucid-arena-bengaluru-2026-buy-tickets)). On a weekend evening, when players most need to book, the app would show seats that are already taken at the counter.

Paid bookings that the venue did not honour make up 8% of Playo's, about 27% of Hudle's and about 33% of KheloMore's low-star iOS reviews between January 2024 and October 2026. Those are shares of complaints, not failure rates (`playo_sentiment.md` §1). The worst case is being turned away at the door with nobody to call.

What venues and vendors do instead: GameBiller advises taking bookings only for hours the cafe fills ([GameBiller blog](https://www.gamebiller.com/blog/managing-peak-hours-in-a-gaming-cafe), 17 Aug 2026, a vendor); iCafeCloud has minimum-lead, grace and lock-minute settings (`software_and_global.md`, Key question 6); the research's "Peak Allotment with Release-Back" idea has owners pledge a few stations whose unsold hours return to walk-ins (`strategy_operator.json`). The cafes' own software has no availability webhooks and no aggregator programme (`software_and_global.md`, Key question 3), and a connector would trip ADR 0003's third trigger.

ADR 0005 already expected "a counter tool" to write bookings and to reshuffle seats on the day. Counter rows cannot belong to a player: `bookings.user_id` is `not null`, and using the staff member's account would put walk-ins in that person's player app and count them against that account's caps.

## Decision

- The app sells only stations the owner pledges to it: `stations.is_app_bookable`, default `false`. Walk-ins on unpledged stations need no record at all.
- Each cafe sets a notice period, `cafes.app_notice_minutes`: between 30 and 1440 in steps of 30, default 180. The app never sells a start sooner than that, so at the cut-off unsold pledged stations go back to walk-ins with nobody doing anything.
- Each cafe has an app-bookings switch, `cafes.app_bookings_enabled`, default `false`. A cafe can be listed and not take app bookings. `cafe_status = 'paused'` keeps its iteration-1 meaning: hidden.
- An owner can switch app bookings on only after an operator has approved the cafe (`cafes.app_bookings_approved_at`), and approving needs a completed, checked-in app booking: the visit's test booking, which the operator may switch app bookings on for. An operator can withdraw the approval, which also switches app bookings off, or suspend the cafe (`cafes.suspended_at`): hidden and not bookable, and nobody can list it or switch app bookings on again until the operator lifts the suspension. Without this, an owner could switch on a counter that never ran the board, and undo the founder's stop of a cafe that fails its players the moment it was made.
- Closures (`cafe_closures`) are time ranges in which the app sells nothing.
- A counter block is a booking with `source = 'counter'`, no user, a kind (walk-in, phone, another app, maintenance, private event, other), an optional note that may not contain a phone number, no amount, and up to 50 seats. It is written `confirmed` by `create_counter_block`, under the same per-tier advisory lock as `create_booking` and the same exclusion constraint on `booking_seats`. The per-account caps count app rows only.
- `create_booking` and `get_availability` honour the switch, the notice, closures and pledges, and reuse the existing codes: `GG006` when app bookings are off, `GG002` inside the notice, `GG003` during a closure.
- At the counter a booking can be acknowledged, checked in, marked a no-show after its grace period, which releases its seats (the grace is the cafe's, copied when the booking was made, so a later change does not move it), completed or ended early, moved to another station of the same tier, or cancelled by the cafe with a reason. The booker can cancel only until the start: from then on a booking is resolved at the counter, so a squad cannot free a seat it is sitting at or turn a no-show into a cancellation. A sweeper marks finished sessions completed. App bookings are never lengthened; extra time at the desk is a counter block that starts where the booking ends.
- A change that would break an existing app booking is refused, not applied quietly: new hours that leave a booking outside them, a closure over a booking, or taking out of service a station that a future app booking uses. Each such check runs under the tier locks `create_booking` allocates under, and `create_booking` repeats its hours and closure checks after taking its lock, so a booking made at the same moment cannot slip past. The partner app shows the bookings in the way and offers to move or cancel them.
- Booking stays instant on pledged stations. A booking that nobody at the cafe acknowledges shows up on the founder's operator page. Request-to-book is not adopted.

## Consequences

- The app shows fewer seats than the cafe has, and the seats it shows are real. New cafes start listed but not bookable, and app bookings are switched on only after a test booking has passed at the counter; the approval gate makes that a rule the database enforces, and the founder's withdrawal or suspension holds until the founder lifts it.
- ADR 0005's invariants hold for every row, because counter rows go through the same constraint and lock. Invariant 2 of spec 02 (`total_paise` equals the quote) now holds for app rows only; counter rows carry zero amounts.
- ADR 0005's "counter tool action" for reshuffling seats is `move_booking_seat`.
- Players see the cafe's notice period and grace period, and the seat stepper stops at the number of pledged stations.
- Truthfulness now depends on staff blocking pledged stations they hand to walk-ins. Whether staff will keep that up is untested (`strategy_operator.json`, `assumptions_to_test`: "Staff will log walk-ins…"), which is why the pledge is small and the notice long by default.
- Opening hours that differ on a particular date (a launch night that runs late) are still not expressible; closures can only take availability away.
