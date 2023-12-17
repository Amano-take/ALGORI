# UNO procon

## UNO Rules

『ALGORI -UNO プログラミングコンテスト-』⼤会のルールについては「ALGORI大会」公式HPの「応募要項」画面内「大会ルール」よりダウンロードできます。

## Requirement

- git 2.21.0
- node v18.14.0
- npm 9.2.0
- tsc 4.3.0
- 各種パッケージ [package.json](/package.json)
- mongodb database server
- redis database server

## Installation

```bash
# Windows
$ cd 解凍したフォルダのパス\development-kit\development-kit\uno-procon
# 移動 Mac（Linux）
$ cd 解凍したフォルダのパス/development-kit/development-kit/uno-procon
```

## Usage

```bash
$ cd # project root path

# install dependencies
$ npm i

## Test
# [test code] start mocha
$ npm run test

## Build
# deploys automatically when you push to the github branch (Github Actions)
# if you push to the [development] branch, it will be deployed to development.
# if you push to the [staging] branch, it will be deployed to staging.
# if you push to the [master], it will be deployed to production.

## Run Server and Demo Player at local
# Step by step
# Start Server
$ npm run start

# Then start server successfully. Create Dealer by call http api (Can use Postman) http://localhost:8080/api/v1/admin/dealer with body data { "name": "Dealer 1", "totalTurn": 1000 }

# Final, start Dealer by call http api http://localhost:8080/api/v1/admin/dealer/:id-of-dealer/start-dealer. Example http://localhost:8080/api/v1/admin/dealer/61f2118161dd1217d3687938/start-dealer
```

## Docker

```bash
# build
$ docker-compose build
# run
$ docker-compose up

$ curl http://localhost:8080/api/v1/admin/dealer
```

## Ops

-

## Specification

-

## Design

-

## License

UNO procon is Confidential.
