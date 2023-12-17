export default `
const host = process.argv[2] || ''; // 接続先（ディーラープログラム or 開発ガイドラインツール）

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
