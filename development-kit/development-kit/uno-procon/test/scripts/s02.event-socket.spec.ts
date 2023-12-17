import * as chai from 'chai';
import * as BlueBird from 'bluebird';
import * as IOClient from 'socket.io-client';
import * as jsonSchema from 'chai-json-schema';
import * as shallowDeepEqual from 'chai-shallow-deep-equal';
import Consts from '../helpers/consts';
import StaticValues from '../helpers/static-values';
import { Color, Desk, Special, StatusGame, WhiteWild } from '../../src/commons/consts/app.enum';
import { DealerService } from '../../src/api/dealer/dealer.service';
import { PlayerService } from '../../src/api/player/player.service';
import { SequenceController } from '../../src/api/sequence/sequence.controller';
import { CommonService } from '../../src/commons/common.service';
import { TestService } from '../../src/commons/test.service';

const sequenceController = new SequenceController();
const dealerService = new DealerService();
const playerService = new PlayerService();

let client1: any;
let client2: any;
let client3: any;
let client4: any;
chai.use(shallowDeepEqual);
chai.use(jsonSchema);

describe('Test Event Socket', () => {
  before(async () => {
    const newDealer = await dealerService.create({
      name: Consts.DEALER_2_NAME,
      players: [],
      status: StatusGame.NEW,
      totalTurn: Consts.TOTAL_TURN,
      whiteWild: Consts.WHITE_WILD.BIND_2,
    } as any);
    StaticValues.DEALER_ID = newDealer.code;

    await playerService.create({
      code: Consts.PLAYER_1,
      name: Consts.PLAYER_1_NAME,
      team: Consts.TEAM_A,
    } as any);
    await playerService.create({
      code: Consts.PLAYER_2,
      name: Consts.PLAYER_2_NAME,
      team: Consts.TEAM_B,
    } as any);
    await playerService.create({
      code: Consts.PLAYER_3,
      name: Consts.PLAYER_3_NAME,
      team: Consts.TEAM_C,
    } as any);
    await playerService.create({
      code: Consts.PLAYER_4,
      name: Consts.PLAYER_4_NAME,
      team: Consts.TEAM_D,
    } as any);
  });
  describe(`Test event ${Consts.SOCKET.EVENT.JOIN_ROOM}`, () => {
    it(`s02-A-TC001: Player 1 join Dealer - successfully`, (done) => {
      client1 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_1_NAME,
        team: Consts.TEAM_A,
      };
      client1.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err).to.equal(null);
        chai.expect(res.room_name).to.equal(dataJoinRoom.room_name);
        chai.expect(res.player).to.equal(dataJoinRoom.player);
        chai.expect(res.team).to.equal(dataJoinRoom.team);
        done();
      });
    });

    it(`s02-A-TC002: Player 2 join Dealer - successfully`, (done) => {
      client2 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_2_NAME,
        team: Consts.TEAM_B,
      };
      client2.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err).to.equal(null);
        chai.expect(res.room_name).to.equal(dataJoinRoom.room_name);
        chai.expect(res.player).to.equal(dataJoinRoom.player);
        done();
      });
    });

    it(`s02-A-TC003: Player 3 join Dealer - successfully`, (done) => {
      client3 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_3_NAME,
        team: Consts.TEAM_C,
      };
      client3.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err).to.equal(null);
        chai.expect(res.room_name).to.equal(dataJoinRoom.room_name);
        chai.expect(res.player).to.equal(dataJoinRoom.player);
        done();
      });
    });

    it(`s02-A-TC004: Player 4 join Dealer - successfully`, (done) => {
      client4 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_4_NAME,
        team: Consts.TEAM_D,
      };
      client4.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err).to.equal(null);
        chai.expect(res.room_name).to.equal(dataJoinRoom.room_name);
        chai.expect(res.player).to.equal(dataJoinRoom.player);
        done();
      });
    });

    it(`s02-A-TC005: Player 5 join Dealer - failed - Reason: Dealer max player. You can not join room`, (done) => {
      const client = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        query: { player: Consts.PLAYER_5_NAME },
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_5_NAME,
        team: Consts.TEAM_D,
      };
      client.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err.message).to.equal('Dealer max player. You can not join room.');
        chai.expect(err.code).to.equal('bad_request');
        chai.expect(err.status).to.equal(400);
        chai.expect(res).to.equal(null);
        done();
      });
    });

    it(`s02-A-TC006: More Player 1 join Dealer - failed Reason: Player name duplicate`, (done) => {
      const client = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_1_NAME,
        team: Consts.TEAM_A,
      };
      client.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err.message).to.equal('Player name duplicate.');
        chai.expect(err.code).to.equal('bad_request');
        chai.expect(err.status).to.equal(400);
        chai.expect(res).to.equal(null);
        done();
      });
    });

    it(`s02-A-TC007: Player 5 join Dealer - failed Reason: Room name is required`, (done) => {
      const client = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        player: Consts.PLAYER_5_NAME,
        team: Consts.TEAM_E,
      };
      client.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err.message).to.equal('Room name is required.');
        chai.expect(err.code).to.equal('bad_request');
        chai.expect(err.status).to.equal(400);
        chai.expect(res).to.equal(null);
        done();
      });
    });

    it(`s02-A-TC008: Player 5 join Dealer - failed Reason: Player name is required`, (done) => {
      const client = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        team: Consts.TEAM_A,
      };
      client.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function (err, res) {
        chai.expect(err.message).to.equal('Player name is required.');
        chai.expect(err.code).to.equal('bad_request');
        chai.expect(err.status).to.equal(400);
        chai.expect(res).to.equal(null);
        done();
      });
    });

    it(`s02-A-TC011: Player 1 join Dealer - failed Reason: Player name too long`, (done) => {
      const client = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: '123456789012345678901234567890',
        team: Consts.TEAM_A,
      };
      client.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, async function (err, res) {
        chai.expect(err.message).to.equal('Player name too long.');
        chai.expect(err.code).to.equal('bad_request');
        chai.expect(err.status).to.equal(400);
        chai.expect(res).to.equal(null);
        await BlueBird.delay(5 * Consts.TIME_DELAY);
        done();
      });
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  // ベースとなるゲーム情報。テストごとに変更したい項目だけ上書きする。
  const baseDesk: Desk = TestService.getDefaultDesk(Consts);

  /** Test Event Consts.SOCKET.EVENT.COLOR_OF_WILD */
  describe(`Test Event ${Consts.SOCKET.EVENT.COLOR_OF_WILD}`, () => {
    before(async () => {
      await dealerService.startDealer(StaticValues.DEALER_ID);
    });

    it(`s02-B-TC003: Player 1 chose color for Wild_shuffle - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.YELLOW,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.YELLOW);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-B-TC004: Player 1 chose color for Wild_draw_4 - failed Reason: Color wild is required`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        colorBeforeWild: Color.RED,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.COLOR_OF_WILD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-B-TC005: Player 1 chose color for Wild_draw_4 - failed Reason: Color wild invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        colorBeforeWild: Color.RED,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.BLACK,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-B-TC007: Player 1 chose color for Wild_draw_4 - failed Reason: Can not chose color of wild`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.YELLOW,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.RED,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.YELLOW);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-B-TC008: Player 1 chose color for Wild (Player 1 have 1 card) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [],
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.RED,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.turn).to.equal(2);
      chai.expect(desk.numberTurnPlay).to.equal(1);
      chai.expect(desk.numberCardPlay).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-B-TC009: First player is Player 1, first card is Black Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        firstPlayer: Consts.PLAYER_1,
        beforePlayer: Consts.PLAYER_1,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLACK,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        restrictInterrupt: true,
        numberTurnPlay: 1,
        numberCardPlay: 1,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.RED,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.firstPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforePlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.turn).to.equal(1);
      chai.expect(desk.numberTurnPlay).to.equal(2);
      chai.expect(desk.numberCardPlay).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-B-TC010: Player 1 chose color for Wild - failed Reason: Already changed color`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.RED,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-B-TC011: Player 1 plays black Wild_shuffle and wins - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_1]: true,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.RED,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.turn).to.equal(2); // 対戦終了済み
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-B-TC012: Player 2 chose color for Wild_draw_4 - failed Reason: Next player invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
        colorBeforeWild: Color.BLUE,
        restrictInterrupt: false,
      });
      await new Promise<void>((resolve) => {
        client2.emit(Consts.SOCKET.EVENT.COLOR_OF_WILD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(5); // cardOfPlayer(3) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-B-TC013: First player chose color - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 1,
            },
            {
              color: Color.BLUE,
              number: 1,
            },
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        numberTurnPlay: 1,
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.numberTurnPlay).to.equal(2);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-B-TC014: First player chose color - failed Reason: Can not chose color of wild`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 1,
            },
            {
              color: Color.BLUE,
              number: 1,
            },
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        numberTurnPlay: 2,
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.COLOR_OF_WILD,
          {
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.numberTurnPlay).to.equal(3);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(9); // cardOfPlayer(7) + penalty(2)
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  /** Test Event Consts.SOCKET.EVENT.PLAY_CARD */
  describe(`Test Event ${Consts.SOCKET.EVENT.PLAY_CARD}`, () => {
    it(`s02-C-TC001: Player 1 play card Red 9 (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC002: Player 1 play card Red 0 (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 0,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 0,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC003: Player 1 play card Blue 5 (before card Red 5) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              number: 5,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              number: 5,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC004: Player 1 play card Blue 5 (before card Blue Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              number: 5,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              number: 5,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC005: Player 1 play card Blue Skip (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC006: Player 1 play card Blue Skip (before card Blue Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.REVERSE,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },

        turnRight: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.turnRight).to.equal(false);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC007: Player 1 play card Blue Skip (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC008: Player 1 play card Red Reverse (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.SKIP,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.REVERSE,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.REVERSE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC009: Player 1 play card Red Reverse (before card Blue Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.REVERSE,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.REVERSE,
            },
          ],
        },
        turnRight: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.REVERSE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC010: Player 1 play card Red Draw_2 (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.REVERSE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            player: Consts.PLAYER_1,
            card_play: {
              color: Color.RED,
              special: Special.DRAW_2,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(2);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC011: Player 1 play card Red Draw_2 (before card Blue Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.DRAW_2,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(2);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC012: Player 1 play card Wild (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          // special: Special.DRAW_2,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            player: Consts.PLAYER_1,
            card_play: {
              color: Color.BLACK,
              special: Special.WILD,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC013: Player 1 play card Wild (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC014: Player 1 play card Wild (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC015: Player 1 play card Wild_draw_4 (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC016: Player 1 play card Wild_draw_4 (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC017: Player 1 play card Wild_draw_4 (before card Blue Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      await Promise.resolve();
    });

    it(`s02-C-TC018: Player 1 play card Wild_shuffle (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          // special: Special.WILD,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC019: Player 1 play card Wild_shuffle (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC020: Player 1 play card Wild_shuffle (before card Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC021: Player 1 play card Red 9 (before card Red 6) - failed - Reason: Card play is required`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-C-TC022: Player 1 play card Red 9 (before card Red 6) - failed - Reason: Param card play invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-C-TC023: Player 1 play card Red Reverse (before card Red 6) - failed - Reason: Special card play invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.REVERSE,
              // number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: 'Reverses',
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-C-TC024: Player 1 play card Red 9 (before card Red 6) - failed - Reason: Color card play invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.REVERSE,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: 'grey',
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-C-TC025: Player 1 play card Red 9 (before card Red 6) - failed - Reason: Number card play invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.REVERSE,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 10,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-C-TC027: Player 1 play card Red 9 (before card Red 6) - failed - Reason: Card play not exist of player`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
              // number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              // special: Special.WILD_DRAW_4,
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4);
      await Promise.resolve();
    });

    it(`s02-C-TC028: Player 1 play card Red Draw_2 (before card Blue 6) - failed - Reason: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.DRAW_2,
              // number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.DRAW_2,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4);
      await Promise.resolve();
    });

    it(`s02-C-TC029: Player 1 play card Blue Skip (before card Red 5) - failed - Reason: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4);
      await Promise.resolve();
    });

    it(`s02-C-TC030: Player 1 play card Red Draw_2 (before card Blue Skip) - failed - Reason: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.SKIP,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.DRAW_2,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4);
      await Promise.resolve();
    });

    it(`s02-C-TC031: Player 1 play card Blue Skip (Player 4 play card Blue Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC032: Player 1 play card Blue Skip (Player 3 play card Blue Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC033: Player 1 play card Blue 6 (Player 4 play card Blue Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              // special: Special.DRAW_2,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              // special: Special.SKIP,
              number: 6,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC034: Player 1 play card Red 6 (Player 4 play card Blue Wild) - failed - Reason: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              // special: Special.SKIP,
              number: 6,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4);
      await Promise.resolve();
    });

    it(`s02-C-TC035: Player 1 play card Blue Skip (Player 3 play card Blue Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_DRAW_4,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC036: Player 1 play card Blue Draw_2 (Player 3 play card Blue Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_DRAW_4,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.DRAW_2,
              // number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.DRAW_2,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(2);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC037: Player 1 play card Blue 6 (Player 3 play card Blue Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_DRAW_4,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              // special: Special.DRAW_2,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              // special: Special.DRAW_2,
              number: 6,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC038: Player 1 play card Red 6 (Player 3 play card Blue Wild_draw_4) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 6,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-C-TC039: Player 1 play card Blue Skip (before card Wild_draw_4) - failed - Reason: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_DRAW_4,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 9,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.SKIP,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(8); // cardOfPlayer(2) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-C-TC040: Player 1 play card Blue 5 (before card Red Wild_shuffle) - failed - Reason: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              // special: Special.DRAW_2,
              number: 5,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              // special: Special.SKIP,
              number: 5,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-C-TC041: Player 1 can not call play card Blue 5 (next player is Player 4) - failed - Reason: Next player invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              // special: Special.SKIP,
              number: 5,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5); // cardOfPlayer(3) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-C-TC042: Finish a turn game successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        order: {
          [Consts.PLAYER_1]: 0,
          [Consts.PLAYER_2]: 0,
          [Consts.PLAYER_3]: 0,
          [Consts.PLAYER_4]: 0,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.order[Consts.PLAYER_1]).to.equal(1);
      await Promise.resolve();
    });

    it(`s02-C-TC043: Player 1 play card Red Draw_2 (before card Blue Draw_2) - failed - Error: Can not call event play-card`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.DRAW_2,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6); // cardOfPlayer(2) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-C-TC044: Player 1 play card Wild (before card Red Wild_draw_4) - failed - Error: Can not call event play-card`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(8); // cardOfPlayer(2) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-C-TC045: Player 1 play card Wild (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC046: Player 1 play card Wild (before card Red Draw_2) - failed - Error: Can not call event play-card`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6); // cardOfPlayer(2) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-C-TC047: Player 1 play card Wild_draw_4 (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC048: Player 1 play card Wild_draw_4 (before card Red Draw_2) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6); // cardOfPlayer(2) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-C-TC049: Player 1 play card Wild_draw_4 (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.colorBeforeWild).to.equal(Color.RED);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC050: Player 1 play card Wild_draw_4 (before card Red Wild_draw_4) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            yell_uno: false,
            color_of_wild: Color.BLUE,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(8); // cardOfPlayer(2) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-C-TC051: Player 1 play card Blue Reverse (Player 3 play card Blue Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_DRAW_4,
          // number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.RED,
              // special: Special.DRAW_2,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              special: Special.REVERSE,
              // number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      // chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC052: Player 1 play card Wild_shuffle (before card Red Wild_draw_4) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(8); // cardOfPlayer(2) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-C-TC053: Player 1 play card Wild_shuffle (before card Blue Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC054: Player 1 play card Wild_shuffle (before card Red Draw_2) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6); // cardOfPlayer(2) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-C-TC055: Player 1 play card White_wild[bind_2] (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC056: Player 1 play card White_wild[bind_2] (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC057: Player 1 play card White_wild[bind_2] (before card Red Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        turnRight: false,
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_4]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC058: Player 1 play card White_wild[bind_2] (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC059: Player 1 play card White_wild[bind_2] (before card Red Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      await Promise.resolve();
    });

    it(`s02-C-TC060: Player 1 play card White_wild[bind_2] (before card Red Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC061: Player 1 play card White_wild[bind_2] (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC062: Player 1 play card White_wild[bind_2] (before card Red Draw_2) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6); // cardOfPlayer(2) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-C-TC063: Player 1 play card White_wild[bind_2] (before card Red Wild_draw_4) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(8); // cardOfPlayer(2) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-C-TC064: Player 1 play card White_wild[bind_2] (before card Red 6 White_wild 2nd times) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {
          [Consts.PLAYER_2]: 1,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(3);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC065: Player 1 plays red draw 2 and wins - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_1]: true,
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              special: Special.DRAW_2,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.turn).to.equal(2); // 対戦終了済み
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC066: Player 1 plays black shuffle_wild and wins - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_1]: true,
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC067: Player 1 plays white_wild and wins - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_1]: true,
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.turn).to.equal(2); // 対戦終了済み
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC068: Player 1 can not call play card Blue 5 (next player is Player 4) - failed - Reason: Interrupts are restricted`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 5,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              number: 5,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.number).to.equal(5);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(3) + penalty(0)
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC069: Player 1 plays black shuffle_wild and update yellUno flag - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_3]: true,
          [Consts.PLAYER_4]: true,
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.equal(true);
      chai.expect(desk.yellUno[Consts.PLAYER_2]).to.equal(false);
      chai.expect(desk.yellUno[Consts.PLAYER_3]).to.equal(false);
      chai.expect(desk.yellUno[Consts.PLAYER_4]).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC070: Player 1 play card Red 9 and call uno (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 9,
            },
            yell_uno: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(true);
      await Promise.resolve();
    });

    it(`s02-C-TC071: Player 1 play card Red 9 and call uno (before card Red 6) - failed - Reason: Yell uno is required`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 9,
            },
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(false);
      await Promise.resolve();
    });

    it(`s02-C-TC072: Player 1 play card Red 9 and call uno (before card Red 6) - failed - Reason: Pram yell uno invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 9,
            },
            yell_uno: 'TRUE',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(false);
      await Promise.resolve();
    });

    it(`s02-C-TC073: Player 1 play card Red 9 and call uno (before card Red 6) - failed - Reason: Card play not exist of player.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.RED,
              number: 9,
            },
            yell_uno: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5); // cardOfPlayer(3) + penalty(2)
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(false);
      await Promise.resolve();
    });

    it(`s02-C-TC074: Player 1 play card White_wild[skip_bind_2] (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC075: Player 1 play card White_wild[skip_bind_2] (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC076: Player 1 play card White_wild[skip_bind_2] (before card Red Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        turnRight: false,
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC077: Player 1 play card White_wild[skip_bind_2] (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC078: Player 1 play card White_wild[skip_bind_2] (before card Red Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      await Promise.resolve();
    });

    it(`s02-C-TC079: Player 1 play card White_wild[skip_bind_2] (before card Red Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC080: Player 1 play card White_wild[skip_bind_2] (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC081: Player 1 play card White_wild[skip_bind_2] (before card Red Draw_2) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6); // cardOfPlayer(2) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-C-TC082: Player 1 play card White_wild[skip_bind_2] (before card Red Wild_draw_4) - failed - Error: Card play invalid with card before`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(8); // cardOfPlayer(2) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-C-TC083: Player 1 play card White_wild[skip_bind_2] (before card Red 6 White_wild 2nd times) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {
          [Consts.PLAYER_3]: 1,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(3);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-C-TC084: Player 1 play card Wild_shuffle (before card Red reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
          ],
        },
        turnRight: false,
        yellUno: {},
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
  /** Test Event Consts.SOCKET.EVENT.DRAW_CARD */
  describe(`Test Event ${Consts.SOCKET.EVENT.DRAW_CARD}`, () => {
    it(`s02-I-TC001: Player 1 draw card (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 0
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC002: Player 1 draw card (before card Red Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
          // number: 0
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await TestService.pushCardToDesk(StaticValues.DEALER_ID, [
        {
          color: Color.RED,
          number: 9,
        },
      ]);
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      // chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(true);
      chai.expect(desk.cardBeforeDrawCard).to.eql({
        color: Color.RED,
        number: 9,
      });
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(true);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC003: Player 1 draw card (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 0
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC004: Player 1 draw card (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 0
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: true,
      });
      await TestService.pushCardToDesk(StaticValues.DEALER_ID, [
        {
          color: Color.RED,
          number: 2,
        },
      ]);
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(true);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(true);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC005: Player 1 draw-card (before card Red 6) - failed Reason: Can not draw card exceed 25`, async () => {
      const cardsOfPlayer = [...Consts.CARD_SET_25];

      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: { [Consts.PLAYER_1]: cardsOfPlayer },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      // chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(25);
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-I-TC006: Player 1 can not call draw card (next player is Player 4) Reason: Next player invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 1,
            },
            {
              color: Color.RED,
              number: 0,
            },
          ],
        },
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.cardAddOn).to.equal(0);
      await Promise.resolve();
    });

    it(`s02-I-TC007: Player 1 draw card (before card Red Draw_2 Player 1 have 25 cards) - successfully`, async () => {
      const cardsOfPlayer = [...Consts.CARD_SET_25];
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 0
        },
        cardOfPlayer: { [Consts.PLAYER_1]: cardsOfPlayer },
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(cardsOfPlayer.length + 2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC008: Player 1 draw card (before card Red Wild_draw_4 Player 1 have 25 cards) - successfully`, async () => {
      const cardsOfPlayer = [...Consts.CARD_SET_25];
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 0
        },
        cardOfPlayer: { [Consts.PLAYER_1]: cardsOfPlayer },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(cardsOfPlayer.length + 4);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC009: Player 1 draw card (before card Red White_wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WHITE_WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },

        mustCallDrawCard: true,
        activationWhiteWild: {
          [Consts.PLAYER_1]: 2,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_1]).to.equal(1);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC010: Player 1 draw card (before card Red White_wild Player 1 have 25 cards) - successfully`, async () => {
      const cardsOfPlayer = [...Consts.CARD_SET_25];
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WHITE_WILD,
        },
        cardOfPlayer: { [Consts.PLAYER_1]: cardsOfPlayer },
        mustCallDrawCard: true,
        activationWhiteWild: {
          [Consts.PLAYER_1]: 2,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(cardsOfPlayer.length + 1);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_1]).to.equal(1);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC011: Player 1 draw card (before card Red 6 White_wild 2nd lap) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: true,
        activationWhiteWild: {
          [Consts.PLAYER_1]: 1,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_1]).to.equal(0);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC012: Player 1 draw card (before card Red 6 White_wild 2nd lap Player 1 have 25 cards) - successfully`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25],
      };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
        mustCallDrawCard: true,
        activationWhiteWild: {
          [Consts.PLAYER_1]: 1,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai
        .expect(desk.cardOfPlayer[Consts.PLAYER_1].length)
        .to.equal(cardOfPlayer[Consts.PLAYER_1].length + 1);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.activationWhiteWild).to.not.undefined;
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_1]).to.equal(0);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC013: Player 1 draw card (before card Red 6 Player 1 has 25 cards) - successfully`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25],
      };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai
        .expect(desk.cardOfPlayer[Consts.PLAYER_1].length)
        .to.equal(cardOfPlayer[Consts.PLAYER_1].length);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC014: Player 1 no play card (before card Red Draw 2 Player 1 has 25 cards) - successfully`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25],
      };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer,
        mustCallDrawCard: false,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai
        .expect(desk.cardOfPlayer[Consts.PLAYER_1].length)
        .to.equal(cardOfPlayer[Consts.PLAYER_1].length);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC015: 39 consecutive no-play-cards`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25],
      };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
        mustCallDrawCard: false,
        noPlayCount: 39,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai
        .expect(desk.cardOfPlayer[Consts.PLAYER_1].length)
        .to.equal(cardOfPlayer[Consts.PLAYER_1].length);
      chai.expect(desk.noPlayCount).to.equal(40);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC016: 40 consecutive no-play-cards`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25],
      };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
        mustCallDrawCard: false,
        noPlayCount: 40,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      chai.expect(desk.noPlayCount).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC017: ReverlDesk leaves the top card and returns to the drawDesk.`, async () => {
      const before: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: before.cardOfPlayer[Consts.PLAYER_1],
        },
        cardAddOn: 4,
        drawDesk: before.revealDesk,
        revealDesk: before.drawDesk,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(11);
      chai.expect(desk.revealDesk.length).to.equal(1);
      chai.expect(desk.drawDesk.length).to.equal(79);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-I-TC018: Player 1 can not call draw card (next player is Player 4) Reason: Interrupts are restricted`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 1,
            },
            {
              color: Color.RED,
              number: 0,
            },
          ],
        },
        mustCallDrawCard: false,
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.DRAW_CARD, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2); // cardOfPlayer(2) + penalty(0)
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(true);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
  /** Test Event Consts.SOCKET.EVENT.PLAY_DRAW_CARD */
  describe(`Test Event ${Consts.SOCKET.EVENT.PLAY_DRAW_CARD}`, () => {
    it(`s02-J-TC001: Player 1 draw card Red 9 and can play (before card Red 0) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 0,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 9,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC002: Player 1 draw card Blue 6 and can play (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          number: 6,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC003: Player 1 draw card Red 0 and can play (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.RED,
              number: 0,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 0,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC004: Player 1 draw card Blue 6 and can play (before card Blue Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.SKIP,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          number: 6,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC005: Player 1 draw card Blue 6 and can play (before card Blue Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.REVERSE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        turnRight: false,
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          number: 6,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC006: Player 1 draw card Blue 6 and can play (before card Blue Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          number: 6,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC007: Player 1 draw card Blue Skip and can play (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          special: Special.SKIP,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC008: Player 1 draw card Blue Reverse and can play (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          special: Special.REVERSE,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.turnRight).to.equal(false);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC009: Player 1 draw card Blue Reverse and can play (before card Blue Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.BLUE,
          special: Special.SKIP,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          special: Special.REVERSE,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC010: Player 1 draw card Blue Draw_2 and can play (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLUE,
              special: Special.DRAW_2,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          special: Special.DRAW_2,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(2);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC011: Player 1 draw card Wild and can play (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLACK,
          special: Special.WILD,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false, color_of_wild: Color.BLUE },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC012: Player 1 draw card Wild_draw_4 and can play (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLACK,
          special: Special.WILD_DRAW_4,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false, color_of_wild: Color.BLUE },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC013: Player 1 draw card Wild_shuffle and can play (before card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
          ],
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 1,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              number: 2,
            },
            {
              color: Color.GREEN,
              number: 5,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLACK,
          special: Special.WILD_SHUFFLE,
        },
        restrictInterrupt: true,
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_3].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.colorBeforeWild).to.equal(Color.BLUE);
      chai.expect(desk.restrictInterrupt).to.equal(true);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC014: Player 1 can not call play-draw-card (Player 1 not call draw-card) - failed Reason: Can not play draw card`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: false,
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-J-TC015: Player 1 can not call play-draw-card (next player is Player 4) - failed - Reason: Next player invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.BLUE,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.GREEN,
              number: 1,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.BLUE,
          number: 9,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          { is_play_card: true, yell_uno: false },
          () => {
            resolve();
          },
        );
      });
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLUE);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1); // cardOfPlayer(1) + penalty(0)
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.restrictInterrupt).to.equal(true);
      await Promise.resolve();
    });

    it(`s02-J-TC016: Player 1 draw card White_wild[bind_2] and can play (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC017: Player 1 draw card White_wild[bind_2] and can play (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC018: Player 1 draw card White_wild[bind_2] and can play (before card Red Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        turnRight: false,
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_4]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC019: Player 1 draw card White_wild[bind_2] and can play (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      await Promise.resolve();
    });

    it(`s02-J-TC020: Player 1 draw card White_wild[bind_2] and can play (before card Red Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC021: Player 1 draw card White_wild[bind_2] and can play (before card Red Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC022: Player 1 draw card White_wild[bind_2] and can play (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC023: Player 1 play draw card White_wild[bind_2] (before card Red 6 White_wild 2nd times) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {
          [Consts.PLAYER_2]: 1,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_2]).to.equal(3);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC024: Player 1 not play card Red 9 and can play (before card Red 0) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 0,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 9,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: false,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(2);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC025: Player 1 draw card Red 9 and can play and call uno (before card Red 0) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 0,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 9,
        },
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(9);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(true);
      await Promise.resolve();
    });

    it(`s02-J-TC026: Player 1 draw card Red 9 and can play and call uno (before card Red 0) - failed - Reason: Yell uno is required.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 0,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 9,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(false);
      await Promise.resolve();
    });

    it(`s02-J-TC027: Player 1 draw card Red 9 and can play and call uno (before card Red 0) - failed - Reason: Param yell uno invalid.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 0,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 9,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: 'TRUE',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(false);
      await Promise.resolve();
    });

    it(`s02-J-TC028: Player 1 draw card Red 9 and can play and call uno (before card Red 0) - failed - Reason: Card play not exist of player.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 0,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.YELLOW,
              number: 9,
            },
            // {
            //   color: Color.RED,
            //   number: 9,
            // },
          ],
        },
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.RED,
          number: 9,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(0);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // cardOfPlayer(2) + penalty(2)
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.canCallPlayDrawCard).to.equal(false);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.yellUno[Consts.PLAYER_1]).to.eql(false);
      await Promise.resolve();
    });

    it(`s02-J-TC029: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC030: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC031: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        turnRight: false,
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC032: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red Draw_2) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      await Promise.resolve();
    });

    it(`s02-J-TC033: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC034: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC035: Player 1 draw card White_wild[skip_bind_2] and can play (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {},
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(2);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });

    it(`s02-J-TC036: Player 1 play draw card White_wild[skip_bind_2] (before card Red 6 White_wild 2nd times) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        mustCallDrawCard: false,
        canCallPlayDrawCard: true,
        cardBeforeDrawCard: {
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        },
        whiteWild: WhiteWild.SKIP_BIND_2,
        activationWhiteWild: {
          [Consts.PLAYER_3]: 1,
        },
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_DRAW_CARD,
          {
            is_play_card: true,
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_3);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.restrictInterrupt).to.equal(false);
      if (desk.activationWhiteWild) {
        chai.expect(desk.activationWhiteWild[Consts.PLAYER_3]).to.equal(3);
      }
      chai.expect(desk.hasYellUnoPenalty).to.eql({});
      await Promise.resolve();
    });
  });

  /** Test Event Consts.SOCKET.EVENT.CHALLENGE */
  describe(`Test Event ${Consts.SOCKET.EVENT.CHALLENGE}`, () => {
    beforeEach(async () => {
      await TestService.setCardOfDesk(StaticValues.DEALER_ID);
    });

    it(`s02-F-TC001: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 3 play card Red 6, Player 4 have card Blue 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLUE,
              // special: Special.SKIP
              number: 6,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(6);
      await Promise.resolve();
    });

    it(`s02-F-TC002: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 3 play card Red Reverse, Player 4 have card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.RED,
              // special: Special.SKIP
              number: 6,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.REVERSE,
          // number: 6
        },
        turnRight: false,
        mustCallDrawCard: true,
        activationWhiteWild: {},
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(6);
      await Promise.resolve();
    });

    it(`s02-F-TC003: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 2 play card Red Skip, Player 4 have card Blue Skip) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.SKIP,
          // number: 6
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(6);
      await Promise.resolve();
    });

    it(`s02-F-TC004: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 3 play card Red Draw_2, Player 4 have card Red Reverse) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.RED,
              special: Special.REVERSE,
              // number: 6
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(6);
      await Promise.resolve();
    });

    it(`s02-F-TC005: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 3 play card Red Wild, Player 4 have card Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.WILD,
          // number: 6
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(6);
      await Promise.resolve();
    });

    it(`s02-F-TC006: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 3 play card Red Wild_shuffle, Player 4 have card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.RED,
              number: 6,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
          // number: 6
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(6);
      await Promise.resolve();
    });

    it(`s02-F-TC007: Player 1 challenge Player 4 win (before card Red Wild_draw_4, Player 3 play card Red 6) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLUE,
              number: 5,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          number: 6,
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-F-TC008: Player 1 challenge Player 4 win (before card Red Wild_draw_4, Player 3 play card Red Wild) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLUE,
              number: 5,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.WILD,
          // number: 6
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-F-TC009: Player 1 challenge Player 4 lose (before card Red Wild_draw_4, Player 3 play card Red Wild_shuffle) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLUE,
              number: 5,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
          // number: 6
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(3 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-F-TC010: Player 1 don't challenge Player 4 (before card Red Wild_draw_4) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        cardAddOn: 4,
        cardBeforeWildDraw4: {
          color: Color.RED,
          // special: Special.WILD_SHUFFLE,
          number: 6,
        },
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      await Promise.resolve();
    });

    it(`s02-F-TC011: Player 1 challenge Player 4 (before card Red 6) - failed - Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          // special: Special.WILD_DRAW_4,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      // chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-F-TC012: Player 1 challenge Player 4 (before card Red Skip) - failed - Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-F-TC013: Player 1 challenge Player 4 (before card Red Reverse) - failed - Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-F-TC014: Player 1 challenge Player 4 (before card Red Draw_2) - failed - Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5); // cardOfPlayer(1) + penalty(2) + DRAW_2(2)
      await Promise.resolve();
    });

    it(`s02-F-TC015: Player 1 challenge Player 4 (before card Red Wild) - failed - Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7); // cardOfPlayer(1) + penalty(2) + WILD(4)
      await Promise.resolve();
    });

    it(`s02-F-TC016: Player 1 challenge Player 4 (before card Red Wild_shuffle) - failed - Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_2,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_SHUFFLE,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_SHUFFLE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-F-TC017: Player 1 can not challenge Player 3 (Next player is Player 4) - Reason: Next player invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.GREEN,
              number: 1,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3); // cardOfPlayer(1) + penalty(2)
      await Promise.resolve();
    });

    it(`s02-F-TC018: Player 1 challenge Player 4 (before card Red Wild_draw_4 Player 1 White_wild 2nd lap) - failed Reason: Can not challenge`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.GREEN,
              number: 1,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
        whiteWild: WhiteWild.BIND_2,
        activationWhiteWild: {
          [Consts.PLAYER_1]: 1,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      // chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7); // cardOfPlayer(1) + penalty(2) + WILD_DRAW_4(4)
      await Promise.resolve();
    });

    it(`s02-F-TC019: Player 1 can not challenge Player 3 (Next player is Player 4) - Reason: Interrupts are restricted`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
          // number: 6
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.GREEN,
              number: 1,
            },
          ],
        },
        cardAddOn: 4,
        mustCallDrawCard: true,
        restrictInterrupt: true,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.CHALLENGE,
          {
            is_challenge: true,
          },
          () => {
            resolve();
          },
        );
      });
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1); // cardOfPlayer(1) + penalty(0)
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  describe(`Test Event ${Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO}`, () => {
    it(`s02-G-TC001: Player 1 pointed Player 4 not say UNO (Player 4 has been say UNO) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.GREEN,
              number: 1,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: true,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: false,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO,
          {
            target: Consts.PLAYER_4,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(1);
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(false);
      }
      await Promise.resolve();
    });

    it(`s02-G-TC002: Player 1 pointed Player 4 not say UNO (Player 4 not say UNO) - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.GREEN,
              number: 1,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: false,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: false,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO,
          {
            target: Consts.PLAYER_4,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(1);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(3); // + penalty not say uno(2)
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(true);
      }
      await Promise.resolve();
    });

    it(`s02-G-TC003: Player 1 pointed Player 4 not say UNO (Player 4 remain 3 cards on the hand) - failed - Reason: Can not pointed not say uno`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: false,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: false,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO,
          {
            target: Consts.PLAYER_4,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5); // + penalty(2)
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(false);
      }
      await Promise.resolve();
    });

    it(`s02-G-TC004: Player 1 pointed Player 4 not say UNO - failed - Reason: Player name is required`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: false,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: false,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5); // + penalty(2)
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(false);
      }
      await Promise.resolve();
    });

    it(`s02-G-TC005: Player 1 pointed Player 4 not say UNO - failed - Reason: Player name invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: false,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: false,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO,
          {
            target: 'test',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5); // + penalty(2)
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(2);
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(false);
      }
      await Promise.resolve();
    });

    it(`s02-G-TC006: Player 1 pointed Player 4 not say UNO - failed - Reason: Out of target`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: false,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: false,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO,
          {
            target: Consts.PLAYER_2,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(1);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(1);
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(false);
      }
      await Promise.resolve();
    });

    it(`s02-G-TC007: Player 1 pointed Player 4 not say UNO - failed - Reason: Already penalized`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        yellUno: {
          ...baseDesk.yellUno,
          [Consts.PLAYER_4]: false,
        },
        hasYellUnoPenalty: {
          ...baseDesk.hasYellUnoPenalty,
          [Consts.PLAYER_4]: true,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.POINTED_NOT_SAY_UNO,
          {
            target: Consts.PLAYER_2,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(3);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_2].length).to.equal(1);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_4].length).to.equal(1);
      if (desk.hasYellUnoPenalty) {
        chai.expect(desk.hasYellUnoPenalty[Consts.PLAYER_4]).to.equal(true);
      }
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  describe(`Test Event ${Consts.SOCKET.EVENT.SPECIAL_LOGIC}`, () => {
    it(`s02-K-TC001: Player 1 Sepcial logic 1st times - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.SPECIAL_LOGIC,
          {
            title: 'xxxxxxxxxxxxxxxx',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      if (desk.specialLogic) {
        chai.expect(desk.specialLogic[Consts.PLAYER_1]).to.equal(1);
      }
      await Promise.resolve();
    });

    it(`s02-K-TC002: Player 1 Sepcial logic 10th times - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        specialLogic: {
          [Consts.PLAYER_1]: 9,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.SPECIAL_LOGIC,
          {
            title: 'xxxxxxxxxxxxxxxx',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      if (desk.specialLogic) {
        chai.expect(desk.specialLogic[Consts.PLAYER_1]).to.equal(10);
      }
      await Promise.resolve();
    });

    it(`s02-K-TC003: Player 1 Sepcial logic 11th times - successfully`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
          ],
        },
        specialLogic: {
          [Consts.PLAYER_1]: 10,
        },
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.SPECIAL_LOGIC,
          {
            title: 'xxxxxxxxxxxxxxxx',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      if (desk.specialLogic) {
        chai.expect(desk.specialLogic[Consts.PLAYER_1]).to.equal(10);
      }
      await Promise.resolve();
    });

    it(`s02-K-TC004: Player 1 Sepcial logic 10th times - failed Reason: Param special logic invalid`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        specialLogic: {
          [Consts.PLAYER_1]: 9,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.SPECIAL_LOGIC, {}, () => {
          resolve();
        });
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      if (desk.specialLogic) {
        chai.expect(desk.specialLogic[Consts.PLAYER_1]).to.equal(9);
      }
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // + penalty(2)
      await Promise.resolve();
    });

    it(`s02-K-TC005: Player 1 Sepcial logic 1st times - failed Reason: Special logic name too long.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_3,
        nextPlayer: Consts.PLAYER_4,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
        },
        specialLogic: {
          [Consts.PLAYER_1]: 9,
        },
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.SPECIAL_LOGIC,
          {
            title: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      if (desk.specialLogic) {
        chai.expect(desk.specialLogic[Consts.PLAYER_1]).to.equal(9);
      }
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(4); // + penalty(2)
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  describe(`Logic calculator score of Player`, () => {
    it(`s02-L-TC001: Player 1 accepts the penalty. (Player 1 has 23 cards)`, async () => {
      const cardOfPlayer = { [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 23) };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(25);
      await Promise.resolve();
    });

    it(`s02-L-TC002: Player 1 accepts the penalty. (Player 1 has 24 cards)`, async () => {
      const cardOfPlayer = { [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 24) };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(25);
      await Promise.resolve();
    });

    it(`s02-L-TC003: Player 1 accepts the penalty. (Player 1 has 25 cards)`, async () => {
      const cardOfPlayer = { [Consts.PLAYER_1]: [...Consts.CARD_SET_25] };
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
      });
      await new Promise<void>((resolve) => {
        client1.emit(
          Consts.SOCKET.EVENT.PLAY_CARD,
          {
            card_play: {
              color: Color.BLUE,
              number: 9,
            },
            yell_uno: false,
          },
          () => {
            resolve();
          },
        );
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(25);
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  describe(`Dealer Emit FIRST_PLAYER`, () => {
    it(`s02-M-TC001: Top card on desk is Red 6`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 7),
      };
      const mapPlayerToSocket = new Map<string, string>();
      mapPlayerToSocket.set(Consts.PLAYER_1, client1.id);
      mapPlayerToSocket.set(Consts.PLAYER_2, client2.id);
      mapPlayerToSocket.set(Consts.PLAYER_3, client3.id);
      mapPlayerToSocket.set(Consts.PLAYER_4, client4.id);
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer,
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const beforeDesk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      await CommonService.firstPlayerAction(
        beforeDesk,
        {
          color: Color.RED,
          number: 6,
        },
        Consts.PLAYER_1,
        mapPlayerToSocket,
      );
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-M-TC002: Top card on desk is Red Skip`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 7),
      };
      const mapPlayerToSocket = new Map<string, string>();
      mapPlayerToSocket.set(Consts.PLAYER_1, client1.id);
      mapPlayerToSocket.set(Consts.PLAYER_2, client2.id);
      mapPlayerToSocket.set(Consts.PLAYER_3, client3.id);
      mapPlayerToSocket.set(Consts.PLAYER_4, client4.id);
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_1,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.SKIP,
        },
        cardOfPlayer,
        isSkip: true,
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const beforeDesk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      await CommonService.firstPlayerAction(
        beforeDesk,
        {
          color: Color.RED,
          special: Special.SKIP,
        },
        Consts.PLAYER_1,
        mapPlayerToSocket,
      );
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.SKIP);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-M-TC003: Top card on desk is Red Reverse`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 7),
      };
      const mapPlayerToSocket = new Map<string, string>();
      mapPlayerToSocket.set(Consts.PLAYER_1, client1.id);
      mapPlayerToSocket.set(Consts.PLAYER_2, client2.id);
      mapPlayerToSocket.set(Consts.PLAYER_3, client3.id);
      mapPlayerToSocket.set(Consts.PLAYER_4, client4.id);
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_1,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.REVERSE,
        },
        cardOfPlayer,
        turnRight: false,
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const beforeDesk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      await CommonService.firstPlayerAction(
        beforeDesk,
        {
          color: Color.RED,
          special: Special.REVERSE,
        },
        Consts.PLAYER_1,
        mapPlayerToSocket,
      );
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_4);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.REVERSE);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-M-TC004: Top card on desk is Red Draw_2`, async () => {
      const cardOfPlayer = {
        ...baseDesk.cardOfPlayer,
        [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 7),
      };
      const mapPlayerToSocket = new Map<string, string>();
      mapPlayerToSocket.set(Consts.PLAYER_1, client1.id);
      mapPlayerToSocket.set(Consts.PLAYER_2, client2.id);
      mapPlayerToSocket.set(Consts.PLAYER_3, client3.id);
      mapPlayerToSocket.set(Consts.PLAYER_4, client4.id);
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_1,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer,
        cardAddOn: 2,
        mustCallDrawCard: true,
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const beforeDesk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      await CommonService.firstPlayerAction(
        beforeDesk,
        {
          color: Color.RED,
          special: Special.REVERSE,
        },
        Consts.PLAYER_1,
        mapPlayerToSocket,
      );
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(2);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-M-TC005: Top card on desk is Red Wild`, async () => {
      const cardOfPlayer = { [Consts.PLAYER_1]: [...Consts.CARD_SET_25].slice(0, 7) };
      const mapPlayerToSocket = new Map<string, string>();
      mapPlayerToSocket.set(Consts.PLAYER_1, client1.id);
      mapPlayerToSocket.set(Consts.PLAYER_2, client2.id);
      mapPlayerToSocket.set(Consts.PLAYER_3, client3.id);
      mapPlayerToSocket.set(Consts.PLAYER_4, client4.id);
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforePlayer: Consts.PLAYER_1,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD,
        },
        cardOfPlayer,
        turnRight: false,
      });
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const beforeDesk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      await CommonService.firstPlayerAction(
        beforeDesk,
        {
          color: Color.BLACK,
          special: Special.WILD,
        },
        Consts.PLAYER_1,
        mapPlayerToSocket,
      );
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_1);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.BLACK);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      await Promise.resolve();
    });

    it(`s02-M-TC006: Top card on desk is Red Wild_draw_4`, async () => {
      const cards = CommonService.desk();
      cards.unshift({
        color: Color.BLACK,
        special: Special.WILD_DRAW_4,
      });
      const { firstCard, newCards } = await CommonService.getFirstCard([...cards]);
      chai.expect(newCards.length).to.equal(cards.length - 1);
      if (firstCard && firstCard.special) {
        chai.expect(firstCard.special).to.not.equal(Special.WILD_DRAW_4);
      }
      await Promise.resolve();
    });

    it(`s02-M-TC007: Top card on desk Wild_shufule`, async () => {
      const cards = CommonService.desk();
      cards.unshift({
        color: Color.BLACK,
        special: Special.WILD_SHUFFLE,
      });
      const { firstCard, newCards } = await CommonService.getFirstCard([...cards]);
      chai.expect(newCards.length).to.equal(cards.length - 1);
      if (firstCard && firstCard.special) {
        chai.expect(firstCard.special).to.not.equal(Special.WILD_SHUFFLE);
      }
      await Promise.resolve();
    });

    it(`s02-M-TC008: Top card on desk White_wild`, async () => {
      const cards = CommonService.desk();
      cards.unshift({
        color: Color.WHITE,
        special: Special.WHITE_WILD,
      });
      const { firstCard, newCards } = await CommonService.getFirstCard([...cards]);
      chai.expect(newCards.length).to.equal(cards.length - 1);
      if (firstCard && firstCard.special) {
        chai.expect(firstCard.special).to.not.equal(Special.WHITE_WILD);
      }
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  describe(`Time Out`, () => {
    it(`s02-N-TC001: Timeout of color of wild event. Player 1 play card wild.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        colorBeforeWild: Color.RED,
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutColorOfWild(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-N-TC002: Timeout of color of wild event. Player 1 play card wild_draw_4.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.BLACK,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        colorBeforeWild: Color.RED,
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutColorOfWild(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(4);
      chai.expect(desk.mustCallDrawCard).to.equal(true);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-N-TC003: Timeout`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutPlayer(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(5);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-N-TC004: Timeout. (before card Red draw_2)`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.DRAW_2,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        cardAddOn: 2,
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutPlayer(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.DRAW_2);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(7);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-N-TC005: Timeout. (before card Red wild_draw_4)`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WILD_DRAW_4,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        cardAddOn: 4,
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutPlayer(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WILD_DRAW_4);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(9);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-N-TC006: Timeout. (before card Red 6 Player 1 White_wild 1st lap)`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          special: Special.WHITE_WILD,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        activationWhiteWild: {
          [Consts.PLAYER_1]: 2,
        },
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutPlayer(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.special).to.equal(Special.WHITE_WILD);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6);
      chai.expect(desk.activationWhiteWild?.[Consts.PLAYER_1]).to.equal(1);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });

    it(`s02-N-TC007: Timeout. (before card Red 6 Player 1 White_wild 2nd lap)`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.BLUE,
              special: Special.REVERSE,
            },
            {
              color: Color.BLUE,
              number: 6,
            },
          ],
        },
        activationWhiteWild: {
          [Consts.PLAYER_1]: 1,
        },
        timeout: {
          [Consts.PLAYER_1]: true,
        },
      });
      await CommonService.timeoutPlayer(StaticValues.DEALER_ID, Consts.PLAYER_1);
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.nextPlayer).to.equal(Consts.PLAYER_2);
      chai.expect(desk.beforeCardPlay.number).to.equal(6);
      chai.expect(desk.beforeCardPlay.color).to.equal(Color.RED);
      chai.expect(desk.cardAddOn).to.equal(0);
      chai.expect(desk.mustCallDrawCard).to.equal(false);
      chai.expect(desk.cardOfPlayer[Consts.PLAYER_1].length).to.equal(6);
      chai.expect(desk.activationWhiteWild?.[Consts.PLAYER_1]).to.equal(0);
      chai.expect(desk.timeout[Consts.PLAYER_1]).to.equal(false);
      await Promise.resolve();
    });
  });

  /* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  describe(`Logic calculator score of Player`, () => {
    beforeEach(async () => {
      await TestService.resetDb();
      await sequenceController.init();
      const newDealer = await dealerService.create({
        name: Consts.DEALER_2_NAME,
        players: [],
        status: StatusGame.NEW,
        totalTurn: 1000,
      } as any);
      StaticValues.DEALER_ID = newDealer.code;
      await playerService.create({
        code: Consts.PLAYER_1,
        name: Consts.PLAYER_1_NAME,
        team: Consts.TEAM_A,
      } as any);
      await playerService.create({
        code: Consts.PLAYER_2,
        name: Consts.PLAYER_2_NAME,
        team: Consts.TEAM_B,
      } as any);
      await playerService.create({
        code: Consts.PLAYER_3,
        name: Consts.PLAYER_3_NAME,
        team: Consts.TEAM_C,
      } as any);
      await playerService.create({
        code: Consts.PLAYER_4,
        name: Consts.PLAYER_4_NAME,
        team: Consts.TEAM_D,
      } as any);
      client1 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_1_NAME,
        team: Consts.TEAM_A,
      };
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom, function () {
          resolve();
        });
      });
      client2 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom2 = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_2_NAME,
        team: Consts.TEAM_B,
      };
      await new Promise<void>((resolve) => {
        client2.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom2, function () {
          resolve();
        });
      });
      client3 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom3 = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_3_NAME,
        team: Consts.TEAM_C,
      };
      await new Promise<void>((resolve) => {
        client3.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom3, function () {
          resolve();
        });
      });
      client4 = IOClient.connect(`http://${Consts.SOCKET.HOST}:${Consts.SOCKET.PORT}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      const dataJoinRoom4 = {
        room_name: Consts.DEALER_2_NAME,
        player: Consts.PLAYER_4_NAME,
        team: Consts.TEAM_D,
      };
      await new Promise<void>((resolve) => {
        client4.emit(Consts.SOCKET.EVENT.JOIN_ROOM, dataJoinRoom4, function () {
          resolve();
        });
      });
      await dealerService.startDealer(StaticValues.DEALER_ID);
    });

    it(`s02-H-TC001: Calculator score of Player (Player 1 win 300 turn Score 254 , Player 2 win 150 Score -59, Player 3 win 100 Score -90, Player 4 win 50 Score -105)`, async () => {
      const orderOfDesk: { [key: string]: number } = {};
      orderOfDesk[Consts.PLAYER_1] = 299;
      orderOfDesk[Consts.PLAYER_2] = 150;
      orderOfDesk[Consts.PLAYER_3] = 100;
      orderOfDesk[Consts.PLAYER_4] = 50;
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        turn: Consts.TOTAL_TURN,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          //Player 2 YELLOW 9, WILD_DRAW_4 50
          [Consts.PLAYER_2]: [
            {
              color: Color.YELLOW,
              number: 9,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
          ],
          //Player 3 Red 0, Wild 50, Wild-shuffle 40
          [Consts.PLAYER_3]: [
            {
              color: Color.RED,
              number: 0,
            },
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            //Player 4 BLUE 0, BLUE Skip, GREEN 4, GREEN REVERSE, GREEN DRAW_2, WHITE_WILD
          ],
          [Consts.PLAYER_4]: [
            {
              color: Color.BLUE,
              number: 1,
            },
            {
              color: Color.BLUE,
              special: Special.SKIP,
            },
            {
              color: Color.GREEN,
              number: 4,
            },
            {
              color: Color.GREEN,
              special: Special.REVERSE,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.WHITE,
              special: Special.WHITE_WILD,
            },
          ],
        },
        score: {
          [Consts.PLAYER_1]: 0,
          [Consts.PLAYER_2]: 0,
          [Consts.PLAYER_3]: 0,
          [Consts.PLAYER_4]: 0,
        },
        order: orderOfDesk,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.PLAY_CARD, {
          card_play: {
            color: Color.RED,
            number: 9,
          },
          yell_uno: false,
        });
        // NOTE: ゲーム終了時、socket通信のcallbackが呼ばれる前にsocketが切断されるので、通信実行後1秒待機してresolveを呼び出す。
        setTimeout(() => {
          resolve();
        }, 1000);
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.order[Consts.PLAYER_1]).to.equal(300);
      chai.expect(desk.order[Consts.PLAYER_2]).to.equal(150);
      chai.expect(desk.order[Consts.PLAYER_3]).to.equal(100);
      chai.expect(desk.order[Consts.PLAYER_4]).to.equal(50);
      const player1 = await playerService.detailByCondition({ code: Consts.PLAYER_1 });
      const player2 = await playerService.detailByCondition({ code: Consts.PLAYER_2 });
      const player3 = await playerService.detailByCondition({ code: Consts.PLAYER_3 });
      const player4 = await playerService.detailByCondition({ code: Consts.PLAYER_4 });
      chai.expect(player1.total_score).to.equal(254);
      chai.expect(player2.total_score).to.equal(-59);
      chai.expect(player3.total_score).to.equal(-90);
      chai.expect(player4.total_score).to.equal(-105);
      await Promise.resolve();
    });

    it(`s02-H-TC002: Calculator score of Player (Player 1 win 250 turn Score 230, Player 2 win 150 Score -30, Player 3 win 150 Score -90, Player 4 win 50 Score -110)`, async () => {
      const orderOfDesk: { [key: string]: number } = {};
      orderOfDesk[Consts.PLAYER_1] = 249;
      orderOfDesk[Consts.PLAYER_2] = 150;
      orderOfDesk[Consts.PLAYER_3] = 150;
      orderOfDesk[Consts.PLAYER_4] = 50;
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        turn: Consts.TOTAL_TURN,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
          //Player 2 Score 30
          [Consts.PLAYER_2]: [
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
            {
              color: Color.YELLOW,
              number: 5,
            },
            {
              color: Color.BLUE,
              number: 5,
            },
          ],
          //Player 3 Score 90
          [Consts.PLAYER_3]: [
            {
              color: Color.BLACK,
              special: Special.WILD,
            },
            {
              color: Color.GREEN,
              special: Special.DRAW_2,
            },
            {
              color: Color.GREEN,
              special: Special.SKIP,
            },
          ],
          //Player 4 Score 110
          [Consts.PLAYER_4]: [
            {
              color: Color.BLACK,
              special: Special.WILD_DRAW_4,
            },
            {
              color: Color.BLACK,
              special: Special.WILD_SHUFFLE,
            },
            {
              color: Color.RED,
              special: Special.DRAW_2,
            },
          ],
        },
        score: {
          [Consts.PLAYER_1]: 0,
          [Consts.PLAYER_2]: 0,
          [Consts.PLAYER_3]: 0,
          [Consts.PLAYER_4]: 0,
        },
        order: orderOfDesk,
      });
      await new Promise<void>((resolve) => {
        client1.emit(Consts.SOCKET.EVENT.PLAY_CARD, {
          card_play: {
            color: Color.RED,
            number: 9,
          },
          yell_uno: false,
        });
        // NOTE: ゲーム終了時、socket通信のcallbackが呼ばれる前にsocketが切断されるので、通信実行後1秒待機してresolveを呼び出す。
        setTimeout(() => {
          resolve();
        }, 1000);
      });
      await BlueBird.delay(5 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      chai.expect(desk.order[Consts.PLAYER_1]).to.equal(250);
      chai.expect(desk.order[Consts.PLAYER_2]).to.equal(150);
      chai.expect(desk.order[Consts.PLAYER_3]).to.equal(150);
      chai.expect(desk.order[Consts.PLAYER_4]).to.equal(50);
      const player1 = await playerService.detailByCondition({ code: Consts.PLAYER_1 });
      const player2 = await playerService.detailByCondition({ code: Consts.PLAYER_2 });
      const player3 = await playerService.detailByCondition({ code: Consts.PLAYER_3 });
      const player4 = await playerService.detailByCondition({ code: Consts.PLAYER_4 });
      chai.expect(player1.total_score).to.equal(230);
      chai.expect(player2.total_score).to.equal(-30);
      chai.expect(player3.total_score).to.equal(-90);
      chai.expect(player4.total_score).to.equal(-110);
      await Promise.resolve();
    });

    it(`s02-H-TC003: The player who reaches that point first is the winner.`, async () => {
      await TestService.setDesk({
        ...baseDesk,
        id: StaticValues.DEALER_ID,
        turn: Consts.TOTAL_TURN,
        beforeCardPlay: {
          color: Color.RED,
          number: 6,
        },
        cardOfPlayer: {
          ...baseDesk.cardOfPlayer,
          [Consts.PLAYER_1]: [
            {
              color: Color.RED,
              number: 9,
            },
          ],
        },
        score: {
          [Consts.PLAYER_1]: 100,
          [Consts.PLAYER_2]: 100,
          [Consts.PLAYER_3]: 100,
          [Consts.PLAYER_4]: -300,
        },
      });
      const player1 = await playerService.detailByCondition({ code: Consts.PLAYER_1 });
      const player2 = await playerService.detailByCondition({ code: Consts.PLAYER_2 });
      const player3 = await playerService.detailByCondition({ code: Consts.PLAYER_3 });
      const player4 = await playerService.detailByCondition({ code: Consts.PLAYER_4 });
      const history1 = [50, -70, 56, 37, -52, -32, 26, 386, -24, -165];
      const history2 = [-25, 140, -3, -2, -22, 94, -14, -80, -12, 24];
      const history3 = [-10, -26, 256, -32, -346, -60, -3, -278, -23, 622];
      const history4 = [-15, -44, -197, -3, 420, -2, -9, -28, 59, -481];
      player1.score = {
        [StaticValues.DEALER_ID]: history1,
      };
      player1.markModified(`score.${StaticValues.DEALER_ID}`);
      player1.save();
      player2.score = {
        [StaticValues.DEALER_ID]: history2,
      };
      player2.markModified(`score.${StaticValues.DEALER_ID}`);
      player2.save();
      player3.score = {
        [StaticValues.DEALER_ID]: history3,
      };
      player3.markModified(`score.${StaticValues.DEALER_ID}`);
      player3.save();
      player4.score = {
        [StaticValues.DEALER_ID]: history4,
      };
      player4.markModified(`score.${StaticValues.DEALER_ID}`);
      player4.save();
      await BlueBird.delay(2 * Consts.TIME_DELAY);
      const desk: Desk = await TestService.getDesk(StaticValues.DEALER_ID);
      const winner = await CommonService.calculateWinnerOfGame(desk);
      chai.expect(winner).to.equal(Consts.PLAYER_2);
      await Promise.resolve();
    });
  });
});
