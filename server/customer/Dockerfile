FROM node

WORKDIR /app/backend/customer

COPY package.json .

RUN npm i

COPY . .

EXPOSE 8041

CMD [ "npm", "start" ]




