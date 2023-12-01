import numpy as np
from tqdm import tqdm
import logging, sys, os, math, bisect, random, time
from collections import defaultdict as ddict

sys.path.append(os.path.join(sys.path[0], os.pardir))

from Game.Master import Master
from Game.Card import Card
from Game.Ruler import Ruler


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

        inideck = Master(logger).init_deck()
        self.uinideck, self.inideckcount = np.unique(inideck, return_counts=True)

        self.cardcount = np.zeros(Card.VARIATION, dtype=np.int8)
        self.sum_cardcount = 0
        self.drawcount = np.repeat(7, repeats=3).astype(np.int8)
        self.have_num_card = np.repeat(7, repeats=3).astype(np.int8)

    def player_submit_card(self, pid: int, card: int):
        """
        pid:= 1, 2, 3
        """
        self.cardcount[card] += 1
        self.sum_cardcount += 1
        self.have_num_card[pid] -= 1

        for i in range(3):
            if i == pid - 1:
                self.plpb[pid - 1][card][:4] = self.plpb[pid - 1][card][1:] / np.sum(
                    self.plpb[pid - 1][card][1:]
                )
            else:
                self.card_open(card, i)
        self.trash.append(card)

    def i_get_card(self, Cards: np.ndarray[int]):
        for card in Cards:
            self.cardcount[card] += 1
            self.sum_cardcount += 1
            for i in range(3):
                self.card_open(card, i + 1)

    def card_open(self, card, pid):
        """
        あるcardがopenになったときの計算をpidに対して行う。本来であれば、その他のカードを持っている確率は上昇するが、今回は行わない。
        #TODO また山札がresetされたときのことをまだ考えていない
        """
        card_num = self.num_card(card)
        r = self.cardcount[card]
        for j in range(0, card_num + 1):
            # 分母の寄与
            multiple1 = (Card.VARIATION * 2 - r + 1) / (card_num - r + 1)
            # 分子の寄与
            multiple2 = (card_num - r - j + 1) / (
                Card.VARIATION * 2 - self.drawcount[pid - 1] - self.sum_cardcount + 1
            )
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

    def other_player_get_card(self, pid: int, my_card, card_num):
        self.have_num_card[pid - 1] += card_num

        # 改善の余地あり。相手の手札確率を考慮していない。
        utrash, ctrash = np.unique(self.trash, return_counts=True)
        deckintrash = np.where(np.isin(self.uinideck, utrash))[0]
        restcount = self.inideckcount.copy()
        restcount[deckintrash] -= ctrash
        restcount -= my_card
        # restcountはPlayer型
        num_rest_Card = np.sum(restcount) - np.sum(self.have_num_card)
        draw = min(num_rest_Card, card_num)
        # 山札からある分からdraw枚数だけdraw
        for i in range(1, Card.VARIATION):
            temp = np.zeros(5, dtype=np.float64)
            amount = self.num_card(i)
            for num in range(0, min(draw, restcount[i]) + 1):
                prob = (
                    math.comb(restcount[i], num)
                    * math.comb(num_rest_Card - restcount[i], draw - num)
                    / math.comb(num_rest_Card, draw)
                )
                temp[num : amount + 1] += (
                    self.plpb[pid - 1][i][: amount - num + 1] * prob
                )
            self.plpb[pid - 1][i] = temp / np.sum(temp)

        # trashを用いて配るような場合
        if draw < card_num:
            restcount = np.zeros(Card.VARIATION, np.int8)
            utrash, ctrash = np.unique(self.trash, return_counts=True)
            restcount[utrash] = restcount[utrash] + ctrash
            num_rest_Card = len(self.trash) - 1
            self.trash_clean()
            draw = card_num - draw
            for i in range(Card.VARIATION):
                temp = np.zeros(5, dtype=np.float64)
                amount = self.num_card(i)
                for num in range(0, min(draw, restcount[i]) + 1):
                    prob = (
                        math.comb(restcount[i], num)
                        * math.comb(num_rest_Card - restcount[i], draw - num)
                        / math.comb(num_rest_Card, draw)
                    )
                    temp[num : amount + 1] += (
                        self.plpb[pid - 1][i][: amount - num + 1] * prob
                    )
                self.plpb[pid - 1][i] = temp

    def trash_clean(self, my_card):
        self.trash = [self.trash[-1]]
        self.cardcount = np.zeros(Card.VARIATION, dtype=np.int8)
        self.cardcount += my_card
        self.cardcount[self.trash[0]] += 1
        self.sum_cardcount = np.sum(my_card) + 1
        self.drawcount = np.repeat(0, repeats=3).astype(np.int8)

    def other_player_pass(self, pid: int, desk: int, color: int):
        self.plpb[pid - 1][
            np.where(ProbabilityModel.rule.canSubmit_byint(desk, color) == 1)[0]
        ] = np.array([1 - ProbabilityModel.alpha, ProbabilityModel.alpha, 0, 0, 0])

    def show(self, pid: int, card: int):
        print(self.plpb[pid - 1][card])

    def get_player_cumsum(self):
        return np.cumsum(self.plpb, axis=2)

    def get_player_card(self):
        return self.have_num_card

    def get_player_card(self, num_card: list[int], cumsums):
        others = []
        for i in range(3):
            ans = []
            t = 0
            while len(ans) < num_card[i]:
                a = np.apply_along_axis(self.get_index(t), axis=1, arr=cumsums[i])
                cs = np.repeat(self.arange, a)
                cumsums[i][cs] = np.array([1, 1, 1, 1, 1])
                ans.extend(cs)
                t += 0.01
            cands = np.array(ans)
            np.random.shuffle(cands)
            others.append(ans[: num_card[i]])
        return others

    def get_index(self, t):
        def no_name(cumsum):
            return bisect.bisect_left(cumsum, random.uniform(t, 1))

        return no_name


if __name__ == "__main__":
    PM = ProbabilityModel()
    my_card = np.zeros(Card.VARIATION, dtype=np.int8)
    my_card[[0, 15, 24, 25, 33, 40, 55]] += 1
    get_cards = np.array([55])
    PM.show(1, 1)
    PM.other_player_get_card(1, my_card, 84)
    PM.show(1, 1)
    cumsum = PM.get_player_cumsum()
    start = time.time()
    for i in range(1000):
        PM.get_player_card([7, 7, 7], cumsum.copy())
    end = time.time()
    print(end - start)
