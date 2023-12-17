/**
 * @class TestToolConst
 * @description define test tool constants
 */

export class TestToolConst {
  static readonly DEALER = 'TestDealer';
}

export const TestToolEventExpectedData = {
  'join-room': {
    player: 'Player 1',
    room_name: 'Test Dealer',
  },
  'play-card': {
    card_play: { color: 'red', number: 6 },
    yell_uno: false,
  },
  'color-of-wild': {
    color_of_wild: 'red',
  },
  'draw-card': {},
  'play-draw-card': {
    is_play_card: true,
    yell_uno: false,
  },
  'pointed-not-say-uno': {
    target: 'Player 1',
  },
  challenge: {
    is_challenge: true,
  },
  'special-logic': {
    title: 'SpecialLogicTitle',
  },
};
