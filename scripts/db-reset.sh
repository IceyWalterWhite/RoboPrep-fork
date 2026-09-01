#!/usr/bin/env bash
#
# Rebuild the local Supabase database from migrations and re-apply seed.sql.
#
#   ./scripts/db-reset.sh
#
# Requires the Supabase CLI (https://supabase.com/docs/guides/cli) and a running
# Docker daemon.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Resetting local database"
supabase db reset
