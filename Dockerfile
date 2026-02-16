# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY backend/src ./src

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
