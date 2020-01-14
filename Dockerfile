FROM node:lts
LABEL maintainer="CyaOnDaNet"

COPY ./ /app/
WORKDIR /app

# Install app dependencies
RUN npm install

VOLUME /app/config
EXPOSE 3000
CMD [ "node", "index.js" ]
