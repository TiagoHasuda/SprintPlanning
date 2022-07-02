FROM node:16.15.0

WORKDIR /projects/discordBots/sprintPlanning

COPY package.json ./

RUN yarn

COPY . .

CMD ["yarn", "start"]
