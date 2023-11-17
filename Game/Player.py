import numpy as np
from Card import Card
from Ruler import Ruler
import logging
class Player:
    rule = Ruler()
    colors = ["red", "yellow", "green", "blue"]
    def __init__(self) -> None:
        self.Cards = np.repeat(0, 54).astype(dtype=np.int8)
        self.num_cards = 0
        self.get_num = np.frompyfunc(Card.getnumber, 1, 1)
        

    def get_card(self, c:np.ndarray[Card]):
        self.num_cards += len(c)
        
        cards = self.get_num(c).astype(np.int8)
        for i in cards:
            self.Cards[i] += 1
    
    def get_intcard(self, n:np.ndarray[int]):
        self.num_cards += len(n)

        self.Cards += n

    def get_turn(self, c:int, color, trash=None):
        if color is None:
            cs  = (Player.rule.canSubmit_byint(c) * self.Cards).astype(np.int8)
        else:
            cs = (Player.rule.canSubmit_byint(c, color) * self.Cards).astype(np.int8)
        #pass
        if sum(cs) == 0:
            return -1, None
        
        #submit
        i = np.where(cs > 0)[0][0]
        self.Cards[i] -= 1
        self.num_cards -= 1
        #wildカードで色の宣言
        if i >= 52:
            c = np.random.randint(4)
            logging.info(Player.colors[c])
            return i, c
        
        if self.number_of_cards() == 1:
            logging.info("UNO!!")
        return i, None
        
    def show_my_cards(self):
        ans = []
        for c, i in enumerate(self.Cards):
            for j in range(i):
                t = Card(c)
                ans.append(t.__str__())
        return ans
    
    def show_cards(self, cs:np.ndarray[Card]):
        ans = []
        for c in enumerate(cs):
            ans.append(c.__str__())
        return ans

    def number_of_cards(self):
        return self.num_cards
    
    def my_score(self):
        if self.num_cards == 0:
            return 0
        else:
            return np.sum(self.Cards * Player.rule.getscore())

class Test:
    def __init__(self) -> None:
        c = np.array([Card(2), Card(2), Card(53)])
        p = Player()
        p.get_card(c)
        p.show_cards()

if __name__ == "__main__":
    Test()