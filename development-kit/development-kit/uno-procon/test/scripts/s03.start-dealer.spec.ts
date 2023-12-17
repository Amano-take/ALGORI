import * as chai from 'chai';
import * as BlueBird from 'bluebird';
import * as IOClient from 'socket.io-client';
import * as jsonSchema from 'chai-json-schema';
import * as shallowDeepEqual from 'chai-shallow-deep-equal';
import { RequestBuilder } from '../helpers/request-builder';
import Consts from '../helpers/consts';
import StaticValues from '../helpers/static-values';
import { StatusGame } from '../../src/commons/consts/app.enum';
import { DealerService } from '../../src/api/dealer/dealer.service';
import { SequenceController } from '../../src/api/sequence/sequence.controller';
import { TestService } from '../../src/commons/test.service';

const dealerService = new DealerService();
const sequenceController = new SequenceController();

const request = new RequestBuilder('/admin/dealer');

chai.use(shallowDeepEqual);
chai.use(jsonSchema);

describe(`Admin start Dealer`, () => {
  describe(`Admin start Dealer - successfully`, () => {
    before(async () => {
      await TestService.resetDb();
      await sequenceController.init();
      const newDealer = await dealerService.create({
        name: Consts.DEALER_1_NAME,
        players: [],
        status: StatusGame.NEW,
        totalTurn: 1000,
      } as any);
      StaticValues.DEALER_ID_1 = newDealer.code;
      const client1 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom1 = {
        room_name: Consts.DEALER_1_NAME,
        player: Consts.PLAYER_1_NAME,
        team: Consts.TEAM_A,
      };
      client1.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom1);
      await BlueBird.delay(10 * Consts.TIME_DELAY);

      const client2 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom2 = {
        room_name: Consts.DEALER_1_NAME,
        player: Consts.PLAYER_2_NAME,
        team: Consts.TEAM_B,
      };
      client2.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom2);
      await BlueBird.delay(10 * Consts.TIME_DELAY);

      const client3 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom3 = {
        room_name: Consts.DEALER_1_NAME,
        player: Consts.PLAYER_3_NAME,
        team: Consts.TEAM_C,
      };
      client3.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom3);
      await BlueBird.delay(10 * Consts.TIME_DELAY);

      const client4 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom4 = {
        room_name: Consts.DEALER_1_NAME,
        player: Consts.PLAYER_4_NAME,
        team: Consts.TEAM_D,
      };
      client4.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom4);
      await BlueBird.delay(10 * Consts.TIME_DELAY);
    });

    it(`s03-A-TC001: Admin start Dealer - successfully`, (done) => {
      request
        .post(`/${StaticValues.DEALER_ID_1}/start-dealer`)
        .expectStatus(200)
        .expectBody({
          data: {
            status: StatusGame.STARTING,
          },
        })
        .end(done);
    });
  });

  describe(`Admin start Dealer - failed - Reason: Number of player join dealer invalid. Can not start dealer.`, () => {
    before(async () => {
      await TestService.resetDb();
      await sequenceController.init();
      const newDealer = await dealerService.create({
        name: Consts.DEALER_3_NAME,
        players: [],
        status: StatusGame.NEW,
        totalTurn: 1000,
      } as any);
      StaticValues.DEALER_ID_3 = newDealer.code;
      const client1 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom1 = {
        room_name: Consts.DEALER_3_NAME,
        player: Consts.PLAYER_1_NAME,
        team: Consts.TEAM_A,
      };
      client1.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom1);
      await BlueBird.delay(Consts.TIME_DELAY);
    });

    it(`s03-A-TC002: Admin start Dealer - failed - Reason: Number of player join dealer invalid. Can not start dealer.`, (done) => {
      request.post(`/${StaticValues.DEALER_ID_3}/start-dealer`).expectStatus(400).end(done);
    });
  });
});
