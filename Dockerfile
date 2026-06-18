FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY api ./api
COPY src ./src
COPY db ./db
COPY public ./public
COPY contracts ./contracts
COPY drizzle.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Build
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => r.statusCode === 404 ? process.exit(0) : process.exit(1))"

# Start server
CMD ["npm", "run", "dev"]
