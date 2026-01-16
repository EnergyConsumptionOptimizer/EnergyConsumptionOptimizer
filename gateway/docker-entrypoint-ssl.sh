#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/server.key" ] || [ ! -f "$CERT_DIR/server.crt" ]; then
    echo "Auto-generating SSL certificates..."

    openssl genrsa -out "$CERT_DIR/server.key" 2048

    openssl req -new -x509 -nodes -days 3650 \
        -key "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/CN=localhost"

    echo "SSL certificates generated."
fi

exec /docker-entrypoint.sh "$@"