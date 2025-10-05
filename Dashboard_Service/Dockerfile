FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json .
COPY package-lock.json* .

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 8080

# Run in development mode
CMD ["npm", "run", "start"]