# Usa a imagem oficial do PHP com FPM (FastCGI Process Manager)
FROM php:8.2-fpm-alpine

# Define o diretório de trabalho
WORKDIR /var/www/html

# Instala extensões PHP necessárias para o MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copia os arquivos do backend para o diretório de trabalho
COPY . .

# Define as permissões corretas para o servidor web
RUN chown -R www-data:www-data /var/www/html