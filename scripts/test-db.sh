#!/usr/bin/env bash
# Starts a throwaway local PostgreSQL cluster for integration/E2E tests when
# Docker is not available. Usage:
#   scripts/test-db.sh start [DATA_DIR] [PORT]   -> prints TEST_DATABASE_URL
#   scripts/test-db.sh stop  [DATA_DIR]
# In CI the PostgreSQL service container is used instead (see .github/workflows/ci.yml).
set -euo pipefail

CMD="${1:-start}"
DATA_DIR="${2:-$(pwd)/.tmp/pgdata}"
PORT="${3:-54329}"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"

run_as_pg() {
  if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi
}

case "$CMD" in
  start)
    mkdir -p "$DATA_DIR"
    if [ "$(id -u)" = "0" ]; then chown -R postgres:postgres "$DATA_DIR"; fi
    if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
      run_as_pg "$PG_BIN/initdb -D '$DATA_DIR' -U postgres --auth=trust --encoding=UTF8 --locale=C.UTF-8 >/dev/null"
    fi
    if ! run_as_pg "$PG_BIN/pg_ctl -D '$DATA_DIR' status >/dev/null 2>&1"; then
      run_as_pg "$PG_BIN/pg_ctl -D '$DATA_DIR' -o \"-p $PORT -k '$DATA_DIR' -c listen_addresses=127.0.0.1 -c fsync=off -c max_connections=200\" -l '$DATA_DIR/server.log' -w start >/dev/null"
    fi
    echo "TEST_DATABASE_URL=postgres://postgres@127.0.0.1:$PORT/postgres"
    ;;
  stop)
    run_as_pg "$PG_BIN/pg_ctl -D '$DATA_DIR' -m fast stop" || true
    ;;
  *)
    echo "usage: $0 start|stop [DATA_DIR] [PORT]" >&2
    exit 2
    ;;
esac
