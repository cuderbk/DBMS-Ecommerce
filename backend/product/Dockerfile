FROM node

WORKDIR /app/product

COPY package.json .

RUN npm i

COPY . .

EXPOSE 8040

CMD [ "npm", "dev" ]
