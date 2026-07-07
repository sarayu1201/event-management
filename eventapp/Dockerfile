FROM node:18-alpine

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy local code
COPY . .

EXPOSE 5000

CMD ["node", "backend/server.js"]
