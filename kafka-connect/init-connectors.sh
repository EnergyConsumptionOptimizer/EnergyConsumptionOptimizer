#!/bin/bash
# Registers all connector configs (JSON files) with Kafka Connect REST API.
# Uses PUT /connectors/{name}/config for idempotent upsert.
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
  local file="$1" name config code
  name="$(jq -r '.name' "$file")"
  config="$(jq '.config' "$file")"

  code=$(curl -s -o /tmp/resp -w "%{http_code}" \
    -X PUT "$API/connectors/$name/config" \
    -H "Content-Type: application/json" -d "$config")

  case "$code" in
    200) echo "  $name -> updated" ;;
    201) echo "  $name -> created" ;;
    *)   echo "  $name -> FAILED (HTTP $code)" >&2; cat /tmp/resp >&2; exit 1 ;;
  esac
}

wait_for_connect
sleep 3

for f in "$CONFIGS"/*.json; do
  register_connector "$f"
done

echo "[init] Done."
