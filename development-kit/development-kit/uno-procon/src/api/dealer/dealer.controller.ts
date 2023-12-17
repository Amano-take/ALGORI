/**
 * Dealer controller
 * ディーラーコントローラー
 */
import { Request, Response } from 'express';

import { AppConst } from '../../commons/consts/app.const';
import { StatusGame } from '../../commons/consts/app.enum';
import { DealerService } from './dealer.service';

const dealerService = new DealerService();

export class DealerController {
  /**
   * ディーラー一覧取得
   * @api {GET} api/v1/admin/dealer 1. List
   * @apiName list
   * @apiGroup Dealer
   * @apiDescription List dealer
   * @apiVersion  1.0.0
   * @apiUse failed
   * @apiUse header
   * @apiUse lang
   *
   * @apiSuccessExample {JSON} Response: HTTP/1.1 200 OK
   [{
      "_id": "5d7b450e3d3be772ab608673",
      "code": "D-00000001",
      "name": "Dealer 1",
      "status": "new",
      "players": ["player 1", "player 2"],
      "totalTrun: 1000,
      "whiteWild": "bind_2",
      "date_created": "2019-09-13T07:28:14.706Z",
      "date_updated": "2019-09-13T07:28:14.706Z"
   },
   {
      "_id": "5d7b450e3d3be772ab608672",
      "code": "D-00000002",
      "name": "Dealer 2",
      "status": "starting",
      "players": ["player 3", "player 4"],
      "totalTrun: 1000,
      "whiteWild": "bind_2",
      "date_created": "2019-09-13T07:28:14.706Z",
      "date_updated": "2019-09-13T07:28:14.706Z"
   }]
   *
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   */
  public list(req: Request, res: Response) {
    const lang = req.query.lang;
    const params: any = {
      paginate: { page: req.query.page },
      order: req.query.order,
      lang: lang,
    };
    dealerService
      .list(params)
      .then((data) => {
        return res.ok(data);
      })
      .catch((error) => {
        return res.bad(error);
      });
  }

  /**
   * 指定したIDに該当するディーラーを取得する
   * @api {GET} api/v1/admin/dealer/:id 2. Detail
   * @apiName detail
   * @apiGroup Dealer
   * @apiDescription Detail dealer by id
   * @apiVersion  1.0.0
   * @apiUse failed
   * @apiUse lang
   *
   * @apiParam (Prams) {String} id Dealer id
   * @apiSuccessExample {JSON} Response: HTTP/1.1 200 OK
   {
      "_id": "5d7b450e3d3be772ab608672",
      "code": "D-00000002",
      "name": "Dealer 2",
      "status": "starting",
      "players": ["player 3", "player 4"],
      "totalTrun: 1000,
      "whiteWild": "bind_2",
      "date_created": "2019-09-13T07:28:14.706Z",
      "date_updated": "2019-09-13T07:28:14.706Z"
   }
   *
   * @param {Request} req リクエスト
   * @param {Response} res レスポンス
   */
  public detailById(req: Request, res: Response) {
    req
      .checkParams('id')
      .trim()
      .notEmpty()
      .withMessage(AppConst.COMMON_ID_IS_REQUIRED)
      .isMongoId()
      .withMessage(AppConst.COMMON_ID_INVALID);
    const errors = req.validationErrors();
    if (errors) {
      return res.badParam(errors);
    }

    dealerService
      .detailById(req.params.id)
      .then((dealer) => {
        return res.ok(dealer);
      })
      .catch((error) => {
        return res.bad(error);
      });
  }

  /**
   * ディーラーを新規作成する
   * @api {POST} api/v1/admin/dealer 4. Admin create Dealer
   * @apiName post
   * @apiGroup Dealer
   * @apiDescription [Admin] Admin create Dealer
   * @apiVersion  1.0.0
   * @apiUse header
   * @apiUse failed
   * @apiUse lang
   *
   * @apiParam (Body) {String} name Name Dealer
   * @apiSuccessExample {JSON} Response: HTTP/1.1 200 OK
   {
      "_id": "5d7b450e3d3be772ab608672",
      "code": "D-00000002",
      "name": "Dealer 2",
      "status": "new",
      "players": [],
      "totalTrun: 1000,
      "whiteWild": "bind_2",
      "date_created": "2019-09-13T07:28:14.706Z",
      "date_updated": "2019-09-13T07:28:14.706Z"
   }
   */
  public create(req: Request, res: Response) {
    req.checkBody('name').trim().notEmpty().withMessage(AppConst.NAME_DEALER_IS_REQUIRED);
    req
      .checkBody('totalTurn')
      .trim()
      .notEmpty()
      .withMessage(AppConst.TOTAL_TURN_IS_REQUIRED)
      .isInt({ min: 1 })
      .withMessage(AppConst.TOTAL_TURN_INVALID);
    const errors = req.validationErrors();
    if (errors) {
      return res.badParam(errors);
    }

    const bodyCreate: any = {
      name: req.body.name,
      players: [],
      status: StatusGame.NEW,
      totalTurn: req.body.totalTurn,
      whiteWild: req.body.whiteWild,
    };
    dealerService
      .create(bodyCreate)
      .then((dealer) => {
        return res.ok(dealer);
      })
      .catch((error) => {
        return res.bad(error);
      });
  }

  /**
   * 指定したIDに該当するディーラーを削除する
   * @api {DELETE} api/v1/admin/dealer/:id 3. Delete By Id
   * @apiName delete
   * @apiGroup Dealer
   * @apiDescription [Admin] Delete dealer by id
   * @apiVersion  1.0.0
   * @apiUse header
   * @apiUse failed
   * @apiUse lang
   *
   * @apiParam (Param) {String} id Dealer id
   * @apiSuccessExample {JSON} Response: HTTP/1.1 200 OK
   {
      "message": "Delete Dealer success."
   }
   */
  public deleteById(req: Request, res: Response) {
    req
      .checkParams('id')
      .trim()
      .notEmpty()
      .withMessage(AppConst.COMMON_ID_IS_REQUIRED)
      .isMongoId()
      .withMessage(AppConst.COMMON_ID_INVALID);
    const errors = req.validationErrors();
    if (errors) {
      return res.badParam(errors);
    }

    dealerService
      .deleteById(req.params.id)
      .then(() => {
        return res.ok({ message: AppConst.COMMON_DELETE_SUCCESS });
      })
      .catch((error) => {
        return res.bad(error);
      });
  }

  public startDealer(req: Request, res: Response) {
    req.checkParams('id').trim().notEmpty().withMessage(AppConst.COMMON_ID_IS_REQUIRED);
    const errors = req.validationErrors();
    if (errors) {
      return res.badParam(errors);
    }

    dealerService
      .startDealer(req.params.id)
      .then((desk) => {
        return res.ok(desk);
      })
      .catch((error) => {
        return res.bad(error);
      });
  }
}
