# UNO procon

## UNO Rules

『ALGORI -UNO プログラミングコンテスト-』⼤会のルールについては「ALGORI大会」公式HPの「応募要項」画面内「大会ルール」よりダウンロードできます。

## Docker

```bash
// create image.
$ docker build -t javascript-demo-player ./
```

```bash
# Windows/Mac環境での実行
$ docker run javascript-demo-player "http://host.docker.internal:8080" "Dealer 1" "Player 2"

# Linux環境での実行
$ docker run --add-host=host.docker.internal:host-gateway javascript-demo-player "http://host.docker.internal:8080" "Dealer 1" "Player 2"
```
