ARG NODE_VERSION=22.21.1

FROM node:${NODE_VERSION}-alpine AS base

# All deps stage
FROM base AS deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# Production only deps stage
FROM base AS production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN node ace build

# Production stage
FROM base AS serve
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app
ADD .env.docker.local /app/.env

# Custom post-install steps
RUN mkdir /app/tmp
ADD docker_start.sh ./start.sh

EXPOSE 3333
CMD ["sh", "./start.sh"]
