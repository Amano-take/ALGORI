import * as chai from 'chai';
import * as BlueBird from 'bluebird';
import * as IOClient from 'socket.io-client';
import { RequestBuilder } from '../helpers/request-builder';
import Consts from '../helpers/consts';
import StaticValues from '../helpers/static-values';
import { StatusGame } from '../../src/commons/consts/app.enum';
import { DealerService } from '../../src/api/dealer/dealer.service';
import { PlayerService } from '../../src/api/player/player.service';
import { SequenceController } from '../../src/api/sequence/sequence.controller';
import { TestService } from '../../src/commons/test.service';

const dealerService = new DealerService();
const playerService = new PlayerService();
const sequenceController = new SequenceController();

const request = new RequestBuilder('/admin/web');

describe(`Admin backend`, () => {
  
  before(async () => {
    await TestService.resetDb();
    await sequenceController.init();

    // Test Dealer作成
    const newDealer = await dealerService.create({
      name: Consts.DEALER_1_NAME,
      players: [],
      status: StatusGame.NEW,
      totalTurn: 1000,
    } as any);
    StaticValues.DEALER_ID_1 = newDealer.code;
    //console.log("dealer", newDealer);

    // Test Player作成
    const newPlayer = await playerService.create({
      code: Consts.PLAYER_1,
      name: Consts.PLAYER_1_NAME,
      team: Consts.TEAM_A,
    } as any);

    // Join-room
    const client1 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    const dataJoinRoom1 = {
      room_name: Consts.DEALER_1_NAME,
      player: Consts.PLAYER_1_NAME,
      team: Consts.TEAM_A,
    };
    await client1.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom1);

    const client2 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    const dataJoinRoom2 = {
      room_name: Consts.DEALER_1_NAME,
      player: Consts.PLAYER_2_NAME,
      team: Consts.TEAM_B,
    };
    await client2.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom2);

    const client3 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    const dataJoinRoom3 = {
      room_name: Consts.DEALER_1_NAME,
      player: Consts.PLAYER_3_NAME,
      team: Consts.TEAM_C,
    };
    await client3.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom3);

    const client4 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    const dataJoinRoom4 = {
      room_name: Consts.DEALER_1_NAME,
      player: Consts.PLAYER_4_NAME,
      team: Consts.TEAM_D,
    };
    await client4.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom4);
    await BlueBird.delay(10 * Consts.TIME_DELAY);

    // 試合開始
    await dealerService.startDealer(newDealer.code);

    // ディーラー情報(ゲーム情報)取得
    const game = await dealerService.detailByCondition({code: newDealer.code});
    //console.log("game", game);

  });
  
  // ディーラー一覧取得
  it(`s05-A-TC001: Should get list of all dealers`, (done) => {
    request.get('').expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // ディーラー新規作成
  it(`s05-A-TC002: Should create a new dealer`, (done) => {
    const body = {
      name: Consts.DEALER_4_NAME,
      totalTurn: Consts.TOTAL_TURN,
      whiteWild: Consts.WHITE_WILD.BIND_2,
    };
    request.post('/new').send(body).expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // 試合にプレイヤーを追加
  it(`s05-A-TC003: Add demo player`, (done) => {
    const body = {};
    request.post(`/${StaticValues.DEALER_ID_1}/player`).send(body).expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // 試合開始
  it(`s05-A-TC004: Start of the game`, (done) => {
    const body = {};
    request.post(`/${StaticValues.DEALER_ID_1}/start-dealer`).send(body).expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // プレイヤー取得
  it(`s05-A-TC005: Get player`, (done) => {
    request.get(`/player/${Consts.PLAYER_1}`).expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // ゲームログ取得
  it(`s05-A-TC006: Get log`, (done) => {
    request.get(`/log/${StaticValues.DEALER_ID_1}`).expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/html; charset=utf-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // ゲームログDL取得
  it(`s05-A-TC007: Get log DL`, (done) => {
    request.get(`/log/download/${StaticValues.DEALER_ID_1}`).expectStatus(200).end(function(err, res){
      try {
        chai.expect(res.headers['content-type']).to.equal('text/plain; charset=UTF-8');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});