FROM node:22

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy source files
COPY . .

# Attempt to run TypeScript compilation
RUN npx tsc

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]