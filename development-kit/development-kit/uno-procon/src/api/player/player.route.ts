/**
 * Player route
 * プレイヤールーター
 */
import { PlayerController } from './player.controller';
import { router } from '../../libs/standard';

const playerCtrl = new PlayerController();

// プレイヤー一覧取得
router.get('/admin/player', playerCtrl.list, {
  allowAnonymous: true,
});

// プレイヤー追加
router.post('/admin/player/:id/add-player', playerCtrl.addPlayer, {
  allowAnonymous: true,
});

export default 'player';
