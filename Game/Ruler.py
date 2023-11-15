import numpy as np
from Card import Card

class Ruler():
    def __init__(self) -> None:
        #場のカードc1に対してc2が出せるなら1, 出せないなら0
        self.canSubmitArray = np.zeros((Card.VARIATION, Card.VARIATION))
        for c1 in range(Card.VARIATION):
            c1c = c1 // 13
            c1v = c1 - c1c * 13
            for c2 in range(Card.VARIATION):
                c2c = c2 // 13
                c2v = c2 - c2c * 13
                #wild
                if c2c == 4 or c1c == 4:
                    self.canSubmitArray[c1][c2] = 1
                elif c1v == c2v and c1c != 4:
                    self.canSubmitArray[c1][c2] = 1
                elif c1c == c2c:
                    self.canSubmitArray[c1][c2] = 1

    def canSubmit(self, c1: Card) -> np.ndarray:
        """
        c1: 場カード
        """
        return self.canSubmitArray[c1.getnumber()]
    


    
class Test():
    def __init__(self, c:Card) -> None:
        print(c)
        r = Ruler()
        ar = r.canSubmit(c)
        for i in range(len(ar)):
            if ar[i]:
                print(Card(i))

"""c = Card._from_str("wild", "+4")
print(c.num)
Test(c)"""
        