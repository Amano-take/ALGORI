from collections import defaultdict
import os
import sys
sys.path.append(os.path.join(sys.path[0],os.pardir))

from Game.Master import Master
from Game.Player import Player
from Game.Card import Card

import logging
import numpy as np
import tqdm


class PlayerMonteCarlo(Player):
    
    def __init__(self):
        super().__init__()
        self.l = logging.getLogger("mcs")
        self.master = Master(self.l)
        self.inideck = self.master.init_deck()
        self.uinideck, self.inideckcount = np.unique(self.inideck, return_counts=True)

    def from_score_get_score(self, scores):
        return scores[0] - max(scores[1:])

    def simulate(self, other_player_cards_num, reverse, trash, action, color, desk, player_rest):
        """

        myCards := [ 0, 0, 0, 1, ...]
        other_player_Cards := [[12, 23, 10, ...], ...]
        に注意
        """
        score_sum = np.zeros(Master.player_num)
        sim_n = 300
        self.l.debug("start-sim---------------------------")
        for i in range(sim_n):
            #self.l.setLevel(logging.WARN)
            other_player_cards, deck = self.random_likelihood(trash, other_player_cards_num)
            score_sum += self.master.set_board(deck, 0, reverse, self.Cards, other_player_cards, trash, action, color, desk, player_rest) / sim_n
            #self.l.setLevel(logging.WARN)
        
        return self.from_score_get_score(score_sum)
    
    def get_turn(self, desk_c:int, desk_color:int, trash:list[np.ndarray[int]], other_player_cards_num:list[int], reverse:int, player_rest:list[int]):
        """
        return カード番号, color: None|(0, 1, 2, 3)
        """
        if desk_color is None:
            cs  = (Player.rule.canSubmit_byint(desk_c) * self.Cards).astype(np.int8)
        else:
            cs = (Player.rule.canSubmit_byint(desk_c, desk_color) * self.Cards).astype(np.int8)

        #pass
        if sum(cs) == 0:
            return -1, None
        
        #submit
        canSub = np.where(cs > 0)[0]
        
        #取れるaction
        action_score = defaultdict(int)
        for i in canSub:
            self.Cards[i] -= 1
            self.num_cards -= 1
            if i >= 52 and i != 55:
                for color in range(4):
                    action_score[(i, color)] = self.simulate(other_player_cards_num, reverse, trash, i, color, desk_c, player_rest)
            else:
                color = None
                action_score[(i, None)] = self.simulate(other_player_cards_num, reverse, trash, i, color, desk_c, player_rest)
            self.Cards[i] += 1
            self.num_cards += 1
        
        
        a, c = max(action_score, key=action_score.get)
        self.Cards[a] -= 1
        self.num_cards -= 1
        if self.number_of_cards() == 1:
            self.l.info("UNO!!")
        if c is not None:
            self.l.info(Player.colors[c]) 
        return a, c

    def random_likelihood(self, trash, other_player_num_of_card:list[int]):
        """
        trash, 自分のカードを除いて、その中からランダムに抽出
        return [other1, other2, other3], deck
        other1: deck型
        """
        utrash, tcount = np.unique(trash, return_counts=True)
        deckintrash = np.where(np.isin(self.uinideck, utrash))[0]
        restcount = self.inideckcount.copy()
        restcount[deckintrash] -= tcount
        restcount -= self.Cards
        try:
            restCards = np.repeat(self.uinideck, restcount)
        except:
            print(restcount)
        #restCards : np.ndarray[int] -> [0 1 1 2 2 ...]
        #ランダムチョイス, replaceを変えればうまくいきそう
        tmp = []
        np.random.shuffle(restCards)
        s = 0
        for i in range(3):
            tmp.append(restCards[s:s+other_player_num_of_card[i]])
            s += other_player_num_of_card[i]
        return tmp, restCards[s:]

class TestMaster(Master):

    def __init__(self, l: logging.Logger) -> None:
        self.logging = l
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)
        self.level = l.level
    
    def set_and_game(self):
        self.players = [Player() for _ in range(Master.player_num -1 )]
        #モンテカルロを一人加える
        self.players.append(PlayerMonteCarlo())
        self.init_turn()
        self.deck = self.init_deck()
        self.desk, self.desk_color = 54, None
        self.trash = []
        self.player_rest = np.zeros(Master.player_num, dtype=np.int8)
        for i in range(Master.player_num):
            self.give_cards(i, 7)
        #self.show_all_players_cards()
        logging.info("start game")
        return self.game_start()


    def game_start(self):
        show_flag = self.level >= logging.DEBUG
        while not self.is_game_finished():
            if show_flag:
                self.show_player_cards(self.turn)
            if self.turn == 3:
                tmp = []
                for i in range(3):
                    tmp.append(self.players[i].num_cards)
                self.players[3].random_likelihood(self.trash, tmp)
                action, color = self.players[3].get_turn(self.desk, self.desk_color, self.trash, tmp, self.turn_plus, self.player_rest)
            else:
                action, color = self.give_turn(self.turn, self.desk, self.desk_color, self.trash, self.turn_plus)

            #カードが出る場合
            if action >= 0:
                self.logging.info("player"+ str(self.turn)+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
                self.desk = action
                #actionがワイルドカードの時
                if action <= 51:
                    self.desk_color = None
                else:
                    self.desk_color = color

                if action in Master.card_plus_two:
                    self.next_turn()
                    self.give_cards(self.turn, 2)
                    self.logging.info("player"+ str(self.turn)+ " get 2 cards")
                    #self.show_player_cards(self.turn)
                elif action in Master.card_skip:
                    self.next_turn()
                    self.logging.info("player"+str(self.turn)+" is skipped")
                elif action in Master.card_reverse:
                    self.reverse_turn()
                    self.logging.info("turn reversed")
                elif action in Master.card_plus_four:
                    self.next_turn()
                    self.give_cards(self.turn, 4)
                    self.logging.info("player"+str(self.turn)+ " get 4 cards")
                    # self.show_player_cards(self.turn)
                #配ろうとしたのちにtrashに加える.
                self.trash.append(action)
            #出ない場合
            else:
                self.logging.info("player"+str(self.turn)+ ": pass")
                self.give_cards(self.turn)
            
            self.next_turn()
            self.logging.info("-----")
        
        self.logging.info("Winner is player"+str(self.winner()))
        scores = self.calc_scores(self.winner())
        self.logging.info("final score is: "+ str(scores))
        return scores

    def give_turn(self, pid:int, c:int, color:int, trash, turn_plus):
        return self.players[pid].get_turn(c, color, trash, turn_plus)
    
    def show_player_cards(self, pid:int): 
        self.logging.debug("player" + str(pid) + ": " + str(self.players[pid].show_my_cards()))

if __name__ == "__main__":
    logging.basicConfig(format="%(message)s")
    ll = logging.getLogger("mcs")
    ll.setLevel(logging.WARN)
    tm = TestMaster(ll)
    scores = np.zeros(4)
    try:
        for i in tqdm.tqdm(range(100)):
            scores += tm.set_and_game()
    except KeyboardInterrupt as e:
        print(scores)
        exit()
    print(scores)