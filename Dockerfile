FROM node

COPY . /app

WORKDIR /app

ENV NODE_ENV=production PORT=5000

RUN yarn install

EXPOSE 5000

CMD ["npm", "run", "start"]
