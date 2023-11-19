import random
import time
import os, sys
import numpy as np
#ここどうすればいいんだろうか？
sys.path.append('d:\\Study\\Programming\\ALGORI\\Game')
from Player import Player
from Card import Card
import logging
class Master:
    player_num = 4
    card_plus_two = set([10, 23, 36, 49])
    card_skip = set([11, 24, 37, 50])
    card_reverse = set([12, 25, 38, 51])
    card_plus_four = set([52])

    def __init__(self, logobject:logging.Logger) -> None:
        self.logging = logobject
        self.level = logobject.level
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)

    #自分を０として本来の順序順に1, 2, 3
    def set_board(self, deck:np.ndarray[Card], turn:int, reverse:int, my_deck:np.ndarray[int], other_decks:np.ndarray[np.ndarray[int]], trash:list, action, color, desk) -> np.ndarray[np.int16]:
        self.players = [Player() for _ in range(Master.player_num)]
        self.turn = 0
        self.desk = desk
        self.deck = deck.copy()
        self.turn_plus = reverse
        self.players[0].Cards = my_deck.copy()
        self.players[0].num_cards = len(my_deck)
        for i in range(1, 4):
            self.players[i].get_intcard(other_decks[i-1])
        self.trash=trash.copy()
        self.logging.debug("player"+ str(self.turn)+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
        self.desk = action
        #actionがワイルドカードの時
        if action <= 51:
            self.desk_color = None
        else:
            self.desk_color = color

        if action in Master.card_plus_two:
            self.next_turn()
            self.give_cards(self.turn, 2)
            self.logging.debug("player"+ str(self.turn)+ " get 2 cards")
            #self.show_player_cards(self.turn)
        elif action in Master.card_skip:
            self.next_turn()
            self.logging.debug("player"+str(self.turn)+" is skipped")
        elif action in Master.card_reverse:
            self.reverse_turn()
            self.logging.debug("turn reversed")
        elif action in Master.card_plus_four:
            self.next_turn()
            self.give_cards(self.turn, 4)
            self.logging.debug("player"+str(self.turn)+ " get 4 cards")
            # self.show_player_cards(self.turn)
        #配ろうとしたのちにtrashに加える.
        self.trash.append(action)
        self.next_turn()
        return self.game_start()
    
    def set_and_game(self):
        self.players = [Player() for _ in range(Master.player_num)]
        self.init_turn()
        self.deck = self.init_deck()
        self.desk, self.desk_color = 54, None
        self.trash = []
        for i in range(Master.player_num):
            self.give_cards(i, 7)
        self.show_all_players_cards()
        self.logging.debug("start game")
        self.game_start()

    def give_cards(self, pid:int, num=1):
        try:
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs
        except:
            #山札が足りなくなったら、
            self.deck = np.hstack((self.deck, self.trash))
            np.random.shuffle(self.deck)
            self.trash = []
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs

    def game_start(self):
        show_flag = self.level <= logging.DEBUG
        while not self.is_game_finished():
            if show_flag:
                self.show_player_cards(self.turn)
            action, color = self.give_turn(self.turn, self.desk, self.desk_color)
            #カードが出る場合
            if action >= 0:
                self.logging.debug("player"+ str(self.turn)+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
                self.desk = action
                #actionがワイルドカードの時
                if action <= 51:
                    self.desk_color = None
                else:
                    self.desk_color = color

                if action in Master.card_plus_two:
                    self.next_turn()
                    self.give_cards(self.turn, 2)
                    self.logging.debug("player"+ str(self.turn)+ " get 2 cards")
                    #self.show_player_cards(self.turn)
                elif action in Master.card_skip:
                    self.next_turn()
                    self.logging.debug("player"+str(self.turn)+" is skipped")
                elif action in Master.card_reverse:
                    self.reverse_turn()
                    self.logging.debug("turn reversed")
                elif action in Master.card_plus_four:
                    self.next_turn()
                    self.give_cards(self.turn, 4)
                    self.logging.debug("player"+str(self.turn)+ " get 4 cards")
                    # self.show_player_cards(self.turn)
                #配ろうとしたのちにtrashに加える.
                self.trash.append(action)
            #出ない場合
            else:
                self.logging.debug("player"+str(self.turn)+ ": pass")
                self.give_cards(self.turn)
            
            self.next_turn()
            self.logging.debug("-----")
        
        self.logging.debug("Winner is player"+str(self.winner()))
        scores = self.calc_scores(self.winner())
        self.logging.debug("final score is: "+ str(scores))
        return scores
    
    def winner(self):
        for i in range(Master.player_num):
            if self.players[i].number_of_cards() == 0:
                return i
            
    def show_trash(self):
        ans = []
        for c in self.trash:
            ans.append(str(c))
        return str(ans)
    
    def get_trash(self):
        return self.trash

    def give_turn(self, pid:int, c:int, color:int):
        return self.players[pid].get_turn(c, color)

    def is_game_finished(self):
        for i in range(Master.player_num):
            if self.players[i].number_of_cards() == 0:
                return True
        return False

    def show_deck(self):
        ans = []
        for c in self.deck:
            ans.append(str(Card(c)))
        return str(ans)

    def show_player_cards(self, pid:int):
        self.logging.debug("player" + str(pid) + ": " + str(self.players[pid].show_my_cards()))

    def show_all_players_cards(self):
        for i in range(Master.player_num):
            self.show_player_cards(i)
    
    def calc_scores(self, winner:int):
        ans = np.zeros(4)
        for i in range(4):
            if i !=winner:
                ans[i] =  - self.players[i].my_score()
        ans[winner] = - sum(ans)
        return ans.astype(np.int16)
    
    def init_turn(self):
        self.turn = np.random.randint(0, Master.player_num)
        #self.turn = 0
        self.turn_plus = 1

    def next_turn(self):
        self.turn += self.turn_plus
        self.turn %= 4
    
    def reverse_turn(self):
        self.turn_plus = (-1) * self.turn_plus

    def get_card_from_deck(self, n=1):
        if len(self.deck) < n:
            raise ValueError("aaa")
        ans = self.deck[0:n]
        self.deck = self.deck[n:]
        return ans

    def init_deck(self) -> np.ndarray[int]:
        #self.deck : np.ndarray[int]
        #ランダムシャフルする
        cards = np.zeros(108, dtype=Card)
        index = 0
        for i in range(54):
            c = i // 13
            v = i % 13
            if c < 4 and v == 0:
                cards[index] = i
                index += 1
            elif c < 4:
                cards[index] = i
                cards[index+1] = i
                index += 2
            else:
                for _ in range(4):
                    cards[index] = i
                    index += 1
        np.random.shuffle(cards)
        return cards
        

class Test:
    def __init__(self) -> None:
        pass
    @staticmethod
    def testonece():
        log = logging.getLogger("ex")
        log.setLevel(logging.DEBUG)
        m = Master(log)
        m.set_and_game()
    @staticmethod
    def test():
        np.random.seed(0)
        start = time.time()
        log = logging.getLogger("ex")
        log.setLevel(logging.WARN)
        m = Master(log)
        """大体2.2秒"""
        for i in range(1000):
            m.set_and_game()
                
        end = time.time()
        print(end - start)

if __name__ == "__main__":
    Test.test()
    #Test.testonece()