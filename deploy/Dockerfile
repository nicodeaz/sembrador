FROM php:8.4-apache-bookworm
RUN a2enmod rewrite headers && php -r 'exit(extension_loaded("pdo_sqlite") && extension_loaded("fileinfo") ? 0 : 1);'
COPY deploy/container-apache.conf /etc/apache2/sites-available/000-default.conf
COPY deploy/production.ini /usr/local/etc/php/conf.d/sembrador.ini
COPY dist/ /var/www/html/
RUN chown -R root:root /var/www/html && chmod -R a-w /var/www/html
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD curl -fsS -H 'X-Forwarded-Proto: https' http://127.0.0.1/ > /dev/null || exit 1
