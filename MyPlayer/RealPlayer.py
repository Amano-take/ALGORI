import math
import random
import numpy as np
#from Card import Card
#from Ruler import Ruler
import logging, socketio
import sys, os, time
from collections import defaultdict as ddict
import argparse
#from Player import Player
#from ProbabilityModel.ProbabilityModel import ProbabilityModel
#from Master import Master
#from MiniMaster import MiniMaster
from numba import jit, njit
from rich import print
class Card():
    """
    赤、黄、緑、青 * 13(0, 1, ..9, +2, skip, reverse) + wild * 2(+4, all) + shuffle + skipbind2 + Empty
    v: 0, 1, .. 9 = 0, 1, ..9
    v: 10: +2 11: skip 12: reverse
    52からがwild
    v: 0: +4, 1:all, 2:shuffle, 3:skipbind2
    white = wild 色とする
    """
    VARIATION = 56
    def __init__(self, number) -> None:
        self.card = np.zeros(Card.VARIATION+1)
        self.card[number] = 1
        self.num = number

    @classmethod
    def _from_str(cls, color:str, var:str):
        number = 0
        if color == "yellow":
            number += 13
        elif color == "green":
            number += 26
        elif color == "blue":
            number += 39
        elif color == "wild":
            number += 52

        if var == "all":
            number += 1
        elif var == "+2":
            number += 10
        elif var == "skip":
            number += 11
        elif var == "reverse":
            number += 12
        elif var == "+4":
            pass
        elif var == "skipbind2":
            number += 3
        elif var == "shuffle":
            number += 2
        return cls(number)
        
    def __str__(self):
        if self.num == Card.VARIATION:
            return "empty"
        colors = ["red", "yellow", "green", "blue", "wild"]
        color = self.num // 13
        var = self.num - color * 13
        c = colors[color]
        if var < 10 and color != 4:
            v = str(var)
        elif color == 4:
            if var == 0:
                v = "+4"
            elif var == 1:
                v = "all"
            elif var == 2:
                v = "shuffle"
            else:
                v = "skipbind2"
        else:
            vars = ["+2", "skip", "reverse"]
            v = vars[var - 10]
        return c + ":" + v
    
    def __eq__(self, other):
        if not isinstance(other, Card):
            return NotImplemented
        return self.num == other.num    

    def __lt__(self, other):
        if not isinstance(other, Card):
            return NotImplemented
        return self.num < other.num

    def __ne__(self, other):
        return not self.__eq__(other)

    def __le__(self, other):
        return self.__lt__(other) or self.__eq__(other)

    def __gt__(self, other):
        return not self.__le__(other)

    def __ge__(self, other):
        return not self.__lt__(other)

    def getnumber(self):
        return int(self.num)
class Ruler():
    def __init__(self) -> None:
        #場のカードc1に対してc2が出せるなら1, 出せないなら0
        #c1c=4に対しては全て出せるようになっている
        self.canSubmitArray = np.zeros((Card.VARIATION+1, Card.VARIATION), dtype=np.int8)
        for c1 in range(Card.VARIATION+1):
            c1c = c1 // 13
            c1v = c1 - c1c * 13
            for c2 in range(Card.VARIATION):
                c2c = c2 // 13
                c2v = c2 - c2c * 13
                #wild
                if c2c == 4:
                    self.canSubmitArray[c1][c2] = 1
                elif c1v == c2v and c1c != 4:
                    self.canSubmitArray[c1][c2] = 1
                elif c1c == c2c:
                    self.canSubmitArray[c1][c2] = 1
                elif c1 == Card.VARIATION:
                    self.canSubmitArray[c1][c2] = 1

            

        self.canSubmitColorArray = np.zeros((4, Card.VARIATION), dtype=np.int8)
        for c1 in range(4):
            for c2 in range(Card.VARIATION):
                c2c = c2 // 13
                #wild
                if c2c == 4:
                    self.canSubmitColorArray[c1][c2] = 1
                elif c1 == c2c:
                    self.canSubmitColorArray[c1][c2] = 1

        self.score = np.zeros(Card.VARIATION, dtype=np.int16)
        for i in range(Card.VARIATION):
            c = i // 13
            v = i % 13
            #wild
            if c == 4:
                self.score[i] = 50
            elif v < 10:
                self.score[i] = v
            else:
                self.score[i] = 20

    def canSubmit(self, c1: Card, color=None) -> np.ndarray:
        """
        c1: 場カード
        """
        colors = ["red", "yellow", "green", "blue"]
        if isinstance(color, str):
            return self.canSubmitColorArray[colors.index(color)]
        elif isinstance(color, int):
            return self.canSubmitColorArray[color]
        return self.canSubmitArray[c1.getnumber()]
    
    def canSubmit_byint(self, c1:int, color=None) -> np.ndarray:
        colors = ["red", "yellow", "green", "blue"]
        if isinstance(color, str):
            return self.canSubmitColorArray[colors.index(color)]
        elif isinstance(color, int):
            #wildの場合は色に基づいて
            if c1 >= 52:
                return self.canSubmitColorArray[color]
            #それ以外の場合はc1の種類に基づいて
            else:
                return self.canSubmitArray[c1]
        elif isinstance(color, np.integer):
            #wildの場合は色に基づいて
            if c1 >= 52:
                return self.canSubmitColorArray[color]
            #それ以外の場合はc1の種類に基づいて
            else:
                return self.canSubmitArray[c1]

        else:
            return self.canSubmitArray[c1]

    def getscore(self) -> np.ndarray[int]:
        return self.score
class Player():
    rule = Ruler()
    colors = ["red", "yellow", "green", "blue"]
    def __init__(self) -> None:
        self.Cards = np.zeros(Card.VARIATION, dtype=np.int8)
        self.num_cards = 0
        self.get_num = np.frompyfunc(Card.getnumber, 1, 1)
        self.logging = logging.getLogger("player")
        self.logging.setLevel(logging.WARN)
    
    def join_room_callback(self, your_id):
        self.playername2_123 = ddict()
        self.playername2_123[your_id] = 0
        self.myname= your_id

    def first_player(self, play_order):
        my_turn = play_order.index(self.myname)
        for i in range(1, 4):
            self.playername2_123[play_order[(my_turn + i)%4]] = i

    def get_card(self, c:np.ndarray[int]):
        self.num_cards = self.__get_card(self.Cards, c, self.num_cards, Card.VARIATION)
    
    @staticmethod
    @njit(cache = True)
    def __get_card(Cards:np.ndarray[np.int8], c:np.ndarray[np.int8], num_cards:int, VAR):
        if len(c) != VAR:
            num_cards += len(c)
            for i in c:
                Cards[i] += 1
        else:
            Cards += c
            num_cards += np.sum(c)
        return num_cards
    
    
    def give_all_my_cards(self):
        self.num_cards = 0
        ans = self.Cards.copy()
        self.Cards -= self.Cards
        return ans
    
    @staticmethod
    @njit(cache = True)
    def __strategy(cs:np.ndarray[np.int8]):
        i = np.where(cs > 0)[0][0]
        if i >= 52 and i != 55:
            c = np.random.randint(4)
        else:
            c = -1
        return i, c
    
    def strategy(self, cs):
        i, c = self.__strategy(cs)
        if i >= 52 and i != 55:
            self.logging.info(Player.colors[c])
        else:
            c = None
        return i, c

    def get_turn(self, c:int, color, trash=None, turn_plus = 1):
        cs = self.__get_turn(self.Cards, Player.rule.canSubmit_byint(c, color))
        if self.__all(cs):
            return -1, None
        
        #submit
        i, c = self.strategy(cs)
        self.num_cards, flag = self.__i_and_c(i, self.num_cards, self.Cards)
        if flag:
            self.logging.info("UNO!!")
        return i, c
    
    def get_turn_after_pass(self, c:int, color:int, get_card:np.ndarray[np.int8]):
        get_card = get_card[0]
        if Player.rule.canSubmit_byint(c, color)[get_card] == 0:
            return -1, None
        
        else:
            cs = np.zeros(Card.VARIATION, dtype=np.int8)
            cs[get_card] = 1
            i, c = self.strategy(cs)
            self.num_cards, flag = self.__i_and_c(i, self.num_cards, self.Cards)
            if flag:
                self.logging.info("UNO!!")
            return i, c
    
    @staticmethod
    @njit(cache = True)
    def __get_turn(Cards:np.ndarray[np.int8], rulearray:np.ndarray[np.int8]):
        cs = rulearray * Cards
        return cs
        
    @staticmethod
    @njit(cache = True)
    def __all(cs:np.ndarray[np.int8]):
        return np.all(cs==0)

    @staticmethod
    @njit(cache = True)
    def __i_and_c(i, restnum, Cards):
        Cards[i] -= 1
        restnum -= 1
        return restnum, restnum == 1

    def show_my_cards(self):
        ans = []
        for c, i in enumerate(self.Cards):
            for j in range(i):
                t = Card(c)
                ans.append(t.__str__())
        return ans
    
    def show_cards(self, cs:np.ndarray[Card]):
        ans = []
        for c in enumerate(cs):
            ans.append(c.__str__())
        return ans

    def number_of_cards(self):
        return self.num_cards
    
    def my_score(self):
        if self.num_cards == 0:
            return 0
        else:
            return np.sum(self.Cards * Player.rule.getscore())





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
ARR_COLOR = [Color.RED, Color.YELLOW, Color.GREEN, Color.BLUE] # 色変更の選択肢


"""
コマンドラインから受け取った変数等
"""
parser = argparse.ArgumentParser(description='A demo player written in Python')
parser.add_argument('host', action='store', type=str, help='Host to connect')
parser.add_argument('room_name', action='store', type=str, help='Name of the room to join')
parser.add_argument('player', action='store', type=str, help='Player name you join the game as')
parser.add_argument('event_name', action='store', nargs='?', default=None, type=str, help='Event name for test tool') # 追加


args = parser.parse_args(sys.argv[1:])
host = args.host # 接続先（ディーラープログラム or 開発ガイドラインツール）
room_name = args.room_name # ディーラー名
player = args.player # プレイヤー名
event_name = args.event_name # Socket通信イベント名
is_test_tool = TEST_TOOL_HOST_PORT in host # 接続先が開発ガイドラインツールであるかを判定
SPECIAL_LOGIC_TITLE = '◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯' # スペシャルロジック名
TIME_DELAY = 10 # 処理停止時間


once_connected = False
id = '' # 自分のID
uno_declared = {} # 他のプレイヤーのUNO宣言状況


"""
コマンドライン引数のチェック
"""
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


# 開発ガイドラインツールSTEP1で送信するサンプルデータ
TEST_TOOL_EVENT_DATA = {
    SocketConst.EMIT.JOIN_ROOM: {
        'player': player,
        'room_name': room_name,
    },
    SocketConst.EMIT.COLOR_OF_WILD: {
        'color_of_wild': 'red',
    },
    SocketConst.EMIT.PLAY_CARD: {
        'card_play': { 'color': 'black', 'special': 'wild' },
        'yell_uno': False,
        'color_of_wild': 'blue',
    },
    SocketConst.EMIT.DRAW_CARD: {},
    SocketConst.EMIT.PLAY_DRAW_CARD: {
        'is_play_card': True,
        'yell_uno': True,
        'color_of_wild': 'blue',
    },
    SocketConst.EMIT.CHALLENGE: {
        'is_challenge': True,
    },
    SocketConst.EMIT.POINTED_NOT_SAY_UNO: {
        'target': 'Player 1',
    },
    SocketConst.EMIT.SPECIAL_LOGIC: {
        'title': SPECIAL_LOGIC_TITLE,
    },
}


# Socketクライアント
sio = socketio.Client()


"""
出すカードを選出する

Args:
    cards (list): 自分の手札
    before_caard (*): 場札のカード
"""
def select_play_card(cards, before_caard):
    cards_valid = [] # ワイルド・シャッフルワイルド・白いワイルドを格納
    cards_wild = [] # ワイルドドロー4を格納
    cards_wild4 = [] # 同じ色 または 同じ数字・記号 のカードを格納

    # 場札と照らし合わせ出せるカードを抽出する
    for card in cards:
        card_special = card.get('special')
        card_number = card.get('number')
        if str(card_special) == Special.WILD_DRAW_4:
            # ワイルドドロー4は場札に関係なく出せる
            cards_wild4.append(card)
        elif (
            str(card_special) == Special.WILD or
            str(card_special) == Special.WILD_SHUFFLE or
            str(card_special) == Special.WHITE_WILD
        ):
            # ワイルド・シャッフルワイルド・白いワイルドも場札に関係なく出せる
            cards_wild.append(card)
        elif str(card.get('color')) == str(before_caard.get('color')):
            # 場札と同じ色のカード
            cards_valid.append(card)
        elif (
            (card_special and str(card_special) == str(before_caard.get('special'))) or
            ((card_number is not None or (card_number is not None and int(card_number) == 0)) and
             (before_caard.get('number') and int(card_number) == int(before_caard.get('number'))))
        ):
            # 場札と数字または記号が同じカード
            cards_valid.append(card)

    """
    出せるカードのリストを結合し、先頭のカードを返却する。
    このプログラムでは優先順位を、「同じ色 または 同じ数字・記号」 > 「ワイルド・シャッフルワイルド・白いワイルド」 > ワイルドドロー4の順番とする。
    ワイルドドロー4は本来、手札に出せるカードが無い時に出していいカードであるため、一番優先順位を低くする。
    ワイルド・シャッフルワイルド・白いワイルドはいつでも出せるので、条件が揃わないと出せない「同じ色 または 同じ数字・記号」のカードより優先度を低くする。
    """
    list = cards_valid + cards_wild + cards_wild4
    if len(list) > 0:
        return list[0]
    else:
        return None

"""
乱数取得

Args:
    num (int):

Returns:
    int:
"""
def random_by_number(num):
    return math.floor(random.random() * num)


"""
変更する色を選出する

Returns:
    str:
"""
def select_change_color():
    # このプログラムでは変更する色をランダムで選択する。
    return ARR_COLOR[random_by_number(len(ARR_COLOR))]

"""
チャンレンジするかを決定する

Returns:
    bool:
"""
def is_challenge():
    # このプログラムでは1/2の確率でチャレンジを行う。
    if random_by_number(2) >= 1:
        return True
    else:
        return False

"""
他のプレイヤーのUNO宣言漏れをチェックする

Args:
    number_card_of_player (Any):
"""
def determine_if_execute_pointed_not_say_uno(number_card_of_player):
    global id, uno_declared

    target = None
    # 手札の枚数が1枚だけのプレイヤーを抽出する
    # 2枚以上所持しているプレイヤーはUNO宣言の状態をリセットする
    for k, v in number_card_of_player.items():
        if k == id:
            # 自分のIDは処理しない
            break
        elif v == 1:
            # 1枚だけ所持しているプレイヤー
            target = k
            break
        elif k in uno_declared:
            # 2枚以上所持しているプレイヤーはUNO宣言の状態をリセットする
            del uno_declared[k]

    if target == None:
        # 1枚だけ所持しているプレイヤーがいない場合、処理を中断する
        return

    # 抽出したプレイヤーがUNO宣言を行っていない場合宣言漏れを指摘する
    if (target not in uno_declared.keys()):
        send_event(SocketConst.EMIT.POINTED_NOT_SAY_UNO, { 'target': target })
        time.sleep(TIME_DELAY / 1000)


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
def receive_event(event, data, callback = pass_func):
    print('Receive {} event.'.format(event))
    print('res_data: ', data)

    callback(data)


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
            elif not event_name in TEST_TOOL_EVENT_DATA:
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
                once_connected = True
                id = args[0].get('your_id')
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
# プレイヤーがゲームに参加
@sio.on(SocketConst.EMIT.JOIN_ROOM)
def on_join_room(data_res):
    receive_event(SocketConst.EMIT.JOIN_ROOM, data_res)


# カードが手札に追加された
@sio.on(SocketConst.EMIT.RECEIVER_CARD)
def on_reciever_card(data_res):
    receive_event(SocketConst.EMIT.RECEIVER_CARD, data_res)


# 対戦の開始
@sio.on(SocketConst.EMIT.FIRST_PLAYER)
def on_first_player(data_res):
    exit()
    print(data_res)
    receive_event(SocketConst.EMIT.FIRST_PLAYER, data_res)


# 場札の色指定を要求
@sio.on(SocketConst.EMIT.COLOR_OF_WILD)
def on_color_of_wild(data_res):
    def color_of_wild_callback(data_res):
        color = select_change_color()
        data = {
            'color_of_wild': color,
        }

        # 色変更を実行する
        send_event(SocketConst.EMIT.COLOR_OF_WILD, data)

    receive_event(SocketConst.EMIT.COLOR_OF_WILD, data_res, color_of_wild_callback)


# 場札の色が変わった
@sio.on(SocketConst.EMIT.UPDATE_COLOR)
def on_update_color(data_res):
    receive_event(SocketConst.EMIT.UPDATE_COLOR, data_res)


# シャッフルワイルドにより手札状況が変更
@sio.on(SocketConst.EMIT.SHUFFLE_WILD)
def on_shuffle_wild(data_res):
    def shuffle_wild_calback(data_res):
        global uno_declared
        uno_declared = {}
        for k, v in data_res.get('number_card_of_player').items():
            if v == 1:
                # シャッフル後に1枚になったプレイヤーはUNO宣言を行ったこととする
                uno_declared[data_res.get('player')] = True
                break
            elif k in uno_declared:
                # シャッフル後に2枚以上のカードが配られたプレイヤーはUNO宣言の状態をリセットする
                if data_res.get('player') in uno_declared:
                    del uno_declared[k]

    receive_event(SocketConst.EMIT.SHUFFLE_WILD, data_res, shuffle_wild_calback)


# 自分の番
@sio.on(SocketConst.EMIT.NEXT_PLAYER)
def on_next_player(data_res):
    def next_player_calback(data_res):
        determine_if_execute_pointed_not_say_uno(data_res.get('number_card_of_player'))

        cards = data_res.get('card_of_player')

        if (data_res.get('draw_reason') == DrawReason.WILD_DRAW_4):
            # カードを引く理由がワイルドドロー4の時、チャレンジを行うことができる。
            if is_challenge():
                send_event(SocketConst.EMIT.CHALLENGE, { 'is_challenge': True} )
                return

        if str(data_res.get('must_call_draw_card')) == 'True':
            # カードを引かないと行けない時
            send_event(SocketConst.EMIT.DRAW_CARD, {})
            return

        #  スペシャルロジックを発動させる
        special_logic_num_random = random_by_number(10)
        if special_logic_num_random == 0:
            send_event(SocketConst.EMIT.SPECIAL_LOGIC, { 'title': SPECIAL_LOGIC_TITLE })

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

            # カードを出すイベントを実行
            send_event(SocketConst.EMIT.PLAY_CARD, data)
        else:
            # 選出したカードが無かった時

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


# カードが場に出た
#ここをめもすることでtrash, の把握が出来そう。
@sio.on(SocketConst.EMIT.PLAY_CARD)
def on_play_card(data_res):
    def play_card_callback(data_res):
        global uno_declared
        # UNO宣言を行った場合は記録する
        if data_res.get('yell_uno'):
            uno_declared[data_res.get('player')] = data_res.get('yell_uno')

    receive_event(SocketConst.EMIT.PLAY_CARD, data_res, play_card_callback)


# 山札からカードを引いた
@sio.on(SocketConst.EMIT.DRAW_CARD)
def on_draw_card(data_res):
    def draw_card_callback(data_res):
        global uno_declared
        # カードが増えているのでUNO宣言の状態をリセットする
        if data_res.get('player') in uno_declared:
            del uno_declared[data_res.get('player')]

    receive_event(SocketConst.EMIT.DRAW_CARD, data_res, draw_card_callback)


# 山札から引いたカードが場に出た
@sio.on(SocketConst.EMIT.PLAY_DRAW_CARD)
def on_play_draw_card(data_res):
    def play_draw_card_callback(data_res):
        global uno_declared
        # UNO宣言を行った場合は記録する
        if data_res.get('yell_uno'):
            uno_declared[data_res.get('player')] = data_res.get('yell_uno')

    receive_event(SocketConst.EMIT.PLAY_DRAW_CARD, data_res, play_draw_card_callback)


# チャレンジの結果
@sio.on(SocketConst.EMIT.CHALLENGE)
def on_challenge(data_res):
    receive_event(SocketConst.EMIT.CHALLENGE, data_res)


# チャレンジによる手札の公開
@sio.on(SocketConst.EMIT.PUBLIC_CARD)
def on_public_card(data_res):
    receive_event(SocketConst.EMIT.PUBLIC_CARD, data_res)


# UNOコールを忘れていることを指摘
@sio.on(SocketConst.EMIT.POINTED_NOT_SAY_UNO)
def on_pointed_not_say_uno(data_res):
    receive_event(SocketConst.EMIT.POINTED_NOT_SAY_UNO, data_res)


# 対戦が終了
@sio.on(SocketConst.EMIT.FINISH_TURN)
def on_finish_turn(data_res):
    def finish_turn__callback(data_res):
        global uno_declared
        uno_declared = {}

    receive_event(SocketConst.EMIT.FINISH_TURN, data_res, finish_turn__callback)


# 試合が終了
@sio.on(SocketConst.EMIT.FINISH_GAME)
def on_finish_game(data_res):
    receive_event(SocketConst.EMIT.FINISH_GAME, data_res)


# ペナルティ発生
@sio.on(SocketConst.EMIT.PENALTY)
def on_penalty(data_res):
    def penalty_callback(data_res):
        global uno_declared
        # カードが増えているのでUNO宣言の状態をリセットする
        if data_res.get('player') in uno_declared:
            del uno_declared[data_res.get('player')]

    receive_event(SocketConst.EMIT.PENALTY, data_res, penalty_callback)


def main():
    sio.connect(
        host,
        transports=['websocket'],
    )
    sio.wait()

if __name__ == '__main__':
    main()
