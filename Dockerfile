FROM node:latest
LABEL maintainer="CyaOnDaNet"

# Create app directory
WORKDIR /usr/src/app

# Get app dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY ./ /usr/src/app

VOLUME /config
EXPOSE 3000
CMD [ "node", "index.js" ]
