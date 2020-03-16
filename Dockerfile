FROM node:11
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install --silent

COPY . .
CMD ["npm", "run", "start"]
