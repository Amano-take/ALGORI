import APP_CONFIG from '../../src/configs/app.config';
import { Color, Special } from '../../src/commons/consts/app.enum';

export default {
  TIME_DELAY: 60,
  DEALER_1_NAME: 'Dealer 1',
  DEALER_2_NAME: 'Dealer 2',
  DEALER_3_NAME: 'Dealer 3',
  DEALER_4_NAME: 'Dealer 4',
  DEALER_NAME_BLANK: '',
  DEALER_NAME_MIN: 'D',
  DEALER_NAME_MAX: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
  DEALER_NAME_OVER: '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901',
  PLAYER_1: 'P-00000001',
  PLAYER_2: 'P-00000002',
  PLAYER_3: 'P-00000003',
  PLAYER_4: 'P-00000004',
  PLAYER_1_NAME: 'Player 1',
  PLAYER_2_NAME: 'Player 2',
  PLAYER_3_NAME: 'Player 3',
  PLAYER_4_NAME: 'Player 4',
  PLAYER_5_NAME: 'Player 5',
  TEAM_A: 'Team A',
  TEAM_B: 'Team B',
  TEAM_C: 'Team C',
  TEAM_D: 'Team D',
  TEAM_E: 'Team E',
  REQUEST_TIMEOUT: 50000,
  TOTAL_TURN: 1000,
  TOTAL_TURN_BLANK: '',
  TOTAL_TURN_MINUS: -1,
  TOTAL_TURN_ZERO: 0,
  TOTAL_TURN_DECIMAL: 0.1,
  TOTAL_TURN_MAX: 99999999999999999999999999,
  TOTAL_TURN_OVER: 100000000000000000000000000,
  TOTAL_TURN_LOG_TEST: 2,
  WHITE_WILD: {
    BIND_2: 'bind_2',
    SKIP_BIND_2: 'skip_bind_2',
  },
  SOCKET: {
    HOST: 'localhost',
    PORT: APP_CONFIG.ENV.APP.PORT,
    EVENT: {
      JOIN_ROOM: 'join-room',
      RECEIVER_CARD: 'receiver-card',
      FIRST_PLAYER: 'first-player',
      COLOR_OF_WILD: 'color-of-wild',
      UPDATE_COLOR: 'update-color',
      SHUFFLE_WILD: 'shuffle-wild',
      NEXT_PLAYER: 'next-player',
      PLAY_CARD: 'play-card',
      DRAW_CARD: 'draw-card',
      PLAY_DRAW_CARD: 'play-draw-card',
      CHALLENGE: 'challenge',
      PUBLIC_CARD: 'public-card',
      POINTED_NOT_SAY_UNO: 'pointed-not-say-uno',
      SPECIAL_LOGIC: 'special-logic',
      FINISH_TURN: 'finish-turn',
      FINISH_GAME: 'finish-game',
      PENALTY: 'penalty',
    },
  },
  CARD_SET_25: [
    {
      color: Color.BLUE,
      special: Special.SKIP,
    },
    {
      color: Color.RED,
      number: 9,
    },
    {
      color: Color.RED,
      number: 8,
    },
    {
      color: Color.RED,
      number: 7,
    },
    {
      color: Color.RED,
      number: 6,
    },
    {
      color: Color.BLUE,
      special: Special.SKIP,
    },
    {
      color: Color.RED,
      number: 5,
    },
    {
      color: Color.RED,
      number: 4,
    },
    {
      color: Color.RED,
      number: 3,
    },
    {
      color: Color.RED,
      number: 2,
    },
    {
      color: Color.RED,
      special: Special.SKIP,
    },
    {
      color: Color.RED,
      number: 1,
    },
    {
      color: Color.RED,
      number: 0,
    },
    {
      color: Color.RED,
      number: 9,
    },
    {
      color: Color.RED,
      number: 8,
    },
    {
      color: Color.RED,
      special: Special.SKIP,
    },
    {
      color: Color.RED,
      number: 7,
    },
    {
      color: Color.RED,
      number: 6,
    },
    {
      color: Color.RED,
      number: 5,
    },
    {
      color: Color.RED,
      number: 4,
    },
    {
      color: Color.GREEN,
      special: Special.SKIP,
    },
    {
      color: Color.RED,
      number: 3,
    },
    {
      color: Color.RED,
      number: 2,
    },
    {
      color: Color.RED,
      number: 1,
    },
    {
      color: Color.RED,
      number: 0,
    },
  ],
};
