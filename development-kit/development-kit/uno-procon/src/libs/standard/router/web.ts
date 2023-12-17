import * as express from 'express';
import * as http from 'http';

import APP_CONFIG from '../../../configs/app.config';
import { AppConst } from '../../../commons/consts/app.const';

const _webRouter = express.Router();
const baseUrl = `http://localhost:${APP_CONFIG.ENV.APP.PORT}/${AppConst.API_PREFIX}/${AppConst.API_VERSION}`;
const baseTemplateData = { title: '管理者ツール' };

const list = (page, callback) => {
  http.get(`${baseUrl}/admin/dealer?page=${page || 1}&order=desc`, (response) => {
    let body = '';
    response.setEncoding('utf8');

    response.on('data', (chunk) => {
      body += chunk;
    });

    response
      .on('end', () => {
        const parseData = JSON.parse(body);
        callback(null, parseData.data);
      })
      .on('error', (e) => {
        callback(e);
      });
  });
};

_webRouter.get('/web', (req, res) => {
  list(req.query.page, (err, data) => {
    if (err) {
      res.bad(err.message);
    }

    res.render('index', {
      ...baseTemplateData,
      ...data,
      page: 'list',
      pageTitle: 'ディーラー一覧',
    });
  });
});

_webRouter.post('/web/dealer', (req, res) => {
  list(1, (err, data) => {
    if (err) {
      res.bad(err.message);
    }

    res.render('index', {
      ...baseTemplateData,
      ...data,
      page: 'list',
      pageTitle: 'ディーラー一覧',
    });
  });
});

export const webRouter = _webRouter;
