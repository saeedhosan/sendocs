#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

exec "$@"