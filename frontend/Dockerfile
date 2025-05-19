# Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["yarn", "start"]
