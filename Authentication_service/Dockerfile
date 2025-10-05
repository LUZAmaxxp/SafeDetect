FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json .
COPY package-lock.json* .

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Install serve to run the built application
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]