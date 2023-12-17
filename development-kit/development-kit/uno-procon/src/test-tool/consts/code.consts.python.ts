import {
  PYdefineConstantfrom,
  PYimportSocketModule,
  PYisTestTool,
  PYspecifyDealer,
  PYspecifyPlayer,
  PYspecifyServerfrom,
} from './codes/step-0';
import { PYcreateSendDataFunction, PYspecifyEventName } from './codes/step-1';
import { PYcreateReceiveDataFunction } from './codes/step-2';
import {
  PYcreateCardSelectingFunction,
  PYcreateChallengeFunction,
  PYcreateChangeColorFunction,
  PYexecuteCardSelectingFunction,
  PYmanageId,
} from './codes/step-3';

export const CodeConsts = {
  PREPARATION: {
    CREATE_PROJECT: {
      type: 'shell',
      commands: ['mkdir uno-player', 'cd uno-player', 'pip freeze > requirements.txt'],
    },
    CREATE_PROGRAM_FILE: {
      type: 'shell',
      commands: ['touch player.py # windows: type nul > player.py'],
    },
    SPECIFY_SERVER: {
      type: 'python',
      file: 'player.py',
      source: PYspecifyServerfrom.default,
      commands: ['python3 -m pip install "rich"'],
    },
    IS_TEST_TOOL: {
      type: 'python',
      file: 'player.py',
      source: PYisTestTool.default,
      commands: [
        `python3 player.py # Host missed`,
        `python3 player.py "http://localhost:3000" # Host: http://localhost:3000`,
      ],
    },
    SPECIFY_DEALER: {
      type: 'python',
      file: 'player.py',
      source: PYspecifyDealer.default,
      commands: [
        `python3 player.py "http://localhost:3000" # Argments invalid`,
        `python3 player.py "http://localhost:3000" "TestDealer" # Dealer: TestDealer`,
      ],
    },
    SPECIFY_PLAYER: {
      type: 'python',
      file: 'player.py',
      source: PYspecifyPlayer.default,
      commands: [
        `python3 player.py "http://localhost:3000" "TestDealer" # Argments invalid`,
        `python3 player.py "http://localhost:3000" "TestDealer" "TestPlayer1" # Dealer: TestDealer, Player: TestPlayer1`,
      ],
    },
    INSTALL_SOCKET_MODULE: {
      type: 'shell',
      commands: ['python3 -m pip install "python-socketio[client]"'],
    },
    IMPORT_SOCKET_MODULE: {
      type: 'python',
      file: 'player.py',
      source: PYimportSocketModule.default,
      commands: [
        `python3 player.py "http://localhost:3000" "TestDealer" "TestPlayer1" # Client connect successfully!`,
      ],
    },
    DEFINE_CONSTANT: {
      type: 'javascript',
      file: 'player.js',
      source: PYdefineConstantfrom.default,
    },
  },
  PLAYER_TO_DEALER: {
    SPECIFY_EVENT_NAME: {
      type: 'python',
      file: 'player.py',
      source: PYspecifyEventName.default,
    },
    CREATE_SEND_DATA_FUNCTION: {
      type: 'python',
      file: 'player.py',
      source: PYcreateSendDataFunction.default,
    },
    SEND_DATA_TO_DEALER: {
      type: 'shell',
      commands: [
        `python3 player.py "http://localhost:3000" "TestDealer" "TestPlayer1" "join-room"`,
      ],
    },
  },
  DEALER_TO_PLAYER: {
    CREATE_RECEIVE_DATA_FUNCTION: {
      type: 'python',
      file: 'player.py',
      source: PYcreateReceiveDataFunction.default,
    },
    SEND_DATA_TO_PLAYER: {
      type: 'shell',
      commands: [`python3 player.py "http://localhost:3000" "TestDealer" "TestPlayer1"`],
    },
  },
  DETAIL: {
    MANAGE_ID_AND_CARDS: {
      type: 'python',
      file: 'player.py',
      source: PYmanageId.default,
    },
    CREATE_CARD_SELECTING_FUNCTION: {
      type: 'python',
      file: 'player.py',
      source: PYcreateCardSelectingFunction.default,
    },
    EXECUTE_CARD_SELECTING_FUNCTION: {
      type: 'python',
      file: 'player.py',
      source: PYexecuteCardSelectingFunction.default,
    },
    CREATE_CHANGE_COLOR_FUNCTION: {
      type: 'python',
      file: 'player.py',
      source: PYcreateChangeColorFunction.default,
    },
    CREATE_CHALLENGE_FUNCTION: {
      type: 'python',
      file: 'player.py',
      source: PYcreateChallengeFunction.default,
    },
  },
};
