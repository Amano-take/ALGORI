import numpy as np
from Card import Card
from Ruler import Ruler
import logging
from collections import defaultdict as ddict
import tqdm, sys, os, time
sys.path.append(os.path.join(sys.path[0],os.pardir))
from Player import Player
from ProbabilityModel.ProbabilityModel import ProbabilityModel
from Master import Master

#通信を行うことを想定
class RealPlayer(Player):
    def join_room_callback(self, your_id):
        self.playername2_123 = ddict()
        self.playername2_123[your_id] = 0
        self.myname= your_id

    def first_player(self, first_card, play_order:list):
        my_turn = play_order.index(self.myname)
        for i in range(1, 4):
            self.playername2_123[play_order[(my_turn + i)%4]] = i
        
    def emit_play_card(self, card, color, yell_uno):
        #TODO:
        if yell_uno:
            self.logging.info("Uno!")
        return card, color
    
    def on_play_card(self, player_id, card, color, yell_uno, color_of_wild):
        pindex = self.playername2_123[player_id]
    
    def test_on_play_card(self, player_id, card, color_of_wild="red", yell_uno=False):
        pindex = self.playername2_123[player_id]

    def on_draw_card(self, player_id, draw_num):
        #draw_処理は自分で行うこととする
        pindex = self.playername2_123[player_id]

    def emit_color_of_wild(self):
        """
        常に黄色を返却
        """
        return 1
    
    def on_color_of_wild(self, color):
        pass

    def shuffle_wild(self, receive_cards):
        self.Cards -= self.Cards
        self.on_receiver_card(receive_cards, is_penalty=False)

    def on_receiver_card(self, cards_reveive:np.ndarray[int], is_penalty=False):
        super().get_card(cards_reveive)

    def on_finish_turn(self, trun_no, winner, score):
        self.Cards -= self.Cards

    #super()にしたほうがよさそうだが可読性のため
    def next_player(self):
        pass

class PMPlayer(Player):
    simulate_num = 300

    def __init__(self) -> None:
        super().__init__()
        self.pm = ProbabilityModel()
        logger = logging.getLogger("mcs")
        logger.setLevel(logging.WARN)
        self.simmaster = Master(logobject=logger)
        self.arange = np.arange(Card.VARIATION, dtype=np.int8)
        self.zeros = np.zeros(Card.VARIATION, dtype=np.int8)

    def join_room_callback(self, your_id):
        self.playername2_123 = ddict()
        self.playername2_123[your_id] = 0
        self.myname= your_id

    def first_player(self, play_order):
        my_turn = play_order.index(self.myname)
        for i in range(1, 4):
            self.playername2_123[play_order[(my_turn + i)%4]] = i

    def other_submit_card(self, pid, card, color):
        pindex = self.playername2_123[pid]
        self.pm.player_submit_card(pindex, card)



    def other_draw_card(self, pid, nums):
        #first drawは無視
        if nums == 7:
            return
        pindex = self.playername2_123[pid]
        #自分がドローした場合
        if pindex == 0:
            self.pm.i_get_card_num(nums, self.Cards)
        else:
            self.pm.other_player_get_card(pindex, self.Cards, nums)
    
    def receive_shuffle(self, pid, af_cards):
        #通常のドローとは異なるように
        pindex = self.playername2_123[pid]
        uaf, caf = np.unique(af_cards, return_counts=True)
        zero = np.copy(self.zeros)
        zero[uaf] += caf

        self.pm.shuffle(pindex, self.Cards, zero)
        self.Cards -= self.Cards
        self.Cards += zero
        self.num_cards = len(af_cards)

    def give_all_my_cards(self):
        self.num_cards = 0
        ans = self.Cards.copy()
        return ans

    def get_card(self, c: np.ndarray[int]):
        
        self.pm.i_get_card(c)
        super().get_card(c)

    def receive_other_pass(self, pid, desk, color):
        pindex = self.playername2_123[pid]
        self.pm.other_player_pass(pindex, desk, color)

    def submit_card(self, card, color):
        self.pm.i_submit_card(card)
        return card, color
    
    def pass_turn(self):
        return -1, None
    
    def strategy(self, cs, turn_plus, player_rest):
        #submit
        canSub = np.where(cs > 0)[0]
        #取れるaction
        action_score = ddict(int)
        cumsum = self.pm.get_player_cumsum()
        for card in canSub:
            self.Cards[card] -= 1
            self.num_cards -= 1
            if card >= 52 and card != 55:
                for color in range(4):
                    action_score[(card, color)] = self.simulate( turn_plus, card, color, cumsum, player_rest)
            else:
                action_score[(card, None)] = self.simulate(turn_plus, card, None, cumsum, player_rest)
            self.Cards[card] += 1
            self.num_cards += 1 
        #print(action_score)
        return max(action_score, key=action_score.get)
    
    def simulate(self, turn_plus, card, color, cumsum, player_rest):
        scores = np.zeros(4)
        rest = self.pm.get_rest(self.Cards, card)
        self.logging.info("simulation start")
        #print(self.pm.trash)
        for _ in range(PMPlayer.simulate_num):
            others, deck, trash = self.pm.get_player_card(cumsum, rest)
            scores += self.simmaster.set_board(deck, turn_plus, self.Cards, others, trash, card, color, 0, player_rest) / PMPlayer.simulate_num
        return self.scores2score(scores)
    
    def scores2score(self, scores):
        return scores[0] - np.average(scores[1:])

    def get_turn(self, c: int, color, turn_plus, player_rest):
        cs = (Player.rule.canSubmit_byint(c, color) * self.Cards)
        if np.all(cs==0):
            return self.pass_turn()
        
        i, c = self.strategy(cs, turn_plus, player_rest)
        self.Cards[i] -= 1
        self.num_cards -= 1
        if self.number_of_cards() == 1:
            self.logging.info("UNO!!")
        return self.submit_card(i, c)
        
class PMMaster(Master):
    def __init__(self, l: logging.Logger) -> None:
        self.logging = l
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)
        self.level = l.level
    
    def set_and_game(self):
        self.players = [Player() for _ in range(Master.player_num -1 )]
        #モンテカルロを一人加える
        self.players.append(PMPlayer())
        self.playerid = ["1P", "2P", "3P", "MP"]
        
        self.init_turn()
        assert isinstance(self.players[3], PMPlayer)
        self.players[3].join_room_callback("MP")
        #firstplayerの通知
        first_player = []
        for i in range(4):
            index = (self.turn + i) % 4
            first_player.append(self.playerid[index])
        self.players[3].first_player(first_player)

        self.deck = self.init_deck()
        self.desk, self.desk_color = 56, None
        self.trash = []
        self.player_rest = np.zeros(Master.player_num, dtype=np.int8)
        for i in range(Master.player_num):
            self.give_cards(i, 7)
        self.show_all_players_cards()
        logging.info("start game")
        return self.game_start()


    def game_start(self):
        show_flag = self.level >= logging.DEBUG
        while not self.is_game_finished():
            colors = ["red", "yellow", "green", "blue", "white"]
            if self.desk_color is not None:
                self.logging.info("desk " + str(Card(self.desk)) + " color: " + str(colors[self.desk_color]))
            if show_flag:
                self.show_player_cards(self.turn)
            if self.turn == 3:
                action, color = self.players[3].get_turn(self.desk, self.desk_color, self.turn_plus, self.player_rest)
            else:
                action, color = self.give_turn(self.turn, self.desk, self.desk_color, self.trash, self.turn_plus)
                assert isinstance(self.players[3], PMPlayer)
                if action >= 0:
                    self.players[3].other_submit_card(self.playerid[self.turn], action , color)
                else:
                    self.players[3].receive_other_pass(self.playerid[self.turn], self.desk, self.desk_color)
            
            
            #カードが出る場合
            if action >= 0:
                self.deal_action_color(action, color, show_flag=True)
            #出ない場合
            else:
                self.logging.info("player"+str(self.playerid[self.turn])+ ": pass")
                self.give_cards(self.turn)
            
            self.next_turn()
            self.logging.info("-----")
        
        self.logging.info("Winner is player"+str(self.winner()))
        scores = self.calc_scores(self.winner())
        self.logging.info("final score is: "+ str(scores))
        return scores
    
    def deal_action_color(self, action, color, show_flag=False):
        self.logging.debug("player"+ str(self.playerid[self.turn])+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
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
            self.logging.debug("player"+ str(self.playerid[self.turn])+ " get 2 cards")
            #self.show_player_cards(self.turn)
        elif action in Master.card_skip:
            self.next_turn()
            self.logging.debug("player"+str(self.playerid[self.turn])+" is skipped")
        elif action in Master.card_reverse:
            self.reverse_turn()
            self.logging.debug("turn reversed")
        elif action in Master.card_plus_four:
            self.next_turn()
            self.give_cards(self.turn, 4)
            self.logging.debug("player"+str(self.playerid[self.turn])+ " get 4 cards")
            # self.show_player_cards(self.turn)
        elif action in Master.card_shuffle:
            self.shuffle()
            if show_flag:
                self.show_all_players_cards()
        elif action in Master.card_skipbind2:
            self.next_turn()
            self.player_rest[(self.turn + 1) % 4] += 2
            self.logging.debug("player"+str(self.playerid[self.turn])+" is skipped and player" + str((self.turn + 1) % 4) + " is binded for 2")
        #配ろうとしたのちにtrashに加える.
        self.trash.append(action)

    def give_turn(self, pid:int, c:int, color:int, trash, turn_plus):
        return self.players[pid].get_turn(c, color, trash, turn_plus)
    
    def show_player_cards(self, pid:int): 
        self.logging.debug("player" + str(self.playerid[pid]) + ": " + str(self.players[pid].show_my_cards()))

    def shuffle(self):
        """
        self.turn + 1の人から配り始める
        """
        self.logging.debug("-------------------------------------------")
        all_card = self.get_cards_of_all_player()
        np.random.shuffle(all_card)
        basis = len(all_card) // 4
        rest = len(all_card) % 4
        cardstuck = []
        for i in range(rest):
            if (self.turn+1+i)%4 == 3:
                cardstuck.extend(all_card[i:i+1])
            else:
                self.players[(self.turn+1+i)%4].get_card(all_card[i:i+1])
        for i in range(4):
            if i == 3:
                cardstuck.extend(all_card[rest+basis*i:rest+basis*(i+1)])
            else:
                self.players[i].get_card(all_card[rest+basis*i:rest+basis*(i+1)])
        assert isinstance(self.players[3], PMPlayer)
        self.players[3].receive_shuffle(self.playerid[self.turn], np.array(cardstuck))
        return

    def give_cards(self, pid:int, num=1):
        """
        pidの人にnum枚挙げる
        """
        assert isinstance(self.players[3], PMPlayer)
        self.players[3].other_draw_card(self.playerid[pid], num)
        try:
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs
        except:
            #山札が足りなくなったら、
            self.logging.debug("reload")
            self.deck = np.hstack((self.deck, self.trash[:len(self.trash) - 1]))
            np.random.shuffle(self.deck)
            self.trash = [self.trash[-1]]
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs
        
if __name__ == "__main__":
    logging.basicConfig(format="%(message)s")
    ll = logging.getLogger("ex")
    ll.setLevel(logging.WARN)
    tm = PMMaster(ll)
    scores = np.zeros(4)
    try:
        #FIXME なぜかスコアが良くない？？？
        for i in tqdm.tqdm(range(1000)):
            scores += tm.set_and_game()
        print(scores)
    except:
        print(scores)