/* eslint-disable no-console */
/**
 * @description config server
 */

import { Server } from 'http';
import * as chalk from 'chalk';

export default function (server: Server, port: number) {
  server.on('uncaughtException', (err: Error) => {
    console.error(chalk.default.red(err.stack));
    process.exit(1);
  });

  server.on('error', function (error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  // App crashed event
  // We can handle errors here, eg: send mail to report error
  process.on('uncaughtException', (err: Error) => {
    chalk.default.bgRed.white(
      '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n',
      err.stack,
      '\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    );
    process.exit(1);
  });
}
