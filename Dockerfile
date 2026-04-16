FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN npm install -g pnpm && pnpm install

# Copiar código
COPY . .

# Build
RUN pnpm run build

# Expor portas
EXPOSE 3000 8081

# Iniciar app
CMD ["pnpm", "start"]
