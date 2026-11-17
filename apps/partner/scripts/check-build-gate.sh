#!/usr/bin/env bash
# The build-time gate of apps/partner/next.config.ts, case by case (docs/spec/09-partner-app.md, Data
# access, sign-in and session). Each case loads the real config through `next typegen`, which loads it
# in the build phase without bundling anything: a refused case must fail with the gate's own message,
# and an accepted case must load. CI runs this in the `check` job; locally:
#
#   pnpm --filter @gog/partner check:gate
#
# Every case sets all five variables the gate reads, an unset one as an empty string, which the gate
# treats as unset: Next never overrides a variable that is already in the environment, even an empty
# one, so a developer's apps/partner/.env.local cannot leak into a case.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# A JWT with the given claims and a signature nobody checks, built at run time: a literal `eyJ…` string
# in the tree would trip CI's secret scan for nothing.
jwt() {
  node -e '
    const part = (value) => Buffer.from(value).toString("base64url");
    process.stdout.write(`${part(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${part(process.argv[1])}.unchecked`);
  ' "$1"
}

LOCAL_URL='http://127.0.0.1:54321'
HOSTED_URL='https://projectref.supabase.co'
PUBLISHABLE='sb_publishable_probe'
ANON_JWT="$(jwt '{"iss":"supabase","role":"anon"}')"
SERVICE_ROLE_JWT="$(jwt '{"iss":"supabase","role":"service_role"}')"
USER_JWT="$(jwt '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111"}')"
ROLELESS_JWT="$(jwt '{"sub":"someone"}')"

failures=0

# load_config SOURCE URL KEY VERCEL_ENV [WEBSITE_URL]: loads the config with exactly these values
# (empty = unset).
load_config() {
  NEXT_PUBLIC_GOG_DATA_SOURCE="$1" \
    NEXT_PUBLIC_SUPABASE_URL="$2" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="$3" \
    VERCEL_ENV="$4" \
    NEXT_PUBLIC_WEBSITE_URL="${5:-}" \
    pnpm exec next typegen 2>&1
}

# refuses NAME EXPECTED SOURCE URL KEY VERCEL_ENV [WEBSITE_URL]
refuses() {
  local name="$1" expected="$2" output
  shift 2
  if output="$(load_config "$@")"; then
    echo "FAIL  $name: the config loaded"
    failures=$((failures + 1))
  elif grep -qF -- "$expected" <<<"$output"; then
    echo "ok    $name"
  else
    echo "FAIL  $name: refused for another reason than \"$expected\":"
    echo "$output"
    failures=$((failures + 1))
  fi
}

# accepts NAME SOURCE URL KEY VERCEL_ENV [WEBSITE_URL]
accepts() {
  local name="$1" output
  shift
  if output="$(load_config "$@")"; then
    echo "ok    $name"
  else
    echo "FAIL  $name: refused:"
    echo "$output"
    failures=$((failures + 1))
  fi
}

echo "Refused:"
refuses 'an sb_secret_ key with a Supabase source' 'NEXT_PUBLIC_SUPABASE_ANON_KEY holds an sb_secret_ key' \
  supabase "$LOCAL_URL" sb_secret_probe ''
refuses 'an sb_secret_ key on fixtures (whatever the source)' 'NEXT_PUBLIC_SUPABASE_ANON_KEY holds an sb_secret_ key' \
  fixtures '' sb_secret_probe ''
refuses 'a service_role JWT' 'holds a JWT with role "service_role"' \
  supabase "$LOCAL_URL" "$SERVICE_ROLE_JWT" ''
refuses "a user's access token" 'holds a JWT with role "authenticated"' \
  supabase "$LOCAL_URL" "$USER_JWT" ''
refuses 'an eyJ string that is not a JWT' 'holds a JWT whose payload cannot be read' \
  supabase "$LOCAL_URL" 'eyJ.garbage.unchecked' ''
refuses 'a JWT without a role claim' 'holds a JWT whose payload cannot be read' \
  supabase "$LOCAL_URL" "$ROLELESS_JWT" ''
refuses 'a quoted sb_secret_ key' 'NEXT_PUBLIC_SUPABASE_ANON_KEY holds an sb_secret_ key' \
  supabase "$HOSTED_URL" '"sb_secret_probe"' production
refuses 'an sb_secret_ key after an invisible character' 'NEXT_PUBLIC_SUPABASE_ANON_KEY holds an sb_secret_ key' \
  supabase "$HOSTED_URL" $'\u200bsb_secret_probe' production
refuses 'a quoted service_role JWT' 'holds a JWT with role "service_role"' \
  supabase "$HOSTED_URL" "'$SERVICE_ROLE_JWT'" production
refuses 'a service_role JWT after "Bearer "' 'holds a JWT with role "service_role"' \
  supabase "$HOSTED_URL" "Bearer $SERVICE_ROLE_JWT" production
refuses 'an anon JWT, then a service_role JWT' 'holds a JWT with role "service_role"' \
  supabase "$HOSTED_URL" "$ANON_JWT $SERVICE_ROLE_JWT" production
refuses 'fixtures on the production deployment' 'NEXT_PUBLIC_GOG_DATA_SOURCE=fixtures is refused on the production deployment' \
  fixtures '' '' production
refuses 'a Supabase source on a Vercel preview without URL or key' 'are required on Vercel (VERCEL_ENV=preview)' \
  '' '' '' preview
refuses 'a Supabase source on production without the key' 'are required on Vercel (VERCEL_ENV=production)' \
  supabase "$HOSTED_URL" '' production
refuses 'a Supabase source on production without the URL' 'are required on Vercel (VERCEL_ENV=production)' \
  supabase '' "$PUBLISHABLE" production
refuses 'an unknown data source' 'NEXT_PUBLIC_GOG_DATA_SOURCE must be "supabase" or "fixtures"' \
  Fixtures '' '' ''
refuses 'a Supabase URL that is not a URL' 'NEXT_PUBLIC_SUPABASE_URL is not an http or https URL' \
  supabase 'not a url' "$PUBLISHABLE" ''
refuses 'an ftp Supabase URL' 'NEXT_PUBLIC_SUPABASE_URL is not an http or https URL' \
  supabase 'ftp://projectref.supabase.co' "$PUBLISHABLE" production
refuses 'a website URL without a scheme' 'NEXT_PUBLIC_WEBSITE_URL is not an http or https URL' \
  supabase "$HOSTED_URL" "$PUBLISHABLE" production 'www.example.com'
refuses 'a website URL without its //' 'NEXT_PUBLIC_WEBSITE_URL is not an http or https URL' \
  fixtures '' '' '' 'https:example.com'
refuses 'a website URL that does not parse' 'NEXT_PUBLIC_WEBSITE_URL is not an http or https URL' \
  fixtures '' '' '' 'https://exa mple.com'

echo "Accepted:"
accepts 'nothing set (a clean clone: lint, typecheck and test)' '' '' '' ''
accepts 'fixtures with no backend (CI build, smoke test)' fixtures '' '' ''
accepts 'fixtures on a Vercel preview' fixtures '' '' preview
accepts 'production with a publishable key' supabase "$HOSTED_URL" "$PUBLISHABLE" production
accepts 'production with an anon JWT' supabase "$HOSTED_URL" "$ANON_JWT" production
accepts 'production with the website URL' supabase "$HOSTED_URL" "$PUBLISHABLE" production 'https://example.com'
accepts 'a local http website URL' fixtures '' '' '' 'http://localhost:3000'

if [ "$failures" -ne 0 ]; then
  echo "$failures case(s) of the partner build gate failed"
  exit 1
fi
echo "Every case of the partner build gate behaves as specified."
