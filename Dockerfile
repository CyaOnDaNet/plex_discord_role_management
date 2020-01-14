FROM node:latest
LABEL maintainer="CyaOnDaNet"

# Create app directory
WORKDIR /

# Get app dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY ./ /

VOLUME /config
EXPOSE 3000
CMD [ "node", "index.js" ]
