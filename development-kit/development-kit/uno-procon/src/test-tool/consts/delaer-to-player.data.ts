import { SocketConst } from '../../commons/consts/socket.const';

export default [
  {
    name: SocketConst.EMIT.JOIN_ROOM,
    list: [
      {
        type: '',
        data: {
          room_name: 'TestDealer',
          player: 'TestPlayer1',
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.RECEIVER_CARD,
    list: [
      {
        type: '',
        data: {
          cards_receive: [
            {
              number: 9,
              color: 'red',
            },
            {
              number: 8,
              color: 'yellow',
            },
            {
              special: 'wild_draw_4',
              color: 'black',
            },
          ],
          is_penalty: false,
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.FIRST_PLAYER,
    list: [
      {
        type: '',
        data: {
          first_player: 'TestPlayer1',
          first_card: {
            number: 8,
            color: 'yellow',
          },
          play_order: ['TestPlayer1', 'TestPlayer2', 'TestPlayer3', 'TestPlayer4'],
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.COLOR_OF_WILD,
    list: [
      {
        type: '',
        data: {},
      },
    ],
  },
  {
    name: SocketConst.EMIT.UPDATE_COLOR,
    list: [
      {
        type: '',
        data: {
          color: 'red',
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.SHUFFLE_WILD,
    list: [
      {
        type: '',
        data: {
          cards_receive: [
            {
              number: 0,
              color: 'blue',
            },
            {
              number: 6,
              color: 'green',
            },
            {
              number: 9,
              color: 'yellow',
            },
            {
              special: 'wild',
              color: 'black',
            },
          ],
          number_card_of_player: {
            TestPlayer1: 4,
            TestPlayer2: 5,
            TestPlayer3: 4,
            TestPlayer4: 4,
          },
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.NEXT_PLAYER,
    list: [
      {
        type: 'カードを出せる場合',
        data: {
          next_player: 'TestPlayer1',
          before_player: 'TestPlayer4',
          card_before: {
            color: 'red',
            number: 9,
          },
          card_of_player: [
            { color: 'yellow', number: 6 },
            { color: 'blue', number: 5 },
            { color: 'blue', number: 0 },
            { color: 'red', number: 2 },
            { color: 'yellow', number: 3 },
            { color: 'yellow', number: 0 },
            { color: 'green', special: 'reverse' },
          ],
          must_call_draw_card: false,
          draw_reason: 'nothing',
          turn_right: true,
          number_card_play: 14,
          number_turn_play: 14,
          number_card_of_player: {
            TestPlayer1: 4,
            TestPlayer2: 3,
            TestPlayer3: 6,
            TestPlayer4: 5,
          },
        },
      },
      {
        type: 'カードを引かなければならない場合',
        data: {
          next_player: 'TestPlayer1',
          before_player: 'TestPlayer4',
          card_before: {
            color: 'red',
            special: 'wild_draw_4',
          },
          card_of_player: [
            { color: 'yellow', number: 6 },
            { color: 'blue', number: 5 },
            { color: 'blue', number: 0 },
            { color: 'red', number: 2 },
            { color: 'yellow', number: 3 },
            { color: 'yellow', number: 0 },
            { color: 'green', special: 'reverse' },
          ],
          must_call_draw_card: true,
          draw_reason: 'wild_draw_4',
          turn_right: true,
          number_card_play: 14,
          number_turn_play: 14,
          number_card_of_player: {
            TestPlayer1: 4,
            TestPlayer2: 3,
            TestPlayer3: 6,
            TestPlayer4: 5,
          },
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.PLAY_CARD,
    list: [
      {
        type: '色の変更がない場合',
        data: {
          player: 'TestPlayer1',
          card_play: {
            color: 'blue',
            number: 8,
          },
          yell_uno: false,
        },
      },
      {
        type: '色の変更がある場合',
        data: {
          player: 'TestPlayer1',
          card_play: {
            color: 'black',
            special: 'wild',
          },
          yell_uno: false,
          color_of_wild: 'red',
        },
      },
      {
        type: 'UNO宣言をしない場合',
        data: {
          player: 'TestPlayer1',
          card_play: {
            color: 'blue',
            number: 8,
          },
          yell_uno: false,
        },
      },
      {
        type: 'UNO宣言をする場合',
        data: {
          player: 'TestPlayer1',
          card_play: {
            color: 'blue',
            number: 8,
          },
          yell_uno: true,
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.DRAW_CARD,
    list: [
      {
        type: '引いたカードが場に出せる場合',
        data: {
          player: 'TestPlayer1',
          can_play_draw_card: true,
        },
      },
      {
        type: '引いたカードが場に出せない場合',
        data: {
          player: 'TestPlayer1',
          can_play_draw_card: false,
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.PLAY_DRAW_CARD,
    list: [
      {
        type: 'カードを出した場合',
        data: {
          player: 'TestPlayer1',
          is_play_card: true,
          play_card: {
            color: 'black',
            special: 'wild',
          },
          yell_uno: false,
        },
      },
      {
        type: 'カードを出さなかった場合',
        data: {
          player: 'TestPlayer1',
          is_play_card: false,
        },
      },
      {
        type: '色の変更を伴うカードを出した場合',
        data: {
          player: 'TestPlayer1',
          card_play: {
            color: 'black',
            special: 'wild',
          },
          yell_uno: false,
          color_of_wild: 'red',
        },
      },
      {
        type: 'UNO宣言と共にカードを出した場合',
        data: {
          player: 'TestPlayer1',
          play_card: {
            color: 'black',
            special: 'wild',
          },
          is_play_card: true,
          yell_uno: true,
          color_of_wild: 'red',
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.CHALLENGE,
    list: [
      {
        type: 'チャレンジが成功した場合',
        data: {
          challenger: 'TestPlayer2',
          target: 'TestPlayer1',
          is_challenge: true,
          is_challenge_success: true,
        },
      },
      {
        type: 'チャレンジが失敗した場合',
        data: {
          challenger: 'TestPlayer2',
          target: 'TestPlayer1',
          is_challenge: true,
          is_challenge_success: false,
        },
      },
      {
        type: 'チャレンジを行わなかった場合',
        data: {
          challenger: 'TestPlayer2',
          target: 'TestPlayer1',
          is_challenge: false,
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.PUBLIC_CARD,
    list: [
      {
        type: '',
        data: {
          card_of_player: 'TestPlayer1',
          cards: [
            {
              number: 2,
              color: 'yellow',
            },
            {
              special: 'reverse',
              color: 'green',
            },
            {
              special: 'white_wild',
              color: 'black',
            },
          ],
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.POINTED_NOT_SAY_UNO,
    list: [
      {
        type: '',
        data: {
          pointer: 'TestPlayer1',
          target: 'TestPlayer2',
          have_say_uno: true,
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.FINISH_TURN,
    list: [
      {
        type: '',
        data: {
          turn_no: 49,
          winner: 'TestPlayer1',
          score: {
            TestPlayer1: 23,
            TestPlayer2: 15,
            TestPlayer3: -6,
            TestPlayer4: -5,
          },
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.FINISH_GAME,
    list: [
      {
        type: '',
        data: {
          winner: 'TestPlayer1',
          turn_win: 602,
          order: {
            TestPlayer1: 560,
            TestPlayer2: -152,
            TestPlayer3: -67,
            TestPlayer4: -574,
          },
          total_score: {
            TestPlayer1: 560,
            TestPlayer2: -125,
            TestPlayer3: 65,
            TestPlayer4: -508,
          },
        },
      },
    ],
  },
  {
    name: SocketConst.EMIT.PENALTY,
    list: [
      {
        type: '',
        data: {
          player: 'TestPlayer1',
          number_card_of_player: 2,
          error: 'Param card play invalid.',
        },
      },
    ],
  },
];
