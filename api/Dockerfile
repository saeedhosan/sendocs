# syntax=docker/dockerfile:1

FROM php:8.4-fpm-alpine AS base

RUN apk add --no-cache \
    git \
    unzip \
    icu-libs \
    libpq \
    libzip \
    && apk add --no-cache --virtual .build-deps \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev \
    && docker-php-ext-install -j"$(nproc)" \
    bcmath \
    intl \
    mbstring \
    opcache \
    pcntl \
    pdo_pgsql \
    zip \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

WORKDIR /var/www/html

FROM base AS vendor

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

FROM vendor AS prod

COPY . .

RUN composer dump-autoload \
    --no-dev \
    --classmap-authoritative

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-api.ini
COPY docker/prepare.sh /usr/local/bin/prepare
COPY docker/entrypoint.sh /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/prepare /usr/local/bin/entrypoint

RUN prepare

USER www-data

EXPOSE 9000

ENTRYPOINT ["entrypoint"]

FROM base AS dev

COPY . .

RUN composer install --prefer-dist

COPY docker/prepare.sh /usr/local/bin/prepare
COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint

RUN chmod +x /usr/local/bin/prepare /usr/local/bin/dev-entrypoint

EXPOSE 8000

ENTRYPOINT ["dev-entrypoint"]

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000", "--no-reload"]