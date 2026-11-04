# Backend and monorepo choice for the gaming cafe booking aggregator

Research date: 3 November 2026. Every page below was read on that date unless a different date is shown. All text is paraphrased. No code was run and no account was created, so nothing here has been tested.

Tags:
- (vendor) = the company's own claim about its product, price or performance.
- (search only) = seen only as search-result text; the page was not opened.
- (my estimate) = arithmetic on assumptions I state. (inference) = my reading, not a source's statement.
- Rupee conversions assume ₹90 per USD. I did not check the rate.

Method limit: one WebSearch call was used, for the Supabase block. Everything else came from opening known pages. Apple's Universal Links page, Jio's DLT portal and two Meta rate pages did not return readable text.

## Bottom line

Start on **Supabase Pro in Mumbai with no separate server**.

- **Booking core:** one `bookings` table, with a Postgres exclusion constraint on station and `tstzrange`. App bookings, web bookings, holds and walk-ins all go in that table.
- **Thin server:** Next.js route handlers on Vercel Pro in `bom1`, calling SQL functions. They hold payment secrets, create orders and take webhooks. Move them to NestJS only when a trigger below fires.
- **OTP:** Supabase's Send SMS hook to a DLT-registered Indian SMS vendor such as MSG91.
- **Live status:** Supabase Realtime Broadcast, triggered from the database.
- **Monorepo:** pnpm and Turborepo, with Expo SDK 58 development builds and Next.js 16. Share types, Zod schemas and pure logic, not UI.
- **Fixed cost at launch:** about $55 to $95 a month (₹5,000 to ₹8,500), made up of Supabase $35, Vercel $20 to $40 and Expo $0 to $19 (my estimate). Add ₹5,000 a year for DLT, about ₹0.25 per SMS, and gateway fees.

Three checks to run in week one, because each one can change the plan:

1. **Split eligibility.** Razorpay says Route needs over ₹40 lakh domestic turnover. A first-year business can self-declare turnover instead of filing GST proofs, but the page does not say a low figure passes. Get a written answer from Razorpay and Cashfree for this entity.
2. **Native payment SDKs.** Build both on Expo SDK 58 on a real Android and iOS device. SDK 55 and later run only on the New Architecture, and I found no statement from either vendor that covers React Native 0.88.
3. **Hostname control.** Supabase's `supabase.co` domain was blocked on several Indian ISPs for about a week in February and March 2026. Ship the apps against a subdomain you own.

## Key question 1: Which data store makes overlap-free booking simplest and safest?

### Takeaway
Postgres. One row per booking and one constraint means overlap is rejected no matter which code path, client or person writes the row. Firestore can be made correct with per-slot documents, but the rule then lives in every writer and needs a fixed time grid.

### Cited Findings

**PostgreSQL (docs for version 18, shown as current, build 18.6)**
- An exclusion constraint guarantees that for any two rows compared on the named columns and operators, not all comparisons are true. The docs recommend it over `UNIQUE` for non-overlap rules — [DDL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html); [range types](https://www.postgresql.org/docs/current/rangetypes.html).
- The docs show `EXCLUDE USING GIST (room WITH =, during WITH &&)` with the `btree_gist` extension. An overlapping insert for the same room fails, and the same time on another room succeeds — [range types](https://www.postgresql.org/docs/current/rangetypes.html).
- `btree_gist` covers `uuid` and is trusted, so a non-superuser with `CREATE` privilege can install it — [btree_gist](https://www.postgresql.org/docs/current/btree-gist.html).
- `tstzrange` is built in. The two-argument constructor defaults to `[)`, so back-to-back sessions do not collide. A `NULL` bound means unbounded on that side — [range types](https://www.postgresql.org/docs/current/rangetypes.html).
- `EXCLUDE ... WHERE (predicate)` limits the constraint to some rows through a partial index. A non-deferrable constraint is checked right after each command — [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html).
- Every function in an index definition must be immutable and cannot depend on the current time — [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html). So `hold_expires_at > now()` cannot be in the predicate.
- A violation raises SQLSTATE `23P01` — [error codes](https://www.postgresql.org/docs/current/errcodes-appendix.html). Exclusion constraints cannot be arbiters for `ON CONFLICT DO UPDATE` — [INSERT](https://www.postgresql.org/docs/current/sql-insert.html).
- `WITHOUT OVERLAPS` behaves like the same `EXCLUDE` — [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html). Supabase's upgrade page discusses Postgres 15 and 17, not 18 — [Supabase upgrades](https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects). Use plain `EXCLUDE`.

**Firestore (no last-updated date shown on these pages)**
- Reads must come before writes, and a transaction function can run more than once. Transactions fail when the client is offline, while batched writes still run offline — [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
- Limits: 10 MiB request size, 20-second lock deadline, 270-second total, 60-second idle. Security Rules allow 20 document access calls for an atomic operation, plus 10 per single-document operation — [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
- Isolation is serializable. Standard edition server libraries default to pessimistic locks, while mobile and web SDKs are always optimistic. After a finite number of retries a transaction fails with an ABORTED contention error — [data contention](https://firebase.google.com/docs/firestore/transaction-data-contention).
- No fixed per-document write limit is given. Google says to load test and keep transactions small — [best practices](https://firebase.google.com/docs/firestore/best-practices).
- TTL deletion usually happens within 24 hours and is not transactional, and expired documents still appear in queries until removed. It cannot end a payment hold on time — [TTL](https://firebase.google.com/docs/firestore/ttl).

### Comparison (inference, from the findings above)

| Need | Postgres `EXCLUDE` on `tstzrange` | Firestore per-slot documents |
|---|---|---|
| Where the no-overlap rule lives | Database, for every writer | Each writer's transaction, plus Security Rules or a server function |
| Variable durations | One row with any start and end | One document per grid unit. Three hours at 15 minutes is 12 documents in one transaction |
| Changing the grid later | No data change | Rewrite future slot documents and every writer |
| Walk-ins and extensions | Same table. `UPDATE during` is re-checked by the constraint | Create or delete more slot documents in a transaction |
| Hold expiry | Status flip by `pg_cron`, plus clearing stale holds in the booking transaction | Scheduled function plus filtering, since TTL is not timely |
| Sloppy code path | Gets a `23P01` error | A plain `set()` on a slot document overwrites a booking without error |
| Calendar read | One range query | Many slot documents per station per day, billed per document |

The founder says principles and architecture come later. This is the one rule that should not depend on code discipline, so it belongs in the database (inference).

### Sketch (mine, not from a source; not run)

```sql
create extension if not exists btree_gist with schema extensions;

create table bookings (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id),
  during tstzrange not null
    check (not isempty(during) and upper(during) is not null),
  status booking_status not null,  -- held, confirmed, checked_in, completed, cancelled, expired
  source booking_source not null,  -- app, web, walk_in
  hold_expires_at timestamptz,
  exclude using gist (station_id with =, during with &&)
    where (status in ('held', 'confirmed', 'checked_in'))
);
```

Details this forces (inference):
- **Hold expiry is a state change.** A `pg_cron` job flips expired holds every 30 to 60 seconds. The hold function also expires stale overlapping holds in the same transaction before it inserts.
- **Walk-ins need a planned end.** A `NULL` upper bound would block that station forever, hence the check above. Extending a session is an `UPDATE` that can fail if the next booking is already there, which is the correct behaviour.
- **Ending early frees the station.** Shrink the range or move the row to `completed`.
- **Staff writes need a connection.** Firestore transactions also fail offline, so neither option gives an offline staff calendar. Decide what staff do when the cafe's internet drops.

### Gaps
- I ran no concurrency test. Run one before launch: two sessions racing for the same station. At the write rate of one cafe's stations, GiST overhead is unlikely to matter (inference, not measured).

## Key question 2: Supabase

### Takeaway
It fits. Mumbai exists, Pro is $25, phone OTP works through a hook, and Realtime limits are generous for this scale. The real risks are the 2026 ISP block and exposing tables directly to shipped apps. Both have cheap fixes if done on day one.

### Cited Findings

**Region**
- Mumbai (`ap-south-1`) is offered only as a specific region. The APAC general region is Singapore, so choose Mumbai explicitly — [regions](https://supabase.com/docs/guides/platform/regions).
- Project migration is described as mainly for changing regions, so expect a migration rather than a setting (inference) — [migrating](https://supabase.com/docs/guides/platform/migrating-within-supabase).

**Pricing** ([pricing](https://supabase.com/pricing))

| Item | Free | Pro ($25/mo) | Team ($599/mo) |
|---|---|---|---|
| Compute credit | none | $10, covers one Micro | $10, covers one Micro |
| MAU | 50,000 | 100,000, then $0.00325 | same as Pro |
| Database | 500 MB | 8 GB, then $0.125/GB | same as Pro |
| Egress | 5 GB | 250 GB, then $0.09/GB | same as Pro |
| Edge Function invocations | 500,000 | 2M, then $2/M | same as Pro |
| Realtime messages | 2M | 5M, then $2.50/M | same as Pro |
| Realtime peak connections | 200 | 500, then $10 per 1,000 | same as Pro |
| Backups | none | 7 days | 14 days |
| Log retention | 1 day | 7 days | 28 days |
| Pausing | after 1 week idle | never | never |

- Add-ons: custom domain $10 a month — [custom domain usage](https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains). PITR $100 a month per 7 days of retention — [pricing](https://supabase.com/pricing). PITR needs at least Small compute and has a worst-case recovery point of two minutes — [backups](https://supabase.com/docs/guides/platform/backups).
- Compute: Micro about $10 (1 GB, shared CPU, 60 direct connections, 200 pooler clients), Small about $15 (2 GB), Medium about $60 (4 GB), Large about $110 (8 GB, dedicated). Changing size causes downtime — [compute](https://supabase.com/docs/guides/platform/compute-and-disk).
- Spend caps are on by default on Pro — [pricing](https://supabase.com/pricing).

**Realtime**
- Concurrent connections and messages per second: Free 200 and 100. Pro 500 and 500. Pro with no spend cap, or Team, 10,000 and 2,500. Broadcast payload is 256 KB on Free and 3,000 KB on paid plans. Limits can be raised on request — [limits](https://supabase.com/docs/guides/realtime/limits).
- Postgres Changes runs on a single thread, and each change is authorised per subscriber. Supabase's Micro benchmark is about 3,000 messages a second with RLS (vendor). It advises Broadcast above about 3,000 subscribers on the same changes — [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- Supabase recommends Broadcast with a trigger calling `realtime.broadcast_changes` for most cases — [subscribing to changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).
- Counting: one broadcast heard by four clients is five messages. Billing rounds up to whole packages of one million — [messages usage](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages).

**Phone auth**
- Built-in SMS providers are MessageBird, Twilio, Vonage and TextLocal (community-supported). WhatsApp works only through Twilio or Twilio Verify. The docs name India's DLT rules as something you must follow — [phone login](https://supabase.com/docs/guides/auth/phone-login).
- The Send SMS hook replaces built-in sending and is on Free and Pro, as a Postgres function or HTTP endpoint — [auth hooks](https://supabase.com/docs/guides/auth/auth-hooks). Its page names Msg91 as an India option but gives no Msg91 code, and it also covers other channels and provider fallback — [Send SMS hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook).
- Default is one OTP request per 60 seconds. The docs advise rate limits and CAPTCHA to control SMS costs — [phone login](https://supabase.com/docs/guides/auth/phone-login).

**Edge Functions**
- Limits: 256 MB memory, 150-second wall clock on Free and 400 on paid, 2 seconds of CPU per request, 150-second idle timeout, 20 MB bundle from the CLI. Outbound ports 25 and 587 are blocked — [limits](https://supabase.com/docs/guides/functions/limits).
- They run in the region nearest the caller. `ap-south-1` can be pinned, and webhooks use the `forceFunctionRegion` query parameter — [regional invocation](https://supabase.com/docs/guides/functions/regional-invocation).
- Webhook endpoints need `verify_jwt = false` — [function configuration](https://supabase.com/docs/guides/functions/function-configuration). Shared code goes in a `_shared` folder — [development tips](https://supabase.com/docs/guides/functions/development-tips). The dependency docs do not cover monorepos or workspaces — [dependencies](https://supabase.com/docs/guides/functions/dependencies).

**Cron and API hardening**
- Supabase Cron runs from every second to once a year. It advises no more than 8 concurrent jobs and each finishing within 10 minutes — [cron](https://supabase.com/docs/guides/cron).
- Keep internal tables out of exposed schemas, and expose a dedicated schema such as `api`. Turn off automatic exposure of new tables. RLS does not apply to functions, so review `security definer` functions. Supabase plans to make exposure opt-in — [hardening](https://supabase.com/docs/guides/database/hardening-data-api).

**The 2026 India block**
- Reported order date 24 Feb 2026 under Section 69A of the IT Act, per a source. Access was patchy across networks. JioFiber, Airtel and ACT Fibernet failed in New Delhi — [TechCrunch, 27 Feb 2026](https://techcrunch.com/2026/02/27/india-disrupts-access-to-popular-developer-platform-supabase-with-blocking-order/).
- Supabase's first description was a provider not returning correct DNS responses — [MediaNama](https://www.medianama.com/2026/02/223-supabase-isp-level-block-jiofiber-users-india/).
- Restoration dates differ: Supabase's announcement on 3 Mar ([OfficeChai](https://officechai.com/stories/supabase-says-that-access-to-its-website-is-fully-restored-for-indian-users-after-govt-intervention)), 4 Mar ([Analytics India Magazine](https://analyticsindiamag.com/ai-news/india-restores-access-to-supabase-after-isp-level-block); [Lovable status](https://status.lovable.dev/incidents/01KJDBPNKJRQZPEDCY6MW95CYX)), 5 Mar ([MediaNama](https://www.medianama.com/2026/02/223-supabase-isp-level-block-jiofiber-users-india/)). The reason was never published.
- MediaNama also relays one founder's post that Firebase had similar trouble. I treat that as weak.

**Exit path**
- `supabase db dump` exports roles, schema and data separately. Storage objects, Edge Functions, Realtime publications, webhooks, non-default extensions and the Vault root key need manual steps — [backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
- The direct connection is the documented route for `pg_dump` and replication — [connecting](https://supabase.com/docs/guides/database/connecting-to-postgres). Logical replication is documented in the inbound direction and needs Postgres 10+ on both sides — [migrating to Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres).
- Self-hosting exists but is community-supported, without managed backups or PITR — [self-hosting](https://supabase.com/docs/guides/self-hosting).

### Inferences
- **Exit is real for data and weak for the rest.** The table, the constraint and SQL functions move to any Postgres. `auth.uid()` policies, Auth, Realtime and Edge Functions need replacing. Phone-only users have no password hashes to move, so they re-verify by OTP.
- **Do not let shipped apps read tables directly.** Reads go through views or functions in an `api` schema, and writes go through your route handlers. Otherwise your table shape becomes a public API that old app versions depend on.
- **Keep Realtime payloads free of personal data.** Broadcast station id and status only, on one topic per venue. This matters with minors on the platform.
- **Live status looks cheap (my estimate).** 1,000 stations, 8 changes a day, 30 days and 5 listeners per venue is about 1.4M messages, inside Pro's 5M. Turn the spend cap off before launch, because Pro with the cap has a 500-connection limit that an evening peak could reach.
- **Block mitigation.**
  - Use a custom domain from the first build. The old `supabase.co` URL keeps working during a switch — [custom domains](https://supabase.com/docs/guides/platform/custom-domains).
  - A CNAME alone may not survive a DNS block, because its target resolves through the same ISP resolver. Keep the record's TTL low and rehearse repointing it at your own reverse proxy, WebSockets included.
  - JioBase sells this kind of proxy (vendor, [post of 28 Feb 2026](https://jiobase-web.pages.dev/blog/why-supabase-banned-india-section-69a)). Its claims are unverified and you do not need it.
  - Route handlers keep working during such a block, because they call Supabase from Vercel's network rather than an Indian ISP's resolver.

### Gaps
- The custom-domain page does not mention Realtime. Test WebSockets through the domain.
- No uptime or SLA figures for `ap-south-1` were checked. An incident page on a third-party tracker refused the fetch.
- The type generation page shows `--schema public` only — [generating types](https://supabase.com/docs/guides/api/rest/generating-types). Confirm it handles an `api` schema.

## Key question 3: Firebase

### Takeaway
Reject it for the booking core and for OTP in India. Keep only FCM, which is free and sits under Expo's push service anyway. Data Connect is the one Firebase path to an exclusion constraint, but React Native is not a listed target and its native SQL is in preview.

### Cited Findings
- **Regions:** Firestore has `asia-south1` (Mumbai) and `asia-south2` (Delhi). Location cannot change after creation — [locations](https://firebase.google.com/docs/firestore/locations).
- **Phone auth price for India: $0.07 per SMS, about ₹6.30.** The first ten SMS a day are not billed — [Identity Platform pricing](https://cloud.google.com/identity-platform/pricing). SMS needs the Blaze plan — [limits](https://firebase.google.com/docs/auth/limits).
- **Phone auth limits:** 3,000 SMS a day and 900 a minute on Firebase Auth, with no daily limit on Identity Platform — [limits](https://firebase.google.com/docs/auth/limits).
- **Location of auth data:** Firebase Authentication runs only from US data centres — [privacy](https://firebase.google.com/support/privacy).
- **Phone Number Verification:** carrier-based, rolling out gradually. The page does not mention India, and its sign-in integration is in beta — [PNV](https://firebase.google.com/docs/phone-number-verification).
- **Firestore list rates:** $0.03 per 100,000 reads and $0.09 per 100,000 writes in the first table shown. I could not confirm the Mumbai column — [Firestore pricing](https://cloud.google.com/firestore/pricing).
- **Data Connect now appears in Google's docs as Firebase SQL Connect.** Schema is written as GraphQL over Cloud SQL for PostgreSQL. Generated SDKs are Kotlin Android, iOS, Flutter and web — [overview](https://firebase.google.com/docs/data-connect).
- **SQL Connect details:**
  - Realtime subscriptions are described for Swift, Android, web and Flutter, not React Native — [realtime](https://firebase.google.com/docs/sql-connect/realtime).
  - Native SQL is in preview with no SLA, and schema changes must not use it — [native SQL](https://firebase.google.com/docs/sql-connect/native-sql).
  - Strict mode deletes tables and columns not in the schema. Compatible mode leaves them. The page does not mention exclusion constraints or triggers — [schema management](https://firebase.google.com/docs/sql-connect/manage-schemas-and-connectors).
  - A hand-managed database is possible by declining managed migrations, and `asia-south1` is listed — [services](https://firebase.google.com/docs/sql-connect/manage-services-and-databases).
  - Cloud SQL starts at $9.37 a month after a 3-month trial. Operations are free to 250,000 a month, then $0.90 per million — [pricing](https://firebase.google.com/docs/sql-connect/pricing).
- **Firebase Auth with Supabase:** supported as a third-party provider, with a custom `role` claim needed on every user. The docs show JavaScript, Flutter, Swift and Kotlin — [Firebase Auth on Supabase](https://supabase.com/docs/guides/auth/third-party/firebase-auth).
- **Push:** Cloud Messaging has no charge — [Firebase pricing](https://firebase.google.com/pricing). Expo's service handles FCM and APNs for you and is free, at up to 600 notifications a second per project — [overview](https://docs.expo.dev/push-notifications/overview/); [FAQ](https://docs.expo.dev/push-notifications/faq/).

### Inferences
- OTP alone can outweigh the whole stack. 10,000 sends a month is about $680 on Firebase, against about ₹2,500 before GST on MSG91 (my estimate). That is roughly 25 times per SMS.
- Using Firebase phone auth as a stopgap while DLT is pending is possible but adds a Cloud Function and a second auth system. DLT registration has a 72-hour stated turnaround, so just file it.
- An earlier Expo and Firebase app once lived in this repository; familiarity with Firebase is a real switching cost. I judge it small against the booking rule and the OTP price.

### Gaps
- None of the pages I read say whether Firebase phone SMS to India needs your own DLT registration.

## Key question 4: NestJS versus FastAPI, and when a separate server is needed

### Takeaway
No separate server at launch. Route handlers on Vercel plus SQL functions cover orders, webhooks and jobs. When a server is needed, use NestJS, because the TypeScript moves across. FastAPI can come later as a sidecar for analytics or pricing work, but not as the main server.

### Cited Findings

**What payment webhooks need**
- Razorpay uses HMAC-SHA256 over the raw body, in the `X-Razorpay-Signature` header. The same event can arrive more than once, and `x-razorpay-event-id` identifies it — [validate webhooks](https://razorpay.com/docs/webhooks/validate-test/).
- Razorpay expects a response within 5 seconds and retries with backoff for 24 hours. The webhook is disabled if failures last that long, and order of arrival is not guaranteed — [best practices](https://razorpay.com/docs/webhooks/best-practices/).
- Cashfree signs over the timestamp and raw body. It retries three times by default, at 2, 10 and 30 minutes, configurable to 10 retries. Delivery is at-least-once, with an `x-idempotency-header`. The page is inconsistent about the signature separator, so use its SDK method — [Cashfree webhooks](https://www.cashfree.com/docs/payments/online/webhooks/overview).
- Orders must be created on the server for both gateways — [Razorpay integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/); [Cashfree RN](https://www.cashfree.com/docs/payments/online/mobile/react-native).

**Where the code can run**
- Vercel Functions on Pro: 300-second default and 800-second maximum duration, full Node.js coverage, 4.5 MB body limit. CPU billing excludes I/O wait — [limits](https://vercel.com/docs/functions/limitations). The default region for new projects is `iad1`, so set `bom1` — [regions](https://vercel.com/docs/functions/configuring-functions/region).
- NestJS: `rawBody: true` exposes the unparsed body — [raw body](https://docs.nestjs.com/faq/raw-body). BullMQ queues need Redis — [queues](https://docs.nestjs.com/techniques/queues). Nest's own monorepo mode gives apps no `package.json`, and the page does not cover pnpm or Turborepo — [Nest monorepo](https://docs.nestjs.com/cli/monorepo). Turborepo has a `with-nestjs` example — [examples](https://github.com/vercel/turborepo/tree/main/examples).
- FastAPI: emits OpenAPI 3.1, and the docs suggest Hey API for TypeScript clients — [generate clients](https://fastapi.tiangolo.com/advanced/generate-clients/). `BackgroundTasks` suits small jobs, and heavier work points to Celery with a broker — [background tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/).
- A long-lived server should use a direct connection (IPv6 or the IPv4 add-on) or session-mode pooling on IPv4. Serverless should use transaction mode with prepared statements off — [connecting](https://supabase.com/docs/guides/database/connecting-to-postgres).

**Hosting a server near a Mumbai database**
- Railway, Render and Fly list no Mumbai region. Singapore is the nearest they offer — [Railway](https://docs.railway.com/reference/deployment-regions); [Render](https://render.com/docs/regions); [Fly](https://docs.fly.io/reference/regions).
- Cloud Run has `asia-south1` at Tier 1 pricing — [Cloud Run](https://docs.cloud.google.com/run/docs/locations). Lightsail lists 2 GB at $12 a month, and Mumbai plans get half the transfer allowance — [Lightsail](https://aws.amazon.com/lightsail/pricing/).

### What sharing TypeScript is worth (judgement, not measured)

| Shared thing | TypeScript server | FastAPI |
|---|---|---|
| Request and response types | Direct import | Generated client, one build step |
| Validation rules | Same Zod schema on client and server | Written twice, or server-only |
| Booking states, price and duration maths | One module | Written twice, or fetched from the server |
| DB row types | `supabase gen types` | Same for clients, separate for the server |

- The value is real but bounded. It removes one class of drift across the player app, website and dashboard. It does not remove the need for backward-compatible APIs, since old app versions stay in use.
- For a one-to-three-person team, one language matters more than the types themselves.
- FastAPI's generated client works. Choose it only if the team is Python-first.

### When a separate server is actually needed (inference)
- **Not needed for:** the booking rule (constraint), hold expiry (`pg_cron`), webhooks and order creation (route handlers), or push sending.
- **Needed when any of these appears:**
  - A long-lived connection to cafe software or hardware.
  - A CPU-heavy job, such as bulk invoice PDFs or large settlement files, that blocks other work.
  - A real job queue with retries and fan-out, where `pg_cron`'s 8 concurrent jobs and 10-minute guidance stop fitting.
  - A public partner API that needs its own versioning and deploys.
  - Enough backend people that webhooks should not ship with the website.
- **Why route handlers rather than Edge Functions by default:** Node and monorepo imports work directly, while Edge Functions use Deno and the docs do not cover workspace imports. Their 2-second CPU limit is fine for I/O-bound webhooks, so they remain a fair alternative if you want everything at one vendor.
- **Moving later is cheap** when route handlers stay thin. Keep logic in plain functions and SQL, so a NestJS controller can call the same code.

## Key question 5: Monorepo with Expo and Next.js in Turborepo and pnpm

### Takeaway
The setup is supported and current. Pin one React version in a pnpm catalog, keep React Native in the app only, and do not share UI. Use Next.js for SEO pages, because Expo Router has no ISR equivalent in its docs.

### Cited Findings

**What Expo's monorepo docs say today**
- SDK 52 and later configure Metro automatically through `expo/metro-config`. Remove any manual `watchFolders` and related settings — [monorepos](https://docs.expo.dev/guides/monorepos/).
- pnpm workspaces are supported. SDK 54 and later have first-class support for isolated installs, which pnpm uses by default. If problems appear, set `nodeLinker: hoisted` in `pnpm-workspace.yaml` — [monorepos](https://docs.expo.dev/guides/monorepos/).
- **React alignment:** duplicate React Native versions in one monorepo are unsupported, duplicate React versions in one app cause runtime errors, and duplicate Turbo and Expo modules can break runs or builds. Find them with `pnpm why --depth=10` and force one version if needed — [monorepos](https://docs.expo.dev/guides/monorepos/).
- Native modules must never be duplicated. Autolinking-aligned module resolution is on automatically for monorepo apps from SDK 55 — [monorepos](https://docs.expo.dev/guides/monorepos/).
- EAS commands run from the app directory, and `eas.json` lives in each app — [EAS monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/).

**Versions today**
- Expo SDK 58: React Native 0.88, React 19.3.0, React Native Web 0.21.0, Node 22.13+ — [versions](https://docs.expo.dev/versions/latest/). npm shows expo 58.0.22 and react-native 0.88.1 with a React peer of ^19.3.0 — [expo](https://registry.npmjs.org/expo/latest); [react-native](https://registry.npmjs.org/react-native/latest).
- Next.js 16.4.4 has a React peer range that allows ^19.0.0 — [next](https://registry.npmjs.org/next/latest). The App Router uses its own built-in React canary, but you should still declare `react` and `react-dom` (page updated 2 Oct 2026) — [Next.js install](https://nextjs.org/docs/app/getting-started/installation).
- Turborepo's `with-react-native-web` example pins React 19.3.0 in both apps, with Expo ^58.0.17, React Native 0.88.0 and Next 16.3.8 — [native](https://raw.githubusercontent.com/vercel/turborepo/main/examples/with-react-native-web/apps/native/package.json); [web](https://raw.githubusercontent.com/vercel/turborepo/main/examples/with-react-native-web/apps/web/package.json). It is community-maintained, uses Yarn Classic rather than pnpm, and shares a React Native UI package — [README](https://raw.githubusercontent.com/vercel/turborepo/main/examples/with-react-native-web/README.md).
- Turborepo's framework guides list Next.js, SvelteKit, Vite and Nuxt, with no Expo guide — [frameworks](https://turborepo.dev/docs/guides/frameworks). Its env inference includes both `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*`, and strict mode is the default — [env vars](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables).
- pnpm catalogs define a version once for the workspace — [catalogs](https://pnpm.io/catalogs).

**Expo Router on web versus Next.js**
- Expo says SEO on the web needs static rendering. `web.output: static` lists pages through `generateStaticParams` at build time, and request-time rendering is not available in that mode. `generateMetadata` arrived in SDK 58 — [static rendering](https://docs.expo.dev/router/web/static-rendering/).
- `web.output: server` is stable from SDK 58. It renders per request, needs a deployed server and has a slower time to first byte. It cannot be mixed with static in one project. Caching is left to the server or CDN, and the page does not mention ISR or revalidation — [server rendering](https://docs.expo.dev/router/web/server-rendering/).
- Next.js has ISR, `revalidatePath` and `revalidateTag` — [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration).
- Expo says Next.js is not an official part of its universal workflow. Using it with `react-native-web` needs an adapter, reset CSS and `transpilePackages`. This page looks dated, since it says the `app` directory is unsupported — [using Next.js](https://docs.expo.dev/guides/using-nextjs/).

### Inferences
- **Layout:**
  - `apps/player` (Expo Router).
  - `apps/web` (Next.js: SEO pages, web booking, `/partner` dashboard, `/api` route handlers).
  - `packages/shared` (Zod schemas, generated DB types, booking states, price maths, with no React dependency).
  - `supabase/` (migrations, SQL functions).
- **React:** catalog `react` and `react-dom` at exactly 19.3.0, and bump them only with an Expo SDK upgrade. `packages/shared` having no React dependency removes most of the duplicate-React risk.
- **Use Next.js for 10,000 SEO pages.** With Expo static output, each data change means a rebuild. With Expo server output, you build your own cache invalidation. The Next.js route has this built in.
- **Do not share UI.** SEO pages want little JavaScript and real HTML. The dashboard wants dense tables. The app wants native controls. Sharing through `react-native-web` adds setup to all three for little gain. Share colour and spacing tokens at most. Revisit only if web booking and app booking turn out to be nearly identical screens.

## Key question 6: India specifics

### Takeaway
Use a domestic SMS vendor behind the Send SMS hook, and file DLT in week one. WhatsApp OTP is a fallback, not a replacement. The biggest surprise is payments: split access can be refused to a new low-turnover entity, and that decision comes before any code.

### Cited Findings

**OTP cost per message**

| Route | Price | Notes |
|---|---|---|
| MSG91 SMS, India | ₹0.25 at 5,000, ₹0.17 at 60,000, ₹0.16 at 9.6 lakh, as low as ₹0.13 by negotiation, plus 18% GST | [MSG91](https://msg91.com/in/pricing/sms) (vendor). DLT scrubbing charges are not mentioned |
| Firebase phone auth, India | $0.07, about ₹6.30; first 10 a day free | [Identity Platform](https://cloud.google.com/identity-platform/pricing) |
| Twilio, India | $0.0832 per segment; carrier fees may apply; stated current as of October 2026 | [Twilio](https://www.twilio.com/en-us/sms/pricing/in) (vendor) |
| WhatsApp authentication, India | ₹0.145 per delivered message, effective 1 Oct 2026; ₹0.127 to ₹0.129 on another reseller, undated | [AiSensy](https://aisensy.com/pricing); [Interakt](https://www.interakt.shop/pricing/) (vendor). Reseller plan fees may apply |

**DLT (Vi's portal FAQ; other operators' fees not read)**
- Principal Entity registration is ₹5,000, non-refundable, valid one year with a 30-day grace period. Approval is stated as 72 hours from fee receipt. It needs a business PAN, details of the authorised person and business documents — [Vi DLT FAQ](https://www.vilpower.in/faq/).
- An OTP for app login is listed under Service Implicit. The Transactional category shown with it covers bank OTPs, though an older definition on the same page is broader. Register the template as Service Implicit unless your DLT operator says otherwise — [Vi DLT FAQ](https://www.vilpower.in/faq/).
- Content templates are verified within 60 minutes as stated. After registration only the variable part can change. A header unused for over 90 days can be returned to the pool — [Vi DLT FAQ](https://www.vilpower.in/faq/).
- URLs, APK links, OTT links and callback numbers in SMS must be whitelisted before sending — [Vi DLT FAQ](https://www.vilpower.in/faq/).
- Twilio's domestic routes need DLT-registered sender IDs and take about 10 business days. International routes skip DLT, but the sender ID may be replaced by a random number — [Twilio guidelines](https://www.twilio.com/en-us/guidelines/in/sms).

**WhatsApp OTP**
- Authentication templates offer a copy-code button, one-tap autofill on Android and zero-tap on Android. iOS 26 and later can autofill from the notification. Code expiry can be 1 to 90 minutes — [Meta templates](https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates).
- Billing is per message, and Indian accounts must move to INR by 31 Dec 2026. The 1 Oct 2026 rate update did not change India. Meta's numeric rate sits in a downloadable rate card I did not open — [Meta pricing](https://developers.facebook.com/docs/whatsapp/pricing).

**Marketplace splits**
- **Razorpay Route eligibility:** domestic turnover over ₹40 lakh, or export over ₹5 lakh, in FY25 or FY26, proved by GST-3B or FIRC. The linked account must directly serve your customers. Razorpay says no business category is exempt — [Route](https://razorpay.com/docs/build/llm-docs/payments/route.md); [Route FAQs](https://razorpay.com/docs/build/llm-docs/payments/route/faqs.md).
- **New businesses:** one in its first year without GST returns can submit a self-declaration of turnover in place of GST documents, recorded for audit. The FAQ does not say that a figure below the threshold passes. Review takes 5 to 7 business days. It does not say whether the figure is platform turnover or GMV, and sets no deadline for new merchants — [Route FAQs](https://razorpay.com/docs/build/llm-docs/payments/route/faqs.md).
- **If refused:** the FAQ suggests settling to your own account and paying vendors manually — [Route FAQs](https://razorpay.com/docs/build/llm-docs/payments/route/faqs.md). That is the pattern `regulation.md` section 7 warns against, so ask counsel before relying on it.
- **Cashfree Easy Split:** its docs state no turnover test — [overview](https://www.cashfree.com/docs/payments/split/overview.md); [FAQ](https://www.cashfree.com/docs/help/easy-split/faqs/faqs.md). The RBI rule in `regulation.md` section 7 applies to aggregators generally, so assume the same question arises. Cashfree needs India registration — [onboarding](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs.md). Production Easy Split goes through an account manager — [overview](https://www.cashfree.com/docs/payments/split/overview.md).

| | Razorpay Route | Cashfree Easy Split |
|---|---|---|
| Fee on top of gateway fee | 0.25% per transfer — [pricing](https://razorpay.com/docs/build/llm-docs/payments/route/pricing.md) | 0.2% per split — [FAQ](https://www.cashfree.com/docs/payments/split/faq) |
| Hold on the seller's share | Can be indefinite — see `regulation.md` section 7 | Up to 45 days, then settles to you — [FAQ](https://www.cashfree.com/docs/help/easy-split/faqs/faqs.md) |
| Sellers per transaction | Not stated in pages read | 5 — [FAQ](https://www.cashfree.com/docs/payments/split/faq) |
| Payment window control | Checkout `timeout` in seconds, set on the client — [integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) | `order_expiry_time` set on the server; no minimum or maximum given — [create order](https://www.cashfree.com/docs/api-reference/payments/latest/orders/create) |
| Refund after split | Comes from your primary account, with an option to reverse transfers at the same time — [refund](https://razorpay.com/docs/build/llm-docs/payments/route/refund.md) | Deducted from your next settlement, adjustable against vendors who received the settlement — [FAQ](https://www.cashfree.com/docs/help/easy-split/faqs/faqs.md) |

**Capture and late payments (Razorpay)**
- Auto-capture by default, or auto or manual capture with a window from 12 minutes to 3 days — [capture settings](https://razorpay.com/docs/payments/payments/capture-settings/).
- Razorpay can poll a bank for up to 3 days, so a payment can turn authorized long after checkout closed. Uncaptured payments are auto-refunded at normal speed, 5 to 7 working days — [capture settings](https://razorpay.com/docs/payments/payments/capture-settings/).

**React Native SDKs**
- SDK 55 and later run only on the New Architecture, with interop for many older libraries. Libraries that ship native code are the most likely to need updates — [New Architecture](https://docs.expo.dev/guides/new-architecture/).
- **Razorpay:** `react-native-razorpay` 3.0.0, published 21 Apr 2026, added New Architecture support and has a codegen config — [npm](https://registry.npmjs.org/react-native-razorpay/latest); [releases](https://github.com/razorpay/react-native-razorpay/releases). The README asks for `expo prebuild` — [repo](https://github.com/razorpay/react-native-razorpay). Its open issues include iOS crash reports and an Expo 54 support request with 22 comments. None is titled for SDK 55 to 58, and I read titles only — [issues](https://github.com/razorpay/react-native-razorpay/issues).
- **Cashfree:** `react-native-cashfree-pg-sdk` `latest` is 2.5.1, published 19 Oct 2026, with no codegen config. A build with codegen is 3.0.0 under the `turbo` tag, published 13 Oct 2026 — [npm](https://registry.npmjs.org/react-native-cashfree-pg-sdk). Its docs claim Expo compatibility using `expo-dev-client` and a mandatory prebuild, and offer a UPI Intent flow (vendor) — [Cashfree RN](https://www.cashfree.com/docs/payments/online/mobile/react-native).
- Neither works in Expo Go, so the team needs development builds from the first payment screen (inference from the prebuild requirements).

### Inferences
- **Payment flow:**
  1. Create the hold in SQL. Then create the gateway order on the server.
  2. The webhook verifies the raw body, inserts the event id into a unique column, then confirms the booking if it is still held.
  3. A lapsed hold whose payment arrives late gets one attempt to re-acquire the slot. If the slot is gone, refund.
  4. Prefer manual capture on Razorpay, so a late payment for a lost slot is never captured.
  5. Run a job that polls the gateway for holds with no webhook yet, especially on Cashfree, whose default retry window is short.
- **Razorpay's 12-minute minimum window** suggests a hold of about 10 minutes, with the late-payment branch above covering the gap.
- **Pick the gateway by who says yes first.** Apply to both in week one. Technical differences are small and the same design fits both. Cashfree has a server-side expiry and an explicit Expo path. Razorpay has the unbounded hold and New Architecture on its `latest` tag.
- **If neither approves a new entity,** do not fall back silently to pooling. A safer starting shape to test with counsel: collect only the platform fee online and take the balance at the venue, or have each cafe use its own gateway account. Model `amount_online` and `amount_at_venue` from the start so this stays open.
- **SMS is the primary channel, with WhatsApp as a hook fallback.** Per-message cost is close, but WhatsApp adds a business account and a reseller or direct Meta setup.

### Gaps
- Razorpay's Route with manual capture and transfers on an order was not tested.
- Cashfree's `order_expiry_time` minimum was not stated. Test it in sandbox.
- Other DLT operators' fees and GST on the fee were not read.

## Key question 7: Deep linking after Firebase Dynamic Links

### Takeaway
Use one web URL per venue, served by Next.js and claimed by the app through Universal Links and App Links. Use Play Install Referrer on Android and a phone-keyed resume on iOS. A paid attribution vendor is not needed at the start, and with minors on the platform it is better to wait.

### Cited Findings
- Firebase Dynamic Links shut down on 25 Aug 2025, and old links return 404. For installed apps Google points to App Links and Universal Links. For deferred links it names Adjust, Airbridge, AppsFlyer, Bitly, Branch, Kochava and Singular, and says they have not been vetted — [FAQ](https://firebase.google.com/support/dynamic-links-faq).
- With either link type, a user without the app lands on your website. iOS can also show a Smart Banner. Expo Go's incoming link support is limited, so test on development builds — [Expo linking](https://docs.expo.dev/linking/overview/).
- **iOS setup:** the association file goes at `.well-known/apple-app-site-association` over HTTPS, under 128 KB, with `ios.associatedDomains` in app config. iOS fetches the file on install or update and rarely after, so path changes effectively ship with an App Store update — [iOS links](https://docs.expo.dev/linking/ios-universal-links/).
- **Android setup:** `.well-known/assetlinks.json` over HTTPS as `application/json`, with `autoVerify` intent filters. With Play App Signing, the fingerprint comes from Play Console — [Android links](https://docs.expo.dev/linking/android-app-links/). Android 15 adds Dynamic App Links, which change matching without a release — [Android](https://developer.android.com/training/app-links).
- **Play Install Referrer** returns the referrer URL and click and install timestamps on devices with Play Store 8.3.73 or later — [Android](https://developer.android.com/google/play/installreferrer). Expo exposes it as `Application.getInstallReferrerAsync()`, Android only — [expo-application](https://docs.expo.dev/versions/latest/sdk/application/).
- **Vendor prices:** Branch lists Basics, Essentials and Enterprise with no prices and no free tier, and offers a trial on Basics (vendor) — [Branch](https://www.branch.io/pricing/). AppsFlyer's Zero plan gives 12K free conversions in the first year and is described as unsuitable for apps with paid activities. Growth is then $0.07 per conversion (vendor) — [AppsFlyer](https://www.appsflyer.com/pricing/?view=full).

### Inferences
- **URL plan:** keep one common prefix, such as `/cafes/{city}/{venue}`, so one matching rule covers 10,000 venues. Use the same path in Expo Router. Serve the two verification files from the Next.js `public/.well-known` folder, on a host with no redirect.
- **Deferred links on Android:** send store links with `referrer=venue_id` and read it on first launch.
- **Deferred links on iOS:** I read no Apple page on this, since the page did not render. Use the phone number instead. A hold or invite started on the web is tied to the verified phone, and the app shows it after OTP with the same number. This needs no SDK or fingerprinting.
- **Why no paid vendor yet:** there is no paid acquisition to attribute yet. Section 9(3) of the DPDP Act bars tracking and targeted ads directed at children, and Play's Families rules limit SDKs for children and unknown-age users — see `regulation.md` sections 4 and 9. Add one only when paid campaigns across two or more networks start and are aimed at adults.

### Gaps
- Apple's own page was not readable in this session. iOS details come from Expo's guide and from `marketplace_playbook.md`.

## Key question 8: Hosting the Next.js site for about 10,000 pages

### Takeaway
Vercel Pro in `bom1` costs about $20 to $40 a month at launch and needs no cache infrastructure. It is cheap to leave later. Hobby is not allowed, because this is commercial use.

### What ISR needs at 10,000 pages (read 3 Nov 2026; Next.js pages updated 1 to 15 Oct 2026)
- **Do not prerender everything at build.** Return a top subset from `generateStaticParams` or an empty array, and other paths render on first visit — [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params).
- **Cache Components differs.** `create-next-app`'s recommended defaults enable it — [install](https://nextjs.org/docs/app/getting-started/installation). There, an empty array is a build error, so return at least one param — [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params). Unlisted paths render on demand and are stored — [ISR with Cache Components](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components).
- **Revalidate rarely and on demand.** The docs advise a high revalidate time, such as an hour, plus on-demand calls. `revalidatePath` only invalidates, and regeneration happens on the next request. ISR needs the Node.js runtime and does not work with static export — [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration).
- **A `no-store` fetch makes a route dynamic,** which silently loses ISR — [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration).
- **Self-hosting:** one `next start` instance with a persistent disk works automatically. Several instances need a shared cache handler and tag coordination — [self-hosting](https://nextjs.org/docs/app/guides/self-hosting).
- Keep live availability out of the cached HTML and load it on the client. Otherwise every slot change invalidates a page (inference).

### Price inputs
- **Vercel Pro:** $20 a month including one deploying seat and $20 usage credit. Extra deploying seats are $20 each — [Pro plan, updated 15 Sep 2026](https://vercel.com/docs/plans/pro-plan).
- **Vercel Flat Rate CDN**, on by default for new Pro teams — [changelog, 8 Sep 2026](https://vercel.com/changelog/flat-rate-cdn-is-now-ga-for-pro-teams). Exceeding a tier for a billing cycle moves you up at the next cycle, and a one-day spike does not — [tiers, updated 14 Sep 2026](https://vercel.com/docs/pricing/flat-rate-cdn).

  | Tier | CDN requests | Data transfer |
  |---|---|---|
  | Included with Pro | 1M | 1 TB |
  | $20/mo | 10M | 50 TB |
  | $100/mo | 50M | 50 TB |
  | $300/mo | 150M | 50 TB |

- **Vercel in `bom1`:** ISR writes $4.40 and reads $0.44 per million 8 KB units. Active CPU $0.14 an hour, memory $0.0116 per GB-hour, image transformations $0.0527 per 1,000 — [bom1, updated 14 Sep 2026](https://vercel.com/docs/pricing/regional-pricing/bom1).
- **Vercel ISR behaviour:** CDN cache reads are free, unchanged content costs no write units, and entries unread for 31 days drop out — [ISR pricing, updated 11 Aug 2026](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing).
- **Hobby** is non-commercial only, and taking payment or advertising a service counts as commercial — [fair use, updated 14 Sep 2026](https://vercel.com/docs/limits/fair-use-guidelines).
- **Cloudflare Workers paid:** $5 a month with 10M requests and 30M CPU-ms included — [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/). R2: 10 GB, 1M Class A and 10M Class B free, then $0.015 per GB, $4.50 and $0.36 per million, with no egress fee — [R2 pricing](https://developers.cloudflare.com/r2/pricing/).
- **OpenNext on Cloudflare** is community-maintained and supports all Next.js 16 releases and ISR. Worker limit is 10 MiB gzipped on paid, and Node Middleware is not yet supported — [OpenNext](https://opennext.js.org/cloudflare). ISR uses R2, a Durable Object queue and a D1 tag cache for a small site — [caching](https://opennext.js.org/cloudflare/caching).
- **Lightsail:** 2 GB at $12 a month, and Mumbai plans have half the transfer allowance — [Lightsail](https://aws.amazon.com/lightsail/pricing/).

### Rough monthly cost (my estimate)
Assumptions: 40 KB per cache entry, every page regenerating daily as the worst case (300,000 a month), 10 CDN requests per page view, 200 ms CPU and 0.5 seconds at 2 GB per regeneration. Image optimisation and tax are excluded.

| Option | 200,000 views/mo | 2,000,000 views/mo | Trade-off |
|---|---|---|---|
| Vercel Pro `bom1` | About $40 ($20 plan, $20 CDN tier; about $12 of ISR and compute falls inside the credit) | About $120 to $130 | No cache infrastructure. Costs rise with requests |
| Cloudflare with OpenNext | About $5 to $10 | About $10 to $15 | More moving parts and a community adapter |
| One Lightsail server | About $12 | About $12 to $24 | You run patching, proxy and failover. Single instance only unless you add a shared cache |

### Inferences
- Start on Vercel. Set the function region to `bom1`, or the default `iad1` puts regeneration and webhooks far from the database and sets the ISR cache region.
- Avoid `new Date()` and random values in cached output, since they create write units with no real change.
- Avoid Vercel-only storage or queue products at the start, so OpenNext or plain `next start` stays a straight exit.

## Key question 9: Which decisions are expensive to reverse?

1. **Booking source of truth.** Postgres ranges versus Firestore slot documents touches data, every writer and every client. Choose Postgres now, and make it the only place bookings live.
2. **Hostnames and API shape inside shipped apps.** Old binaries keep calling what they shipped with. Use your own subdomain and an `api` schema or route handlers, never direct table access.
3. **Who holds the money.** Merchant structure, Route or Easy Split, and each cafe's KYC with one provider. Switching means re-onboarding every venue. Keep a provider-neutral ledger: integer paise, provider name, provider ids, split and refund rows that are never edited.
4. **Data region.** Firestore's location is fixed, and moving Supabase means a project migration. Choose Mumbai at creation.
5. **Identity and the minors model.** Use your own user UUID, not the phone number, as the key. Decide adult-only accounts with parent-led under-18 bookings before launch, and store age band, guardian link and consent version from day one (see `regulation.md` section 4, plan to 13 May 2027). Data already collected through tracking SDKs cannot be un-collected.
6. **Public URLs and app identity.** SEO paths, the link domain, the iOS bundle ID, the Android package name and signing keys. Path changes on iOS effectively wait for an App Store update, and Google has indexed the old URLs.
7. **Server language once logic accumulates.** TypeScript keeps the move to NestJS cheap. A Python main server later means rewriting shared logic.

**Cheap to change, so do not agonise:** Turborepo itself, Next.js host, SMS vendor (one hook), Expo Push (`getDevicePushTokenAsync` gives native tokens; push via Expo is free, limited to 600 a second — [push FAQ](https://docs.expo.dev/push-notifications/faq/)), adding NestJS later, sharing UI, adding an attribution vendor.

## What changes as it grows

| Change | Trigger |
|---|---|
| Go from Free to Pro | Before any real user: Free pauses after a week idle and has no backups |
| Spend cap off | Before launch, or peak connections near 500 |
| Own audit table for bookings and payments | Day one: Pro keeps logs 7 days, while `regulation.md` section 4 cites one-year log retention |
| Micro to Small or Medium | Sustained CPU or memory pressure. Plan a short window, since resizing causes downtime |
| PITR, about $100 more plus Small compute | When losing up to 24 hours of bookings becomes unacceptable; I would do it once payouts are live in a city |
| Add `apps/api` in NestJS | Any trigger in Key question 4. Host in Mumbai on Cloud Run or AWS, not Railway, Render or Fly |
| Add BullMQ and Redis | When `pg_cron` guidance stops fitting |
| Expo Starter, $19 plus usage | Over 15 builds per platform a month or over 1K update users on Free — [Expo pricing](https://expo.dev/pricing) |
| Vercel to Cloudflare or self-hosting | CDN spend passes about $100 to $300 a month, or the top tier's 150M requests |
| Attribution vendor | Paid campaigns on two or more networks aimed at adults |
| Leave Supabase for plain Postgres | Repeated blocks in India, a compliance demand, or an outgrown platform limit. Move the database first, then Auth and Realtime |
| Python service | A real pricing, recommendation or analytics workload, beside the core and not inside it |

## Other options considered

- **Plain Postgres in Mumbai with your own server from day one.** Same booking safety and the cleanest exit, but you then build OTP, realtime and row-level access yourself. RDS prices were not checked. It is the destination if you leave Supabase, not the start.
- **Supabase Edge Functions for webhooks.** Viable within the limits above. Not the default only because of Deno and undocumented workspace sharing.

## Gaps across this file

- Apple's Universal Links page, Jio's portal and Meta's numeric India rate were not readable in this session.
- Mumbai-specific Firestore rates, RDS prices, Cloud Functions regions and Cloudflare static-asset billing were not read.
- Cross-border rules under DPDP were not reviewed here. `regulation.md` has the wider picture.
- Android and iOS share of the audience was not checked.
- Text addressed to AI agents appeared on Expo pages (asking agents to submit feedback through a command and to fetch linked pages), Vercel pages (asking agents to follow links and use a feedback path) and one Next.js page (a prompt to paste into a coding agent). I ignored all of it and submitted nothing.
