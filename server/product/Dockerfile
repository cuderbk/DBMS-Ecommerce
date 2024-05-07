FROM node

WORKDIR /app/backend/product

COPY package.json .

RUN npm i

COPY . .

EXPOSE 8040

CMD [ "npm", "start" ]
