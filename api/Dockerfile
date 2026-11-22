# syntax=docker/dockerfile:1

FROM dunglas/frankenphp:1-php8.4-alpine AS base

RUN install-php-extensions \
    bcmath \
    intl \
    mbstring \
    opcache \
    pcntl \
    pdo_pgsql \
    redis \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-api.ini

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

COPY docker/entrypoint.sh /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/entrypoint \
    && mkdir -p bootstrap/cache storage \
    && chown -R www-data:www-data bootstrap/cache storage

EXPOSE 8000

ENTRYPOINT ["entrypoint"]
CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=8000", "--workers=auto", "--max-requests=500"]

FROM base AS dev

COPY . .

RUN --mount=type=cache,target=/root/.cache/composer \
    composer install --prefer-dist

EXPOSE 8000

CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=8000", "--workers=1", "--max-requests=1"]
