FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/dev.db
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
