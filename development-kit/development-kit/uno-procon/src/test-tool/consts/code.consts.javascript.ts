import {
  JSdefineConstantfrom,
  JSimportSocketModule,
  JSisTestTool,
  JSspecifyDealer,
  JSspecifyPlayer,
  JSspecifyServerfrom,
} from './codes/step-0';
import { JScreateSendDataFunction, JSspecifyEventName } from './codes/step-1';
import { JScreateReceiveDataFunction } from './codes/step-2';
import {
  JScreateCardSelectingFunction,
  JScreateChallengeFunction,
  JScreateChangeColorFunction,
  JSexecuteCardSelectingFunction,
  JSmanageId,
} from './codes/step-3';

export const CodeConsts = {
  PREPARATION: {
    CREATE_PROJECT: {
      type: 'shell',
      commands: ['mkdir uno-player', 'cd uno-player', 'npm init'],
    },
    CREATE_PROGRAM_FILE: {
      type: 'shell',
      commands: ['touch player.js # windows: type nul > player.js'],
    },
    SPECIFY_SERVER: {
      type: 'javascript',
      file: 'player.js',
      source: JSspecifyServerfrom.default,
    },
    IS_TEST_TOOL: {
      type: 'javascript',
      file: 'player.js',
      source: JSisTestTool.default,
      commands: [
        `node player.js # Host missed`,
        `node player.js "http://localhost:3000" # Host: http://localhost:3000`,
      ],
    },
    SPECIFY_DEALER: {
      type: 'javascript',
      file: 'player.js',
      source: JSspecifyDealer.default,
      commands: [
        `node player.js "http://localhost:3000" # Argments invalid`,
        `node player.js "http://localhost:3000" "TestDealer" # Dealer: TestDealer`,
      ],
    },
    SPECIFY_PLAYER: {
      type: 'javascript',
      file: 'player.js',
      source: JSspecifyPlayer.default,
      commands: [
        `node player.js "http://localhost:3000" "TestDealer" # Argments invalid`,
        `node player.js "http://localhost:3000" "TestDealer" "TestPlayer1" # Dealer: TestDealer, Player: TestPlayer1`,
      ],
    },
    INSTALL_SOCKET_MODULE: {
      type: 'shell',
      commands: ['npm i -S socket.io-client@2.4.0'],
    },
    IMPORT_SOCKET_MODULE: {
      type: 'javascript',
      file: 'player.js',
      source: JSimportSocketModule.default,
      commands: [
        `node player.js "http://localhost:3000" "TestDealer" "TestPlayer1" # Client connect successfully!`,
      ],
    },
    DEFINE_CONSTANT: {
      type: 'javascript',
      file: 'player.js',
      source: JSdefineConstantfrom.default,
    },
  },
  PLAYER_TO_DEALER: {
    SPECIFY_EVENT_NAME: {
      type: 'javascript',
      file: 'player.js',
      source: JSspecifyEventName.default,
    },
    CREATE_SEND_DATA_FUNCTION: {
      type: 'javascript',
      file: 'player.js',
      source: JScreateSendDataFunction.default,
    },
    SEND_DATA_TO_DEALER: {
      type: 'shell',
      commands: [`node player.js "http://localhost:3000" "TestDealer" "TestPlayer1" "join-room"`],
    },
  },
  DEALER_TO_PLAYER: {
    CREATE_RECEIVE_DATA_FUNCTION: {
      type: 'javascript',
      file: 'player.js',
      source: JScreateReceiveDataFunction.default,
    },
    SEND_DATA_TO_PLAYER: {
      type: 'shell',
      commands: [`node player.js "http://localhost:3000" "TestDealer" "TestPlayer1"`],
    },
  },
  DETAIL: {
    MANAGE_ID_AND_CARDS: {
      type: 'javascript',
      file: 'player.js',
      source: JSmanageId.default,
    },
    CREATE_CARD_SELECTING_FUNCTION: {
      type: 'javascript',
      file: 'player.js',
      source: JScreateCardSelectingFunction.default,
    },
    EXECUTE_CARD_SELECTING_FUNCTION: {
      type: 'javascript',
      file: 'player.js',
      source: JSexecuteCardSelectingFunction.default,
    },
    CREATE_CHANGE_COLOR_FUNCTION: {
      type: 'javascript',
      file: 'player.js',
      source: JScreateChangeColorFunction.default,
    },
    CREATE_CHALLENGE_FUNCTION: {
      type: 'javascript',
      file: 'player.js',
      source: JScreateChallengeFunction.default,
    },
  },
};
