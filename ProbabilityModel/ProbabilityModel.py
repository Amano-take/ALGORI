import time
import numpy as np
from tqdm import tqdm
import logging, sys, os, math
sys.path.append(os.path.join(sys.path[0],os.pardir))

from Game.Master import Master
from Game.Card import Card

class ProbabilityModel():
    one = [0, 13, 26, 39, 54]
    three = [55]
    four = [52, 53]
    def __init__(self) -> None:
        initprobability = np.zeros((Card.VARIATION, 5))
        for i in range(Card.VARIATION):
            color = i // 13
            value = i % 13
            if color < 4:
                if value == 0:
                    initprobability[i][1] = 7 / 112
                    initprobability[i][0] = 105 / 112
                else:
                    initprobability[i][2] = 42 / (112 * 111)
                    initprobability[i][1] = 7 * 105 * 2 / (112 * 111)
                    initprobability[i][0] = 105 * 104 / (112 * 111)
            if color == 4:
                if value == 2:
                    initprobability[i][0] = 105 / 112
                    initprobability[i][1] = 7 / 112
                elif value == 3:
                    initprobability[i][0] = 105 * 104 * 103 / (112 * 111 * 110)
                    initprobability[i][1] = 7 * 105 * 104 * 3 / (112 * 111 * 110)
                    initprobability[i][2] = 7 * 6 * 105 * 3 / (112 * 111 * 110)
                    initprobability[i][3] = 7 * 6 * 5 / (112 * 111 * 110)
                else:
                    initprobability[i][0] = 105 * 104 * 103 * 102 / (112 * 111 * 110 * 109)
                    initprobability[i][1] = 7 * 4 * 105 * 104 * 103 / (112 * 111 * 110 * 109)
                    initprobability[i][2] = 7 * 6 * 6 * 105 * 104 / (112 * 111 * 110 * 109)
                    initprobability[i][3] = 7 * 6 * 5 * 4 * 105 / (112 * 111 * 110 * 109)
                    initprobability[i][4] = 7 * 6 * 5 * 4 / (112 * 111 * 110 * 109)

        self.plpb = np.repeat(initprobability[np.newaxis, ::], 3, axis=0)
        self.trash = []
        self.deck_rest = Card.VARIATION * 2 - (7 * 4)
        logger = logging.getLogger("pm")
        inideck = Master(logger).init_deck()
        self.uinideck, self.inideckcount = np.unique(inideck, return_counts=True)

    def player_submit_card(self, pid:int, card:int):
        for i in range(3):
            if i == pid - 1:
                self.plpb[pid-1][card][:4] = self.plpb[pid-1][card][1:] / np.sum(self.plpb[pid-1][card][1:])
            else:
                for j in range(4, 0, -1):
                    if self.plpb[i][card][j] != 0:
                        self.plpb[i][card][j] = 0
                        break
                    else:
                        self.plpb[i][card] /= np.sum(self.plpb[i][card])
        self.trash.append(card)

    def i_get_card(self, Cards:np.ndarray[int]):
        for card in Cards:
            print(card)
            for i in range(3):
                for j in range(4, 0, -1):
                    if self.plpb[i][card][j] != 0:
                        self.plpb[i][card][j] = 0
                        break
                self.plpb[i][card] /= np.sum(self.plpb[i][card])

    def i_submit_card(self, card:int):
        self.trash.append(card)

    def other_player_get_card(self, pid:int,  my_card, card_num):
        utrash, ctrash = np.unique(self.trash, return_counts = True)
        deckintrash = np.where(np.isin(self.uinideck, utrash))[0]
        restcount = self.inideckcount.copy()
        restcount[deckintrash] -= ctrash
        restcount -= my_card
        num_rest_Card = np.sum(restcount)

        for i in range(Card.VARIATION):
            for num in range(1, min(card_num, restcount[i])+1):
                prob =math.comb(card_num, num)/math.comb(num_rest_Card, num)
                self.plpb[pid-1][i][num:] =  self.plpb[pid-1][i][:5-num] + prob
                self.plpb[pid-1][i] /= np.sum(self.plpb[pid-1][i])

    def show(self, pid:int, card:int):
        print(self.plpb[pid-1][card])  
    
PM = ProbabilityModel()
my_card = np.zeros(Card.VARIATION, dtype=np.int8)
my_card[0] += 1
my_card[11] += 2
my_card[15] += 1
my_card[55] += 2
my_card[52] += 1
get_cards = np.array([0, 11, 11, 15, 55, 55, 52])
PM.show(1, 55)
PM.i_get_card(get_cards)
PM.show(1, 55)
