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

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy index.html explicitly (belt and suspenders)
COPY --from=builder /app/dist/index.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
