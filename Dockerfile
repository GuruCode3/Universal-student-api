# Universal Student API - Custom Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables to prevent npm warnings
ENV NODE_ENV=production
ENV NPM_CONFIG_PRODUCTION=true
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Copy package files
COPY package*.json ./

# Install dependencies with clean output
RUN npm ci --omit=dev --silent --no-audit --no-fund

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Change ownership of app directory
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "server.js"]