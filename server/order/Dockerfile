FROM node

WORKDIR /app/backend/order

COPY package.json .

RUN npm i

COPY . .

EXPOSE 8042

CMD [ "npm", "start" ]
