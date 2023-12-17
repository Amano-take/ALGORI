FROM public.ecr.aws/docker/library/node:16
WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8081

ENTRYPOINT [ "node", "demo-player.js"]

CMD [ "http://localhost:8080/", "Dealer 1", "Player 1" ]
