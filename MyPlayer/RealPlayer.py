import math, random, bisect
import logging
import sys, os, time
import numpy as np
from collections import defaultdict as ddict
import socketio
import argparse
from numba import njit
from rich import print


class Card:
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
        self.card = np.zeros(Card.VARIATION + 1)
        self.card[number] = 1
        self.num = number

    @classmethod
    def _from_str(cls, cardict:dict):
        number = 0
        color = cardict["color"]
        if color == "yellow":
            number += 13
        elif color == "green":
            number += 26
        elif color == "blue":
            number += 39
        elif color == "black":
            number += 52
        elif color == "white":
            number += 55

        if "number" in cardict:
            number += int(cardict["number"])
        elif "special" in cardict:
            var = cardict["special"]
            if var == "all":
                number += 1
            elif var == "draw_2":
                number += 10
            elif var == "skip":
                number += 11
            elif var == "reverse":
                number += 12
            elif var == "wild_draw_4":
                number = 52 
            elif var == "white_wild":
                number = 55
            elif var == "wild_shuffle":
                number = 54
            elif var == "wild":
                number = 53
        
        return number
    
    @classmethod
    def _to_str(cls, number):
        ans = ddict(str)
        colors = ["red", "yellow", "green", "blue", "black", "white"]
        color = number // 13
        var = number - color * 13
        if color < 4:
            ans["color"] = colors[color]
            if var < 10:
                ans["number"] = var
            else:
                vars = ["+2", "skip", "reverse"]
                ans["special"] = vars[var - 10]
        elif color == 4:
            if var == 0:
                ans["color"] = "black"
                ans["special"] = "wild_draw_4"
            elif var == 1:
                ans["special"] = "wild"
                ans["color"] = "black"
            elif var == 2:
                ans["special"] = "wild_shuffle"
                ans["color"] = "black"
            else:
                ans["special"] = "white_wild"
                ans["color"] = "white"
        return dict(ans)

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
class Ruler:
    def __init__(self) -> None:
        # 場のカードc1に対してc2が出せるなら1, 出せないなら0
        # c1c=4に対しては全て出せるようになっている
        self.canSubmitArray = np.zeros(
            (Card.VARIATION + 1, Card.VARIATION), dtype=np.int8
        )
        for c1 in range(Card.VARIATION + 1):
            c1c = c1 // 13
            c1v = c1 - c1c * 13
            for c2 in range(Card.VARIATION):
                c2c = c2 // 13
                c2v = c2 - c2c * 13
                # wild
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
                # wild
                if c2c == 4:
                    self.canSubmitColorArray[c1][c2] = 1
                elif c1 == c2c:
                    self.canSubmitColorArray[c1][c2] = 1

        self.score = np.zeros(Card.VARIATION, dtype=np.int16)
        for i in range(Card.VARIATION):
            c = i // 13
            v = i % 13
            # wild
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

    def canSubmit_byint(self, c1: int, color=None) -> np.ndarray:
        colors = ["red", "yellow", "green", "blue"]
        if isinstance(color, str):
            return self.canSubmitColorArray[colors.index(color)]
        elif isinstance(color, int):
            # wildの場合は色に基づいて
            if c1 >= 52:
                return self.canSubmitColorArray[color]
            # それ以外の場合はc1の種類に基づいて
            else:
                return self.canSubmitArray[c1]
        elif isinstance(color, np.integer):
            # wildの場合は色に基づいて
            if c1 >= 52:
                return self.canSubmitColorArray[color]
            # それ以外の場合はc1の種類に基づいて
            else:
                return self.canSubmitArray[c1]

        else:
            return self.canSubmitArray[c1]

    def getscore(self) -> np.ndarray[int]:
        return self.score
class Master:
    player_num = 4
    card_plus_two = set([10, 23, 36, 49])
    card_skip = set([11, 24, 37, 50])
    card_reverse = set([12, 25, 38, 51])
    card_plus_four = set([52])
    card_shuffle = set([54])
    card_skipbind2 = set([55])


    def __init__(self, logobject:logging.Logger) -> None:
        self.logger = logobject
        self.level = logobject.level
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)

    #自分を０として本来の順序順に1, 2, 3
    def set_board(self, deck:np.ndarray[Card], reverse:int, my_deck:np.ndarray[int], other_decks:np.ndarray[np.ndarray[int]], trash:list, action, color, desk, player_rest) -> np.ndarray[np.int16]:
        #モンテカルロなのでplayerはランダムプレイ
        self.players = [RandomPlayer() for _ in range(Master.player_num)]
        self.turn = 0
        self.desk = desk
        self.deck = deck.copy()
        self.trash=trash.copy()
        self.turn_plus = reverse
        self.player_rest = player_rest
        self.desk_color = color
        #playerにカードを渡す。
        self.players[0].Cards = my_deck.copy()
        self.players[0].num_cards = len(my_deck)
        for i in range(1, 4):
            self.players[i].get_card(other_decks[i-1])
        
        #actionの処理を行って、次の人に回してからシミュレーションスタート
        self.deal_action_color(action, color)
        self.next_turn()
        return self.game_start()
    
    def set_and_game(self):
        self.players = [Player() for _ in range(Master.player_num)]
        self.init_turn()
        self.deck = self.init_deck()
        self.desk, self.desk_color = Card.VARIATION, None
        self.trash = []
        self.player_rest = np.zeros(Master.player_num, dtype=np.int8)
        for i in range(Master.player_num):
            self.give_cards(i, 7)
        self.show_all_players_cards()
        self.logger.debug("start game")
        self.game_start()
        
    def game_start(self):
        show_flag = self.level <= logging.DEBUG
        while not self.is_game_finished():
            #手札を表示するかどうか
            if show_flag:
                self.show_player_cards(self.turn)
                if self.desk_color is not None:
                    self.logger.debug(str(Card(self.desk)) + " " + str(Player.colors[(self.desk_color)]) + " on desk")
            #rest確認後、ターンを渡す
            if self.player_rest[self.turn] == 0:
                action, color = self.give_turn(self.turn, self.desk, self.desk_color)
            #パスを強制しrestを一つ減らす。
            else:
                self.player_rest[self.turn] -= 1
                self.logger.debug("player" + str(self.turn) + " is binded so skip this turn. reminer is " + str(self.player_rest[self.turn]))
                action, color = -1, None
                

            #カードが出る場合
            if action >= 0:
                self.deal_action_color(action, color, show_flag)
            #出ない場合
            else:
                self.logger.debug("player"+str(self.turn)+ ": pass")
                cs = self.give_cards(self.turn)
                self.logger.debug("player" + str(self.turn) + "get " + str(Card(cs[0])))
                action, color = self.give_turn_after_pass(self.turn, self.desk, self.desk_color, cs)
                if action >= 0:
                    self.deal_action_color(action, color, show_flag)

            
            self.next_turn()
            self.logger.debug("-----")
        
        self.logger.debug("Winner is player"+str(self.winner()))
        scores = self.calc_scores(self.winner())
        self.logger.debug("final score is: "+ str(scores))
        return scores
    
    #numba化したいがselfを引数に取れないので、なかなか難しい
    def deal_action_color(self, action, color, show_flag=False):
        self.logger.debug("player"+ str(self.turn)+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
        self.desk = action
        #actionがワイルドカードでない場合
        if action <= 51:
            self.desk_color = action // 13
        #skipbind2の場合色を引き継ぐ
        elif action == 55:
            self.desk_color = self.desk_color
        #その他wildカラーの場合、playerの宣言色に染まる
        else:
            self.desk_color = color

        #deskcolor以外の処理
        if action in Master.card_plus_two:
            self.next_turn()
            self.give_cards(self.turn, 2)
            self.logger.debug("player"+ str(self.turn)+ " get 2 cards")
            #self.show_player_cards(self.turn)
        elif action in Master.card_skip:
            self.next_turn()
            self.logger.debug("player"+str(self.turn)+" is skipped")
        elif action in Master.card_reverse:
            self.reverse_turn()
            self.logger.debug("turn reversed")
        elif action in Master.card_plus_four:
            self.next_turn()
            self.give_cards(self.turn, 4)
            self.logger.debug("player"+str(self.turn)+ " get 4 cards")
            # self.show_player_cards(self.turn)
        elif action in Master.card_shuffle:
            self.shuffle()
            if show_flag:
                self.show_all_players_cards()
        elif action in Master.card_skipbind2:
            self.next_turn()
            self.player_rest[(self.turn + 1) % 4] += 2
            self.logger.debug("player"+str(self.turn)+" is skipped and player" + str((self.turn + 1) % 4) + " is binded for 2")
        #配ろうとしたのちにtrashに加える.
        self.trash.append(action)

    #カード関係
    def give_cards(self, pid:int, num=1):
        """
        pidの人にnum枚挙げる
        """
        try:
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs
        except:
            #山札が足りなくなったら、
            self.deck = np.hstack((self.deck, self.trash))
            np.random.shuffle(self.deck)
            self.trash = []
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs
        
    def get_num_of_player_card(self):
        """
        プレイヤーのカードの枚数を取得
        """
        ans_num = np.zeros(4, dtype=np.int8)
        for i in range(4):
            ans_num[i] = self.players[i].number_of_cards()
        return ans_num
    
    def get_cards_of_all_player(self):
        #player型カード表現
        ans_card = np.zeros(Card.VARIATION, dtype=np.int8)
        for i in range(4):
            ans_card += self.players[i].give_all_my_cards()

        #master型カード表現へと変更
        ara = np.arange(Card.VARIATION, dtype=np.int8)
        return np.repeat(ara, ans_card)

    def shuffle(self):
        """
        self.turn + 1の人から配り始める
        """
        self.logger.debug("-------------------------------------------")
        all_card = self.get_cards_of_all_player()
        np.random.shuffle(all_card)
        basis = len(all_card) // 4
        rest = len(all_card) % 4
        for i in range(rest):
            self.players[(self.turn+1+i)%4].get_card(all_card[i:i+1])
        for i in range(4):
            self.players[i].get_card(all_card[rest+basis*i:rest+basis*(i+1)])
        return

    def winner(self):
        for i in range(Master.player_num):
            if self.players[i].number_of_cards() == 0:
                return i
            
    
            
    def show_trash(self):
        ans = []
        for c in self.trash:
            ans.append(str(c))
        return str(ans)
    
    def get_trash(self):
        return self.trash
    

    def give_turn(self, pid:int, c:int, color:int):
        return self.players[pid].get_turn(c, color)
    
    def give_turn_after_pass(self, pid:int, c:int, color:int, cs:np.ndarray[int]):
        return self.players[pid].get_turn_after_pass(c, color, cs)


    def is_game_finished(self):
        for i in range(Master.player_num):
            if self.players[i].number_of_cards() == 0:
                return True
        return False

    def show_deck(self):
        ans = []
        for c in self.deck:
            ans.append(str(Card(c)))
        return str(ans)

    def show_player_cards(self, pid:int):
        self.logger.debug("player" + str(pid) + ": " + str(self.players[pid].show_my_cards()))

    def show_all_players_cards(self):
        
        for i in range(Master.player_num):
            self.show_player_cards(i)
    
    def calc_scores(self, winner:int):
        """
        scoreを算出。ゲームが終わってない場合は未定義動作。err出すようにするべきか？？
        winnerを出した方が早い
        """
        ans = np.zeros(4)
        for i in range(4):
            if i !=winner:
                ans[i] =  - self.players[i].my_score()
        ans[winner] = - sum(ans)
        return ans.astype(np.int16)
    
    def init_turn(self):
        """
        turnを初期化
        """
        self.turn = np.random.randint(0, Master.player_num)
        #self.turn = 0
        self.turn_plus = 1

    def next_turn(self):
        """
        turnを回す
        """
        self.turn += self.turn_plus
        self.turn %= 4
    
    def reverse_turn(self):
        """
        turnをreverse
        """
        self.turn_plus = (-1) * self.turn_plus

    def get_card_from_deck(self, n=1):
        """
        deckからn枚とってくる。足りない場合ValueError
        """
        if len(self.deck) < n:
            raise ValueError("the number of the cards of deck is lack for drawing....")
        #ここ結構早いです
        ans = self.deck[0:n]
        self.deck = self.deck[n:]
        return ans

    def init_deck(self) -> np.ndarray[int]:
        #self.deck : np.ndarray[int]
        #ランダムシャフルする
        cards = np.zeros(Card.VARIATION * 2, dtype=np.int8)
        index = 0
        for i in range(Card.VARIATION):
            c = i // 13
            v = i % 13
            #not wild
            if c < 4 and v == 0:
                cards[index] = i
                index += 1
            elif c < 4:
                cards[index] = i
                cards[index+1] = i
                index += 2
            #wild
            else:
                #shuffle
                if v == 2:
                    cards[index] = i
                    index += 1
                #skipbind2
                elif v == 3:
                    for _ in range(3):
                        cards[index] = i
                        index += 1
                #+4, all
                else:
                    for _ in range(4):
                        cards[index] = i
                        index += 1
        np.random.shuffle(cards)
        return cards
class ProbabilityModel:
    one = [0, 13, 26, 39, 54]
    three = [55]
    four = [52, 53]
    alpha = 1 / (10**4)
    rule = Ruler()

    def __init__(self) -> None:
        initprobability = np.zeros((Card.VARIATION, 5), dtype=np.float64)
        for i in range(Card.VARIATION):
            if i in ProbabilityModel.one:
                initprobability[i][1] = 7 / 112
                initprobability[i][0] = 105 / 112
            elif i in ProbabilityModel.three:
                initprobability[i][0] = 105 * 104 * 103 / (112 * 111 * 110)
                initprobability[i][1] = 7 * 105 * 104 * 3 / (112 * 111 * 110)
                initprobability[i][2] = 7 * 6 * 105 * 3 / (112 * 111 * 110)
                initprobability[i][3] = 7 * 6 * 5 / (112 * 111 * 110)
            elif i in ProbabilityModel.four:
                initprobability[i][0] = 105 * 104 * 103 * 102 / (112 * 111 * 110 * 109)
                initprobability[i][1] = (
                    7 * 4 * 105 * 104 * 103 / (112 * 111 * 110 * 109)
                )
                initprobability[i][2] = 7 * 6 * 6 * 105 * 104 / (112 * 111 * 110 * 109)
                initprobability[i][3] = 7 * 6 * 5 * 4 * 105 / (112 * 111 * 110 * 109)
                initprobability[i][4] = 7 * 6 * 5 * 4 / (112 * 111 * 110 * 109)
            else:
                initprobability[i][2] = 42 / (112 * 111)
                initprobability[i][1] = 7 * 105 * 2 / (112 * 111)
                initprobability[i][0] = 105 * 104 / (112 * 111)

        self.plpb = np.repeat(initprobability[np.newaxis, ::], 3, axis=0)
        self.arange = np.arange(Card.VARIATION)
        self.trash = []

        logger = logging.getLogger("pm")

        self.lock = False

        inideck = Master(logger).init_deck()
        self.uinideck, self.inideckcount = np.unique(inideck, return_counts=True)

        self.cardcount = np.zeros(Card.VARIATION, dtype=np.int8)
        self.sum_cardcount = 0
        self.drawcount = np.repeat(7, repeats=3).astype(np.int8)
        self.have_num_card = np.repeat(7, repeats=3).astype(np.int8)

    def other_player_submit_card(self, pid: int, card: int):
        """
        pid:= 1, 2, 3
        """
        self.cardcount[card] += 1
        self.sum_cardcount += 1
        self.have_num_card[pid - 1] -= 1

        for i in range(3):
            if i == pid - 1:
                try:
                    self.plpb[pid - 1][card][:4] = self.plpb[pid - 1][card][
                        1:
                    ] / np.sum(self.plpb[pid - 1][card][1:])
                except:
                    print(self.plpb[pid - 1][card][1:])
                    raise ValueError("self.plpbcomb")
            else:
                self.card_open(card, i + 1)
        self.trash.append(card)

    def i_get_card_num(self, num, mycard):
        restcount = Card.VARIATION * 2
        restcount -= num
        restcount -= len(self.trash)
        restcount -= np.sum(mycard)
        restcount -= np.sum(self.have_num_card)
        assert restcount == np.sum(self.inideckcount - self.cardcount) - np.sum(self.have_num_card)
        
        if restcount < 0:
            self.trash_clean(mycard)


    def i_get_card(self, Cards: np.ndarray[int], deck_num=Card.VARIATION * 2):
        while self.lock:
            time.sleep(0.01)
        self.lock = True
        for card in Cards:
            self.cardcount[card] += 1
            self.sum_cardcount += 1
            for i in range(3):
                self.card_open(card, i + 1, deck_num)
        self.lock = False

    def card_open(self, card, pid, deck_num=Card.VARIATION * 2):
        """
        あるcardがopenになったときの計算をpidに対して行う。本来であれば、その他のカードを持っている確率は上昇するが、今回は行わない。
        #TODO numba化したい
        """
        card_num = self.num_card(card)
        r = self.cardcount[card]
        if deck_num != Card.VARIATION * 2:
            raise ValueError("AAa")
        for j in range(0, card_num + 1):
            # 分母の寄与
            multiple1 = (deck_num - r + 1) / (card_num - r + 1)
            # 分子の寄与
            multiple2 = (card_num - r - j + 1) / (
                deck_num - self.have_num_card[pid - 1] - self.sum_cardcount + 1
            )
            if (card_num - r + 1) == 0 or deck_num - self.have_num_card[pid - 1] - self.sum_cardcount + 1 == 0:
                print(deck_num, self.have_num_card[pid - 1], self.sum_cardcount, r, card)
                print(multiple1, multiple2)
                raise ValueError("Stop IT")

            self.plpb[pid - 1][card][j] *= multiple1 * multiple2

        # print(np.sum(self.plpb[pid-1][card])) -> 1を確認だが念のため
        self.plpb[pid - 1][card] /= np.sum(self.plpb[pid - 1][card])

    def num_card(self, card):
        if card in ProbabilityModel.one:
            return 1
        elif card in ProbabilityModel.three:
            return 3
        elif card in ProbabilityModel.four:
            return 4
        else:
            return 2

    def i_submit_card(self, card: int):
        self.trash.append(card)

    def other_player_get_card_until_num(self, my_card, card_nums:list[int]):
        for i in range(1, 4):
            draw = card_nums[i] - self.have_num_card[i-1]
            assert draw >= 0
            if draw == 0:
                continue
            self.other_player_get_card(i, my_card, draw)
        assert np.all(self.have_num_card == card_nums[1:])

    def other_player_get_card(self, pid: int, my_card, card_num):
        #HACK: もっといい処理はないか？
        while self.lock:
            time.sleep(0.01)
        self.lock = True
        restcount = self.inideckcount - self.cardcount
        num_rest_Card = np.sum(restcount)
        draw = min(num_rest_Card - np.sum(self.have_num_card), card_num)
        

        # 山札からある分からdraw枚数だけdraw
        for i in range(0, Card.VARIATION):
            temp = np.zeros(5, dtype=np.float64)
            amount = restcount[i]
            for num in range(0, min(draw, restcount[i]) + 1):
                # FIXME probが違う
                try:
                    prob = (
                        math.comb(draw, num)
                        * math.comb(
                            num_rest_Card - draw - self.have_num_card[pid - 1],
                            restcount[i] - num,
                        )
                        / math.comb(
                            num_rest_Card - self.have_num_card[pid - 1], restcount[i]
                        )
                    )
                except:
                    print(num_rest_Card, restcount[i], draw, num)
                    raise ValueError("kokodesuyo")
                try:
                    temp[num : amount + 1] += (
                        self.plpb[pid - 1][i][: amount - num + 1] * prob
                    )
                except:
                    print(num, amount, self.trash, my_card, card_num, restcount)
                    raise ValueError("kokoniarimasu")
            self.plpb[pid - 1][i] = temp / np.sum(temp)
        # trashを用いて配るような場合
        if draw < card_num:
            restcount = np.zeros(Card.VARIATION, np.int8)
            utrash, ctrash = np.unique(self.trash, return_counts=True)
            restcount[utrash] = restcount[utrash] + ctrash
            num_rest_Card = len(self.trash) - 1
            self.trash_clean(my_card)
            draw = card_num - draw
            for i in range(Card.VARIATION):
                temp = np.zeros(5, dtype=np.float64)
                amount = self.num_card(i)
                for num in range(0, min(draw, restcount[i]) + 1):
                    prob = (
                        math.comb(draw, num)
                        * math.comb(
                            num_rest_Card - draw - self.have_num_card[pid - 1],
                            restcount[i] - num,
                        )
                        / math.comb(
                            num_rest_Card - self.have_num_card[pid - 1], restcount[i]
                        )
                    )
                    temp[num : amount + 1] += (
                        self.plpb[pid - 1][i][: amount - num + 1] * prob
                    )
                self.plpb[pid - 1][i] = temp

        self.have_num_card[pid - 1] += card_num
        self.lock = False

    def trash_clean(self, my_card):
        self.trash = [self.trash[-1]]
        self.cardcount -= self.cardcount
        self.cardcount += my_card
        self.cardcount[self.trash[0]] += 1
        self.sum_cardcount = np.sum(my_card) + 1
        self.drawcount = np.repeat(0, repeats=3).astype(np.int8)

    def improved_shuffle(self, pre_my_card, af_my_card, number_card_of_player:list[int]):
        for i in range(1, 4):
            self.have_num_card[i-1] = number_card_of_player[i]

        self._shuffle_average()
        diff = af_my_card - pre_my_card
        bef = np.where(diff < 0, -diff, 0)
        self.cardcount -= bef
        self.sum_cardcount -= np.sum(bef)
        af = np.where(diff > 0, diff, 0)
        stuck_af = np.repeat(self.arange, af)
        self._shuffle_distribute_bef(self.have_num_card, bef)
        self.i_get_card(stuck_af)

    def shuffle(self, pid: int, pre_my_card, af_my_card, reverse):
        """
        reverse: +1 or -1
        """
        total = self._shuffle_num_card(pid, pre_my_card, reverse)
        self._shuffle_average()

        diff = af_my_card - pre_my_card
        bef = np.where(diff < 0, -diff, 0)
        self.cardcount -= bef
        self.sum_cardcount -= np.sum(bef)
        af = np.where(diff > 0, diff, 0)
        stuck_af = np.repeat(self.arange, af)
        self._shuffle_distribute_bef(self.have_num_card, bef)
        # FIXME: 優先度低　shuffle後のカード確率校正
        self.i_get_card(stuck_af)

    def _shuffle_distribute_bef(self, draws, bef):
        sum = np.sum(draws)
        for card, amount in enumerate(bef):
            limit = self.num_card(card) - self.cardcount[card]
            for i in range(3):
                temp = np.zeros(5, dtype=np.float64)
                for num in range(0, amount + 1):
                    prob = (
                        math.comb(draws[i], num)
                        * math.comb(sum - draws[i], amount - num)
                        / math.comb(sum, draws[i])
                    )
                    temp[num : limit + 1] += (
                        self.plpb[i][card][: limit - num + 1] * prob
                    )

                self.plpb[i - 1][card] = temp / np.sum(temp)

    def _shuffle_average(self):
        #FIXME: ここで平均を取るのは正しいのか？枚数を考慮していない
        average = np.sum(self.plpb, axis=0) / 3
        for i in range(3):
            self.plpb[i] = np.copy(average)

    def _shuffle_num_card(self, pid, pre_my_card, reverse):
        mynum = np.sum(pre_my_card)
        other_num = np.sum(self.have_num_card)
        total = mynum + other_num
        rest = total % 4
        basic = total // 4
        
        self.have_num_card = np.repeat(basic, 3).astype(np.int8)
        for i in range(1, rest + 1):
            if (pid + reverse * i) % 4 >= 1:
                self.have_num_card[((pid + reverse * i) % 4) - 1] += 1
        return total

    def other_player_pass(self, pid: int, desk: int, color: int):
        #FIXME: 二枚持っているのにパスする可能性がある
        self.plpb[pid - 1][
            np.where(ProbabilityModel.rule.canSubmit_byint(desk, color) == 1)[0]
        ] = np.array([1 - ProbabilityModel.alpha, ProbabilityModel.alpha, 0, 0, 0])

    def show(self, pid: int, card: int):
        print(self.plpb[pid - 1][card])

    def get_player_cumsum(self):
        cumsum = np.cumsum(self.plpb, axis=2)
        return cumsum

    def get_player_card(self):
        return self.have_num_card

    def get_player_card(self, cumsums, rest):
        others = []
        num_card = self.have_num_card
        cumsumss = np.copy(cumsums)
        ruikei = np.zeros(Card.VARIATION, dtype=np.int8)
        if np.sum(rest) < np.sum(num_card):
            print(rest, self.have_num_card)
            raise ValueError("waaaaa")
        for i in range(3):
            ans = []
            t = 1
            while len(ans) < num_card[i]:
                a = np.apply_along_axis(self.get_index(t), axis=1, arr=cumsumss[i])
                cs = self.arange[a]
                # とりすぎた場合
                if len(ans) + len(cs) > num_card[i]:
                    a = np.random.choice(
                        np.where(a)[0], num_card[i] - len(ans), replace=False
                    )
                    cs = self.arange[a]
                ruikei[a] += 1
                cumsumss[:, np.arange(Card.VARIATION), rest - ruikei] = 1
                ans.extend(cs)
                t += 1

            cands = np.array(ans)
            np.random.shuffle(cands)
            others.append(ans[: num_card[i]])

        return self.other_deck_trash(others, rest)

    def other_deck_trash(self, others, rest):
        rest_ = np.copy(rest)
        for other in others:
            uo, co = np.unique(other, return_counts=True)
            try:
                rest_[uo] -= co
            except:
                print(others, rest, self.trash)
                raise ValueError("rest____")

        if np.any(rest_ < 0):
            print(others, rest, self.trash)
            print(self.plpb[:, rest_ < 0])
            print(rest_)
            rest_ = np.where(rest_ < 0, 0, rest_)
            raise ValueError("nannze")

        rest_deck = np.repeat(self.arange, rest_)
        np.random.shuffle(rest_deck)
        return others, rest_deck, self.trash

    def get_rest(self, my_cards, card):
        rest = np.copy(self.inideckcount)
        ut, ct = np.unique(self.trash, return_counts=True)
        if len(ut) > 0:
            rest[ut] -= ct
        rest -= my_cards
        rest[card] -= 1
        return rest

    def get_index(self, t):
        def no_name(cumsum):
            return bisect.bisect_left(cumsum, random.uniform(1 - 1 / t, 1)) >= 1

        return no_name

class Player:
    rule = Ruler()
    colors = ["red", "yellow", "green", "blue"]
    def __init__(self) -> None:
        self.Cards = np.zeros(Card.VARIATION, dtype=np.int8)
        self.num_cards = 0
        self.get_num = np.frompyfunc(Card.getnumber, 1, 1)
        self.logging = logging.getLogger("player")
        self.logging.setLevel(logging.WARN)
        

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

class RandomPlayer(Player):
    def strategy(self, cs):
        i, c = self.__strategy(cs)
        if c != -1:
            self.logging.info(Player.colors[c])
        else:
            c = None
        return i, c
    
    @staticmethod
    @njit(cache = True)
    def __strategy(cs:np.ndarray[np.int8]):
        i = np.random.choice(np.where(cs > 0)[0], size=1)[0]
        if i >= 52 and i != 55:
            c = np.random.randint(4)
        else:
            c = -1
        return i, c
class RPlayer:
    rule = Ruler()
    colors = ["red", "yellow", "green", "blue"]

    def __init__(self) -> None:
        self.Cards = np.zeros(Card.VARIATION, dtype=np.int8)
        self.num_cards = 0

        file_handler = logging.FileHandler("player.log")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        self.logger = logging.getLogger(__name__)
        #self.logger.setLevel(logging.DEBUG)
        self.logger.addHandler(file_handler)

        self.plpb = ProbabilityModel()
        #how many number of cards next player have to draw
        self.force_draw = 0
        self.players_rest = np.zeros(4, dtype=np.int8)

        self.trash = []

    
    def join_room_callback(self, your_id:str):
        self.playername2_123 = ddict()
        self.playername2_123[your_id] = 0
        self.myname = your_id


    def first_player(self, play_order:list[str], first_card:dict):
        #Complete
        self.plpb = ProbabilityModel()
    
        #カード関連
        card = Card._from_str(first_card)
        if card in Master.card_skipbind2 or card in Master.card_plus_four or card in Master.card_shuffle:
            return
        if card in Master.card_plus_two:
            self.force_draw = 2
        self.plpb.i_get_card([card])
        self.plpb.i_submit_card(card)
        self.desk_color = None
        self.trash.append(Card._from_str(first_card))
        
        #turn関連
        my_turn = play_order.index(self.myname)
        for i in range(1, 4):
            self.playername2_123[play_order[(my_turn + i) % 4]] = i
        print(self.playername2_123)
        self.order = play_order

    def get_card(self, c: list[dict], penalty:bool=False):
        if penalty:
            self.logger.info("get card for penalty")
        ndarrc = np.array([Card._from_str(card) for card in c])
        print("i get cards " , ndarrc)
        self.plpb.i_get_card(ndarrc)
        self.num_cards = self.__get_card(self.Cards, ndarrc)

    @staticmethod
    @njit(cache=True)
    def __get_card(
        Cards: np.ndarray[np.int8], arrc: np.ndarray[np.int8]
    ):
        num_cards = len(arrc)
        for i in arrc:
            Cards[i] += 1
        return num_cards

    def reset_my_cards(self):
        self.num_cards = 0
        self.Cards -= self.Cards

    
    def receive_next_player(self, next_player, before_player, card_before, card_of_player, must_call_draw_card:bool, 
                            turn_right:bool, number_of_card_play:int, number_of_turn_play:int, number_card_of_player:dict):
        assert next_player == self.myname
        start = time.time()
        while self.trash[-1] != Card._from_str(card_before):
            time.sleep(0.01)
        print("trash is ",  self.trash)
        assert self.trash[-1] == Card._from_str(card_before)
        end = time.time()
        print("until coincide with trash", end - start)
        assert (self.force_draw > 0) or (self.players_rest[self.order.index(self.myname)] > 0)  == must_call_draw_card

        ndarrc = np.array([Card._from_str(card) for card in card_of_player])
        unique, counts = np.unique(ndarrc, return_counts=True)
        while self.num_cards != len(ndarrc):
            time.sleep(0.01)
        print("my_card and ndarrc", self.Cards, ndarrc)
        print("until coincide between mycard, receive", time.time() - end)
        assert np.all(counts == self.Cards[unique])

        if must_call_draw_card:
            return None
        
        
        cs = self.__get_turn(self.Cards, RPlayer.rule.canSubmit_byint(self.trash[-1], self.desk_color))
        print(cs)
        if self.__all(cs):
            return None
        
        num_c_o_p = [0] * 4
        for playername, num in number_card_of_player.items():
            num_c_o_p[self.playername2_123[playername]] = num
        self.plpb.other_player_get_card_until_num(self.Cards, num_c_o_p)
        
        i, c = self.strategy(cs)
        yell_uno = self.num_cards == 2
        return i, c, yell_uno

    def strategy(self, cs):
        i, c = self.__strategy(cs)
        if c != -1:
            c = RPlayer.colors[c]
        else:
            c = None
        return i, c
    
    @staticmethod
    @njit(cache=True)
    def __strategy(cs: np.ndarray[np.int8]):
        i = np.where(cs > 0)[0][0]
        if i >= 52 and i <= 53:
            c = np.random.randint(4)
        else:
            c = -1
        return i, c

    @staticmethod
    @njit(cache=True)
    def __get_turn(Cards: np.ndarray[np.int8], rulearray: np.ndarray[np.int8]):
        cs = rulearray * Cards
        return cs

    @staticmethod
    @njit(cache=True)
    def __all(cs: np.ndarray[np.int8]):
        return np.all(cs == 0)

    @staticmethod
    @njit(cache=True)
    def __i_and_c(i, restnum, Cards):
        Cards[i] -= 1
        restnum -= 1
        return restnum, restnum == 1

    
    def receive_play_card(self, card:dict, yell_uno:bool, playername:str, color_of_wild:str = None):
        #TODO: Cardが無効だった場合の判定
        if playername != self.myname:
            print(playername, self.playername2_123[playername], Card._from_str(card))
            self.plpb.other_player_submit_card(self.playername2_123[playername], Card._from_str(card))
        else:
            self.num_cards -= 1
            self.Cards[Card._from_str(card)] -= 1
            self.plpb.i_submit_card(Card._from_str(card)) 
        action = Card._from_str(card)
        assert self.force_draw == 0

        if action in Master.card_plus_two:
            self.force_draw = 2
        elif action in Master.card_plus_four:
            self.force_draw = 4
        elif action in Master.card_shuffle:
            pass
        elif action in Master.card_skipbind2:
            turn = self.order.index(playername)
            self.players_rest[(turn + 2) % 4] += 2
            color_of_wild = self.desk_color
        elif action in Master.card_skip:
            pass
        #配ろうとしたのちにtrashに加える.
        self.trash.append(action)
        self.desk_color = RPlayer.colors.index(color_of_wild) if color_of_wild is not None else None
    
    def receive_play_draw_card(self, playername, card:dict, yell_uno:bool, color_of_wild:str = None):
        self.receive_play_card(card, yell_uno, playername, color_of_wild)

    def receive_draw_card(self, playername:str):
        if playername == self.myname:
            flag = False
        else:
            flag = True

        if self.force_draw > 0:
            if flag:
                self.plpb.other_player_get_card(self.playername2_123[playername], self.Cards, self.force_draw)
            self.force_draw = 0
            return
        if self.players_rest[self.order.index(playername)] > 0:
            if flag:
                self.plpb.other_player_get_card(self.playername2_123[playername], self.Cards, 1)
            self.players_rest[self.order.index(playername)] -= 1
            return
        if flag:
            self.plpb.other_player_pass(self.playername2_123[playername], self.trash[-1], self.desk_color)
            self.plpb.other_player_get_card(self.playername2_123[playername], self.Cards, 1)
    
    def callback_draw_card(self, playername:str, is_draw:bool, can_play_draw_card:bool, card:list[dict]):
        """
        pass: None
        play:card, color, yell_uno
        """
        assert playername == self.myname
        self.get_card(card)
        if not can_play_draw_card:
            return None
        assert is_draw

        get_card = Card._from_str(card)
        if Player.rule.canSubmit_byint(self.trash[-1], self.desk_color)[get_card] == 0:
            return None
        else:
            cs = np.zeros(Card.VARIATION, dtype=np.int8)
            cs[get_card] = 1
            i, c = self.strategy(cs)
            self.num_cards, flag = self.__i_and_c(i, self.num_cards, self.Cards)
            return i, c, flag
        
    def receive_challenge(self, challenger, target, is_challenge, is_challenge_success):
        pass

    def receive_pointed_not_say_uno(self, pointer, target, have_say_uno):
        pass

    def receive_receiver_card(self, cards_receive:list[dict], is_penalty:bool):
        assert not is_penalty
        if len(cards_receive) == 7 and np.sum(self.Cards) == 0:
            self.get_card(cards_receive)

    def receive_color_of_wild(self):
        #TODO: 色の決め方改善
        return RPlayer.colors[0]
        
    def receive_update_color(self, color:str):
        self.desk_color = RPlayer.colors.index(color)

    
    
    def receive_shuffle_wild(self, cards_receive:list[dict], number_of_cards_player_receive:dict):
        number_of_cards_player = [0] * 4
        for playername, num in number_of_cards_player_receive.items():
            number_of_cards_player[self.playername2_123[playername]] = num
        afcards = self.__change_data_type_of_cards(np.array([Card._from_str(card) for card in cards_receive]))
        self.plpb.improved_shuffle(self.Cards, afcards, number_of_cards_player)
        self.Cards = afcards

    @staticmethod
    @njit(cache=True)
    def __change_data_type_of_cards(cards:np.ndarray[np.int8]):
        unique, counts = np.unique(cards, return_counts=True)
        ans = np.zeros(56, dtype=np.int8)
        ans[unique] = counts
        return ans
    
    def receive_finish_turn(self, scores):
        self.reset_my_cards()
        

"""
定数
"""


# Socket通信の全イベント名
class SocketConst:
    class EMIT:
        JOIN_ROOM = "join-room"  # 試合参加
        RECEIVER_CARD = "receiver-card"  # カードの配布
        FIRST_PLAYER = "first-player"  # 対戦開始
        COLOR_OF_WILD = "color-of-wild"  # 場札の色を変更する
        UPDATE_COLOR = "update-color"  # 場札の色が変更された
        SHUFFLE_WILD = "shuffle-wild"  # シャッフルしたカードの配布
        NEXT_PLAYER = "next-player"  # 自分の手番
        PLAY_CARD = "play-card"  # カードを出す
        DRAW_CARD = "draw-card"  # カードを山札から引く
        PLAY_DRAW_CARD = "play-draw-card"  # 山札から引いたカードを出す
        CHALLENGE = "challenge"  # チャレンジ
        PUBLIC_CARD = "public-card"  # 手札の公開
        POINTED_NOT_SAY_UNO = "pointed-not-say-uno"  # UNO宣言漏れの指摘
        SPECIAL_LOGIC = "special-logic"  # スペシャルロジック
        FINISH_TURN = "finish-turn"  # 対戦終了
        FINISH_GAME = "finish-game"  # 試合終了
        PENALTY = "penalty"  # ペナルティ


# UNOのカードの色
class Color:
    RED = "red"  # 赤
    YELLOW = "yellow"  # 黄
    GREEN = "green"  # 緑
    BLUE = "blue"  # 青
    BLACK = "black"  # 黒
    WHITE = "white"  # 白


# UNOの記号カード種類
class Special:
    SKIP = "skip"  # スキップ
    REVERSE = "reverse"  # リバース
    DRAW_2 = "draw_2"  # ドロー2
    WILD = "wild"  # ワイルド
    WILD_DRAW_4 = "wild_draw_4"  # ワイルドドロー4
    WILD_SHUFFLE = "wild_shuffle"  # シャッフルワイルド
    WHITE_WILD = "white_wild"  # 白いワイルド


# カードを引く理由
class DrawReason:
    DRAW_2 = "draw_2"  # 直前のプレイヤーがドロー2を出した場合
    WILD_DRAW_4 = "wild_draw_4"  # 直前のプレイヤーがワイルドドロー4を出した場合
    BIND_2 = "bind_2"  # 直前のプレイヤーが白いワイルド（バインド2）を出した場合
    SKIP_BIND_2 = "skip_bind_2"  # 直前のプレイヤーが白いワイルド（スキップバインド2）を出した場合
    NOTHING = "nothing"  # 理由なし


TEST_TOOL_HOST_PORT = "3000"  # 開発ガイドラインツールのポート番号
ARR_COLOR = [Color.RED, Color.YELLOW, Color.GREEN, Color.BLUE]  # 色変更の選択肢


"""
コマンドラインから受け取った変数等
"""
parser = argparse.ArgumentParser(description="A demo player written in Python")
parser.add_argument("host", action="store", type=str, help="Host to connect")
parser.add_argument(
    "room_name", action="store", type=str, help="Name of the room to join"
)
parser.add_argument(
    "player", action="store", type=str, help="Player name you join the game as"
)
parser.add_argument(
    "event_name",
    action="store",
    nargs="?",
    default=None,
    type=str,
    help="Event name for test tool",
)  # 追加


args = parser.parse_args(sys.argv[1:])
host = args.host  # 接続先（ディーラープログラム or 開発ガイドラインツール）
room_name = args.room_name  # ディーラー名
player = args.player  # プレイヤー名
event_name = args.event_name  # Socket通信イベント名
is_test_tool = TEST_TOOL_HOST_PORT in host  # 接続先が開発ガイドラインツールであるかを判定
SPECIAL_LOGIC_TITLE = "◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯"  # スペシャルロジック名
TIME_DELAY = 10  # 処理停止時間


once_connected = False
id = ""  # 自分のID
uno_declared = {}  # 他のプレイヤーのUNO宣言状況
rplayer = RPlayer()

"""
コマンドライン引数のチェック
"""
if not host:
    # 接続先のhostが指定されていない場合はプロセスを終了する
    print("Host missed")
    os._exit(0)
else:
    print("Host: {}".format(host))

# ディーラー名とプレイヤー名の指定があることをチェックする
if not room_name or not player:
    print("Arguments invalid")

    if not is_test_tool:
        # 接続先がディーラープログラムの場合はプロセスを終了する
        os._exit(0)
else:
    print("Dealer: {}, Player: {}".format(room_name, player))


# 開発ガイドラインツールSTEP1で送信するサンプルデータ
TEST_TOOL_EVENT_DATA = {
    SocketConst.EMIT.JOIN_ROOM: {
        "player": player,
        "room_name": room_name,
    },
    SocketConst.EMIT.COLOR_OF_WILD: {
        "color_of_wild": "red",
    },
    SocketConst.EMIT.PLAY_CARD: {
        "card_play": {"color": "black", "special": "wild"},
        "yell_uno": False,
        "color_of_wild": "blue",
    },
    SocketConst.EMIT.DRAW_CARD: {},
    SocketConst.EMIT.PLAY_DRAW_CARD: {
        "is_play_card": True,
        "yell_uno": True,
        "color_of_wild": "blue",
    },
    SocketConst.EMIT.CHALLENGE: {
        "is_challenge": True,
    },
    SocketConst.EMIT.POINTED_NOT_SAY_UNO: {
        "target": "Player 1",
    },
    SocketConst.EMIT.SPECIAL_LOGIC: {
        "title": SPECIAL_LOGIC_TITLE,
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


"""def select_play_card(cards, before_caard):
    cards_valid = []  # ワイルド・シャッフルワイルド・白いワイルドを格納
    cards_wild = []  # ワイルドドロー4を格納
    cards_wild4 = []  # 同じ色 または 同じ数字・記号 のカードを格納

    # 場札と照らし合わせ出せるカードを抽出する
    for card in cards:
        card_special = card.get("special")
        card_number = card.get("number")
        if str(card_special) == Special.WILD_DRAW_4:
            # ワイルドドロー4は場札に関係なく出せる
            cards_wild4.append(card)
        elif (
            str(card_special) == Special.WILD
            or str(card_special) == Special.WILD_SHUFFLE
            or str(card_special) == Special.WHITE_WILD
        ):
            # ワイルド・シャッフルワイルド・白いワイルドも場札に関係なく出せる
            cards_wild.append(card)
        elif str(card.get("color")) == str(before_caard.get("color")):
            # 場札と同じ色のカード
            cards_valid.append(card)
        elif (
            card_special and str(card_special) == str(before_caard.get("special"))
        ) or (
            (
                card_number is not None
                or (card_number is not None and int(card_number) == 0)
            )
            and (
                before_caard.get("number")
                and int(card_number) == int(before_caard.get("number"))
            )
        ):
            # 場札と数字または記号が同じカード
            cards_valid.append(card)

    #
    出せるカードのリストを結合し、先頭のカードを返却する。
    このプログラムでは優先順位を、「同じ色 または 同じ数字・記号」 > 「ワイルド・シャッフルワイルド・白いワイルド」 > ワイルドドロー4の順番とする。
    ワイルドドロー4は本来、手札に出せるカードが無い時に出していいカードであるため、一番優先順位を低くする。
    ワイルド・シャッフルワイルド・白いワイルドはいつでも出せるので、条件が揃わないと出せない「同じ色 または 同じ数字・記号」のカードより優先度を低くする。
    #
    list = cards_valid + cards_wild + cards_wild4
    if len(list) > 0:
        return list[0]
    else:
        return None"""


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
    return False
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
    if target not in uno_declared.keys():
        send_event(SocketConst.EMIT.POINTED_NOT_SAY_UNO, {"target": target})
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


def send_event(event, data, callback=pass_func):
    print("Send {} event.".format(event))
    print("req_data: ", data)

    def after_func(err, res):
        if err:
            print("{} event failed!".format(event))
            print(err)
            return

        print("Send {} event.".format(event))
        print("res_data: ", res)
        callback(res)

    sio.emit(event, data, callback=after_func)


"""
受信イベント共通処理

Args:
    event (str): Socket通信イベント名
    data (Any): 送信するデータ
    callback (func): 個別処理
"""


def receive_event(event, data, callback=pass_func):
    print("Receive {} event.".format(event))
    print("res_data: ", data)

    callback(data)


"""
Socket通信の確立
"""


@sio.on("connect")
def on_connect():
    print("Client connect successfully!")

    if not once_connected:
        if is_test_tool:
            # テストツールに接続
            if not event_name:
                # イベント名の指定がない（開発ガイドラインSTEP2の受信のテストを行う時）
                print("Not found event name")
            elif not event_name in TEST_TOOL_EVENT_DATA:
                # イベント名の指定があり、テストデータが定義されていない場合はエラー
                print("Undefined test data. eventName: ", event_name)
            else:
                # イベント名の指定があり、テストデータが定義されている場合は送信する(開発ガイドラインSTEP1の送信のテストを行う時)
                send_event(event_name, TEST_TOOL_EVENT_DATA[event_name])
        else:
            # ディーラープログラムに接続
            data = {
                "room_name": room_name,
                "player": player,
            }

            def join_room_callback(*args):
                global once_connected, id
                print("Client join room successfully!")
                once_connected = True
                id = args[0].get("your_id")
                rplayer.join_room_callback(id)
                print("My id is {}".format(id))

            send_event(SocketConst.EMIT.JOIN_ROOM, data, join_room_callback)


"""
Socket通信を切断
"""


@sio.on("disconnect")
def on_disconnect():
    print("Client disconnect.")
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
    rplayer.receive_receiver_card(data_res.get("cards_receive"), data_res.get("is_penalty"))
    receive_event(SocketConst.EMIT.RECEIVER_CARD, data_res)


# 対戦の開始
@sio.on(SocketConst.EMIT.FIRST_PLAYER)
def on_first_player(data_res):
    rplayer.first_player(data_res.get("play_order"), data_res.get("first_card"))
    receive_event(SocketConst.EMIT.FIRST_PLAYER, data_res)


# 場札の色指定を要求
@sio.on(SocketConst.EMIT.COLOR_OF_WILD)
def on_color_of_wild(data_res):
    def color_of_wild_callback(data_res):
        color = rplayer.receive_color_of_wild
        data = {
            "color_of_wild": color,
        }

        # 色変更を実行する
        send_event(SocketConst.EMIT.COLOR_OF_WILD, data)

    receive_event(SocketConst.EMIT.COLOR_OF_WILD, data_res, color_of_wild_callback)


# 場札の色が変わった
@sio.on(SocketConst.EMIT.UPDATE_COLOR)
def on_update_color(data_res):
    rplayer.receive_update_color(data_res.get("color"))
    receive_event(SocketConst.EMIT.UPDATE_COLOR, data_res)


# シャッフルワイルドにより手札状況が変更
@sio.on(SocketConst.EMIT.SHUFFLE_WILD)
def on_shuffle_wild(data_res):
    def shuffle_wild_calback(data_res):
        global uno_declared
        uno_declared = {}
        rplayer.receive_shuffle_wild(data_res.get("cards_receive"), data_res.get("number_card_of_player"))
        for k, v in data_res.get("number_card_of_player").items():
            if v == 1:
                # シャッフル後に1枚になったプレイヤーはUNO宣言を行ったこととする
                uno_declared[data_res.get("player")] = True
                break
            elif k in uno_declared:
                # シャッフル後に2枚以上のカードが配られたプレイヤーはUNO宣言の状態をリセットする
                if data_res.get("player") in uno_declared:
                    del uno_declared[k]

    receive_event(SocketConst.EMIT.SHUFFLE_WILD, data_res, shuffle_wild_calback)


# 自分の番
@sio.on(SocketConst.EMIT.NEXT_PLAYER)
def on_next_player(data_res):
    def next_player_calback(data_res):
        determine_if_execute_pointed_not_say_uno(data_res.get("number_card_of_player"))

        cards = data_res.get("card_of_player")

        if data_res.get("draw_reason") == DrawReason.WILD_DRAW_4:
            # カードを引く理由がワイルドドロー4の時、チャレンジを行うことができる。
            if is_challenge():
                send_event(SocketConst.EMIT.CHALLENGE, {"is_challenge": True})
                return

        #  スペシャルロジックを発動させる
        special_logic_num_random = random_by_number(10)
        if special_logic_num_random == 0:
            send_event(SocketConst.EMIT.SPECIAL_LOGIC, {"title": SPECIAL_LOGIC_TITLE})

        play_card = rplayer.receive_next_player(data_res.get("next_player"), data_res.get("before_player"), data_res.get("card_before"), cards, data_res.get("must_call_draw_card"), data_res.get("turn_right"), data_res.get("number_of_card_play"), data_res.get("number_of_turn_play"), data_res.get("number_card_of_player"))

        if play_card is not None:
            i, c, yell_uno = play_card
            play_card = Card._to_str(i)
            # 選出したカードがある時
            print(
                "selected card: {} {}".format(
                    play_card.get("color"),
                    play_card.get("number") or play_card.get("special"),
                )
            )
            data = {
                "card_play": play_card,
                "yell_uno": len(cards) == 2,  # 残り手札数を考慮してUNOコールを宣言する
            }

            if (
                play_card.get("special") == Special.WILD
                or play_card.get("special") == Special.WILD_DRAW_4
            ):
                data["color_of_wild"] = c

            # カードを出すイベントを実行
            send_event(SocketConst.EMIT.PLAY_CARD, data)
        else:
            # 選出したカードが無かった時

            # draw-cardイベント受信時の個別処理
            def draw_card_callback(res):
                play_card = rplayer.callback_draw_card(data_res.get("next_player"), res.get("is_draw"), res.get("can_play_draw_card"), res.get("draw_card"))
                if play_card is None:
                    # 引いたカードを出せないので処理を終了
                    return
                i, c, yell_uno = play_card
                play_card = Card._to_str(i)

                # 以後、引いたカードが場に出せるときの処理
                data = {
                    "is_play_card": True,
                    "yell_uno": len(cards + res.get("draw_card"))
                    == 2,  # 残り手札数を考慮してUNOコールを宣言する
                }

                play_card = res.get("draw_card")[0]
                if (
                    play_card.get("special") == Special.WILD
                    or play_card.get("special") == Special.WILD_DRAW_4
                ):
                    data["color_of_wild"] = c

                # 引いたカードを出すイベントを実行
                send_event(SocketConst.EMIT.PLAY_DRAW_CARD, data)

            # カードを引くイベントを実行
            send_event(SocketConst.EMIT.DRAW_CARD, {}, draw_card_callback)

    receive_event(SocketConst.EMIT.NEXT_PLAYER, data_res, next_player_calback)


# カードが場に出た
@sio.on(SocketConst.EMIT.PLAY_CARD)
def on_play_card(data_res):
    def play_card_callback(data_res):
        global uno_declared
        rplayer.receive_play_card(data_res.get("card_play"), data_res.get("yell_uno"), data_res.get("player"), data_res.get("color_of_wild"))
        # UNO宣言を行った場合は記録する
        if data_res.get("yell_uno"):
            uno_declared[data_res.get("player")] = data_res.get("yell_uno")

    receive_event(SocketConst.EMIT.PLAY_CARD, data_res, play_card_callback)


# 山札からカードを引いた
@sio.on(SocketConst.EMIT.DRAW_CARD)
def on_draw_card(data_res):
    def draw_card_callback(data_res):
        global uno_declared
        rplayer.receive_draw_card(data_res.get("player"))
        # カードが増えているのでUNO宣言の状態をリセットする
        if data_res.get("player") in uno_declared:
            del uno_declared[data_res.get("player")]

    receive_event(SocketConst.EMIT.DRAW_CARD, data_res, draw_card_callback)


# 山札から引いたカードが場に出た
@sio.on(SocketConst.EMIT.PLAY_DRAW_CARD)
def on_play_draw_card(data_res):
    def play_draw_card_callback(data_res):
        rplayer.receive_play_draw_card(data_res.get("player"), data_res.get("card_play"), data_res.get("yell_uno"), data_res.get("color_of_wild"))
        global uno_declared
        # UNO宣言を行った場合は記録する
        if data_res.get("yell_uno"):
            uno_declared[data_res.get("player")] = data_res.get("yell_uno")

    receive_event(SocketConst.EMIT.PLAY_DRAW_CARD, data_res, play_draw_card_callback)


# チャレンジの結果
@sio.on(SocketConst.EMIT.CHALLENGE)
def on_challenge(data_res):
    rplayer.receive_challenge(data_res.get("challenger"), data_res.get("target"), data_res.get("is_challenge"), data_res.get("is_challenge_success"))
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
        rplayer.receive_finish_turn(data_res.get("scores"))
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
        if data_res.get("player") in uno_declared:
            del uno_declared[data_res.get("player")]

    receive_event(SocketConst.EMIT.PENALTY, data_res, penalty_callback)


def main():
    sio.connect(
        host,
        transports=["websocket"],
    )
    sio.wait()


if __name__ == "__main__":
    main()
