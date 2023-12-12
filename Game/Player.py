import numpy as np
from Card import Card
from Ruler import Ruler
import logging
from numba import njit, jit
class Player:
    rule = Ruler()
    colors = ["red", "yellow", "green", "blue"]
    def __init__(self) -> None:
        self.Cards = np.zeros(Card.VARIATION, dtype=np.int8)
        self.num_cards = 0
        self.get_num = np.frompyfunc(Card.getnumber, 1, 1)
        self.logging = logging.getLogger("player")
        self.logging.setLevel(logging.WARN)
        

    def get_card(self, c:np.ndarray[int]):
        self.num_cards = self.__get_card(self.Cards, c, self.num_cards, Card.VARIATION)
    
    @staticmethod
    @njit(cache = True)
    def __get_card(Cards:np.ndarray[np.int8], c:np.ndarray[np.int8], num_cards:int, VAR):
        if len(c) != VAR:
            num_cards += len(c)
            for i in c:
                Cards[i] += 1
        else:
            Cards += c
            num_cards += np.sum(c)
        return num_cards
    def give_all_my_cards(self):
        self.num_cards = 0
        ans = self.Cards.copy()
        self.Cards -= self.Cards
        return ans
    
    @staticmethod
    @njit(cache = True)
    def __strategy(cs:np.ndarray[np.int8]):
        i = np.where(cs > 0)[0][0]
        if i >= 52 and i != 55:
            c = np.random.randint(4)
        else:
            c = -1
        return i, c
    
    def strategy(self, cs):
        i, c = self.__strategy(cs)
        if i >= 52 and i != 55:
            self.logging.info(Player.colors[c])
        else:
            c = None
        return i, c

    def get_turn(self, c:int, color, trash=None, turn_plus = 1):
        cs = self.__get_turn(self.Cards, Player.rule.canSubmit_byint(c, color))
        if self.__all(cs):
            return -1, None
        
        #submit
        i, c = self.strategy(cs)
        self.num_cards, flag = self.__i_and_c(i, self.num_cards, self.Cards)
        if flag:
            self.logging.info("UNO!!")
        return i, c
    
    @staticmethod
    @njit(cache = True)
    def __get_turn(Cards:np.ndarray[np.int8], rulearray:np.ndarray[np.int8]):
        cs = rulearray * Cards
        return cs
        
    @staticmethod
    @njit(cache = True)
    def __all(cs:np.ndarray[np.int8]):
        return np.all(cs==0)

    @staticmethod
    @njit(cache = True)
    def __i_and_c(i, restnum, Cards):
        Cards[i] -= 1
        restnum -= 1
        return restnum, restnum == 1


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

class RandomPlayer(Player):
    def strategy(self, cs):
        i, c = self.__strategy(cs)
        if c != -1:
            self.logging.info(Player.colors[c])
        else:
            c = None
        return i, c
    
    @staticmethod
    @njit(cache = True)
    def __strategy(cs:np.ndarray[np.int8]):
        i = np.random.choice(np.where(cs > 0)[0], size=1)[0]
        if i >= 52 and i != 55:
            c = np.random.randint(4)
        else:
            c = -1
        return i, c

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