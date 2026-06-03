FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# prisma.config.ts reads DATABASE_URL at generate time; a placeholder is enough (no DB connection needed).
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collegeProject?schema=public
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run prisma:generate && npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/server.js"]