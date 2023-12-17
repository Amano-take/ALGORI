import chalk from 'chalk';
import * as http from 'http';
import * as glob from 'glob';
import * as path from 'path';
import * as signale from 'signale';
import * as socketIO from 'socket.io';

import APP_CONFIG from '../../configs/app.config';

export default function (server: http.Server) {
  (<any>global).__IO = socketIO(server);
  const sockets: string[] = glob.sync(
    path.normalize(`${APP_CONFIG.ROOT}/test-tool/commons/sockets/**/*.socket.{ts,js}`),
  );
  sockets.forEach((socket) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const name = require(socket).default;
    signale.complete(chalk.magenta(`Test Tool Socket "${name}" has running!`));
  });
}
