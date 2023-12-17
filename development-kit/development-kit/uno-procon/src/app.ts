/**
 * @module app
 * @description config all application
 * @since 2020-10-05
 */

import { Server } from 'http';
import * as http from 'http';
import * as express from 'express';
import * as signale from 'signale';

import APP_CONFIG from './configs/app.config';
import bootstrapConfig from './configs/bootstrap.config';
import databaseConfig from './configs/database';
import configExpress from './configs/express.config';
import configServer from './configs/server.config';
import socketConfig from './configs/socket.config';
import registerRoutes from './configs/router.config';

import { CommonService } from './commons/common.service';
import { SequenceController } from './api/sequence/sequence.controller';
import { getLogger } from './libs/commons';

const app = express();
const sequenceController = new SequenceController();

databaseConfig(); // config connect db (mongodb & redis)
configExpress(app); // config express app
registerRoutes(app); // config register router
bootstrapConfig(); // load bootstrapping config

getLogger('admin', '').info('Start ALGORI system.');

// init sequence service
sequenceController.init();

// init common service
CommonService.init();

const server: Server = http.createServer(app);
configServer(server, APP_CONFIG.ENV.APP.PORT);
socketConfig(server);
server.listen(APP_CONFIG.ENV.APP.PORT, () => {
  const serverAddress: any = server.address();
  signale.success(`Server's running at: ${serverAddress.address}/${serverAddress.port}`);
});

export default app;
