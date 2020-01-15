FROM node:12-slim as base
LABEL maintainer="CyaOnDaNet"
ENV NODE_ENV=production

RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections && \
  apt-get update -y && \
  apt-get install -y -q && \
  apt-get install dialog apt-utils -y &&  \
  apt-get install make -y && \
  apt-get install gcc -y && \
  apt-get install python -y && \
  apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node package.json package-lock*.json ./
RUN npm ci && npm cache clean --force

FROM base as source
COPY --chown=node:node . .

FROM source as prod
VOLUME /app/config
EXPOSE 3000
CMD ["node", "index.js"]
