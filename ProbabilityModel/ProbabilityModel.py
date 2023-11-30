import numpy as np
from tqdm import tqdm
import logging, sys, os, math, bisect, random, time
sys.path.append(os.path.join(sys.path[0],os.pardir))

from Game.Master import Master
from Game.Card import Card
from Game.Ruler import Ruler

class ProbabilityModel():
    one = [0, 13, 26, 39, 54]
    three = [55]
    four = [52, 53]
    alpha = 1 / (10 ** 4)
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
                initprobability[i][1] = 7 * 4 * 105 * 104 * 103 / (112 * 111 * 110 * 109)
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
        self.deck_rest = Card.VARIATION * 2 - (7 * 4)
        self.get_index_u = np.vectorize(self.get_index)
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
            for i in range(3):
                for j in range(4, 0, -1):
                    if self.plpb[i][card][j] != 0:
                        self.plpb[i][card][j] = 0
                        break
                self.plpb[i][card] /= np.sum(self.plpb[i][card])

    def i_submit_card(self, card:int):
        self.trash.append(card)

    def other_player_get_card(self, pid:int,  my_card, card_num):
        #改善の余地あり。相手の手札確率を考慮していない。
        utrash, ctrash = np.unique(self.trash, return_counts = True)
        deckintrash = np.where(np.isin(self.uinideck, utrash))[0]
        restcount = self.inideckcount.copy()
        restcount[deckintrash] -= ctrash
        restcount -= my_card
        #restcountはPlayer型
        num_rest_Card = np.sum(restcount)
        draw = min(num_rest_Card, card_num)
        
        for i in range(Card.VARIATION):
            temp = np.zeros(5, dtype=np.float64)
            for num in range(0, min(card_num, restcount[i])+1):
                prob = math.comb(card_num, num)*math.comb(num_rest_Card-card_num, draw - num)/math.comb(num_rest_Card, draw)
                temp[num:] +=  self.plpb[pid-1][i][:5-num] * prob
            self.plpb[pid-1][i] = temp


        if num_rest_Card < card_num:
            card_num -= num_rest_Card
            restcount = self.inideckcount.copy
            restcount[self.trash[-1]] -= 1
            restcount -= my_card
            draw = card_num - num_rest_Card
            for i in range(Card.VARIATION):
                temp = np.zeros(5, dtype=np.float64)
                for num in range(1, min(card_num, restcount[i])+1):
                    prob = math.comb(card_num, num)*math.comb(num_rest_Card-card_num, draw - num)/math.comb(num_rest_Card, draw)
                    temp[num:] +=  self.plpb[pid-1][i][:5-num] * prob
                self.plpb[pid-1][i] = temp

    def other_player_pass(self, pid:int, desk:int, color:int):
        self.plpb[pid-1][np.where(ProbabilityModel.rule.canSubmit_byint(desk, color) == 1 )[0]] = np.array([1-ProbabilityModel.alpha, ProbabilityModel.alpha, 0, 0, 0])
  
    def show(self, pid:int, card:int):
        print(self.plpb[pid-1][card]) 

    def get_player_cumsum(self):
        return np.cumsum(self.plpb, axis=2)
        
    def get_player_card(self,  num_card: list[int], cumsums):
        others = []
        for i in range(3):
            ans = []
            t = 0
            while len(ans) < num_card[i]:
                a = np.apply_along_axis(self.get_index(t), axis=1, arr = cumsums[i])
                cs = np.repeat(self.arange, a)
                cumsums[i][cs] = np.array([1, 1, 1, 1, 1])
                ans.extend(cs)
                t += 0.01
            cands = np.array(ans)
            np.random.shuffle(cands)
            others.append(ans[:num_card[i]])
        return others
    
    def get_index(self, t):
        def no_name(cumsum):
            return bisect.bisect_left(cumsum, random.uniform(t, 1))
        return no_name

if __name__ == "__main__":
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
    PM.show(1, 13)
    PM.other_player_pass(1, 0, 0)
    cumsum = PM.get_player_cumsum()
    start = time.time()
    for i in range(1000):
        PM.get_player_card( [17, 17, 7], cumsum.copy())
    end = time.time()
    print(end - start)