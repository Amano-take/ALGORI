import numpy as np
import time

class Card():
    """
    赤、黄、緑、青 * 13(0, 1, ..9, +2, skip, reverse) + wild * 2(+4, all) + shuffle + skipbind2 + Empty
    v: 0, 1, .. 9 = 0, 1, ..9
    v: 10: +2 11: skip 12: reverse
    v: 0: +4, 1:all, 2:shuffle, 3:skipbind2
    white = wild 色とする
    """
    VARIATION = 56
    def __init__(self, number) -> None:
        self.card = np.zeros(Card.VARIATION+1)
        self.card[number] = 1
        self.num = number

    @classmethod
    def _from_str(cls, color:str, var:str):
        number = 0
        if color == "yellow":
            number += 13
        elif color == "green":
            number += 26
        elif color == "blue":
            number += 39
        elif color == "wild":
            number += 52

        if var == "all":
            number += 1
        elif var == "+2":
            number += 10
        elif var == "skip":
            number += 11
        elif var == "reverse":
            number += 12
        elif var == "+4":
            pass
        elif var == "skipbind2":
            number += 3
        elif var == "shuffle":
            number += 2
        return cls(number)
        
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

class Test():
    def __init__(self) -> None:
        for i in range(56):
            card = Card(i)
            print(card)

if __name__ == "__main__":
    Test()