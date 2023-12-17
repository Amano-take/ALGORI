export default `
import argparse
import os
import sys
import socketio

from rich import print


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


TEST_TOOL_HOST_PORT = '3000' # 開発ガイドラインツールのポート番号


parser = argparse.ArgumentParser(description='A demo player written in Python')
parser.add_argument('host', action='store', type=str, help='Host to connect')
parser.add_argument('room_name', action='store', type=str, help='Name of the room to join')
parser.add_argument('player', action='store', type=str, help='Player name you join the game as')
parser.add_argument('event_name', action='store', nargs='?', default=None, type=str, help='Event name for test tool')

args = parser.parse_args(sys.argv[1:])
host = args.host # 接続先（ディーラープログラム or 開発ガイドラインツール）
room_name = args.room_name # ディーラー名
player = args.player # プレイヤー名
event_name = args.event_name # Socket通信イベント名
is_test_tool = TEST_TOOL_HOST_PORT in host # 接続先が開発ガイドラインツールであるかを判定

once_connected = False
id = '' # 自分のID


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


TEST_TOOL_EVENT_DATA = {
    # サンプル ここから
    SocketConst.EMIT.JOIN_ROOM: {
        'player': player,
        'room_name': room_name,
    }
    # サンプル ここまで
}


# Socketクライアント
sio = socketio.Client()


def select_play_card(cards, before_caard):
    # カードを選択するロジックをご自身で自由に実装してください。


def select_change_color():
    # カードを選択するロジックをご自身で自由に実装してください。


# 追加 ここから
def is_challenge():
    # チャンレンジを行うか判定する処理を自由に記述してください。
# 追加 ここまで


"""
個別コールバックを指定しないときの代替関数
"""
def pass_func(err):
    return


"""
送信イベント共通処理

Args:
    event (str): Socket通信イベント名
    data (Any): 送信するデータ
    callback (func): 個別処理
"""
def send_event(event, data, callback = pass_func):
    print('Send {} event.'.format(event))
    print('req_data: ', data)

    def after_func(err, res):
        if err:
            print('{} event failed!'.format(event))
            print(err)
            return

        print('Send {} event.'.format(event))
        print('res_data: ', res)
        callback(res)

    sio.emit(event, data, callback=after_func)


"""
受信イベント共通処理

Args:
    event (str): Socket通信イベント名
    data (Any): 送信するデータ
    callback (func): 個別処理
"""
def receive_event(event, res, callback = pass_func):
    print('Receive {} event.'.format(event))
    print('res_data: ', res)

    callback(res)


"""
Socket通信の確立
"""
@sio.on('connect')
def on_connect():
    print('Client connect successfully!')

    if not once_connected:
        if is_test_tool:
            # テストツールに接続
            if not event_name:
                # イベント名の指定がない（開発ガイドラインSTEP2の受信のテストを行う時）
                print('Not found event name')
            elif not TEST_TOOL_EVENT_DATA.get(event_name):
                # イベント名の指定があり、テストデータが定義されていない場合はエラー
                print('Undefined test data. eventName: ', event_name)
            else:
                # イベント名の指定があり、テストデータが定義されている場合は送信する(開発ガイドラインSTEP1の送信のテストを行う時)
                send_event(event_name, TEST_TOOL_EVENT_DATA[event_name])
        else:
            # ディーラープログラムに接続
            data = {
                'room_name': room_name,
                'player': player,
            }

            def join_room_callback(*args):
                global once_connected, id
                print('Client join room successfully!')
                print(args[1])
                once_connected = True
                id = args[1].get('your_id')
                print('My id is {}'.format(id))

            send_event(SocketConst.EMIT.JOIN_ROOM, data, join_room_callback)


"""
Socket通信を切断
"""
@sio.on('disconnect')
def on_disconnect():
    print('Client disconnect.')
    os._exit(0)


"""
Socket通信受信
"""
# TODO 受信する全てのイベントの処理を記述してください。
# プレイヤーがゲームに参加
@sio.on(SocketConst.EMIT.JOIN_ROOM)
def on_join_room(data_res):
    receive_event(SocketConst.EMIT.JOIN_ROOM, data_res)


# 場札の色指定を要求
@sio.on(SocketConst.EMIT.COLOR_OF_WILD)
def on_color_of_wild(data_res):
    def color_of_wild_callback(data_res):
        color_of_wild = select_change_color()
        data = {
            'color_of_wild': color,
        }

        # 色変更を実行する
        send_event(SocketConst.EMIT.COLOR_OF_WILD, data)

    receive_event(SocketConst.EMIT.COLOR_OF_WILD, data_res)


# 自分の番
@ sio.on(SocketConst.EMIT.NEXT_PLAYER)
def on_next_player(data_res):
    def next_player_calback(data_res):
        cards = data_res.get('card_of_player')

        # 追加 ここから
        if data_res.get('draw_reason') == DrawReason.WILD_DRAW_4:
        is_challenge_data = is_challenge()
        if is_challenge_data:
          send_challenge(is_challenge_data)
        # 追加 ここまで

        if str(data_res.get('must_call_draw_card')) == 'True':
            # カードを引かないと行けない時
            send_event(SocketConst.EMIT.DRAW_CARD, {})
            return

        play_card = select_play_card(cards, data_res.get('card_before'))

        if play_card:
            # 選出したカードがある時
            print('selected card: {} {}'.format(play_card.get('color'), play_card.get('number') or play_card.get('special')))

            data = {
                'card_play': play_card,
                'yell_uno': len(cards) == 2, # 残り手札数を考慮してUNOコールを宣言する
            }

            if play_card.get('special') == Special.WILD or play_card.get('special') == Special.WILD_DRAW_4:
                color = select_change_color()
                data['color_of_wild'] = color

            send_event(SocketConst.EMIT.PLAY_CARD, data)
        else:
            # 選出したカードが無かった時
            if not res.get('can_play_draw_card'):
                return

            # draw-cardイベント受信時の個別処理
            def draw_card_callback(res):
                if not res.get('can_play_draw_card'):
                    # 引いたカードが場に出せないので処理を終了
                    return

                # 以後、引いたカードが場に出せるときの処理
                data = {
                    'is_play_card': True,
                    'yell_uno': len(cards + res.get('draw_card')) == 2, # 残り手札数を考慮してUNOコールを宣言する
                }

                play_card = res.get('draw_card')[0]
                if play_card.get('special') == Special.WILD or play_card.get('special') == Special.WILD_DRAW_4:
                    color = select_change_color()
                    data['color_of_wild'] = color


                # 引いたカードを出すイベントを実行
                send_event(SocketConst.EMIT.PLAY_DRAW_CARD, data)

            # カードを引くイベントを実行
            send_event(SocketConst.EMIT.DRAW_CARD, {}, draw_card_callback)

    receive_event(SocketConst.EMIT.NEXT_PLAYER, data_res, next_player_calback)


def main():
    sio.connect(
        host,
        transports=['websocket'],
    )
    sio.wait()

if __name__ == '__main__':
    main()
`;
