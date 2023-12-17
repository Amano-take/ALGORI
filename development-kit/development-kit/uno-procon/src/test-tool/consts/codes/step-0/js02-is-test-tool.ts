export default `
const TEST_TOOL_HOST_PORT = '3000'; // 開発ガイドラインツールのポート番号 ←追加

const host = process.argv[2] || ''; // 接続先（ディーラープログラム or 開発ガイドラインツール）
const isTestTool = host.includes(TEST_TOOL_HOST_PORT); // 接続先が開発ガイドラインツールであるかを判定 ←追加

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
`;
