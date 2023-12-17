/**
 * Web route
 * 管理ツールルーター
 */
import { WebController } from './web.controller';
import { router } from '../../libs/standard';

const webCtrl = new WebController();

// ディーラー一覧取得
router.get('/admin/web', webCtrl.list, {
  allowAnonymous: true,
});

// ディーラー新規作成
router.post('/admin/web/new', webCtrl.addDealer, {
  allowAnonymous: true,
});

// 試合にプレイヤーを追加
router.post('/admin/web/:id/player', webCtrl.addPlayer, {
  allowAnonymous: true,
});

// 試合開始
router.post('/admin/web/:id/start-dealer', webCtrl.startDealer, {
  allowAnonymous: true,
});

// プレイヤー取得
router.get('/admin/web/player/:id', webCtrl.player, {
  allowAnonymous: true,
});

// ゲームログ取得
router.get('/admin/web/log/:id', webCtrl.log, {
  allowAnonymous: true,
});

// ゲームログDL取得
router.get('/admin/web/log/download/:id', webCtrl.logDownload, {
  allowAnonymous: true,
});

export default 'web';
