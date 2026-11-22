#!/bin/sh
set -e

if [ -z "${APP_KEY:-}" ]; then
    php artisan key:generate
fi

mkdir -p \
    bootstrap/cache \
    storage/app \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs
chown -R www-data:www-data bootstrap/cache storage

php artisan optimize
chown -R www-data:www-data bootstrap/cache storage

exec "$@"
