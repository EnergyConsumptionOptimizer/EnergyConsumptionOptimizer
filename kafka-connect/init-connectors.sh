#!/bin/bash
# Registers all connector configs (JSON files) with Kafka Connect REST API.
# Idempotent: handles 409 (already exists) by updating the config.
set -euo pipefail

API="http://kafka-connect:8083"
CONFIGS="${CONFIGS_DIR:-/etc/kafka-connect/configs}"

wait_for_connect() {
  echo "[init] Waiting for Kafka Connect..."
  for i in $(seq 1 90); do
    if curl -sf "$API/" > /dev/null 2>&1; then return 0; fi
    sleep 2
  done
  echo "[init] ERROR: Kafka Connect not ready" >&2
  exit 1
}

register_connector() {
  local file="$1" name code
  name="$(basename "$file" .json)"

  for attempt in 1 2 3 4 5; do
    code=$(curl -s -o /tmp/resp -w "%{http_code}" \
      -X POST "$API/connectors" -H "Content-Type: application/json" -d "@$file")

    case "$code" in
      201) echo "  $name -> created"; return 0 ;;
      409)
        code=$(curl -s -o /tmp/resp -w "%{http_code}" \
          -X PUT "$API/connectors/$name/config" \
          -H "Content-Type: application/json" -d "$(jq '.config' "$file")")
        [ "$code" = "200" ] && { echo "  $name -> updated"; return 0; }
        ;;
    esac
    [ "$attempt" -lt 5 ] && sleep 2
  done

  echo "  $name -> FAILED (HTTP $code)" >&2
  cat /tmp/resp >&2
}

wait_for_connect
sleep 3

for f in "$CONFIGS"/*.json; do
  register_connector "$f"
done

echo "[init] Done."
