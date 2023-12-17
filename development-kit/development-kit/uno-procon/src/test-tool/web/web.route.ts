import { WebController } from './web.controller';
import * as express from 'express';

const router = express.Router();

const webCtrl = new WebController();

router.get('/test-tool', webCtrl.testTool);

router.get('/test-tool/preparation', webCtrl.preparation);

router.get('/test-tool/player-to-dealer', webCtrl.testPlayerToDealer);

router.get('/test-tool/dealer-to-player', webCtrl.testDealerToPlayer);

router.get('/test-tool/dealer-to-player/:eventName/:index', webCtrl.sentDealerToPlayer);

router.get('/test-tool/detail', webCtrl.detail);

router.get('/test-tool/game', webCtrl.game);

export default router;
