FROM node

WORKDIR /app/customer

COPY package.json .

RUN npm i

COPY . .

EXPOSE 8041

CMD [ "npm", "dev" ]




