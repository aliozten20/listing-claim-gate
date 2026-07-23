#!/bin/sh
set -eu
PORT="${PORT:-3000}"
PROM_URL="${PROMETHEUS_URL:-http://prometheus:9090}"
export GF_SERVER_HTTP_PORT="$PORT"
export GF_SERVER_ROOT_URL="${GF_SERVER_ROOT_URL:-http://localhost:3002}"

DS="/etc/grafana/provisioning/datasources/datasource.yml"
sed -i "s|PROMETHEUS_URL_PLACEHOLDER|${PROM_URL}|g" "$DS"

exec /run.sh
