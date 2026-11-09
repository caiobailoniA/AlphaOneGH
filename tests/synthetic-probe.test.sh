#!/usr/bin/env bash
# Tests for scripts/synthetic-probe.sh
set -u
cd "$(dirname "$0")/.." || exit 1
# shellcheck source=../scripts/synthetic-probe.sh
source scripts/synthetic-probe.sh

fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "ok   - $1"; else echo "FAIL - $1: expected '$2' got '$3'"; fail=1; fi
}

check "p95 of 1..20" 19 "$(seq 1 20 | percentile 95)"
check "p95 of single sample" 120 "$(echo 120 | percentile 95)"
check "p95 unsorted input" 300 "$(printf '50\n300\n60\n70\n80\n' | percentile 95)"
check "p95 of empty input" 0 "$(printf '' | percentile 95)"
check "availability 999/1000" 99.900 "$(availability 999 1000)"
check "availability no samples" 100.000 "$(availability 0 0)"
gt 201 200 && check "gt true" 1 1 || check "gt true" 1 0
gt 200 200 && check "gt equal is false" 0 1 || check "gt equal is false" 0 0
lt 99.8 99.9 && check "lt true" 1 1 || check "lt true" 1 0

# End-to-end against a local server
python3 -m http.server 18080 --bind 127.0.0.1 >/dev/null 2>&1 &
srv=$!
trap 'kill $srv 2>/dev/null' EXIT
for _ in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:18080/ && break; sleep 0.25; done

PROBE_URL=http://127.0.0.1:18080/ ONCE=1 THRESHOLD_MS=5000 ./scripts/synthetic-probe.sh >/dev/null 2>&1
check "healthy endpoint exits 0" 0 $?
PROBE_URL=http://127.0.0.1:18080/missing ONCE=1 ./scripts/synthetic-probe.sh >/dev/null 2>&1
check "404 endpoint exits 1" 1 $?
PROBE_URL=http://127.0.0.1:18080/ ONCE=1 THRESHOLD_MS=-1 ./scripts/synthetic-probe.sh >/dev/null 2>&1
check "latency over threshold exits 1" 1 $?

exit $fail
