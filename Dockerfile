FROM node:22

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Run TypeScript compilation
RUN npx tsc

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]