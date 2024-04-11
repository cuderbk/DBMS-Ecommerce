FROM node

WORKDIR /app/order

COPY package.json .

RUN npm i

COPY . .

EXPOSE 8042

CMD [ "npm", "dev" ]
