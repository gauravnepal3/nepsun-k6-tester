#!/usr/bin/env bash
set -euo pipefail

# Usage examples:
#   ./run-qps-test.sh
#   MODE=constant TARGET_QPS=500 DURATION=120s ./run-qps-test.sh
#   MODE=ramp STAGES="200:20s,400:20s,600:20s,800:20s,1000:20s" ./run-qps-test.sh
#
# Required:
#   SSP_API_KEY

: "${BASE_URL:=http://rtb.us.adstork.com}"
: "${SSP_API_KEY:?Set SSP_API_KEY env var}"
: "${MODE:=ramp}"

# Engine
: "${PRE_ALLOCATED_VUS:=500}"
: "${MAX_VUS:=4000}"

# Request
: "${TIMEOUT:=5s}"
: "${IP_PREFIX:=27.34}"

# Ramp mode defaults
: "${STAGES:=200:30s,400:30s,600:30s,800:30s,1000:30s}"
: "${START_RATE:=1}"
: "${TIME_UNIT:=1s}"

# Constant mode defaults
: "${TARGET_QPS:=500}"
: "${DURATION:=120s}"

# Thresholds
: "${P95_MS:=1000}"
: "${FAIL_RATE:=0.20}"

echo "Running k6 RTB QPS test..."
echo "  BASE_URL=$BASE_URL"
echo "  MODE=$MODE"
echo "  PRE_ALLOCATED_VUS=$PRE_ALLOCATED_VUS  MAX_VUS=$MAX_VUS"
echo "  TIMEOUT=$TIMEOUT  IP_PREFIX=$IP_PREFIX"
if [[ "$MODE" == "constant" ]]; then
  echo "  TARGET_QPS=$TARGET_QPS  DURATION=$DURATION"
else
  echo "  STAGES=$STAGES  START_RATE=$START_RATE  TIME_UNIT=$TIME_UNIT"
fi
echo "  P95_MS=$P95_MS  FAIL_RATE=$FAIL_RATE"
echo ""

k6 run rtb-qps-limit-test.js \
  -e BASE_URL="$BASE_URL" \
  -e SSP_API_KEY="$SSP_API_KEY" \
  -e MODE="$MODE" \
  -e PRE_ALLOCATED_VUS="$PRE_ALLOCATED_VUS" \
  -e MAX_VUS="$MAX_VUS" \
  -e TIMEOUT="$TIMEOUT" \
  -e IP_PREFIX="$IP_PREFIX" \
  -e STAGES="$STAGES" \
  -e START_RATE="$START_RATE" \
  -e TIME_UNIT="$TIME_UNIT" \
  -e TARGET_QPS="$TARGET_QPS" \
  -e DURATION="$DURATION" \
  -e P95_MS="$P95_MS" \
  -e FAIL_RATE="$FAIL_RATE"