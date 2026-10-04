#!/bin/sh
set -e

php artisan config:cache
php artisan event:cache

exec "$@"