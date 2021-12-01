FROM node:lts
RUN apt-get update && apt-get install -y vim
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
COPY . /app
RUN npm install
CMD ["npm", "start"]