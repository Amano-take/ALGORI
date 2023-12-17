/**
 * Web controller
 * 管理ツールコントローラー
 */
import * as Bluebird from 'bluebird';
import { Request, Response } from 'express';

import { DealerService } from '../dealer/dealer.service';
import { PlayerService } from '../player/player.service';
import { WebService } from './web.service';
import { AppConst } from '../../commons/consts/app.const';
import { StatusGame } from '../../commons/consts/app.enum';
import { getLogger } from '../../libs/commons';
import { SocketConst } from '../../commons/consts/socket.const';

const dealerService = new DealerService();
const playerService = new PlayerService();
const webService = new WebService();
const baseTemplateData = { title: '管理者ツール', pageTitle: 'ディーラー一覧', pageName: 'list' };

// ゲームログ検索のデフォルト（盤面に影響のあるものを選択）
const EVENTS = {
  [SocketConst.EMIT.FIRST_PLAYER]: true,
  [SocketConst.EMIT.NEXT_PLAYER]: false,
  'color-change-request': false,
  [SocketConst.EMIT.COLOR_OF_WILD]: true,
  [SocketConst.EMIT.SHUFFLE_WILD]: true,
  [SocketConst.EMIT.PLAY_CARD]: true,
  [SocketConst.EMIT.DRAW_CARD]: true,
  [SocketConst.EMIT.PLAY_DRAW_CARD]: true,
  [SocketConst.EMIT.POINTED_NOT_SAY_UNO]: true,
  [SocketConst.EMIT.CHALLENGE]: true,
  [SocketConst.EMIT.PUBLIC_CARD]: false,
  [SocketConst.EMIT.SPECIAL_LOGIC]: false,
  [SocketConst.EMIT.FINISH_TURN]: true,
  [SocketConst.EMIT.FINISH_GAME]: false,
};

export class WebController {
  /**
   * ディーラー一覧取得
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async list(req: Request, res: Response) {
    try {
      // 一覧取得
      const data = await webService.list(Number(req.query.page || 1));

      // トークンを更新する
      webService.setOneTimeToken();

      // 最新のトークンを取得する
      const oneTimeToken = webService.getOneTimeToken();

      // UI描画
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
        topPath: `${req.baseUrl}/admin/web`,
      });
    } catch (e) {
      getLogger('admin', '').error(e);
      res.bad(e);
    }
  }

  /**
   * ディーラー新規追加
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async addDealer(req: Request, res: Response) {
    // 最新のトークンを取得する
    const currentToken = webService.getOneTimeToken();

    // リクエストのトークンが最新のトークンと一致しない場合、画面描画のみ行う
    if (webService.getDirty() && currentToken !== req.body.oneTimeToken) {
      getLogger('admin', '').warn('Resend add dealer post.');
      const data = await webService.list(1);

      const oneTimeToken = webService.getOneTimeToken();
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
        topPath: `${req.baseUrl}/admin/web`,
      });
    }

    // リクエストデータのバリデーションチェック
    req.checkBody('name').trim().notEmpty().withMessage(AppConst.NAME_DEALER_IS_REQUIRED);
    req
      .checkBody('totalTurn')
      .trim()
      .notEmpty()
      .withMessage(AppConst.TOTAL_TURN_IS_REQUIRED)
      .isInt({ min: 1 })
      .withMessage(AppConst.TOTAL_TURN_INVALID);
    const errors = req.validationErrors();

    try {
      if (!errors.length) {
        // バリデーションにエラーがなければ処理を続行
        const bodyCreate: any = {
          name: req.body.name, // ディーラー名
          players: [], // プレイヤーリスト（空リストで固定）
          status: StatusGame.NEW, // ゲームステータス（NEWで固定）
          totalTurn: req.body.totalTurn, // 総対戦数
          whiteWild: req.body.whiteWild, // 白いワイルドの効果
        };

        // ディーラーを作成
        await dealerService.create(bodyCreate);
        getLogger('admin', '').info('Add new dealer.');
      }

      // 最新のディーラー一覧を取得する
      const data = await webService.list(1);

      // トークンを更新する
      const oneTimeToken = webService.setOneTimeToken();

      // UI描画
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        errors,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
        topPath: `${req.baseUrl}/admin/web`,
      });
    } catch (e) {
      getLogger('admin', '').error(e);

      // 最新のディーラー一覧を取得する
      const data = await webService.list(1);

      // トークンを更新する
      const oneTimeToken = webService.setOneTimeToken();

      // UI描画
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        errors: [e],
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
        topPath: `${req.baseUrl}/admin/web`,
      });
    }
  }

  /**
   * 試合にプレイヤーを参加
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async addPlayer(req: Request, res: Response) {
    // 最新のトークンを取得する
    const currentToken = webService.getOneTimeToken();

    // リクエストのトークンが最新のトークンと一致しない場合、画面描画のみ行う
    if (webService.getDirty() && currentToken !== req.body.oneTimeToken) {
      const data = await webService.list(1);
      getLogger('admin', '').warn('Resend add player post.');

      const oneTimeToken = webService.getOneTimeToken();
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
      });
    }

    try {
      const errors = [];
      // 試合にプレイヤーを追加する
      const player = await playerService.addPlayer(req.params.id).catch((err) => {
        errors.push({
          msg: err,
        });
      });
      getLogger('admin', '').info(`Added a player to ${req.params.id}. Player: ${player}.`);

      if (!errors.length) {
        // エラーがなければ1.5秒待ってから画面描画を行う
        await Bluebird.delay(1500); // NOTE: 補助プレイヤー起動〜試合参加までの時間分
      }

      // 最新のディーラー一覧を取得する
      const data = await webService.list(1);

      // トークンを更新する
      const oneTimeToken = webService.setOneTimeToken();

      // UI描画
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        message: errors.length
          ? ''
          : `${req.params.id}のゲームにプレイヤー ${player} を追加しました。`,
        errors,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
        topPath: `${req.baseUrl}/admin/web`,
      });
    } catch (e) {
      getLogger('admin', '').error(e);
      res.bad(e);
    }
  }

  /**
   * 試合を開始
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async startDealer(req: Request, res: Response) {
    // 最新のトークンを取得する
    const currentToken = webService.getOneTimeToken();

    // リクエストのトークンが最新のトークンと一致しない場合、画面描画のみ行う
    if (webService.getDirty() && currentToken !== req.body.oneTimeToken) {
      getLogger('admin', '').warn('Resend start dealer post.');
      const data = await webService.list(1);

      const oneTimeToken = webService.getOneTimeToken();
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
      });
    }

    try {
      const errors = [];
      // 試合を開始
      await dealerService.startDealer(req.params.id).catch((err) => {
        errors.push({
          msg: err,
        });
      });
      getLogger('admin', '').info(`Start game ${req.params.id}.`);

      // 最新のディーラー一覧を取得する
      const data = await webService.list(1);

      // トークンを更新する
      const oneTimeToken = webService.setOneTimeToken();

      // UI描画
      return res.render('admin/dealer', {
        ...baseTemplateData,
        ...data,
        message: errors.length ? '' : `${req.params.id}の試合を開始しました。`,
        errors,
        MIN_PLAYER: AppConst.MIN_PLAYER,
        oneTimeToken,
        topPath: `${req.baseUrl}/admin/web`,
      });
    } catch (e) {
      getLogger('admin', '').error(e);
      res.bad(e);
    }
  }

  /**
   * プレイヤー情報を取得
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async player(req: Request, res: Response) {
    try {
      // プレイヤー情報取得
      const data = await playerService.detailByCondition({ code: req.params.id });

      // UI描画
      return res.render('admin/player', {
        ...baseTemplateData,
        ...data,
        pageName: 'player',
        pageTitle: 'プレイヤー成績',
      });
    } catch (e) {
      getLogger('admin', '').error(e);
      res.bad(e);
    }
  }

  /**
   * ゲームログ情報を取得
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async log(req: Request, res: Response) {
    try {
      // ログの検索条件
      const events = req.query.event as string[];
      const eventsCondition = typeof events === 'string' ? [events] : events;
      const params = {
        event: events ? eventsCondition : Object.keys(EVENTS).filter((name) => EVENTS[name]),
      };

      // ゲームログを取得する
      const data = await webService.log(req.params.id, params, Number(req.query.turn || 1));

      // UI描画
      return res.render('admin/log', {
        ...baseTemplateData,
        game: data.game,
        players: data.allPlayers,
        activities: data.activities,
        turnStartLog: data.turnStartLog,
        turnEndLog: data.turnEndLog,
        gameEndLog: data.gameEndLog,
        condition: data.condition,
        pageName: 'log',
        pageTitle: `ゲームログ - ${data.game.code}`,
        currentURL: req._parsedUrl.pathname,
        currentQuery: {
          ...req.query,
          event: params.event,
          turn: Number(data.condition.conditions.turn),
        },
        originalUrl: req.originalUrl,
        topPath: `${req.baseUrl}/admin/web`,
      });
    } catch (e) {
      getLogger('admin', '').error(e);
      res.bad(e);
    }
  }

  /**
   * ゲームログファイルをDL
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   * @returns
   */
  public async logDownload(req: Request, res: Response) {
    const code = req.params.id as string;

    try {
      const file = await webService.logDownload(code);
      return res.download(file);
    } catch (e) {
      getLogger('admin', '').error(e);
      res.bad(e);
    }
  }
}
