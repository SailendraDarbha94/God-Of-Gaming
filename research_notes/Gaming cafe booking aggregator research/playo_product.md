# Playo product teardown: players, venues, website (for a gaming cafe booking aggregator)

*Everything was read on 3 Nov 2026 unless a date says otherwise.*

*Labels. [company-claimed] Playo's own unaudited number. [store] shown by Apple or Google. [tracker estimate] third-party estimate. [aggregator] low-quality or AI-summarised site. [code] read by me from Playo's public page data or web JavaScript, so the field meanings are my reading and not documentation. [user report] a single app-store review, unverified and paraphrased. STALE means older than Nov 2024. Dates written 2026\* come from Freshdesk help pages that leave out the current year; the weekday shown on the page matches 2026.*

*Limits. (1) The shared web-search budget ran out during this work (200 searches per turn, shared by all agents), so planned searches on commission rates, Reddit complaints and 2025-26 founder data did not run. After that I only opened first-party pages (Playo, Apple, Google) and URLs that earlier results had surfaced. (2) No app was installed, nothing was signed into and no checkout was run, so native-app claims come from store text, help pages and reviews. (3) playo.co/robots.txt disallows /_next/ for crawlers. I saw that rule and still read the build manifest and about 60 static JavaScript files there, because every browser visitor loads them and they hold the slot and fee model. I called no APIs. Findings marked [code] with a /_next/ link rest on those files, so the report author may want to weigh them accordingly. (4) I did not call Playo's availability or pricing endpoints, so no live slot or price data is reported. (5) The brief asked me to write only to this notes file. I also created a few temporary helper files in the session scratchpad and deleted them.*

## What are all the player-facing features, and how does the booking flow work step by step?

### Takeaway
Players get four jobs in one app: book a court, join or host a game, find a coach, earn rewards. The booking flow is a conventional court and slot cart with a 10-minute hold at payment, venue-set cancellation rules and a non-refundable convenience fee. Booking works on both web and app.

### Cited Findings

**Feature inventory**
- The current store text lists venue booking with real-time availability for 50+ sports, finding players, joining or hosting games, GameTime (hosted games), coaches and academies, and Karma Points. It also claims 5M+ players [company-claimed] — [iTunes lookup](https://itunes.apple.com/lookup?id=1018786950&country=in); [Google Play](https://play.google.com/store/apps/details?id=com.techmash.playo&hl=en_IN&gl=IN)
- The iOS subtitle is Find Players & Book Courts, which puts players ahead of courts — [App Store](https://apps.apple.com/in/app/id1018786950)
- The web header has Games, Venues, Trainers and Partner with us. City pages have tabs for Venues, Coaching, Events and Memberships — [homepage](https://playo.co/); [city page](https://playo.co/venues/bangalore/sports/badminton)
- The full player guide also lists recurring slot booking, split payments, weekly fitness goals, streaks, badges, Google Fit and Apple Health sync, and leaderboards (Oct 2025) — [Playo guide](https://blog.playo.co/playo-a-complete-guide-into-how-to-use-it-2020)

**Step 1: discovery and filters**
- At setup the player enables location and picks favourite sports, skill level and preferred times so the feed is personalised. Booking starts with sport, time and location, with filters for indoor or outdoor, turf type and price (Oct 2025) — [Playo guide](https://blog.playo.co/playo-a-complete-guide-into-how-to-use-it-2020)
- The help centre describes it more simply: go to the Venues tab and search the list (last edited 25 Feb 2026\*) — [How do I book a venue](https://playo.freshdesk.com/support/solutions/articles/1070000107618-how-do-i-book-a-venue-)
- Universal Search exists and reaches trainers and academies as well as venues (release note, 2 Apr 2026) — [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history)
- Web venue cards show a photo, a Bookable label, name, star rating and count, locality, approximate distance and sport icons. The list uses a Show More button — [city page](https://playo.co/venues/bangalore/sports/badminton)
- Reviewers complain that the Feb 2026 redesign broke sorting and filtering: no sort by distance or date, no multi-date selection, nearby games shown last (Feb-Mar 2026) [user report] — [App Store feed, page 2](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json)
- Reviewers have asked for filters that hide full games and filter by hours played (Mar and Jul 2026) [user report] — [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json); [feed, page 2](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json)

**Step 2: venue page**
- The page shows name, area, rating and count, a Rate Venue link, Book Now, Share, Bulk / Corporate, timings, address, sports with a tap-for-price-chart note, amenities, free-text rules and a Need help ticket link — [sample venue page](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- Free-text rules carry real commercial terms. That venue caps a badminton court at 6 people and charges ₹100 per extra head at the venue — [sample venue page](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)

**Step 3: slot picker**
- The app path is Venues tab, venue, Book Now, `Book Hourly`, then sport, time, duration and court, then payment. Displayed cost is per court per hour unless stated otherwise (25 Feb 2026\*) — [How do I book a venue](https://playo.freshdesk.com/support/solutions/articles/1070000107618-how-do-i-book-a-venue-)
- Green marks open slots and red marks booked ones (5 Feb 2025) — [green/red line](https://playo.freshdesk.com/support/solutions/articles/1070000107620-what-does-the-green-red-line-signify-while-booking-)
- Multi-day bookings work through a cart: pick day, pick slot, add to cart, repeat (5 Feb 2025) — [multiple days](https://playo.freshdesk.com/support/solutions/articles/1070000107624-can-i-make-bookings-for-multiple-days-in-one-transaction-)
- Help says there is no cap on hours beyond availability (5 Feb 2025), while the web code stops the cart at 15 items [code] — [hours limit](https://playo.freshdesk.com/support/solutions/articles/1070000107622-is-there-a-limit-to-the-number-of-hours-i-can-book-at-a-particular-venue-); [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- Decathlon venues can be reserved up to 20 days ahead, which shows the booking window varies by venue (Dec 2025) — [Decathlon post](https://blog.playo.co/decathlon-playo-partnership-sports-for-all/)

**Step 4: payment**
- A slot added to the cart is locked for 10 minutes once the player reaches the payment page, then released if unpaid. Playo describes this as its protection against double booking (18 Sep 2025) — [locked slots](https://playo-partner.freshdesk.com/support/solutions/articles/1070000007244-how-to-clear-slots-showing-as-locked-on-the-playo-dashboard-vendor-side-portal-partner-app)
- Accepted methods are credit and debit cards, UPI, wallets and net banking, and cash is not accepted through the platform (6 Feb 2025) — [payment modes](https://playo.freshdesk.com/support/solutions/articles/1070000107708-what-modes-of-payment-are-accepted-)
- Money debited without a booking returns in 5-7 business days (4 Sep 2026\*) — [debited, no booking](https://playo.freshdesk.com/support/solutions/articles/1070000107709-my-money-is-debited-but-booking-did-not-happen-what-do-i-do-)
- Stacking rules: loyalty credits can combine with Karma or a venue coupon and with Playo credits, but Karma and a venue coupon cannot combine (28 Sep 2026\*) — [stacking](https://playo.freshdesk.com/support/solutions/articles/1070000140990-can-i-use-loyalty-credits-with-the-karma-points-venue-coupon-and-playo-credits-)
- Reviewers report recurring payment-screen failures, including a slot reported as unavailable because the player themselves was holding it (Apr 2026) and a final payment page not loading for about 30 days (Jun 2026) [user report] — [feed, page 2](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json); [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)

**Step 5: confirmation and check-in**
- The player gets a booking ID and must show it if venue staff ask, so proof is required only on request (5 Feb 2025) — [booking ID](https://playo.freshdesk.com/support/solutions/articles/1070000107626-do-i-need-to-show-the-booking-id-at-the-venue-before-using-the-slot-)
- For GameTime the player goes to the venue reception desk, which assigns the spot and shared equipment (5 Feb 2025) — [whom to contact](https://playo.freshdesk.com/support/solutions/articles/1070000107574-whom-do-i-contact-once-i-reach-the-venue-)
- A reviewer asked for a way to share booking details by text or WhatsApp (Sep 2026), and another said external sharing sends app info instead of the booking (Apr 2026) [user report] — [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json); [feed, page 2](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json)

**Step 6: cancellation, rescheduling, no-shows**
- Each merchant sets its own policy, shown before purchase and on the booking ticket. The app shows the refund amount before the player confirms — [cancellation policy page](https://playo.co/cancellation-refund)
- The path is profile picture, menu, My Purchases, booking, cancel. The option appears only if the policy allows it (25 May 2026\*) — [how to cancel](https://playo.freshdesk.com/support/solutions/articles/1070000107641-how-to-cancel-my-booking-)
- No fixed percentages are published. The help article says charges vary by venue (25 Feb 2026\*) — [cancellation charges](https://playo.freshdesk.com/support/solutions/articles/1070000107643-what-is-the-cancellation-policy-for-my-booking-and-what-are-the-cancellation-charges-applicable-)
- Playo's blog says every venue charges a small cancellation fee taken from the refund, the reschedule cutoff is often 2-4 hours, many venues cap reschedules, and a no-show gets nothing (Jun-Aug 2025) — [cancellation guide](https://blog.playo.co/playo-rescheduling-and-cancellations)
- Playo recommends to venues a full refund within a set window, but the venue decides (30 Sep 2025) — [partner policy FAQ](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137974-what-is-your-cancellation-policy-)
- Rescheduling charges or refunds the price difference, because prices differ by time, holidays, weekday versus weekend and court upgrade (7 Sep 2026\*). The player can change court at the same venue but not switch venue or sport — [extra charge on reschedule](https://playo.freshdesk.com/support/solutions/articles/1070000140931-why-am-i-charged-an-extra-amount-while-rescheduling-); [cancellation guide](https://blog.playo.co/playo-rescheduling-and-cancellations)

**Step 7: refunds**
- Refunds take 5-7 working days (Nov 2026) — [cancellation policy page](https://playo.co/cancellation-refund)
- The convenience fee is not refunded when the player cancels (25 Feb 2026\*) — [refund article](https://playo.freshdesk.com/support/solutions/articles/1070000107648-how-will-i-receive-my-refund-)
- The refund destination conflicts across sources. The policy page says original payment source and not the Playo wallet; the 2025 blog says source or Playo credits at the player's choice; a reviewer says a rain cancellation refunded to wallet only (Apr 2026) [user report] — [policy page](https://playo.co/cancellation-refund); [blog](https://blog.playo.co/playo-rescheduling-and-cancellations); [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json)
- The Terms of Use state payments are non-refundable for any reason (IV.1), with exceptions when a provider changes or withdraws an offering (IV.2) and a refund liability capped at the booking amount (VII.9). This sits awkwardly with the refund policy — [Terms](https://playo.co/terms)
- If a venue asks the player to cancel or turns out closed, the only documented remedy is contacting Playo support (5 Feb 2025) — [venue asked me to cancel](https://playo.freshdesk.com/support/solutions/articles/1070000107651-the-venue-has-asked-me-to-cancel-my-playo-booking-what-do-i-do-); [venue closed](https://playo.freshdesk.com/support/solutions/articles/1070000107628-the-venue-i-booked-is-closed)
- A booking paid directly at the venue is treated as offline, so Playo will not track, change or cancel it (6 Feb 2025) — [paid at venue](https://playo.freshdesk.com/support/solutions/articles/1070000107710-i-have-made-full-payment-at-the-venue-for-my-booking-but-it-still-shows-payment-to-be-made-in-the-a); [offline booking](https://playo.freshdesk.com/support/solutions/articles/1070000107632-can-an-offline-booking-be-rescheduled-cancelled-through-playo-)

**Where the flow breaks, per recent reviews [user report]**
- Venue closed on arrival because of a power cut, money lost and no help (Oct 2025) — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)
- Turf operator cancelled on arrival, which the reviewer attributes to a team paying more (Nov 2025) — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)
- Venue cancelled at about 30 minutes' notice, refund still unpaid after two weeks (Mar 2026) — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json)
- Over ₹120 charged for cancelling a mistaken booking immediately (Jan 2026) — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)
- Double-booked venue with no refund after eight emails (26 Sep 2026), and venues with zero-refund terms not made clear (30 Sep 2026) [aggregator] — [MWM](https://mwm.ai/apps/playo-sports-community-app/1018786950)

### Inferences
- The hold-then-pay pattern, the cart and the venue-set policy are all directly reusable for gaming stations.
- The largest player pain is the gap between a confirmed booking and what happens at the venue, and support is the only recovery path. An aggregator could beat Playo here with an automatic refund when a venue fails, not with more features.
- Proof at the door is optional, so nothing stops a venue from overriding a paid booking. A check-in code would also give the platform evidence of no-shows and venue failures.

### Gaps
- Whether there is a QR or OTP check-in. No evidence found in help pages or the three web checkout files I searched. That is not evidence it does not exist, since the native apps were not inspected.
- Exact cancellation windows per venue. The policy text lives in each venue's private booking data, which I did not call.
- Exact screens in the current native flow. The app was not installed.

## What are the social features, and how central are they?

### Takeaway
Social is the core of the product, not an add-on. Help content, store text and the Games tab all treat finding players as equal to or ahead of booking, and a five-level peer rating with chat, groups and hosting sits on top. The same features attract the most fraud complaints, because hosts can collect money off-platform.

### Cited Findings

**How central it is**
- The largest player help folder is Meet Playpals with 23 articles, against 17 for Karma and Offers, 14 for Booking, 12 for Cancellation, 12 for Ratings, 11 for GameTime and 5 for Groups — [help centre](https://playo.freshdesk.com/support/solutions/1070000183081)
- The app is named Playo - Sports Community App and carries the subtitle Find Players & Book Courts — [App Store](https://apps.apple.com/in/app/id1018786950)
- A Sep 2026 post positions Playo as a sports partner finder for solo players and people new to a city — [finding partners](https://blog.playo.co/how-to-find-sports-partners/)
- On 3 Nov 2026 the first 20 game cards for Bangalore showed 19 with a venue tagged, 10 with a court booked, 7 with a per-player price and 6 flagged as Playo's own games. This is one snapshot [code] — [games page](https://playo.co/games/bangalore/sports/all)
- Sample Pay & Join prices on that page were ₹169 and ₹240 per player — [games page](https://playo.co/games/bangalore/sports/all)

**Finding, hosting and joining**
- Players can create a public activity in the Games tab or browse and send a join request. The host accepts each request and can mark the game full (Feb and Sep 2026\*) — [finding players](https://playo.freshdesk.com/support/solutions/articles/1070000107581-how-to-find-other-players-on-playo-); [hosting](https://playo.freshdesk.com/support/solutions/articles/1070000107582-how-does-hosting-a-match-work-)
- Only the host or co-host can book a bookable venue for an activity (4 Sep 2026\*) — [hosting](https://playo.freshdesk.com/support/solutions/articles/1070000107582-how-does-hosting-a-match-work-)
- Public activities are discoverable, while invite-only ones show only on the host's calendar and spread by invite, group notification or WhatsApp link (5 Feb 2025) — [activity types](https://playo.freshdesk.com/support/solutions/articles/1070000107595-what-are-invite-only-and-public-activities-)
- Pay & Join confirms participation on payment rather than host approval (4 Sep 2026\*) — [how to join](https://playo.freshdesk.com/support/solutions/articles/1070000107590-how-to-join-an-activity-)
- Leaving a Pay & Join game is allowed up to 2 hours before start, and other games up to 30 minutes before (4 Sep 2026\*) — [leaving](https://playo.freshdesk.com/support/solutions/articles/1070000107593-by-when-can-i-leave-the-activity-)
- Tagging a venue shows the exact place but is not a reservation (5 Feb 2025) — [tagging](https://playo.freshdesk.com/support/solutions/articles/1070000107588-what-is-tagging-a-venue)
- A 2019 release said a booking automatically creates a private activity and a co-host gets similar rights. STALE, though the guide still mentions co-hosts in Oct 2025 — [2019 feature post](https://blog.playo.co/you-shouldnt-be-missing-out-on-this-features-of-our-app); [Playo guide](https://blog.playo.co/playo-a-complete-guide-into-how-to-use-it-2020)

**GameTime (hosted games)**
- Playo books the venue and confirms players, and the player buys a spot. It targets solo players and newcomers (Oct 2025) — [Playo guide](https://blog.playo.co/playo-a-complete-guide-into-how-to-use-it-2020)
- Playo staff host but do not play (5 Feb 2025), and shared gear is usually supplied (4 Sep 2026\*) — [host](https://playo.freshdesk.com/support/solutions/articles/1070000107575-who-is-the-host-for-the-game-will-the-host-play-or-not-); [equipment](https://playo.freshdesk.com/support/solutions/articles/1070000107576-do-i-need-to-carry-my-own-equipment-or-will-the-equipment-be-provided-at-the-venue-)
- Withdrawal up to 2 hours before returns the slot price but not the convenience fee. If Playo or the host cancels, the player gets everything back (7 Sep 2026\*) — [Pay & Join policy](https://playo.freshdesk.com/support/solutions/articles/1070000140932-cancellation-policies-for-pay-join-gametime-activity-)
- Slots are not discounted (5 Feb 2025) — [discount](https://playo.freshdesk.com/support/solutions/articles/1070000107577-how-can-i-get-a-discount-)
- The venue-facing page claims 5,000+ games a month, 7 cities, 147+ venues and over 12% revenue growth for partners. It is undated [company-claimed] — [partner GameTime](https://playo.co/partner-venue/gametime)
- A 95% figure appears as a success rate on one partner page and a fill rate on another, so the definition is unclear [company-claimed, undated] — [partner GameTime](https://playo.co/partner-venue/gametime); [partner overview](https://playo.co/partner-venue/unlock-your-potential)

**Chat and groups**
- Every activity gets a game chat that stays open for 7 days after the match (25 Feb 2026\*) — [finding players](https://playo.freshdesk.com/support/solutions/articles/1070000107581-how-to-find-other-players-on-playo-)
- Groups support shared activities and discussion, notify only members, and require more than 10 Playpals to create (5 Feb 2025) — [what is a group](https://playo.freshdesk.com/support/solutions/articles/1070000107670-what-is-a-group-)
- AppGoblin detected the Sendbird SDK in the Android app, which suggests chat is bought rather than built (scan 9 Jul 2026) [tracker estimate] — [AppGoblin](https://appgoblin.info/apps/com.techmash.playo)

**Skill levels**
- The five levels are Beginner, Amateur, Intermediate, Advanced and Professional. Players self-rate first, then co-players rate anonymously within 7 days and can edit within 3 hours. About 90% of the score comes from the last 25 games plus self-rating and about 10% from older ratings (Jan 2026) — [rating graph](https://blog.playo.co/playo-user-rating-graph/)
- Hosts can set a min and max skill, and the data has a strict flag [code] — [games page](https://playo.co/games/bangalore/sports/all)
- A separate reputation score covered punctuality, teamwork and paying on time in 2019. STALE, though help still cites a host reputation rating in Feb 2026\* — [2019 feature post](https://blog.playo.co/you-shouldnt-be-missing-out-on-this-features-of-our-app); [trust the host](https://playo.freshdesk.com/support/solutions/articles/1070000107580-how-would-i-know-if-i-can-trust-the-host-)
- Reviewers report friend groups inflating each other (May 2026) and players deliberately marking others down (May-Jun 2026) [user report] — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)

**Karma and rewards**
- Earning: 50 for registering, 25 for a full profile, 15 and 10 for the first two activities, 3 per venue booking, 1 per game joined or created, 50 per referral, 1 per joiner when hosting (Oct 2025, edited Feb 2026) — [Karma guide](https://blog.playo.co/5-ways-to-earn-karma-on-the-playo-app/)
- Redemption: 1 Karma equals ₹1 or 1 AED and does not expire. The cap is 2.5% of booking value in most cities and 10% in Delhi, Mumbai and NCR, and some venues opt out (Feb 2026) — [Karma guide](https://blog.playo.co/5-ways-to-earn-karma-on-the-playo-app/)
- Help gives 2.5% on venue bookings and 5% on Pay & Join games (28 Sep 2026\*), while the blog body says Karma is for venue bookings only and uses a 20% example. These conflict — [how much Karma](https://playo.freshdesk.com/support/solutions/articles/1070000107718-how-much-karma-can-i-redeem-); [Karma guide](https://blog.playo.co/5-ways-to-earn-karma-on-the-playo-app/)

**Trust and abuse**
- Playo will not recover money owed between players, because it cannot control offline transactions (25 Feb 2026\*) — [unpaid playpals](https://playo.freshdesk.com/support/solutions/articles/1070000107606-my-playpals-have-not-paid-me-after-the-activity-will-playo-be-able-to-help-)
- Its trust advice is to check how many games a host has run and contact a new host before paying (25 Feb 2026\*) — [trust the host](https://playo.freshdesk.com/support/solutions/articles/1070000107580-how-would-i-know-if-i-can-trust-the-host-)
- Reviewers report people asking for money and then blocking the payer (Oct 2026), and no way to report scammers (Jun 2026) [user report] — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)
- Reviewers report hosts charging above court cost (Dec 2025) and, in Bangalore, a few organisers holding prime football slots and reselling at about double through WhatsApp (May 2026) [user report] — [feed, page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json); [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)
- Host pain points include pending join requests never being answered (May 2026), rehost not keeping settings (Aug 2026), and heavy push notifications (Sep-Oct 2026) [user report] — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)

### Inferences
- GameTime and Pay & Join are how Playo sells empty inventory by the seat rather than the court. The gaming equivalent would be open sessions, tournaments or squad nights that fill idle stations.
- Peer skill rating is weak where friends rate friends. Games already have verifiable ranks, so a gaming product could import ranks instead of relying only on peers.
- At ₹1 per point and a 2.5% cap, a ₹1,000 booking gets at most ₹25 off in most cities. Karma is cheap for Playo and acts mainly as an app-install nudge.
- Pay & Join is the fix for off-platform host money, so the gaming version should make paid group sessions on-platform by default.

### Gaps
- Actual share of bookings that come through social features. No figure found.
- Names of all five app tabs. Release notes name Home, Game and Social; the others were not confirmed.
- Whether Playo has a fraud or host verification process beyond ratings. No evidence found.

## What else does it sell: coaching, events, memberships, corporate, gear, offers, wallet?

### Takeaway
Playo layers several revenue lines on top of booking: trainer subscriptions, academy listings, event ticketing and promotion, memberships and passes, gift cards, an optional cover at checkout, corporate events and brand work. Most of these run through relationship managers with no public pricing.

### Cited Findings
- **Coaching (academies):** Bangalore shows 66 listings, cards show batch time and monthly or yearly duration, and no prices are on the listing (Nov 2026) — [coaching page](https://playo.co/experiences/bangalore/coaching/all)
- **Academy listing:** one-month free trial then unpublished pricing, through a relationship manager (undated) — [partner academy](https://playo.co/partner-venue/academy)
- **Individual trainers pay Playo:** ₹499 for 1 month, ₹449 per month for 3 months and ₹399 per month for 6 months, shown as 33% off and inclusive of tax (Nov 2026) — [train with us](https://train-with-us.playo.co/)
- **Trainer onboarding:** signing up goes through the Train section, certifications, a starter plan and verification (6 Feb 2025) — [coach registration](https://playo.freshdesk.com/support/solutions/articles/1070000107726-i-am-a-coach-how-can-i-register-myself-in-the-playo-app-)
- **Events:** Bangalore shows 5, tagged Walkathon, Tournament or Experience, with dates in Nov 2026 — [events page](https://playo.co/experiences/bangalore/event/all)
- **Event tools:** partners get a dedicated landing page, promotion and registration tools (30 Sep 2025), plus event chat, online and offline registration tracking and featured listings — [tournament FAQ](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137972-can-i-list-a-tournament-on-the-playo-app-); [list business](https://playo.co/list-business)
- **Playo-run events:** Flashcamps (weekend coaching) and #LevelUp sessions run at partner venues (undated) — [partner events](https://playo.co/partner-venue/playo-events)
- **Memberships and passes:** Bangalore shows 28 and Hyderabad 51, tagged Membership Plans or Membership Passes, for example swimming memberships at a chain's branches (Nov 2026) — [memberships page](https://playo.co/experiences/bangalore/deal/all)
- **Passes in the app:** a Passes screen exists (release note, 18 Mar 2026) and the web code has ticket-pass calls [code] — [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history); [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- **Members-only clubs:** Playo digitises member bookings at established clubs (30 Sep 2025) — [members-only FAQ](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137969-does-playo-also-work-with-member-s-only-facilities-)
- **Corporate:** the offer is Corporate Sports Day, Fitness In Office and Corporate Sports Vouchers (Nov 2026) — [corporate page](https://playo.co/corporate-offerings)
- **Corporate claims:** the Aug-Sep 2026 posts add 900+ events, 500+ clients, 95,000+ employees and named clients Samsung, Google, Amazon, Deloitte and Microsoft, with pricing by quote only [company-claimed] — [corporate post](https://blog.playo.co/corporate-sports-events/); [planning post](https://blog.playo.co/how-to-plan-perfect-corporate-sports-day/)
- **Corporate on venues:** the partner page says 800+ corporate days (undated), and every venue page has a Bulk / Corporate button — [partner corporate](https://playo.co/partner-venue/corporate-events); [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- **Brand work:** a Brand Activations page exists with a contact button and no public detail — [brand activations](https://playo.co/brand-activations)
- **Sponsorship signals:** the site has sponsor-game routes, and venue and activity records carry sponsored fields, including a sponsored radius on venues [code] — [build manifest](https://playo.co/_next/static/7za0E0Z_NeemoERxU8Zqx/_buildManifest.js); [The Grid venue](https://playo.co/venues/koramangala-5th-block-bengaluru/the-grid-gaming-arena-koramangala-koramangala-5th-block-bengaluru)
- **Sponsored complaints:** a reviewer says sponsored games now crowd out other players' games (Feb 2026), and another says GameTime is preselected in badminton and cannot be turned off (Oct 2026) [user report] — [feed, page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json); [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)
- **Gift cards:** ₹250 to ₹25,000, one-year validity, buyable on web, redeemed by 16-digit code, non-refundable, with a corporate option (Nov 2026) — [gift cards](https://playo.co/buy-gift-card)
- **Gift card launch:** the in-app launch was May 2026 — [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history)
- **Wallet and credits:** a passbook and wallet history exist on web [code] — [account code](https://playo.co/_next/static/chunks/9641-d46b0ef9cd76b32f.js)
- **Wallet exit:** reviewers say wallet money cannot be taken back (Sep 2025) and hosts asked for withdrawal (Sep 2026) [user report] — [feed, page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json); [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)
- **Venue loyalty credits:** venue-funded, earned after the second booking at a venue and applied automatically from the third, with the amount set by the venue (28 Sep 2026\*) — [earning credits](https://playo.freshdesk.com/support/solutions/articles/1070000140988-how-to-accumulate-loyalty-credits-); [what they are](https://playo.freshdesk.com/support/solutions/articles/1070000140983-what-are-loyalty-credits-)
- **Checkout cover:** the receipt code has a `Fitness` line with a linked info page, and fields mark whether insurance applies and its unit price [code] — [account code](https://playo.co/_next/static/chunks/9641-d46b0ef9cd76b32f.js); [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- **Checkout cover default:** a reviewer calls it fitness cover and says it must be removed each time (Oct 2026) [user report] — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json)
- **Content and campaigns:** Off the Field live expert sessions (Jul 2025) and the Khelo India. Playo India. campaign (Aug 2026) — [Off the Field](https://blog.playo.co/off-the-field-by-playo/); [campaign](https://blog.playo.co/khelo-india-playo-india/)
- **Decathlon:** 36 of Decathlon's 76 playgrounds were live on Playo in Dec 2025 [company-claimed] — [Decathlon post](https://blog.playo.co/decathlon-playo-partnership-sports-for-all/)

### Inferences
- Trainers pay a subscription because they have no slot inventory to take commission on. Gaming coaches or tournament organisers could follow the same model.
- Prepaid passes and memberships are the natural fit for regular gaming cafe players, and Playo has the plumbing already.
- Corporate is the highest-ticket line and every venue page feeds it. Team nights at gaming cafes would be the direct analogue.

### Gaps
- Revenue split across these lines. No public breakdown found.
- A gear store. A search summary of third-party listings mentioned gear and apparel, but the current store text does not, and a Mar 2026 reviewer asked for an in-app shop. The site has brand redirect routes (Amazon, Puma, Under Armour, Yonex). No evidence of a live store, which is not evidence that none exists.
- Who underwrites the fitness cover and what it costs. Not found.
- Membership prices. Listing cards show none and detail pages were not opened.

## What do venues get: partner app, software, cost, and how are offline walk-ins kept in sync?

### Takeaway
Venues get a free-to-download partner app, a web dashboard and a PWA covering calendar, pricing, reports, staff roles, memberships and GST invoices, plus sales-led growth programmes. The stated price is a commission per successful booking, deducted before weekly payouts, and the rate is not public. Sync depends on one shared calendar that staff keep up to date, with a 10-minute payment hold. I found no automatic link to any outside system.

### Cited Findings

**Products**
- The Android partner app is Playo: Venue Partner App: 4.3 stars from 141 reviews, 10K+ downloads, updated 16 Dec 2025 [store] — [Google Play](https://play.google.com/store/apps/details?id=com.techmash.playobooking&hl=en_IN&gl=IN)
- AppGoblin estimates 36K+ installs and about 2.6K monthly users [tracker estimate] — [AppGoblin](https://appgoblin.info/apps/com.techmash.playobooking)
- The iOS app is Venue Partner Interface: 3.4 stars from 16 ratings, last update 9 Sep 2025 [store] — [App Store](https://apps.apple.com/in/app/id1057092085)
- Three surfaces exist: the app, a PWA and the Vendor Side Portal web dashboard (18 Sep 2025) — [locked slots](https://playo-partner.freshdesk.com/support/solutions/articles/1070000007244-how-to-clear-slots-showing-as-locked-on-the-playo-dashboard-vendor-side-portal-partner-app)
- The app and web share a login. Equipment configuration and deep analysis are web only (24 Jul 2025) — [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-)

**Features**
- Dashboard: today's bookings, earnings, cancellations, availability and performance (Jun 2025) — [partner app post](https://blog.playo.co/playo-partner-app)
- Calendar: add or block slots, adjust prices, schedule maintenance or tournaments (Jun-Jul 2025) — [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-)
- Booking logs show who booked, duration, payment status, repeat customers and online versus offline (Jun 2025) — [partner app post](https://blog.playo.co/playo-partner-app)
- Staff roles exist for front desk, accountant and owner (Jul 2025) — [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-)
- Reports cover revenue by sport, peak times, trends and occupancy, with export (Jun 2025) — [partner app post](https://blog.playo.co/playo-partner-app)
- Multi-club login dates from 2018 and bulk booking from 2021. STALE dates, though both are probably still present — [iOS version history](https://apps.apple.com/in/app/id1057092085)
- The sales page adds printer-ready invoices, happy-hour pricing, memberships and prepaid credits, SMS and email alerts, vouchers and loyalty, equipment and referee add-ons, event promotion, and reviews and followers (Nov 2026) — [list business](https://playo.co/list-business)
- Playo's own support staff handle cancellations, rescheduling and refunds for customers (30 Sep 2025) — [customer queries](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137973-how-are-customer-queries-handled-)
- Invoicing stays the venue's legal duty, but Playo can automate GST or non-GST invoices (30 Sep 2025) — [invoices](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137971-can-i-raise-invoices-to-my-customers-using-playo-)

**Growth programmes (all undated, all through a relationship manager)**
- Superhost gives priority placement in the Play section and Recommended lists — [superhost](https://playo.co/partner-venue/superhost); [partner overview](https://playo.co/partner-venue/unlock-your-potential)
- GameTime fills idle slots with hosted sessions — [partner GameTime](https://playo.co/partner-venue/gametime)
- Playo Events bring new players through camps — [partner events](https://playo.co/partner-venue/playo-events)
- Corporate Events bring employees who may return — [partner corporate](https://playo.co/partner-venue/corporate-events)
- Academy Listing has a free first month — [partner academy](https://playo.co/partner-venue/academy)

**Cost and money flow**
- Playo takes a commission per successful booking (Jun-Jul 2025), described as small, with no number given — [partner app post](https://blog.playo.co/playo-partner-app); [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-)
- Service fees are set in each venue's Engagement Proposal, so rates look negotiated per venue (30 Sep 2025) — [settlements](https://playo-partner.freshdesk.com/support/solutions/articles/1070000136933-how-will-i-get-my-settlements-at-what-frequency-does-a-partner-get-payments-through-playo-)
- Money flow: TechMash collects from the player, gateway charges come off, service fees come off, and Monday-to-Sunday bookings settle on the Thursday of the following week with a transaction report. A monthly invoice shows fees, with GST added on top (30 Sep 2025) — [settlements](https://playo-partner.freshdesk.com/support/solutions/articles/1070000136933-how-will-i-get-my-settlements-at-what-frequency-does-a-partner-get-payments-through-playo-)
- Terms say the provider issues the receipt and TechMash passes payments on — [Terms](https://playo.co/terms)
- Onboarding is by email or support ticket with owner name, number, venue name, location and sports (25 Feb 2026\*), or through the I'm Interested link on the sales page — [list my venue](https://playo.freshdesk.com/support/solutions/articles/1070000107615-i-want-to-list-my-venue-on-playo-how-do-i-do-it-); [list business](https://playo.co/list-business)

**Keeping online and offline in step**
- The sales page promises real-time availability with online and offline integration (Nov 2026) — [list business](https://playo.co/list-business)
- The store text pitches the scheduler as a replacement for pen and paper, with courts reserved on the go — [Google Play partner](https://play.google.com/store/apps/details?id=com.techmash.playobooking&hl=en_IN&gl=IN)
- Slot changes apply immediately across the platform (Jun 2025) — [partner app post](https://blog.playo.co/playo-partner-app)
- The logs tag bookings online or offline (Jun-Jul 2025) — [partner app post](https://blog.playo.co/playo-partner-app)
- The 10-minute lock prevents two online buyers colliding, and a manual Sync Availability tool clears stuck locks (18 Sep 2025) — [locked slots](https://playo-partner.freshdesk.com/support/solutions/articles/1070000007244-how-to-clear-slots-showing-as-locked-on-the-playo-dashboard-vendor-side-portal-partner-app)
- Double-booking and overriding complaints exist: double booked with no refund (Sep 2026) [aggregator], and operator cancelling on arrival for a higher-paying team (Nov 2025) [user report] — [MWM](https://mwm.ai/apps/playo-sports-community-app/1018786950); [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)

### Inferences
- Sync is a people process: a walk-in only blocks an online slot if staff enter it. That matches the phrase pen and paper replacement and the existence of a manual sync tool. Gaming cafes may have an advantage here, because PC session software already knows which station is live.
- Commission, weekly settlement and Playo-run support form a package venues accept in exchange for demand. The venue software looks like a bundled retention tool rather than a priced product.
- The low partner-app ratings and small rating counts, against thousands of listings, suggest many venues are served by relationship managers rather than by self-service.

### Gaps
- The commission rate. No figure found on any first-party page, and the search planned for it could not run because the budget ran out. This is the largest open question.
- Any separate SaaS or subscription fee. No evidence found, which is not evidence that none exists.
- The exact walk-in flow in the partner app. The help centre labels offline bookings but does not document how they are created.
- Any POS or third-party integration. No evidence found.
- How often double bookings happen. No rate published.

## How is inventory modelled, and how are fees shown?

### Takeaway
Inventory is venue, then sport, then date, then court, then fixed-length slots, each with its own price and status. A second ticketing mode sells per person. Pricing varies by court, time, day and holiday. Players see a convenience fee as its own line, and the venue balance can be split into an advance plus an amount payable at the venue.

### Cited Findings

**Model, as read from public web code [code]**
- Availability is requested per venue, sport and date, which returns a minimum slot length and a list of courts — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- Each court carries an id, a name, its slots, minimum and maximum consecutive slots, a booking time buffer, a close time, minimum and maximum tickets, and an optional list named `courtBro` — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- Each slot has a time, a status and a price. Booking length is one slot length times the count, limited by the min and max — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- A separate `TICKETING` type prices per person with a one-ticket cost and a total, and uses status as remaining capacity — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- The picker groups times into bands with edges at 05:00, 12:00 and 17:00 — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- Venue records separate `sports` from `bookSports`, and also hold `bookingFlowEnabled`, `active`, `isExternal`, an inquiry phone and type, `bnpl`, `members`, `restricted`, `offers`, `sponsored` and `sponsoredRadius` — [sample venue page](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- The sports table has 168 entries. It includes sub-products such as Football - Per Person, Football - Morning, Badminton Premium, Rental, Bowling Machine and Shuttle Feeding Machine, and also non-sports such as Studio, Sauna and Box Office — [booking page data](https://playo.co/booking?venueId=63283391c45768138ff9de75)
- Sports can have playing modes, for example football 5-a-side to 11-a-side or women's only — [booking page data](https://playo.co/booking?venueId=63283391c45768138ff9de75)

**Pricing, as documented**
- Partner pricing varies by court, time, day and sport, with discounts and promotions — [Google Play partner](https://play.google.com/store/apps/details?id=com.techmash.playobooking&hl=en_IN&gl=IN)
- Happy-hour pricing and per-sport cancellation rules are offered (Nov 2026) — [list business](https://playo.co/list-business)
- Custom prices for events or specific hours are supported (Jul 2025) — [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-)
- Slot prices vary by timing, holiday dates, weekday versus weekend and court upgrade (7 Sep 2026\*) — [extra charge on reschedule](https://playo.freshdesk.com/support/solutions/articles/1070000140931-why-am-i-charged-an-extra-amount-while-rescheduling-)
- Each venue page offers a price chart per sport — [sample venue page](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)

**Add-ons**
- Equipment rental and referee or marker hire can be offered alongside bookings (Nov 2026) — [list business](https://playo.co/list-business)
- Equipment configuration is a web dashboard feature (Jul 2025) — [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-)

**How fees are shown**
- The web booking detail lists these lines in order: booking amount, `Convenience Fee`, `Discount`, `Fitness`, `Total Price`, `Advance Paid`, `Payable at the venue` [code] — [account code](https://playo.co/_next/static/chunks/9641-d46b0ef9cd76b32f.js)
- The order calculation returns a gross, online payable, venue payable, discount, convenience fee, convenience percent, fee with tax, tax name and percent, insurance price, wallet balance, member credits and policies [code] — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- Help confirms partial payments through the app count as Playo bookings (6 Feb 2025) — [paid at venue](https://playo.freshdesk.com/support/solutions/articles/1070000107710-i-have-made-full-payment-at-the-venue-for-my-booking-but-it-still-shows-payment-to-be-made-in-the-a)
- The partner settlement FAQ says users pay the full amount online (30 Sep 2025), which conflicts with the advance-plus-balance fields and suggests both models exist — [settlements](https://playo-partner.freshdesk.com/support/solutions/articles/1070000136933-how-will-i-get-my-settlements-at-what-frequency-does-a-partner-get-payments-through-playo-)
- Gateways seen: Juspay and Stripe in the Android SDK scan (Jul 2026), and Juspay, Stripe and QPay paths in the web code. A Razorpay script loads on a Playo error page [tracker estimate, code] — [AppGoblin](https://appgoblin.info/apps/com.techmash.playo); [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js); [sitemap 404 page](https://playo.co/sitemap.xml)

### Inferences
- Mapping to gaming: a station or PC is a court, a console or PC class is a sport or playing mode, and a shared LAN room seat is a ticket.
- `courtBro` looks like linked courts that share one physical resource, such as a ground that splits into smaller pitches, so booking one blocks the other. This is my reading of a field name and not documented. If right, it is exactly what a gaming cafe needs for booking a whole LAN room versus single PCs.
- Using separate sports for Morning, Evening, Premium and Rental looks like a workaround for a data model without first-class variants or add-ons. A new build should model variants and add-ons properly from the start.
- Fixed slot lengths suit courts. Gaming sessions are often extended on the spot, so an extend-while-free action may matter and is not something the court model obviously supports.

### Gaps
- The convenience fee rate. A percent field exists but no public number was found.
- Live slot lengths and prices. I did not call the availability or price endpoints.
- How peak pricing appears on the player's picker. The native app was not inspected.

## What are the current public numbers, with dates?

### Takeaway
Company claims run well ahead of what the stores show. Google Play shows 10L+ (1M+) Android downloads and 57.2K reviews, and the App Store India shows 15.3K ratings, while Playo says 5M+ users and in one post appears to claim that per month. Venue claims look broadly consistent with the per-city listing counts.

### Cited Findings

| Metric | Value | As of | Type | Source |
|---|---|---|---|---|
| Google Play rating, reviews | 4.8 (4.756), 57.2K (57,158) | 3 Nov 2026 | store | [Google Play](https://play.google.com/store/apps/details?id=com.techmash.playo&hl=en_IN&gl=IN) |
| Google Play downloads | 10L+ (1M+ tier) | 3 Nov 2026 | store | [Google Play](https://play.google.com/store/apps/details?id=com.techmash.playo&hl=en_IN&gl=IN) |
| Google Play last update | 26 Oct 2026 | 3 Nov 2026 | store | [Google Play](https://play.google.com/store/apps/details?id=com.techmash.playo&hl=en_IN&gl=IN) |
| App Store India | 4.65, 15,268 ratings, v5.2.6 of 2 Nov 2026, first released 28 Jul 2015 | 3 Nov 2026 | store | [iTunes lookup](https://itunes.apple.com/lookup?id=1018786950&country=in) |
| App Store India chart | No. 33, Health & Fitness | 3 Nov 2026 | store | [App Store](https://apps.apple.com/in/app/id1018786950) |
| Android installs | 3.4M+, +66K a month | 1 Nov 2026 | tracker estimate | [AppGoblin](https://appgoblin.info/apps/com.techmash.playo) |
| Android monthly users | about 95K | 1 Nov 2026 | tracker estimate | [AppGoblin](https://appgoblin.info/apps/com.techmash.playo) |
| iOS total ratings, written reviews | 4.7 from 16.7K; written 2.4 from 805 | Nov 2026 | aggregator | [MWM](https://mwm.ai/apps/playo-sports-community-app/1018786950) |
| Users | 5M+ | Nov 2026 | company-claimed | [iTunes lookup](https://itunes.apple.com/lookup?id=1018786950&country=in) |
| Users | 4M+ | undated | company-claimed | [About](https://playo.co/about) |
| Users | over 3M | undated | company-claimed | [train with us](https://train-with-us.playo.co/) |
| Users, cities, countries, sessions | 5M+ users in 150+ cities and 5 countries using it each month, nearly 2M sessions | Aug 2026 | company-claimed, ambiguous wording | [campaign post](https://blog.playo.co/khelo-india-playo-india/) |
| Venues and cities | 5,000+ venues, 100+ cities | Nov 2026 | company-claimed | [homepage](https://playo.co/) |
| Venues and cities | 5,000+ verified, 110+ cities | Aug-Oct 2026 | company-claimed | [corporate post](https://blog.playo.co/corporate-sports-events/) |
| Countries | India, UAE, Qatar, Australia, UK | Nov 2026 | company-claimed | [homepage](https://playo.co/) |
| Countries | 6 | 30 Sep 2025 | company-claimed | [cities FAQ](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137967-which-cities-is-playo-present-in-) |
| Countries | 4 | Dec 2025 | company-claimed | [Decathlon post](https://blog.playo.co/decathlon-playo-partnership-sports-for-all/) |
| Sports | 50+ | Sep 2025, Nov 2026 | company-claimed | [sports FAQ](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137966-what-sports-does-playo-cater-to-) |
| Sports table entries | 168, including non-sports | 3 Nov 2026 | code | [booking page data](https://playo.co/booking?venueId=63283391c45768138ff9de75) |
| Activities, connections | 20M+, 15M+ | undated | company-claimed | [About](https://playo.co/about) |
| Partner app, Android | 4.3, 141 reviews, 10K+ downloads | 3 Nov 2026 | store | [Google Play partner](https://play.google.com/store/apps/details?id=com.techmash.playobooking&hl=en_IN&gl=IN) |
| Partner app, iOS | 3.4, 16 ratings | 3 Nov 2026 | store | [App Store partner](https://apps.apple.com/in/app/id1057092085) |
| Revenue | ₹20.5 Cr+ in FY25, up 63%; ₹8.0 Cr in FY23 | FY25 | database, unverified | [Inc42](https://inc42.com/company/playo/overview) |
| Funding | $500K seed from ah! Ventures, Aug 2021 (STALE) | 2021 | database | [Inc42 funding](https://inc42.com/company/playo/funding/) |
| Funding | $1.5M | undated | database, conflicts with Inc42 | [Clay](https://www.clay.com/dossier/playo-funding) |

**Listings per city, from each city page's own tab counts (3 Nov 2026) [code]**

| City | Venues | Coaching | Events | Memberships |
|---|---|---|---|---|
| [Bangalore](https://playo.co/venues/bangalore/sports/all) | 1,380 | 66 | 5 | 28 |
| [Hyderabad](https://playo.co/venues/hyderabad/sports/all) | 1,096 | 65 | 2 | 51 |
| [Delhi NCR](https://playo.co/venues/delhi-ncr/sports/all) | 703 | 2 | 1 | 0 |
| [Chennai](https://playo.co/venues/chennai/sports/all) | 587 | 8 | 1 | 8 |
| [Dubai](https://playo.co/venues/dubai/sports/all) | 544 | 0 | 1 | 0 |
| [Pune](https://playo.co/venues/pune/sports/all) | 534 | 28 | 1 | 14 |
| [Mumbai](https://playo.co/venues/mumbai/sports/all) | 328 | 28 | 0 | 0 |
| [Kochi](https://playo.co/venues/kochi/sports/all) | 148 | 0 | 0 | 0 |
| [Ahmedabad](https://playo.co/venues/ahmedabad/sports/all) | 140 | 0 | 0 | 0 |
| [Indore](https://playo.co/venues/indore/sports/all) | 67 | 0 | 0 | 0 |
| [Kolkata](https://playo.co/venues/kolkata/sports/all) | 58 | 3 | 3 | 0 |
| [Doha](https://playo.co/venues/doha/sports/all) | 49 | 2 | 0 | 0 |

- Recent App Store written reviews: of the 150 most recent in the India feed (16 Sep 2025 to 29 Oct 2026), 81 were 1-star, 13 2-star, 14 3-star, 15 4-star and 27 5-star. By rough keyword count, 48 mention the redesign or UI, 35 crashes, bugs or slowness, 16 support, 10 skill ratings, 9 refunds or cancellations, 7 login or OTP. These themes overlap and writers self-select toward complaints, so this is not satisfaction data [my tally of user reports] — [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json); [page 2](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json); [page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)

### Inferences
- Google's download tier means under 5M Android installs ever, on Google's own count. With about 15K iOS ratings, a claim of 5M people per month looks implausible, and 5M is more likely cumulative registrations. Only the store numbers can be verified.
- If nearly 2M sessions a month were true, the undated 20M+ total activities figure would be only about 10 months' worth. One of those numbers is old or defined differently.
- The 12 cities above total 5,634 listings, so the 5,000+ claim is consistent with listing counts. Listings are not the same as bookable venues, because the main sitemap also carries inactive records from 2018-19.
- The 4.65-4.8 star averages hide a much harsher written-review picture, and MWM's 2.4 written-review figure points the same way.

### Gaps
- Bookings or GMV. No public figure found.
- Bookable versus listed venues, overall or per city. Not published, and Show More pagination relies on a private endpoint I did not call.
- Monthly active users from a primary source. None found.
- Why Inc42 and Clay differ on funding. Not resolved here; another researcher covers the business side.
- Some sources failed: Craft and YourStory returned 403, Kimola's review report returned 410, and AppFollow timed out.

## How is playo.co structured as a website?

### Takeaway
It is a server-rendered Next.js site built for programmatic local SEO: city, locality and sport pages, venue pages with rich structured data, and a large content blog. Web booking does work, but the site keeps nudging people to the app through Karma discounts and app-only game creation.

### Cited Findings

**URL patterns**
- City and sport: `/venues/{city}/sports/{sport}`, for example [Bangalore badminton](https://playo.co/venues/bangalore/sports/badminton)
- Locality and sport: `/venues/{locality-city}/sports/{sport}` — [Bangalore sitemap](https://playo.co/sitemaps/sitemap-venues-bangalore.xml)
- Venue: `/venues/{locality-city}/{venue-slug-locality-city}` — [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- Older venue URLs use title case without city suffix on the first segment, for example `/venues/Koramangala/...` — [main sitemap](https://playo.co/sitemaps/sitemap.xml)
- Games: `/games/{city}/sports/{sport}`; experiences: `/experiences/{city}/{coaching|event|deal}/{sport}`; trainers: `/trainer/{city}/...` — [build manifest](https://playo.co/_next/static/7za0E0Z_NeemoERxU8Zqx/_buildManifest.js)
- The build manifest also lists `/booking`, `/booking/summary`, `/confirmation`, `/booking-receipt`, `/match/[id]`, `/group/[id]`, `/profile/[id]`, `/myprofile/passbook`, `/discover/[sport]`, `/yearInPlayo`, `/partner-venue/*`, `/sponsor-game` and brand pages such as `/decathlon-events` [code] — [build manifest](https://playo.co/_next/static/7za0E0Z_NeemoERxU8Zqx/_buildManifest.js)

**Does web booking work?**
- Yes in code and by reports, though I did not complete a booking. The venue's reserve action points at `/venue?venueId=`, and `/booking?venueId=` is a real page titled for real-time slot availability [code] — [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru); [booking page code](https://playo.co/_next/static/chunks/pages/booking-4930ef431c4917c1.js)
- The code has web-specific booking and order calls — [booking code](https://playo.co/_next/static/chunks/1421-509fe578b440b5ea.js)
- Page FAQ text says booking can be confirmed online, and the Decathlon post says book by app or website (Dec 2025) — [city page](https://playo.co/venues/bangalore/sports/badminton); [Decathlon post](https://blog.playo.co/decathlon-playo-partnership-sports-for-all/)
- Reviewers use the web to get around app bugs (Nov 2025, Jun 2026), though others call the web version poor (Dec 2025, Feb 2026) [user report] — [feed, page 1](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1018786950/sortby=mostrecent/json); [feed, page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)
- Pay & Join is offered on the web games page, while creating a game requires the app — [games page](https://playo.co/games/bangalore/sports/all)

**How it pushes the app**
- A banner promotes Karma discounts for booking on the app, with a Download the App button — [homepage](https://playo.co/)
- Google Play and App Store badges appear under the claim of a seamless experience in the app, on almost every page — [homepage](https://playo.co/); [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- A `/download` landing page has store buttons and three benefits, with no QR code — [download](https://playo.co/download)
- Year In Playo 2025 sends web visitors to the app for their stats — [Year In Playo](https://playo.co/yearInPlayo)
- Pages carry Twitter app cards, an android-app alternate link for app indexing, and a go.playo.app short link — [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- Reviewers complain that invite links open the browser instead of the app (Sep 2025, Feb 2026) [user report] — [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json)

**SEO approach**
- Title and H1 templates target phrases like badminton courts in Bangalore, with a canonical tag and meta description on city pages. The sample venue page had a templated meta description but no canonical tag in the HTML I read — [city page](https://playo.co/venues/bangalore/sports/badminton); [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- City pages embed BreadcrumbList, ItemList with an aggregate rating, FAQPage (10 Q&As) and Organization JSON-LD [code] — [city page](https://playo.co/venues/bangalore/sports/badminton)
- Venue pages embed LocalBusiness with address, geo, phone, aggregate rating and ReserveAction, plus AMP alternates and a related-links block across locality, sport and city [code] — [sample venue](https://playo.co/venues/museum-road-bengaluru/machaxi-active-sports-centre-museum-road-bengaluru)
- Sitemaps are split: 342 city and sport URLs, 1,233 Bangalore locality and sport URLs, 5,710 unique venue-style URLs in the main file, and 14 static pages, plus a trainer subdomain — [robots](https://playo.co/robots.txt); [cities](https://playo.co/sitemaps/cities-sitemap.xml); [Bangalore](https://playo.co/sitemaps/sitemap-venues-bangalore.xml); [main](https://playo.co/sitemaps/sitemap.xml); [static](https://playo.co/sitemaps/static-sitemap.xml)
- The sitemap sport list (badminton, football, cricket, tennis, basketball, table tennis, volleyball, swimming) is older than the site nav, which now has pickleball and padel — [cities](https://playo.co/sitemaps/cities-sitemap.xml); [homepage](https://playo.co/)
- Unknown sport slugs still return a 200 page with a matching title and generic venues, for example Gaming Venues in Bangalore listing general sports centres. Exact-match slugs such as `play_station` do filter — [gaming slug](https://playo.co/venues/bangalore/sports/gaming); [PlayStation filter](https://playo.co/venues/bangalore/sports/play_station)
- Hygiene gaps: `/explore/bangalore` is in the static sitemap but returns 404, and `/sitemap.xml` at the root returns a Page Not Found page — [static sitemap](https://playo.co/sitemaps/static-sitemap.xml); [explore page](https://playo.co/explore/bangalore); [root sitemap](https://playo.co/sitemap.xml)
- robots.txt blocks /support/ and /profile/, names GPTBot, ChatGPT-User and PerplexityBot with Allow lines for the B2B pages, and disallows Meta's crawlers — [robots](https://playo.co/robots.txt)

**Blog**
- blog.playo.co is a separate subdomain with 1,707 posts across two sitemaps — [sitemap 1](https://blog.playo.co/post-sitemap.xml); [sitemap 2](https://blog.playo.co/post-sitemap2.xml)
- By last-modified year: 317 in 2026, 244 in 2025, 115 in 2024 — [sitemap 2](https://blog.playo.co/post-sitemap2.xml)
- It mixes sports news and rules (IPL squads, court dimensions) with transactional local posts from Oct 2026 such as booking cricket nets in Bangalore and badminton in Koramangala — [sitemap 2](https://blog.playo.co/post-sitemap2.xml)
- A sample transactional post has a table of contents, booking steps, five FAQs, one link to the venue listing and several app calls to action, with no prices or fees (Oct 2026) — [sample post](https://blog.playo.co/book-tennis-court-in-bangalore-last-minute/)
- The homepage blog preview shows articles dated 2016-22, which is stale for a homepage — [homepage](https://playo.co/)

**Stack clues**
- Next.js with server-rendered page data, Gumlet image CDN, Sentry — [city page](https://playo.co/venues/bangalore/sports/badminton)
- Firebase, CleverTap, OneSignal, Sendbird, Juspay and Stripe in the Android SDK scan (Jul 2026) [tracker estimate] — [AppGoblin](https://appgoblin.info/apps/com.techmash.playo)

### Inferences
- For the promo site and web app, the copyable core is simple: one page per city and category, one per venue, schema on all of them, FAQs on every list, and real web booking so links never dead-end.
- Gaming search terms are lightly defended by Playo. The live category title reads Play_station Venues in Bangalore, and an esports slug falls back to unrelated venues.
- Karma discounts that apply only in the app are how Playo converts web visitors without blocking web checkout. That is a softer alternative to an app wall.

### Gaps
- Search traffic and rankings per page type. Inc42 reports 742.01K web traffic, down 12.36% over 30 days, with no date or method — [Inc42 funding](https://inc42.com/company/playo/funding/). Better figures were not available.
- Whether `/discover/[sport]` is meant to be a live hub. The sample I opened rendered like a general landing page.

## What changed in the product between 2024 and 2026?

### Takeaway
The biggest visible change is the version 5 redesign in Feb 2026, followed by months of bad reviews and patches. Around it came racket-sport expansion (pickleball, padel), Decathlon inventory, a rewritten cancellation flow, gift cards and a steady onboarding of gaming venues. Evidence before Feb 2026 is thin, because Apple shows only the last 25 releases and I did not use archive services.

### Cited Findings

| Date | Change | Source |
|---|---|---|
| Oct 2024 onward | The Grid - Gaming Arena Koramangala listing created; more gaming venues follow (see next section) [code] | [The Grid](https://playo.co/venues/koramangala-5th-block-bengaluru/the-grid-gaming-arena-koramangala-koramangala-5th-block-bengaluru) |
| Nov 2024, Jun 2025, Sep 2025 | iOS partner app updates: notifications, new logo, UI changes | [App Store partner](https://apps.apple.com/in/app/id1057092085) |
| Jun-Sep 2025 | Partner app guide and partner FAQs published | [partner app post](https://blog.playo.co/playo-partner-app); [partner console](https://playo-partner.freshdesk.com/support/solutions/articles/1070000137391-what-is-the-playo-partner-console-) |
| Jul 2025 | Off the Field expert sessions start | [Off the Field](https://blog.playo.co/off-the-field-by-playo/) |
| Oct 2025 | Community partner for IPA Pickleball Nationals | [IPA post](https://blog.playo.co/playo-joins-ipa-nationals-as-sports-community-partner/) |
| Oct 2025 | A reviewer mentions a new, bulkier court-selection UI [user report] | [feed, page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json) |
| Dec 2025 | Decathlon partnership, 36 playgrounds live | [Decathlon post](https://blog.playo.co/decathlon-playo-partnership-sports-for-all/) |
| Undated, page says 2025 | Year In Playo 2025 recap, shown in the app | [Year In Playo](https://playo.co/yearInPlayo) |
| By 2 Feb 2026 | Version 5.0 live. Of 57 written reviews in Feb-Mar 2026, 38 were 1-star, citing navigation, filters, sorting and speed [user report] | [feed, page 2](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json); [feed, page 3](https://itunes.apple.com/in/rss/customerreviews/page=3/id=1018786950/sortby=mostrecent/json) |
| Feb-May 2026 | Rapid 5.0.x patches: Home, Game and Social tab UX, payment screens, Passes screen fix, all five tabs | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| 7 Mar 2026 | Several reviewers report an outage on one day [user report] | [App Store feed](https://itunes.apple.com/in/rss/customerreviews/page=2/id=1018786950/sortby=mostrecent/json) |
| 1 Apr 2026 | Revamped cancellation flow (v5.0.6) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| 2 Apr 2026 | Universal Search navigation to trainers and academies (v5.0.7) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| May 2026 | My Purchases work and login fixes (v5.0.9 to 5.1.2) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| 26-31 May 2026 | Gift cards launched in app (v5.1.3, 5.1.4) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| Jul 2026 | Better group chat and activity sharing (v5.1.8) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| 11 Aug 2026 | Auto-scrolling banners, better refund experience (v5.1.10) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| Aug 2026 | Khelo India. Playo India. campaign | [campaign](https://blog.playo.co/khelo-india-playo-india/) |
| 26 Aug 2026 | Checkout and richer venue listings (v5.2.2) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| Oct 2026 | Game creation, Pay & Join settings, payment screens (v5.2.4), venue tagging (v5.2.5) | [version history](https://apps.apple.com/in/app/playo-sports-community-app/id1018786950?see-all=version-history) |
| Sep 2026\* | Loyalty credits help articles edited | [what are credits](https://playo.freshdesk.com/support/solutions/articles/1070000140983-what-are-loyalty-credits-) |

- Pickleball and padel now sit in the Popular sports block for every city, while the older sitemap list has basketball and volleyball instead — [homepage](https://playo.co/); [cities sitemap](https://playo.co/sitemaps/cities-sitemap.xml)
- The Karma cap seems to have fallen. An earlier search snippet of the Karma post showed 5% for most cities, while the page now says 2.5% (edited 2 Feb 2026). Low confidence — [Karma guide](https://blog.playo.co/5-ways-to-earn-karma-on-the-playo-app/)
- The account path changed from My Bookings (2025 blog) to My Purchases (May 2026 help) — [cancellation guide](https://blog.playo.co/playo-rescheduling-and-cancellations); [how to cancel](https://playo.freshdesk.com/support/solutions/articles/1070000107641-how-to-cancel-my-booking-)

### Inferences
- The redesign backlash is the most useful lesson here. Filters and sort are the product for repeat users, and removing them hurt badly. Ship navigation changes gradually with an old view available.
- Most 2026 releases concern payments, refunds, cancellation and login, which suggests core reliability is Playo's current problem and not feature breadth.

### Gaps
- Changes in 2024 and most of 2025. Apple's history stops at Feb 2026 and no changelog was found. Archive services were ruled out once the search budget ran out, so this is under-researched.
- Android release notes. Google Play's page did not show What's New in the text I could read.
- Founder or executive commentary on the redesign. The one interview found (The Bridge, updated Apr 2021, STALE) held no figures, and the YourStory 2019 piece returned 403 — [The Bridge](https://thebridge.in/featured/living-seagull-conversation-playo-ceo-gauravjeet-singh/).

## Added question: is Playo already selling gaming venues?

### Takeaway
Yes. Playo already sells PlayStation, VR and esports slots at gaming cafes in India, using its normal slot model, and most of the listings I sampled were created since 2025. Supply is concentrated in Bengaluru and Hyderabad and volumes look small. This is the most decision-relevant finding for the founder: it validates demand but means Playo is an existing competitor rather than only a template.

### Cited Findings
- Playo's sports table includes Play Station, XBox, VR, eSports, Car Racing, Board Games, Pool, Snooker, Laser Tag, Bowling and Foosball [code] — [booking page data](https://playo.co/booking?venueId=63283391c45768138ff9de75)
- Venues in the Play Station category, 3 Nov 2026 [code]: Hyderabad 18, Bangalore 16, Chennai 4, Pune 3, Delhi NCR 2, Kochi 1, Mumbai 0, Ahmedabad 0, Kolkata 0, Indore 0, for a total of 44 — [Hyderabad](https://playo.co/venues/hyderabad/sports/play_station); [Bangalore](https://playo.co/venues/bangalore/sports/play_station); [Chennai](https://playo.co/venues/chennai/sports/play_station); [Pune](https://playo.co/venues/pune/sports/play_station); [Delhi NCR](https://playo.co/venues/delhi-ncr/sports/play_station); [Kochi](https://playo.co/venues/kochi/sports/play_station); [Mumbai](https://playo.co/venues/mumbai/sports/play_station); [Ahmedabad](https://playo.co/venues/ahmedabad/sports/play_station); [Kolkata](https://playo.co/venues/kolkata/sports/play_station); [Indore](https://playo.co/venues/indore/sports/play_station)
- Other categories in Bangalore: Foosball 29, Darts 2, XBox 2, VR 1. Hyderabad has VR 1 and XBox 0. Pune, Delhi NCR, Mumbai and Chennai have 0 for both VR and XBox — [Bangalore foosball](https://playo.co/venues/bangalore/sports/Foosball); [Bangalore XBox](https://playo.co/venues/bangalore/sports/XBox); [Bangalore VR](https://playo.co/venues/bangalore/sports/VR); [Hyderabad VR](https://playo.co/venues/hyderabad/sports/VR)
- Listing creation dates for the 33 venues on the first pages of five cities [code]: 2023: 2; 2024: 4; 2025: 11; 2026: 16 so far. 27 of 33 are from Jan 2025 onward. This is a sample and not the full 43 in those cities.
- 32 of the 33 had at least one bookable category. Joystix Game Zone (Pune) had none.
- Rating counts are low, from 0 to 31. Rifle Club Gaming Cafe has the most at 31 (5.0).
- Separately, The Grid - Gaming Arena has three Bengaluru branches with Bowling, Laser Tag, eSports, Shooting, Pool, Air Hockey and Dance bookable, listed from Oct 2024 to Jun 2025 — [Koramangala](https://playo.co/venues/koramangala-5th-block-bengaluru/the-grid-gaming-arena-koramangala-koramangala-5th-block-bengaluru); [Kalyan Nagar](https://playo.co/venues/hrbr-layout-bengaluru/the-grid-gaming-arena-kalyan-nagar-hrbr-layout-bengaluru); [New BEL Road](https://playo.co/venues/rmv-2nd-stage-bengaluru/the-grid-gaming-arena-new-bel-road-rmv-2nd-stage-bengaluru)
- Older gaming cafes exist as inactive 2018-19 directory records tagged Pool or Snooker, for example X3 Esports (Pune), Gamer'z Lounge (NCR) and LaFfAzZ D Gaming Cafe (Indore) — [X3 Esports](https://playo.co/venues/Rahatani/X3-Esports-Rahatani-pune); [Gamer'z Lounge](https://playo.co/venues/Shastri-Nagar/Gamer-z-Lounge-Shastri-Nagar-ncr); [LaFfAzZ D](https://playo.co/venues/Ratlam-Kothi/LaFfAzZ-D-Gaming-Cafe-Ratlam-Kothi-indore)
- Gaming venues have generic pages with plain marketing text on PS5, VR and racing cockpits. Fields seen are hours, amenities and sports. No station count or game library field appeared on web pages I read — [Playport](https://playo.co/venues/madhapur-hyderabad/playport-madhapur-hyderabad)
- The eSports category cannot be reached by URL: the slugs `esports`, `eSports`, `Esports`, `ESports` and `e-sports` all fall back to the full city list, even though venues carry that category — [esports slug](https://playo.co/venues/bangalore/sports/esports); [Playport](https://playo.co/venues/madhapur-hyderabad/playport-madhapur-hyderabad)

**Sampled venues on Playo with a Play Station category, by listing date [code]**

| Created | Venue | City | Bookable categories | Rating (count) |
|---|---|---|---|---|
| 2023-10 | [Hakuna Matata](https://playo.co/venues/near-christ-university-bengaluru/hakuna-matata-near-christ-university-bengaluru) | Bengaluru | Pool, Play Station, Snooker | 4.6 (7) |
| 2023-10 | [Uj's Turf](https://playo.co/venues/tathawade-pune/ujs-turf-tathawade-pune) | Pune | Box Cricket, Football, Pool, Snooker, Play Station | 4.9 (25) |
| 2024-07 | [Cafe Game Theory](https://playo.co/venues/kompally-hyderabad/cafe-game-theory-kompally-hyderabad) | Hyderabad | Play Station, eSports, Foosball, Carrom, Hall, Chess | 5.0 (3) |
| 2024-07 | [Play Again Snooker and Pool Academy](https://playo.co/venues/rajarajeshwari-nagar-bengaluru/play-again-snooker-and-pool-academy-rajarajeshwari-nagar-bengaluru) | Bengaluru | Snooker, Pool, Play Station | 5.0 (3) |
| 2024-11 | [G5 Arena](https://playo.co/venues/kondapur-hyderabad/g5-arena-snooker-and-gaming-lounge-kondapur-hyderabad) | Hyderabad | Snooker, Play Station | 4.5 (2) |
| 2024-11 | [Break And Chill Snooker Lounge](https://playo.co/venues/gopanapally-hyderabad/break-and-chill-snooker-lounge-gopanapally-hyderabad) | Hyderabad | Snooker, Play Station | 5.0 (1) |
| 2025-01 | [Alchemy Gaming, Nandanam](https://playo.co/venues/nandanam-chennai/alchemy-gaming-nandanam-nandanam-chennai) | Chennai | Snooker, Play Station, eSports | 3.0 (2) |
| 2025-01 | [Alchemy Gaming, Perambur](https://playo.co/venues/perambur-chennai/alchemy-gaming-perambur-perambur-chennai) | Chennai | Snooker, Play Station, eSports | 5.0 (1) |
| 2025-03 | [Pixel and Paddle](https://playo.co/venues/mogappair-west-chennai/pixel-and-paddle-mogappair-west-chennai) | Chennai | Pickleball, Play Station | 4.3 (6) |
| 2025-06 | [BrewPlay](https://playo.co/venues/annapurneshwari-nagar-bengaluru/brewplay-annapurneshwari-nagar-bengaluru) | Bengaluru | Pool, Snooker, Play Station | 5.0 (3) |
| 2025-08 | [Joystix Game Zone](https://playo.co/venues/wagholi-pune/joystix-game-zone-wagholi-pune) | Pune | none bookable | 0 (0) |
| 2025-11 | [Vibe & Strike Gaming Lounge](https://playo.co/venues/nizampet-hyderabad/vibe-strike-gaming-lounge-nizampet-hyderabad) | Hyderabad | Snooker, Play Station, eSports | 4.0 (4) |
| 2025-11 | [The Godown](https://playo.co/venues/kalyan-nagar-bengaluru/the-godown-kalyan-nagar-bengaluru) | Bengaluru | Pool, Snooker, Play Station, Table Tennis, Foosball | 4.9 (9) |
| 2025-12 | [G2 - Go Games](https://playo.co/venues/anekal-bengaluru/g2-go-games-anekal-bengaluru) | Bengaluru | Pickleball, Box Cricket, Football, Cricket Nets, Pool, Play Station | 5.0 (2) |
| 2025-12 | [Pikklle](https://playo.co/venues/bowenpally-hyderabad/pikklle-the-pickleball-arena-diamond-point-bowenpally-hyderabad) | Hyderabad | Pickleball, Play Station | 3.3 (7) |
| 2025-12 | [Lucid Arena](https://playo.co/venues/chikkabanavara-bengaluru/lucid-arena-chikkabanavara-bengaluru) | Bengaluru | Play Station, Board Games | 5.0 (2) |
| 2025-12 | [Pitch Point](https://playo.co/venues/sector-64-gurugram/pitch-point-sector-64-gurugram) | Gurugram | Cricket Nets, Pool, Play Station | 5.0 (2) |
| 2026-01 | [Crazy Pickleball](https://playo.co/venues/old-bowenpally-hyderabad/crazy-pickleball-old-bowenpally-hyderabad) | Hyderabad | Pickleball, Play Station | 4.1 (30) |
| 2026-01 | [One Zone Cricket & PickleBall](https://playo.co/venues/attapur-hyderabad/one-zone-cricket-pickleball-attapur-hyderabad) | Hyderabad | Box Cricket, Play Station, Pickleball | 4.0 (4) |
| 2026-01 | [SmashVille Arena](https://playo.co/venues/kolathur-chennai/smashville-arena-kolathur-chennai) | Chennai | Badminton, Snooker, Play Station | 5.0 (1) |
| 2026-02 | [The Skydeck 24](https://playo.co/venues/shivaji-marg-delhi/the-skydeck-24-shivaji-marg-delhi) | Delhi | Pickleball, Play Station, Cricket Nets | 5.0 (1) |
| 2026-02 | [Rifle Club Gaming Cafe](https://playo.co/venues/keregudadahalli-bengaluru/rifle-club-gaming-cafe-keregudadahalli-bengaluru) | Bengaluru | Play Station, Car Racing, Pool | 5.0 (31) |
| 2026-03 | [Chats GPT Gaming Garage](https://playo.co/venues/hsr-layout-bengaluru/chats-gpt-gaming-garage-hsr-layout-bengaluru) | Bengaluru | Play Station, Massage Therapy, Table Tennis, Snooker, Carrom | 3.4 (8) |
| 2026-03 | [Royal Snooker Emporium](https://playo.co/venues/rk-hegde-nagar-bengaluru/royal-snooker-emporium-rk-hegde-nagar-bengaluru) | Bengaluru | Snooker, Pool, Play Station | 4.0 (4) |
| 2026-04 | [GG - Gaming Garage](https://playo.co/venues/malkajgiri-hyderabad/gg-gaming-garage-malkajgiri-hyderabad) | Hyderabad | Play Station, eSports, Table Tennis, Carrom, Chess, Snooker, Pool | 5.0 (1) |
| 2026-05 | [DG Gaming cafe](https://playo.co/venues/bowenpally-hyderabad/dg-gaming-cafe-bowenpally-hyderabad) | Hyderabad | Play Station, Car Racing | 5.0 (2) |
| 2026-05 | [Most Wanted Gaming Cafe](https://playo.co/venues/vidyaranyapura-bengaluru/most-wanted-gaming-cafe-vidyaranyapura-bengaluru) | Bengaluru | Pool, Car Racing, Play Station | 3.7 (3) |
| 2026-05 | [Lucky Gaming Zone](https://playo.co/venues/secunderabad-hyderabad/lucky-gaming-zone-secunderabad-hyderabad) | Hyderabad | Play Station, eSports, Snooker, Kids Play Area | 5.0 (1) |
| 2026-06 | [Mana Snooker Adda](https://playo.co/venues/ashok-nagar-hyderabad/mana-snooker-adda-ashok-nagar-hyderabad) | Hyderabad | Pool, Snooker, Play Station | 5.0 (2) |
| 2026-07 | [Kreeda Lounge](https://playo.co/venues/banaswadi-bengaluru/kreeda-lounge-banaswadi-bengaluru) | Bengaluru | Foosball, XBox, Play Station, Pool, Chess | 5.0 (1) |
| 2026-07 | [Headshot Hub](https://playo.co/venues/kharadi-pune/headshot-hub-the-gaming-cafe-kharadi-pune) | Pune | Car Racing, Play Station, eSports | 5.0 (2) |
| 2026-07 | [V Play Gaming Zone](https://playo.co/venues/konanakunte-bengaluru/v-play-gaming-zone-konanakunte-bengaluru) | Bengaluru | VR, Snooker, Play Station | 5.0 (1) |
| 2026-08 | [Playport](https://playo.co/venues/madhapur-hyderabad/playport-madhapur-hyderabad) | Hyderabad | VR, eSports, Play Station | 5.0 (4) |

### Inferences
- Many of these look like Playo sales teams adding snooker halls, turfs and pickleball arenas with a console as a side product, plus a rising share of pure gaming cafes during 2026. The 2025-26 date curve suggests active supply work and not an accident.
- Playo's position is real but thin: a few dozen venues, low rating counts, no console-specific fields seen on web, and rough category pages. A gaming-first product would differentiate on station specs, game library, live availability, tournaments and squad booking, and on SEO for these terms.
- The strongest risk is that cafes already on Playo see no reason to add a second app unless the new one sends more bookings or charges less. Founders should treat the 44-plus listed venues as a lead list as well as a threat.
- Bengaluru and Hyderabad are where Playo has the supply today. Mumbai, Kolkata, Ahmedabad and Indore show none in this category.

### Gaps
- Booking volume at gaming venues. Rating counts are the only proxy.
- How a PS station is modelled and priced on Playo: court or ticket, per hour or per seat. That data sits behind the availability endpoint I did not call.
- Total esports-tagged venues, because the slug does not resolve.
- Whether Playo has a formal gaming push. No announcement was found, and the search budget ran out before I could look for one specifically.
- Commission paid by gaming cafes. Not public.
