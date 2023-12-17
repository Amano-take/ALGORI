import { Server } from 'http';
import * as http from 'http';
import * as express from 'express';
import * as signale from 'signale';
import AppConfig from '../configs/app.config';
import configExpress from '../configs/express.config';
import configServer from '../configs/server.config';
import bootstrapConfig from '../configs/bootstrap.config';
import testToolSocketConfig from './commons/socket.config';
import testToolRegisterTestRoutes from './commons/route.config';
import registerRoutes from './commons/route.config';

const testTool = express();

const server: Server = http.createServer(testTool);
configExpress(testTool);
registerRoutes(testTool);
bootstrapConfig();
testToolRegisterTestRoutes(testTool);
testToolSocketConfig(server);
configServer(server, AppConfig.ENV.APP.TEST_PORT);

server.listen(AppConfig.ENV.APP.TEST_PORT, () => {
  const serverAddress: any = server.address();
  signale.success(`Test tool server's running at: ${serverAddress.address}/${serverAddress.port}`);
});

export default testTool;
