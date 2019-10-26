FROM node:10

# make app directory
WORKDIR /usr/src/app

# app depencency install
COPY package*.json ./
RUN npm install

# add app source
COPY . .

CMD ["npm", "start"]