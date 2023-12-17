export default `
import argparse
import os
import sys
import socketio

from rich import print


# 追加 ここから
"""
定数
"""
# Socket通信の全イベント名
class SocketConst:
    class EMIT:
        JOIN_ROOM = 'join-room' # 試合参加
        RECEIVER_CARD = 'receiver-card' # カードの配布
        FIRST_PLAYER = 'first-player' # 対戦開始
        COLOR_OF_WILD = 'color-of-wild' # 場札の色を変更する
        UPDATE_COLOR = 'update-color' # 場札の色が変更された
        SHUFFLE_WILD = 'shuffle-wild' # シャッフルしたカードの配布
        NEXT_PLAYER = 'next-player' # 自分の手番
        PLAY_CARD = 'play-card' # カードを出す
        DRAW_CARD = 'draw-card' # カードを山札から引く
        PLAY_DRAW_CARD = 'play-draw-card' # 山札から引いたカードを出す
        CHALLENGE = 'challenge' # チャレンジ
        PUBLIC_CARD = 'public-card' # 手札の公開
        POINTED_NOT_SAY_UNO = 'pointed-not-say-uno' # UNO宣言漏れの指摘
        SPECIAL_LOGIC = 'special-logic' # スペシャルロジック
        FINISH_TURN = 'finish-turn' # 対戦終了
        FINISH_GAME = 'finish-game' # 試合終了
        PENALTY = 'penalty' # ペナルティ


# UNOのカードの色
class Color:
    RED = 'red' # 赤
    YELLOW = 'yellow' # 黄
    GREEN = 'green' # 緑
    BLUE = 'blue' # 青
    BLACK = 'black' # 黒
    WHITE = 'white' # 白


# UNOの記号カード種類
class Special:
    SKIP = 'skip' # スキップ
    REVERSE = 'reverse' # リバース
    DRAW_2 = 'draw_2' # ドロー2
    WILD = 'wild' # ワイルド
    WILD_DRAW_4 = 'wild_draw_4' # ワイルドドロー4
    WILD_SHUFFLE = 'wild_shuffle' # シャッフルワイルド
    WHITE_WILD = 'white_wild' # 白いワイルド


# カードを引く理由
class DrawReason:
    DRAW_2 = 'draw_2' # 直前のプレイヤーがドロー2を出した場合
    WILD_DRAW_4 = 'wild_draw_4' # 直前のプレイヤーがワイルドドロー4を出した場合
    BIND_2 = 'bind_2' # 直前のプレイヤーが白いワイルド（バインド2）を出した場合
    SKIP_BIND_2 = 'skip_bind_2' # 直前のプレイヤーが白いワイルド（スキップバインド2）を出した場合
    NOTHING = 'nothing' # 理由なし
# 追加 ここまで


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

def main():
    sio.connect(
        host,
        transports=['websocket'],
    )
    sio.wait()

if __name__ == '__main__':
    main()
`;
