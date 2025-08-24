# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/docs ./dist/docs
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]