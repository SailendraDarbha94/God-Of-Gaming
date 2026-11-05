#!/usr/bin/env bash
# Docker-less local Postgres for schema work (docs/spec/03-database.md, No-Docker local path).
#
# Runs Homebrew PostgreSQL 17 from .local/postgres on port 54329 with a database named gog_local,
# applies supabase/local/shim.sql, the migrations and the seed, runs the pgTAP tests when pgTAP is
# installed, and regenerates packages/data/src/database.types.ts. The real stack (supabase start,
# supabase test db, supabase gen types --local) is what CI runs; this is for machines without Docker.
#
#   scripts/db/local.sh up      initdb into .local/postgres if needed, start on port 54329
#   scripts/db/local.sh reset   drop and recreate gog_local, apply shim, migrations in order, seed
#   scripts/db/local.sh test    run supabase/tests/*.sql with pg_prove (needs the pgtap extension)
#   scripts/db/local.sh types   regenerate packages/data/src/database.types.ts (Supabase CLI with Docker,
#                               otherwise the same generator from @supabase/postgres-meta)
#   scripts/db/local.sh down    stop the server
set -euo pipefail

# macOS: the postmaster refuses to start ("became multithreaded during startup") when the
# process locale is unset or invalid; the cluster itself is created with --locale=C below.
export LC_ALL=C

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_DIR="$ROOT_DIR/.local"
DATA_DIR="$LOCAL_DIR/postgres"
LOG_FILE="$LOCAL_DIR/postgres.log"
PORT=54329
DB_NAME=gog_local
DB_URL="postgresql://localhost:$PORT/$DB_NAME"
SUPABASE_DIR="$ROOT_DIR/supabase"
TYPES_FILE="$ROOT_DIR/packages/data/src/database.types.ts"

# Prefer Homebrew's postgresql@17 binaries even when another Postgres is first on PATH.
if command -v brew >/dev/null 2>&1; then
  if pg_prefix="$(brew --prefix postgresql@17 2>/dev/null)" && [ -x "$pg_prefix/bin/pg_ctl" ]; then
    export PATH="$pg_prefix/bin:$PATH"
  fi
fi

usage() {
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'
}

die() {
  echo "local.sh: $*" >&2
  exit 1
}

require_binaries() {
  for bin in initdb pg_ctl psql createdb dropdb; do
    command -v "$bin" >/dev/null 2>&1 || die "$bin not found; install Homebrew PostgreSQL 17 (brew install postgresql@17)"
  done
}

is_running() {
  [ -f "$DATA_DIR/PG_VERSION" ] && pg_ctl -D "$DATA_DIR" status >/dev/null 2>&1
}

require_running() {
  is_running || die "Postgres is not running on port $PORT; run 'scripts/db/local.sh up' first"
}

# psql with the flags the migrations rely on: stop on the first error, no ~/.psqlrc, quiet.
run_psql() {
  psql -X -q -v ON_ERROR_STOP=1 -h localhost -p "$PORT" "$@"
}

db_exists() {
  [ "$(psql -X -tA -h localhost -p "$PORT" -d postgres -c "select 1 from pg_database where datname = '$DB_NAME'")" = "1" ]
}

require_db() {
  db_exists || die "database $DB_NAME does not exist; run 'scripts/db/local.sh reset' first"
}

cmd_up() {
  require_binaries
  mkdir -p "$LOCAL_DIR"
  if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
    echo "Initialising $DATA_DIR"
    # trust auth: a throwaway development cluster that only listens on localhost.
    initdb -D "$DATA_DIR" --auth=trust --encoding=UTF8 --locale=C >/dev/null
  fi
  if is_running; then
    echo "Postgres already running on port $PORT"
  else
    pg_ctl -D "$DATA_DIR" -l "$LOG_FILE" -w \
      -o "-p $PORT -c listen_addresses=localhost -c unix_socket_directories=$LOCAL_DIR" \
      start >/dev/null
    echo "Postgres started on port $PORT (log: $LOG_FILE)"
  fi
}

cmd_down() {
  if is_running; then
    pg_ctl -D "$DATA_DIR" -m fast -w stop >/dev/null
    echo "Postgres stopped"
  else
    echo "Postgres is not running"
  fi
}

cmd_reset() {
  require_binaries
  require_running
  echo "Recreating $DB_NAME"
  dropdb --if-exists -h localhost -p "$PORT" "$DB_NAME"
  createdb -h localhost -p "$PORT" "$DB_NAME"

  echo "Applying supabase/local/shim.sql"
  run_psql -d "$DB_NAME" -1 -f "$SUPABASE_DIR/local/shim.sql"

  for migration in "$SUPABASE_DIR"/migrations/*.sql; do
    echo "Applying ${migration#"$ROOT_DIR/"}"
    run_psql -d "$DB_NAME" -1 -f "$migration"
  done

  echo "Applying supabase/seed.sql"
  run_psql -d "$DB_NAME" -1 -f "$SUPABASE_DIR/seed.sql"
  echo "Done: $DB_URL"
}

pgtap_available() {
  [ "$(psql -X -tA -h localhost -p "$PORT" -d "$DB_NAME" -c "select 1 from pg_available_extensions where name = 'pgtap'")" = "1" ]
}

cmd_test() {
  require_binaries
  require_running
  require_db
  if ! pgtap_available; then
    cat <<EOF
pgTAP is not installed for this PostgreSQL, so the SQL tests were skipped.
Homebrew has no pgtap formula: build the extension from source against postgresql@17
(https://pgtap.org; make PG_CONFIG="\$(brew --prefix postgresql@17)/bin/pg_config" && make install)
and 'cpanm TAP::Parser::SourceHandler::pgTAP' for pg_prove, then run this again; or run the
tests with Docker (pnpm db:test).
EOF
    exit 0
  fi

  # supabase test db does the same before running pg_prove.
  run_psql -d "$DB_NAME" -c "create extension if not exists pgtap with schema extensions"

  local tests=("$SUPABASE_DIR"/tests/*.sql)
  if command -v pg_prove >/dev/null 2>&1; then
    pg_prove -h localhost -p "$PORT" -d "$DB_NAME" "${tests[@]}"
    return
  fi

  # No pg_prove: run each file with psql and fail on any `not ok` line.
  echo "pg_prove not found; running the tests with psql"
  local failed=0 output
  for test in "${tests[@]}"; do
    echo "# ${test#"$ROOT_DIR/"}"
    if ! output="$(psql -X -q -tA -v ON_ERROR_STOP=1 -h localhost -p "$PORT" -d "$DB_NAME" -f "$test" 2>&1)"; then
      failed=1
    fi
    printf '%s\n' "$output"
    if printf '%s\n' "$output" | grep -q -E '^(not ok|# Looks like you failed)'; then
      failed=1
    fi
  done
  [ "$failed" -eq 0 ] || die "SQL tests failed"
  echo "All SQL tests passed"
}

# `supabase gen types` (CLI 2.116) runs postgres-meta in a container even for --db-url, so without
# Docker it fails with LegacyContainerRuntimeNotFoundError. The fallback runs the very same
# generator the CLI pins (supabase/postgres-meta:v0.98.0, published to npm as
# @supabase/postgres-meta 0.98.0) with the same environment the CLI gives the container. It formats
# its output with whichever Prettier it resolves (the repository's here, the image's own in the
# container), so cmd_types reformats with the repository's, as `pnpm db:types` does, and the file
# comes out the same on every path.
PGMETA_SERVER="$ROOT_DIR/node_modules/@supabase/postgres-meta/dist/server/server.js"

generate_types() {
  local out="$1"
  if command -v docker >/dev/null 2>&1 && command -v supabase >/dev/null 2>&1; then
    supabase gen types typescript --db-url "$DB_URL" --schema public >"$out"
    return
  fi
  if [ -f "$PGMETA_SERVER" ]; then
    echo "Docker not found; generating with @supabase/postgres-meta (the generator the CLI runs in its container)" >&2
    PG_META_DB_URL="$DB_URL" \
      PG_META_GENERATE_TYPES=typescript \
      PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS=public \
      PG_META_GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS=true \
      node "$PGMETA_SERVER" >"$out"
    return
  fi
  die "type generation needs Docker (for 'supabase gen types') or @supabase/postgres-meta 0.98.0 installed at the repository root (pnpm add -w -D @supabase/postgres-meta@0.98.0)"
}

cmd_types() {
  require_running
  require_db
  local tmp
  tmp="$(mktemp)"
  # Write to a temporary file first so a failed generation never truncates the committed file.
  if generate_types "$tmp"; then
    mkdir -p "$(dirname "$TYPES_FILE")"
    mv "$tmp" "$TYPES_FILE"
    "$ROOT_DIR/node_modules/.bin/prettier" --log-level warn --write "$TYPES_FILE"
    echo "Wrote ${TYPES_FILE#"$ROOT_DIR/"}"
  else
    rm -f "$tmp"
    die "type generation failed"
  fi
}

case "${1:-}" in
  up) cmd_up ;;
  down) cmd_down ;;
  reset) cmd_reset ;;
  test) cmd_test ;;
  types) cmd_types ;;
  -h | --help | help | "") usage ;;
  *) die "unknown command '$1' (expected up, down, reset, test or types)" ;;
esac
