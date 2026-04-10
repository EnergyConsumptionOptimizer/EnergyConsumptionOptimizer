#!/usr/bin/env bash
# Exit immediately if a command fails
set -e

ORG="EnergyConsumptionOptimizer"
SERVICES=("frontend" "user-service" "alert-service" "monitoring-service" "threshold-service" "smart-furniture-hookup-service" "forecast-service" "map-service")

# Defaults
PROTOCOL=${1:-ssh}
TARGET_DIR=${2:-..}

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

echo "🔍 Checking workspaces in: $(cd "$TARGET_DIR" && pwd)"
echo "---------------------------------------------------"

for SERVICE in "${SERVICES[@]}"; do
    REPO_PATH="$TARGET_DIR/$SERVICE"

    if [ -d "$REPO_PATH" ]; then
        printf "✅ %-35s -> Already exists. Skipping.\n" "$SERVICE"
        continue
    fi

    if [ "$PROTOCOL" = "https" ]; then
        REPO_URL="https://github.com/$ORG/$SERVICE.git"
    else
        REPO_URL="git@github.com:$ORG/$SERVICE.git"
    fi

    printf "⬇️  Cloning %-32s via %s...\n" "$SERVICE" "${PROTOCOL^^}"
    git clone -q "$REPO_URL" "$REPO_PATH" || { echo "Failed to clone $SERVICE"; exit 1; }
done

echo -e "All workspaces are ready."