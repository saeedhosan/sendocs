#!/bin/sh
set -e

mkdir -p \
    bootstrap/cache \
    storage/app \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

if [ "$1" = "--own" ]; then
    chown -R www-data:www-data bootstrap/cache storage
fi