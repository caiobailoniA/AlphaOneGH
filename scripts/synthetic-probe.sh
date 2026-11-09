#!/usr/bin/env bash
# Synthetic probe for the My Work query endpoint (MOBL-65).
# Probes every INTERVAL seconds, tracks P95 latency over the last WINDOW samples and
# cumulative availability, and alerts when P95 > THRESHOLD_MS or availability < MIN_AVAILABILITY.
#
# Env: PROBE_URL (required), INTERVAL=60, THRESHOLD_MS=200, WINDOW=5,
#      MIN_AVAILABILITY=99.9, ALERT_WEBHOOK_URL (optional), ONCE=0 (single probe, exit 1 on breach)
set -u

INTERVAL="${INTERVAL:-60}"
THRESHOLD_MS="${THRESHOLD_MS:-200}"
WINDOW="${WINDOW:-5}"
MIN_AVAILABILITY="${MIN_AVAILABILITY:-99.9}"
ONCE="${ONCE:-0}"

# probe URL -> prints "<http_code> <latency_ms>"
probe_once() {
  local out code secs
  out=$(curl -s -o /dev/null --max-time 10 -w '%{http_code} %{time_total}' "$1") || out="000 10"
  code=${out% *}
  secs=${out#* }
  awk -v c="$code" -v s="$secs" 'BEGIN { printf "%s %.0f\n", c, s * 1000 }'
}

# percentile P (0-100) of newline-separated numbers on stdin, nearest-rank method
percentile() {
  sort -n | awk -v p="$1" '{ a[NR] = $1 } END {
    if (NR == 0) { print 0; exit }
    r = int(p / 100 * NR); if (r < p / 100 * NR) r++; if (r < 1) r = 1
    print a[r] }'
}

# availability percent from ok and total counts
availability() {
  awk -v ok="$1" -v total="$2" 'BEGIN { printf "%.3f\n", total ? ok * 100 / total : 100 }'
}

# exit 0 when value $1 > $2
gt() { awk -v a="$1" -v b="$2" 'BEGIN { exit !(a > b) }'; }
lt() { awk -v a="$1" -v b="$2" 'BEGIN { exit !(a < b) }'; }

alert() {
  echo "ALERT: $1" >&2
  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    curl -s -o /dev/null --max-time 10 -X POST -H 'Content-Type: application/json' \
      -d "{\"text\": \"My Work synthetic probe: $1\"}" "$ALERT_WEBHOOK_URL" || true
  fi
}

main() {
  : "${PROBE_URL:?PROBE_URL is required}"
  local ok=0 total=0 samples=() breach=0 code ms p95 avail
  while true; do
    read -r code ms < <(probe_once "$PROBE_URL")
    total=$((total + 1))
    breach=0
    if [ "$code" = "200" ]; then
      ok=$((ok + 1))
      samples+=("$ms")
      [ "${#samples[@]}" -gt "$WINDOW" ] && samples=("${samples[@]:1}")
    else
      alert "probe failed with HTTP $code"
      breach=1
    fi
    if [ "${#samples[@]}" -gt 0 ]; then
      p95=$(printf '%s\n' "${samples[@]}" | percentile 95)
      echo "$(date -u +%FT%TZ) status=$code latency_ms=$ms p95_ms=$p95"
      if gt "$p95" "$THRESHOLD_MS"; then
        alert "P95 latency ${p95}ms exceeds ${THRESHOLD_MS}ms"
        breach=1
      fi
    fi
    avail=$(availability "$ok" "$total")
    if lt "$avail" "$MIN_AVAILABILITY"; then
      alert "availability ${avail}% below ${MIN_AVAILABILITY}%"
      breach=1
    fi
    if [ "$ONCE" = "1" ]; then exit "$breach"; fi
    sleep "$INTERVAL"
  done
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  main
fi
