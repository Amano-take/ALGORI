import numpy as np
from Card import Card
from Ruler import Ruler
import logging

class Player:
    rule = Ruler()
    colors = ["red", "yellow", "green", "blue"]
    def __init__(self) -> None:
        self.Cards = np.zeros(Card.VARIATION, dtype=np.int8)
        self.num_cards = 0
        self.get_num = np.frompyfunc(Card.getnumber, 1, 1)
        self.logging = logging.getLogger("ex")
        

    def get_card(self, c:np.ndarray[int]):
        self.num_cards += len(c)
        for i in c:
            self.Cards[i] += 1
    
    #何のためにあるのだろうか？
    def get_intcard(self, n:np.ndarray[int]):
        self.num_cards += len(n)
        tt = np.zeros(Card.VARIATION, dtype=np.int8)
        for i in n:
            tt[i] += 1
        self.Cards += tt

    def give_all_my_cards(self):
        self.num_cards = 0
        ans = self.Cards.copy()
        self.Cards -= self.Cards
        return ans

    def get_turn(self, c:int, color, trash=None, turn_plus = 1):
        if color is None:
            cs  = (Player.rule.canSubmit_byint(c) * self.Cards)
        else:
            cs = (Player.rule.canSubmit_byint(c, color) * self.Cards)
        #pass
        if np.all(cs==0):
            return -1, None
        
        #submit
        i = np.where(cs > 0)[0][0]
        self.Cards[i] -= 1
        self.num_cards -= 1
        #wildカードで色の宣言
        if i >= 52 and i != 55:
            c = np.random.randint(4)
            self.logging.info(Player.colors[c])
            return i, c
        
        if self.number_of_cards() == 1:
            self.logging.info("UNO!!")
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

#なぜか遅くなる始末
class NewPlayer(Player):
    def __init__(self) -> None:
        self.Cards = np.zeros(0, dtype=np.int8)
        self.logging = logging.getLogger("ex")

    def get_card(self, c:np.ndarray[int]):
        self.Cards = np.hstack((self.Cards, c))

    def give_all_my_cards(self):
        ans = self.Cards.copy()
        self.Cards = self.Cards[0:0]
        return ans
    
    def number_of_cards(self):
        return len(self.Cards)
    
    def my_score(self):
        if len(self.Cards) == 0:
            return 0
        else:
            ucard, cardcount = np.unique(self.Cards, return_counts=True)
            return np.sum(Player.rule.getscore()[ucard] * cardcount)
        
    def show_my_cards(self):
        ans = []
        for c in (self.Cards):
            t = Card(c)
            ans.append(t.__str__())
        return ans
    
    def show_cards(self, cs):
        ans = []
        for c in cs:
            ans.append(str(Card(c)))
        return ans
    
    def get_turn(self, c: int, color:int, trash=None, turn_plus=1):
        tmp = np.where(Player.rule.canSubmit_byint(c, color)[self.Cards])[0]
        inar = np.arange(len(self.Cards))[tmp]
        cs  = self.Cards[tmp]
        #pass
        if len(cs) == 0:
            return -1, None
        
        #submit
        index = np.argmin(cs)
        i = cs[index]
        self.Cards = np.delete(self.Cards, inar[index])
        #wildカードで色の宣言
        if i >= 52 and i != 55:
            c = np.random.randint(4)
            self.logging.info(Player.colors[c])
            return i, c
        
        if self.number_of_cards() == 1:
            self.logging.info("UNO!!")
        return i, None
        
class Test:
    def __init__(self) -> None:
        c = np.array([Card(2), Card(2), Card(53)])
        p = Player()
        p.get_card(c)
        p.show_cards()

if __name__ == "__main__":
    Test()