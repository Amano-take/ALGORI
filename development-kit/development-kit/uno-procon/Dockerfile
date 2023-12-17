FROM node:16
WORKDIR /app

COPY . .

RUN apt-get update
RUN apt-get install less -y

RUN apt-get update && apt-get install -y locales
RUN sed -i -E 's/# (ja_JP.UTF-8)/\1/' /etc/locale.gen
RUN locale-gen
ENV LANG=ja_JP.UTF-8

RUN npm install

EXPOSE 8081

CMD [ "npm", "run" ]
