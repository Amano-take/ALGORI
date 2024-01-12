import numpy as np
from collections import defaultdict as ddict
from numba import njit
import time


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
    def _from_str(cls, cardict: dict):
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
                vars = ["draw_2", "skip", "reverse"]
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


def init_deck() -> np.ndarray[int]:
    # self.deck : np.ndarray[int]
    # ランダムシャフルする
    cards = np.zeros(56 * 2, dtype=np.int8)
    index = 0
    for i in range(56):
        c = i // 13
        v = i % 13
        # not wild
        if c < 4 and v == 0:
            cards[index] = i
            index += 1
        elif c < 4:
            cards[index] = i
            cards[index + 1] = i
            index += 2
        # wild
        else:
            # shuffle
            if v == 2:
                cards[index] = i
                index += 1
            # skipbind2
            elif v == 3:
                for _ in range(3):
                    cards[index] = i
                    index += 1
            # +4, all
            else:
                for _ in range(4):
                    cards[index] = i
                    index += 1
    np.random.shuffle(cards)
    return cards


class Test:
    rule = Ruler()

    def __init__(self):
        self.initdeck = init_deck()
        self.uinideck, self.inideckcount = np.unique(self.initdeck, return_counts=True)
        self.Cards = np.zeros(56, np.int8)
        self.Cards[0] = 1
        self.Cards[13] = 1
        self.Cards[15] = 1
        self.Cards[18] = 1
        self.Cards[20] = 1
        self.Cards[21] = 1
        self.Cards[23] = 1
        start = time.time()
        print(self.random_likelihood2([1], [7, 7, 7], [[0, 13, 26, 39, 0, 2], [], []]))
        print(time.time() - start)

    def random_likelihood2(
        self, trash, other_player_num_of_card: list[int], players_pass_history
    ):
        utrash, tcount = np.unique(trash, return_counts=True)
        restcount = self.inideckcount.copy()
        restcount[utrash] -= tcount
        restcount -= self.Cards
        try:
            restCards = np.repeat(self.uinideck, restcount)
        except:
            print(restcount)
        # restCards : np.ndarray[int] -> [0 1 1 2 2 ...]
        # ランダムチョイス, replaceを変えればうまくいきそう
        tmp = [[] for _ in range(3)]
        np.random.shuffle(restCards)
        s = np.sum(other_player_num_of_card)
        card_deliver = other_player_num_of_card.copy()
        for card in restCards[:s]:
            perm = self.random_return_permutation()
            for p in perm:
                if card_deliver[p] == 0:
                    continue
                for index, pass_history in enumerate(players_pass_history[p][::-1][:2]):
                    if Test.rule.canSubmit_byint(pass_history)[
                        card
                    ] == 1 and self.random_return(0.9**index):
                        break
                else:
                    tmp[p].append(card)
                    card_deliver[p] -= 1
                    break
            else:
                for p in perm:
                    if card_deliver[p] == 0:
                        continue
                    tmp[p].append(card)
                    card_deliver[p] -= 1
                    break
        return tmp, restCards[s:]

    def random_return_permutation(self):
        return np.random.permutation(3)

    def random_return(self, prob):
        return np.random.random() < prob


Test()
