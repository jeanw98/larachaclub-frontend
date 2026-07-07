#!/bin/sh
set -eu

API_PROXY_URL="${API_PROXY_URL:-http://host.docker.internal:3001}"
API_PROXY_HOST="${API_PROXY_HOST:-$(echo "$API_PROXY_URL" | sed -E 's#^https?://##' | cut -d/ -f1)}"
export API_PROXY_URL API_PROXY_HOST

envsubst '${API_PROXY_URL} ${API_PROXY_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "nginx proxy -> ${API_PROXY_URL} (host: ${API_PROXY_HOST})"

exec nginx -g 'daemon off;'
