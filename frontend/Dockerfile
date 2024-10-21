FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]

FROM node:20-alpine AS production
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["npx", "serve", "build"]
