import * as signale from 'signale';
import * as Promise from 'bluebird';
import * as mongoose from 'mongoose';

import APP_CONFIG from '../app.config';
import { getLogger } from '../../libs/commons';

export default function () {
  (<any>mongoose).Promise = Promise;
  connectDb();
}

/**
 * @method connectDb
 * @description connection database
 * @param {Function} callback
 */
function connectDb(callback?: Function) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  if ('function' !== typeof callback) callback = function () {};
  let isConnectedBefore = false;
  const uri =
    `mongodb://${APP_CONFIG.ENV.DATABASE.MONGODB.HOST}:${APP_CONFIG.ENV.DATABASE.MONGODB.PORT}/` +
    `${APP_CONFIG.ENV.DATABASE.MONGODB.NAME}`;
  const connectionOptions: mongoose.ConnectionOptions = {
    useNewUrlParser: true,
    // https://mongoosejs.com/docs/deprecations.html
    useFindAndModify: false,
    useCreateIndex: true,
  };
  if (APP_CONFIG.ENV.DATABASE.MONGODB.USERNAME) {
    connectionOptions.user = APP_CONFIG.ENV.DATABASE.MONGODB.USERNAME;
    connectionOptions.pass = APP_CONFIG.ENV.DATABASE.MONGODB.PASSWORD;
  }

  connect();

  function connect() {
    if (isConnectedBefore) {
      signale.await('Db reconnecting...');
    }
    mongoose.connect(uri, connectionOptions).done();
  }

  mongoose.connection.on('error', function (err) {
    signale.error('Could not connect to Mongodb: ', err);
  });

  mongoose.connection.on('disconnected', function () {
    signale.error('Db has lost connection...');
    if (!isConnectedBefore) {
      setTimeout(connect, 5000);
    }
  });

  mongoose.connection.on('connected', function () {
    isConnectedBefore = true;
    signale.success(
      `[Mongodb] "${APP_CONFIG.ENV.DATABASE.MONGODB.NAME}" has connected successfully!`,
    );
    callback();
  });

  mongoose.connection.on('reconnected', function () {
    getLogger('admin', '').info('Db has reconnected!');
  });

  process.on('SIGINT', function () {
    mongoose.connection.close().then(() => {
      getLogger('admin', '').info('Mongoose default connection disconnected through app terminal!');
      process.exit(0);
    });
  });
}
