# Estágio 1: Build
FROM node:18-alpine AS development

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o package.json e o package-lock.json (ou yarn.lock)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto dos arquivos do projeto
COPY . .

# Expõe a porta que o servidor de desenvolvimento do React usa
EXPOSE 3000

# Comando para iniciar a aplicação em modo de desenvolvimento
# O comando agora é "npm run dev"
# A flag "--host" permite que o Nginx se conecte ao Vite
CMD ["npm", "run", "dev", "--", "--host"]