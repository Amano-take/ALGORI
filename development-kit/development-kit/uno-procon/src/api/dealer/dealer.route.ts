/**
 * Dealer route
 * ディーラールーター
 */
import { DealerController } from './dealer.controller';
import { router } from '../../libs/standard';

const dealerCtrl = new DealerController();

// ディーラー一覧取得
router.get('/admin/dealer', dealerCtrl.list, {
  allowAnonymous: true,
});

// ディーラー取得
router.get('/admin/dealer/:id', dealerCtrl.detailById, {
  allowAnonymous: true,
});

// ディーラー作成
router.post('/admin/dealer', dealerCtrl.create, {
  allowAnonymous: true,
});

// ディーラー削除
router.delete('/admin/dealer/:id', dealerCtrl.deleteById, {
  allowAnonymous: true,
});

// 試合開始
router.post('/admin/dealer/:id/start-dealer', dealerCtrl.startDealer, {
  allowAnonymous: true,
});

export default 'dealer';
