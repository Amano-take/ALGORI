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

    def get_turn(self, c:int, color):
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

    def 

class TestMaster(Master):

    def __init__(self, level = logging.WARN) -> None:
        self.level = level
        logging.basicConfig(level=level, format="%(message)s")
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)
    
    def set_and_game(self):
        self.players = [Player() for _ in range(Master.player_num -1 )]
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

if __name__ == "__main__":
    tm = TestMaster(logging.DEBUG)
    tm.set_and_game()