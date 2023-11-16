import numpy as np
import time

class Card():
    """
    赤、黄、緑、青 * 13(0, 1, ..9, +2, skip, reverse) + wild * 2(+4, all) + Empty
    
    """
    VARIATION = 54
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
        elif var != "+4":
            number += int(var)
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
            else:
                v = "all"
        else:
            vars = ["+2", "skip", "reverse"]
            v = vars[var - 10]
        return c + ":" + v

    def getnumber(self):
        return int(self.num)

class Test():
    def __init__(self) -> None:
        for i in range(54):
            card = Card(i)
            print(card)

if __name__ == "__main__":
    Test()