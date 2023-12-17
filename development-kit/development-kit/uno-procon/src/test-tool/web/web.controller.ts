import { Request, Response } from 'express';
import { SocketConst } from '../../commons/consts/socket.const';

import delaerToPlayerData from '../consts/delaer-to-player.data';
import { CodeConsts as JsCodeConsts } from '../consts/code.consts.javascript';
import { CodeConsts as PyCodeConsts } from '../consts/code.consts.python';

const getLanguage = (req: Request) => {
  const { lang } = req.query;

  switch (lang) {
    case 'python':
      return {
        name: 'python',
        codes: PyCodeConsts,
      };
    case 'javascript':
    default:
      return {
        name: 'javascript',
        codes: JsCodeConsts,
      };
  }
};

export class WebController {
  /**
 * @api {GET} api/v1/admin/test-tool
 * @apiName test-tool
 * @apiGroup TestTool
 * @apiDescription Test tool dashboard
 * @apiVersion 1.0.0
 * @apiUse failed
 * @apiUse header
 *
 * @apiSuccessExample {JSON} Response: HTTP/1.1 200 OK
 * 
  {
    title: 'プレイヤーからディーラーへの通信',
    url: 'B-002'
  },
  {
    title: 'ディーラーからプレイヤーへの通信',
    url: 'B-003'
  },
  {
    title: '1試合行う',
    url: 'B-004'
  }      
*/

  public testTool(req: Request, res: Response) {
    const lang = getLanguage(req);

    return res.render('test-tool/menu', {
      title: '開発ガイドライン',
      pageTitle: '開発手順',
      lang: lang.name || 'javascript',
      steps: [
        {
          title: 'STEP0: 開発準備',
          url: 'preparation',
          btnTitle: '開発準備',
        },
        {
          title: 'STEP1: プレイヤーからディーラーへの通信',
          url: 'player-to-dealer',
          btnTitle: '各イベント単体実行',
        },
        {
          title: 'STEP2: ディーラーからプレイヤーへの通信',
          url: 'dealer-to-player',
          btnTitle: '各イベント単体実行',
        },
        {
          title: 'STEP3: 詳細実装をする',
          url: 'detail',
          btnTitle: '実装を行う',
        },
        {
          title: 'STEP4: 1試合行う',
          url: 'game',
          btnTitle: '1試合行う',
        },
      ],
      topPath: `${req.baseUrl}/test-tool`,
    });
  }

  /**
   * @api {GET} api/v1/admin/test-tool/preparation
   * @apiName preparation
   * @apiGroup TestTool
   * @apiDescription Test tool preparation
   * @apiVersion 1.0.0
   * @apiUse failed
   * @apiUse header
   */
  public preparation(req: Request, res: Response) {
    const lang = getLanguage(req);

    return res.render('test-tool/step-0', {
      title: '開発ガイドライン',
      pageTitle: 'STEP 0：開発準備',
      lang: lang.name || 'javascript',
      codes: lang.codes.PREPARATION,
      topPath: `${req.baseUrl}/test-tool`,
    });
  }

  /**
   * @api {GET} api/v1/admin/test-tool/player-to-dealer
   * @apiName test-player-to-dealer
   * @apiGroup TestTool
   * @apiDescription Test tool game
   * @apiVersion 1.0.0
   * @apiUse failed
   * @apiUse header
   */
  public testPlayerToDealer(req: Request, res: Response) {
    const lang = getLanguage(req);

    return res.render('test-tool/step-1', {
      title: '開発ガイドライン',
      pageTitle: 'STEP 1：プレイヤーからディーラーへの通信',
      lang: lang.name || 'javascript',
      codes: lang.codes.PLAYER_TO_DEALER,
      events: [
        'join-room',
        'color-of-wild',
        'play-card',
        'draw-card',
        'play-draw-card',
        'challenge',
        'pointed-not-say-uno',
        'special-logic',
      ],
      topPath: `${req.baseUrl}/test-tool`,
    });
  }

  /**
   * @api {GET} api/v1/admin/test-tool/dealer-to-player
   * @apiName test-dealer-to-player
   * @apiGroup TestTool
   * @apiDescription Test tool dealer-to-player
   * @apiVersion 1.0.0
   * @apiUse failed
   * @apiUse header
   */
  public testDealerToPlayer(req: Request, res: Response) {
    const lang = getLanguage(req);

    return res.render('test-tool/step-2', {
      title: '開発ガイドライン',
      pageTitle: 'STEP2: ディーラーからプレイヤーへの通信',
      lang: lang.name || 'javascript',
      codes: lang.codes.DEALER_TO_PLAYER,
      events: delaerToPlayerData,
      topPath: `${req.baseUrl}/test-tool`,
    });
  }

  /**
   * @api {GET} api/v1/admin/test-tool/dealer-to-player/:eventName/:index
   * @apiName send-dealer-to-player
   * @apiGroup TestTool
   * @apiDescription Test tool sender dealer-to-player
   * @apiVersion 1.0.0
   * @apiUse failed
   * @apiUse header
   */
  public sentDealerToPlayer(req: Request, res: Response) {
    const index = Number(req.params.index);
    const eventName = req.params.eventName.replace(/-/g, '_').toUpperCase();
    const socketEventName = SocketConst.EMIT[eventName];
    if (Number.isNaN(index) || !socketEventName) {
      res.send(`Bad Request.`);
      return;
    }

    const eventData = delaerToPlayerData.find(
      (socketEvent) => socketEvent.name === req.params.eventName,
    );

    if (!eventData) {
      res.send(`Not found event. ${req.params.eventName}`);
      return;
    }

    const testData = eventData.list[index];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TestToolSocketService } = require('../commons/sockets/socket-io.service');
    TestToolSocketService.sendEvent(socketEventName, testData.data);

    return res.send(testData);
  }

  /**
   * @api {GET} api/v1/admin/test-tool/detail
   * @apiName detail
   * @apiGroup TestTool
   * @apiDescription Test tool detail
   * @apiVersion 1.0.0
   * @apiUse failed
   * @apiUse header
   */
  public detail(req: Request, res: Response) {
    const lang = getLanguage(req);

    return res.render('test-tool/step-3', {
      title: '開発ガイドライン',
      pageTitle: 'STEP 3：詳細実装をする',
      lang: lang.name || 'javascript',
      codes: lang.codes.DETAIL,
      topPath: `${req.baseUrl}/test-tool`,
    });
  }

  /**
   * @api {GET} api/v1/admin/test-tool/game
   * @apiName game
   * @apiGroup TestTool
   * @apiDescription Test tool game
   * @apiVersion 1.0.0
   * @apiUse failed
   * @apiUse header
   */
  public game(req: Request, res: Response) {
    const lang = getLanguage(req);

    return res.render('test-tool/step-4', {
      title: '開発ガイドライン',
      pageTitle: 'STEP 4：1試合行う',
      lang: lang.name || 'javascript',
      topPath: `${req.baseUrl}/test-tool`,
    });
  }
}
