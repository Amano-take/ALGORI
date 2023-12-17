FROM python:3.9
WORKDIR /app

COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 8081

ENTRYPOINT [ "python", "RealPlayer.py"]

CMD [ "http://host.docker.internal:8080/", "Dealer 1", "Player 1" ]
