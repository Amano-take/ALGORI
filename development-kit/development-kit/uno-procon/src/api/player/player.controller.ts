/**
 * Player controller
 * プレイヤーコントローラー
 */
import { Request, Response } from 'express';

import { PlayerService } from './player.service';

const playerService = new PlayerService();

export class PlayerController {
  /**
   * プレイヤー一覧取得
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   */
  public list(req: Request, res: Response) {
    const lang = req.query.lang;
    const params: any = {
      paginate: req.query,
      lang: lang,
    };
    playerService
      .list(params)
      .then((data) => {
        return res.ok(data);
      })
      .catch((error) => {
        return res.bad(error);
      });
  }

  /**
   * プレイヤーの新規追加
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   */
  public addPlayer(req: Request, res: Response) {
    playerService
      .addPlayer(req.params.id)
      .then((data) => {
        return res.ok(data);
      })
      .catch((error) => {
        return res.bad(error);
      });
  }
}
