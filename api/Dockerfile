# syntax=docker/dockerfile:1

FROM php:8.4-fpm-alpine AS base

RUN apk add --no-cache git unzip icu-libs libpq libzip \
    && apk add --no-cache --virtual .build-deps icu-dev libzip-dev oniguruma-dev postgresql-dev \
    && docker-php-ext-install -j"$(nproc)" bcmath intl mbstring opcache pcntl pdo_pgsql zip \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

WORKDIR /var/www/html

RUN mkdir -p bootstrap/cache \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
    && chown -R www-data:www-data bootstrap/cache storage \
    && printf 'APP_KEY=\n' > .env

FROM base AS vendor

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

FROM vendor AS prod

ENV APP_ENV=production \
    APP_DEBUG=false \
    PORT=9000

COPY . .

RUN composer dump-autoload --no-dev --classmap-authoritative

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-sendocs.ini
COPY docker/entrypoint.sh /usr/local/bin/sendocs-entrypoint

RUN chmod +x /usr/local/bin/sendocs-entrypoint

USER www-data

EXPOSE 9000

ENTRYPOINT ["sendocs-entrypoint"]

FROM base AS dev

ENV APP_ENV=development \
    APP_DEBUG=true \
    PHP_CLI_SERVER_WORKERS=4 \
    PORT=8000

COPY . .

RUN composer install --prefer-dist

COPY docker/dev-entrypoint.sh /usr/local/bin/sendocs-dev-entrypoint

RUN chmod +x /usr/local/bin/sendocs-dev-entrypoint

EXPOSE 8000

ENTRYPOINT ["sendocs-dev-entrypoint"]

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000", "--no-reload"]