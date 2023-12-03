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
        self.have_num_card[pid-1] -= 1

        for i in range(3):
            if i == pid - 1:
                try:
                    self.plpb[pid - 1][card][:4] = self.plpb[pid - 1][card][1:] / np.sum(
                        self.plpb[pid - 1][card][1:]
                    )
                except:
                    print(self.plpb[pid - 1][card][1:])
                    raise ValueError("self.plpbcomb")
            else:
                self.card_open(card, i+1)
        self.trash.append(card)

    def i_get_card_num(self, num, mycard):
        restcount = Card.VARIATION * 2
        restcount -= num
        restcount -= len(self.trash)
        restcount -= np.sum(mycard)
        restcount -= np.sum(self.have_num_card)
        if restcount < 0:
            self.trash_clean(mycard)


    def i_get_card(self, Cards: np.ndarray[int], deck_num = Card.VARIATION * 2):
        for card in Cards:
            self.cardcount[card] += 1
            self.sum_cardcount += 1
            for i in range(3):
                self.card_open(card, i + 1, deck_num)

    def card_open(self, card, pid, deck_num=Card.VARIATION * 2):
        """
        あるcardがopenになったときの計算をpidに対して行う。本来であれば、その他のカードを持っている確率は上昇するが、今回は行わない。
        #TODO また山札がresetされたときのことをまだ考えていない
        """
        card_num = self.num_card(card)
        r = self.cardcount[card]
        for j in range(0, card_num + 1):

           
            # 分母の寄与
            multiple1 = (deck_num - r + 1) / (card_num - r + 1)
            # 分子の寄与
            multiple2 = (card_num - r - j + 1) / (
                deck_num - self.have_num_card[pid - 1] - self.sum_cardcount + 1
            )
            if np.abs(multiple2) > 100:
                print(deck_num, self.have_num_card[pid - 1], self.sum_cardcount)
                sys.exit(0)
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


    def other_player_get_card(self, pid: int, my_card, card_num):
        # 改善の余地あり。相手の手札確率を考慮していない。
        utrash, ctrash = np.unique(self.trash, return_counts=True)
        restcount = self.inideckcount.copy()
        if len(utrash) != 0:
            restcount[utrash] -= ctrash
        restcount -= my_card
        # restcountはPlayer型
        num_rest_Card = np.sum(restcount)
        draw = min(num_rest_Card - np.sum(self.have_num_card), card_num)


        # 山札からある分からdraw枚数だけdraw
        for i in range(0, Card.VARIATION):
            temp = np.zeros(5, dtype=np.float64)
            amount = restcount[i]
            for num in range(0, min(draw, restcount[i]) + 1):
                try:
                    prob = (
                        math.comb(draw, num)
                        * math.comb(num_rest_Card - draw, restcount[i] - num)
                        / math.comb(num_rest_Card, restcount[i])
                    )
                except:
                    print(num_rest_Card, restcount[i], draw, num)
                    raise ValueError("kokodesuyo")
                try:
                    temp[num : amount + 1] += (
                        self.plpb[pid - 1][i][: amount - num + 1] * prob
                    )
                except:
                    print(num, amount, self.trash, my_card, card_num)
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
                        math.comb(restcount[i], num)
                        * math.comb(num_rest_Card - restcount[i], draw - num)
                        / math.comb(num_rest_Card, draw)
                    )
                    temp[num : amount + 1] += (
                        self.plpb[pid - 1][i][: amount - num + 1] * prob
                    )
                self.plpb[pid - 1][i] = temp

        self.have_num_card[pid - 1] += card_num
        
        
    def trash_clean(self, my_card):
        self.trash = [self.trash[-1]]
        self.cardcount -= self.cardcount
        self.cardcount += my_card
        self.cardcount[self.trash[0]] += 1
        self.sum_cardcount = np.sum(my_card) + 1
        self.drawcount = np.repeat(0, repeats=3).astype(np.int8)

    def shuffle(self, pid:int, pre_my_card, af_my_card):
        #TODO:shuffleされたときの挙動を考えなくては
        total = self._shuffle_num_card(pid, pre_my_card)
        self._shuffle_average()

        diff = af_my_card - pre_my_card
        bef = np.where(diff < 0, -diff, 0)
        self.cardcount -= bef
        self.sum_cardcount -= np.sum(bef)
        af = np.where(diff > 0, diff, 0)
        stuck_af = np.repeat(self.arange, af)
        self._shuffle_distribute_bef(self.have_num_card, bef)
        #FIXME: 優先度低　shuffle後のカード確率校正
        self.i_get_card(stuck_af)

    def _shuffle_distribute_bef(self, draws, bef):
        sum = np.sum(draws)
        for card, amount in enumerate(bef):
            limit = self.num_card(card) - self.cardcount[card]
            for i in range(3):
                temp = np.zeros(5, dtype=np.float64)
                for num in range(0, amount+1):
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
        average = np.sum(self.plpb, axis=0)
        for i in range(3):
            self.plpb[i] = np.copy(average)


    def _shuffle_num_card(self, pid, pre_my_card):
        mynum = np.sum(pre_my_card)
        other_num = np.sum(self.have_num_card)
        total = mynum + other_num
        rest = total % 4
        basic = total // 4
        self.have_num_card = np.repeat(basic, 3).astype(np.int8)
        for i in range(1, rest+1):
            if (pid + i) % 4 >= 1:
                self.have_num_card[((pid + i) % 4) - 1] += 1
        return total
        
    def other_player_pass(self, pid: int, desk: int, color: int):
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
        
        for i in range(3):
            ans = []
            t = 1
            while len(ans) < num_card[i]:
                a = np.apply_along_axis(self.get_index(t), axis=1, arr=cumsumss[i])
                cs = self.arange[a]
                #とりすぎた場合
                if len(ans) + len(cs) > num_card[i]:
                    a = np.random.choice(np.where(a)[0], num_card[i] - len(ans), replace=False)
                    cs = self.arange[a]
                ruikei[a] += 1
                cumsumss[:,np.arange(Card.VARIATION), rest - ruikei] = 1
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
                print(others)
                raise ValueError("rest____")
        
        if np.any(rest_ < 0):
            print(others, rest, self.trash)
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
            return bisect.bisect_left(cumsum, random.uniform(1 - 1/t, 1)) >= 1
        return no_name


if __name__ == "__main__":
    PM = ProbabilityModel()
    my_card = np.zeros(Card.VARIATION, dtype=np.int8)
    my_card[[0, 15, 24, 33, 40, 55]] += 1
    my_card[33] += 1
    my_card[17] += 1
    stuck_my = np.repeat(PM.arange, my_card)
    PM.i_get_card(stuck_my)
    #PM.player_submit_card(1, 15)
    #print(PM.plpb[:, 15])
    my_card[17] -= 1
    rest = PM.get_rest(my_card, 17)
    
    cumsum = PM.get_player_cumsum()
    PM.other_player_get_card(1, my_card, 83)
    #print(cumsum[1, 1, :])
    print(sum(rest))
    print(PM.get_player_card(cumsum, rest))
    #print(cumsum[1, 1, :])
    #print(PM.get_player_card(cumsum, rest))