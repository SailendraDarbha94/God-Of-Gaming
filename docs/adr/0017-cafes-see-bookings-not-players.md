# 0017. Cafes see bookings, not players

Date: 2026-11-16
Status: Proposed
Amends: ADR 0011 (what we share, and with whom)

## Context

Iteration 1 shares little. `profiles` is readable by its owner only, `booking_details` carries no name or phone, and the draft privacy page tells players that the cafe receives "cafe, station tier, time, number of seats and status" (`apps/web/src/app/privacy/page.tsx`). The counter now needs to match a squad at the desk to its booking, and somebody needs to reach a player when a cafe has to cancel.

The partner research recommended that a cafe see the booker's display name, a booking code, party size, tier, stations and times, with the phone number visible only from booking until shortly after the session, and no export (`research_notes/Gaming cafe booking aggregator research/`, partner report of 16 Nov 2026). Its legal readings are not counsel's:

- DPDP Act section 7(a) allows processing "for the specified purpose for which the Data Principal has voluntarily provided" the data ([dpdpa.com, section 7](https://www.dpdpa.com/dpdpa2023/chapter-2/section7.html), read 16 Nov 2026). Whether passing a booker's name and phone to the cafe is covered, and whether the cafe is our processor or a fiduciary in its own right, is unverified.
- Under-18s need verifiable parental consent, and tracking and targeted advertising directed at them are barred, with penalties up to ₹200 crore (`regulation.md` §4). Nothing measures how many players are minors.
- The main DPDP duties are computed to start on 13 May 2027; the date is computed from the Rules, not notified as a calendar date (`regulation.md` §4, [dpdprules.org timeline](https://dpdprules.org/timeline)).

Players cannot set a display name yet: the player app's profile shows it as "editable later" (spec 06). Playo staff check a booking ID only when they ask (`playo_product.md`), so a code is a familiar way to find a booking at the desk.

## Decision

- For each app booking, a cafe's owners and staff see: a booking code (the last six hexadecimal characters of the booking id, upper case), the tier, the station labels, start and end, seat count, status, the listed total, the hold expiry, when it was acknowledged and checked in, and the cafe's own cancellation reason. They do not see the booker's name, phone number or user id, the person's other bookings at the same cafe, or anything about other cafes, either in the partner functions or by reading `bookings` directly, whose select policy is booker-only from M0. There is no export.
- Players show their booking code at the desk. The player app displays it on every booking.
- An operator, who works for the platform, can look up the phone number behind one app booking at a time, from when it is made until 24 hours after it ends, to sort out a problem such as a cafe cancellation. Every lookup is written to the audit log. The player privacy notice says so.
- Counter blocks are not meant to hold customer data. The block form labels the note "For staff: no names or numbers", and the partner terms ask cafes not to enter customers' details. Notes, cancellation reasons and closure notes are refused when they contain a run of seven or more digits, so phone numbers do not end up in free text. A phone block's note is still where staff would write who called, and the cafe's customers get no notice from us, so the sweeper clears a block's note 30 days after the block ends; the board never shows rows that old.
- About partner users themselves, we keep the phone number they sign in with, their role at each cafe and their user id on the actions they take. Owners see their co-members' display names and the last four digits of their phone numbers.
- Showing display names to cafes is decided again when players can set one. The field's copy must then say that the cafe sees it.

## Consequences

- The player privacy page and the partner privacy notice change in the same pull request that ships the board: the cafe receives the booking with its code, and the platform may use the phone number to contact the player about that booking.
- A cafe cannot ring a late squad. The no-show rule and the published grace period cover that case, and the founder is the human contact during the pilot: `/ops` lists each cafe cancellation of an upcoming app booking with its reason, so the founder can look up the booker's number and ring the squad before they travel, since the player app sends no notifications in this iteration.
- Less personal data reaches the cafes, so there is less to protect and less to redesign when the DPDP duties begin.
- Counsel still has to confirm the purpose wording and the cafe's role before public launch (`docs/spec/iteration-2/07-launch.md`).
