FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

RUN npm install -g bower
RUN npm install -g forever

COPY bower.json /usr/src/app/
RUN bower install --allow-root

# Bundle app source
COPY . /usr/src/app

EXPOSE 8080
# RUN forever start batchJobs.js

CMD forever start -l batch-forever.log -o batch-out.log -e batch-err.log batchJobs.js && forever server.js && forever logs batchJobs.js

#CMD ["node","server.js"]

# CMD node server.js && node batchJobs.js
