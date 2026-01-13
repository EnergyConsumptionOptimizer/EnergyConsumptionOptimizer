#!/bin/sh

VARS='$USER_HOST $USER_PORT \
      $THRESHOLD_HOST $THRESHOLD_PORT \
      $FORECAST_HOST $FORECAST_PORT \
      $ALERT_HOST $ALERT_PORT \
      $FRONTEND_HOST $FRONTEND_PORT'

envsubst "$VARS" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Nginx environment variables from docker compose rendered successfully."
