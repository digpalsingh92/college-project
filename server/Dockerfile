FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/server.js"]