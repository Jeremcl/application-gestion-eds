# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files (including index.html and src/styles)
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Verify index.html exists
RUN test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Test nginx config before starting
CMD ["sh", "-c", "nginx -t && nginx -g 'daemon off;'"]
