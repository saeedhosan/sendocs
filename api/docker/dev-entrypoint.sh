#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
    if ! grep -q '^APP_KEY=base64:' /var/www/html/.env; then
        php artisan key:generate --force
    fi

    unset APP_KEY
fi

exec "$@"