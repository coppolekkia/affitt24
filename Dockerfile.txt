FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build the project (creates dist/ folder and dist/server.cjs)
RUN npm run build

# Expose the API port
EXPOSE 3000

# Start the Node.js production server
CMD ["npm", "run", "start"]
