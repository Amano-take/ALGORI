import numpy as np
from Card import Card

class Ruler():
    def __init__(self) -> None:
        #場のカードc1に対してc2が出せるなら1, 出せないなら0
        #c1c=4に対しては全て出せるようになっている
        self.canSubmitArray = np.zeros((Card.VARIATION+1, Card.VARIATION))
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

        self.canSubmitColorArray = np.zeros((4, Card.VARIATION))
        for c1 in range(4):
            for c2 in range(Card.VARIATION):
                c2c = c2 // 13
                #wild
                if c2c == 4:
                    self.canSubmitColorArray[c1][c2] = 1
                elif c1 == c2c:
                    self.canSubmitColorArray[c1][c2] = 1

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
    


    
class Test():
    def __init__(self, c:Card) -> None:
        print(c)
        r = Ruler()
        ar = r.canSubmit(c)
        for i in range(len(ar)):
            if ar[i]:
                print(Card(i))

if __name__ == "__main__":
    Test(Card(0))
        