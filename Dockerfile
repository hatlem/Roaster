# Multi-stage Dockerfile for Next.js production

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy website folder
COPY website/package*.json ./
COPY website/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY website ./

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
CMD ["node", "server.js"]
