import numpy as np
from Card import Card

class Ruler():
    def __init__(self) -> None:
        #場のカードc1に対してc2が出せるなら1, 出せないなら0
        #c1c=4に対しては全て出せるようになっている
        self.canSubmitArray = np.zeros((Card.VARIATION+1, Card.VARIATION), dtype=np.int8)
        for c1 in range(Card.VARIATION+1):
            c1c = c1 // 13
            c1v = c1 - c1c * 13
            for c2 in range(Card.VARIATION):
                c2c = c2 // 13
                c2v = c2 - c2c * 13
                #wild
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
                #wild
                if c2c == 4:
                    self.canSubmitColorArray[c1][c2] = 1
                elif c1 == c2c:
                    self.canSubmitColorArray[c1][c2] = 1

        self.score = np.zeros(Card.VARIATION, dtype=np.int16)
        for i in range(Card.VARIATION):
            c = i // 13
            v = i % 13
            #wild
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
    
    def canSubmit_byint(self, c1:int, color=None) -> np.ndarray:
        colors = ["red", "yellow", "green", "blue"]
        if isinstance(color, str):
            return self.canSubmitColorArray[colors.index(color)]
        elif isinstance(color, int):
            #wildの場合は色に基づいて
            if c1 >= 52:
                return self.canSubmitColorArray[color]
            #それ以外の場合はc1の種類に基づいて
            else:
                return self.canSubmitArray[c1]
        elif isinstance(color, np.integer):
            #wildの場合は色に基づいて
            if c1 >= 52:
                return self.canSubmitColorArray[color]
            #それ以外の場合はc1の種類に基づいて
            else:
                return self.canSubmitArray[c1]

        else:
            return self.canSubmitArray[c1]

    def getscore(self) -> np.ndarray[int]:
        return self.score
    
class Test():
    def __init__(self, c:Card) -> None:
        print(c)
        r = Ruler()
        print(r.canSubmit_byint(55, 0))

if __name__ == "__main__":
    Test(Card(0))
        