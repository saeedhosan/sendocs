#!/bin/sh
set -e

mkdir -p \
    bootstrap/cache \
    storage/app \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs
chown -R www-data:www-data bootstrap/cache storage

php artisan config:cache
php artisan event:cache
chown -R www-data:www-data bootstrap/cache storage

exec "$@"