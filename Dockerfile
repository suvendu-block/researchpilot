FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY prompts/ ./prompts/

# Copy env file (if exists)
COPY .env* ./

# Default command
CMD ["npx", "tsx", "src/cli.ts", "--help"]
