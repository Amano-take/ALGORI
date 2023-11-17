import os
import sys
sys.path.append(os.path.join(sys.path[0],os.pardir))

from Game.Master import Master
from Game.Player import Player
from Game.Card import Card

import logging
import numpy as np


class PlayerMonteCarlo(Player):
    
    def __init__(self):
        super().__init__()
        self.master = Master()
        self.card2num = np.frompyfunc(lambda x: x.num, 1, 1)
        self.inideck = self.card2num(self.master.init_deck())
        self.uinideck, self.inideckcount = np.unique(self.inideck, return_counts=True)

    def get_turn(self, c:int, color:int, trash:list[np.ndarray[Card]]):
        if color is None:
            cs  = (Player.rule.canSubmit_byint(c) * self.Cards).astype(np.int8)
        else:
            cs = (Player.rule.canSubmit_byint(c, color) * self.Cards).astype(np.int8)
        #pass
        if sum(cs) == 0:
            return -1, None
        
        #submit
        i = np.where(cs > 0)[0][0]
        self.Cards[i] -= 1
        self.num_cards -= 1
        #wildカードで色の宣言
        if i >= 52:
            c = np.random.randint(4)
            logging.info(Player.colors[c])
            return i, c
        
        if self.number_of_cards() == 1:
            logging.info("UNO!!")
        return i, None

    def random_likelihood(self, trash):
        """
        trash, 自分のカードを除いて、その中からランダムに抽出
        for文でやるには重たすぎる。。解決!! 
        """
        utrash, count = np.unique(trash, return_counts=True)
        deckintrash = np.where(np.isin(self.uinideck, utrash))[0]
        restcount = self.inideckcount.copy()
        restcount[deckintrash] -= count
        delete_trash = np.repeat(self.uinideck, restcount)
        


class TestMaster(Master):

    def __init__(self, level = logging.WARN) -> None:
        self.level = level
        logging.basicConfig(level=level, format="%(message)s")
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)
    
    def set_and_game(self):
        self.players = [Player() for _ in range(Master.player_num -1 )]
        #モンテカルロを一人加える
        self.players.append(PlayerMonteCarlo())
        self.init_turn()
        self.deck = self.init_deck()
        self.desk, self.desk_color = 54, None
        self.trash = []
        for i in range(Master.player_num):
            self.give_cards(i, 7)
        self.show_all_players_cards()
        logging.debug("start game")
        self.game_start()

    def game_start(self):
        show_flag = self.level <= logging.DEBUG
        while not self.is_game_finished():
            if show_flag:
                self.show_player_cards(self.turn)
            action, color = self.give_turn(self.turn, self.desk, self.desk_color, self.trash)
            if self.turn == 0:
                self.players[3].random_likelihood(self.trash)
            #カードが出る場合
            if action >= 0:
                logging.debug("player"+ str(self.turn)+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
                self.desk = action
                #actionがワイルドカードの時
                if action <= 51:
                    self.desk_color = None
                else:
                    self.desk_color = color

                if action in Master.card_plus_two:
                    self.next_turn()
                    self.give_cards(self.turn, 2)
                    logging.debug("player"+ str(self.turn)+ " get 2 cards")
                    #self.show_player_cards(self.turn)
                elif action in Master.card_skip:
                    self.next_turn()
                    logging.debug("player"+str(self.turn)+" is skipped")
                elif action in Master.card_reverse:
                    self.reverse_turn()
                    logging.debug("turn reversed")
                elif action in Master.card_plus_four:
                    self.next_turn()
                    self.give_cards(self.turn, 4)
                    logging.debug("player"+str(self.turn)+ " get 4 cards")
                    # self.show_player_cards(self.turn)
                #配ろうとしたのちにtrashに加える.
                self.trash.append(action)
            #出ない場合
            else:
                logging.debug("player"+str(self.turn)+ ": pass")
                self.give_cards(self.turn)
            
            self.next_turn()
            logging.debug("-----")
        
        logging.debug("Winner is player"+str(self.winner()))
        scores = self.calc_scores(self.winner())
        logging.debug("final score is: "+ str(scores))
        return scores

    def give_turn(self, pid:int, c:int, color:int, trash):
        return self.players[pid].get_turn(c, color, trash)

if __name__ == "__main__":
    tm = TestMaster(logging.DEBUG)
    tm.set_and_game()