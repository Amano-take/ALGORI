export default `
const TEST_TOOL_HOST_PORT = '3000'; // 開発ガイドラインツールのポート番号

const host = process.argv[2] || ''; // 接続先（ディーラープログラム or 開発ガイドラインツール）
const roomName = process.argv[3] || ''; // ディーラー名 ←追加
const isTestTool = host.includes(TEST_TOOL_HOST_PORT); // 接続先が開発ガイドラインツールであるかを判定

/**
 * コマンドライン引数のチェック
 */
if (!host) {
  // 接続先のhostが指定されていない場合はプロセスを終了する
  console.log('Host missed');
  process.exit();
} else {
  console.log(\`Host: \${host}\`);
}

/** 追加 ここから */
// ディーラー名とプレイヤー名の指定があることをチェックする
if (!roomName) {
  console.log('Arguments invalid');
  if (!isTestTool) {
    // 接続先がディーラープログラムの場合はプロセスを終了する
    process.exit();
  }
} else {
  console.log(\`Dealer: \${roomName}\`);
}
/** 追加 ここまで */
`;
