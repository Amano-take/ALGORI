export default `
import argparse
import os
import sys
import socketio # ←追加

from rich import print


TEST_TOOL_HOST_PORT = '3000' # 開発ガイドラインツールのポート番号


parser = argparse.ArgumentParser(description='A demo player written in Python')
parser.add_argument('host', action='store', type=str, help='Host to connect')
parser.add_argument('room_name', action='store', type=str, help='Name of the room to join')
parser.add_argument('player', action='store', type=str, help='Player name you join the game as')

args = parser.parse_args(sys.argv[1:])
host = args.host # 接続先（ディーラープログラム or 開発ガイドラインツール）
room_name = args.room_name # ディーラー名
player = args.player # プレイヤー名
is_test_tool = TEST_TOOL_HOST_PORT in host # 接続先が開発ガイドラインツールであるかを判定


if not host:
    # 接続先のhostが指定されていない場合はプロセスを終了する
    print('Host missed')
    os._exit(0)
else:
    print('Host: {}'.format(host))

# ディーラー名とプレイヤー名の指定があることをチェックする
if not room_name or not player:
    print('Arguments invalid')

    if not is_test_tool:
        # 接続先がディーラープログラムの場合はプロセスを終了する
        os._exit(0)
else:
    print('Dealer: {}, Player: {}'.format(room_name, player))


# 追加 ここから
# Socketクライアント
sio = socketio.Client()

"""
Socket通信の確立
"""
@sio.on('connect')
def on_connect():
    print('Client connect successfully!')


"""
Socket通信を切断
"""
@sio.on('disconnect')
def on_disconnect():
    print('Client disconnect.')
    os._exit(0)
# 追加 ここまで

def main():
    sio.connect(
        host,
        transports=['websocket'],
    )
    sio.wait()

if __name__ == '__main__':
    main()
`;
