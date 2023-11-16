import random
import time
import numpy as np
from Player import Player
from Card import Card
import logging
class Master:
    player_num = 4

    def __init__(self) -> None:
        logging.basicConfig(level=logging.WARN, format="%(message)s")
        self.players = [Player() for _ in range(Master.player_num)]
        self.init_turn()
        self.num2Card = np.frompyfunc(lambda x: Card(x), 1, 1)
        self.deck = self.init_deck()
        self.desk, self.desk_color = 54, None
        self.trash = []
        for i in range(Master.player_num):
            self.give_cards(i, 7)
        self.show_all_players_cards()
        logging.debug("start game")
        self.game_start()

    def give_cards(self, pid, num=1):
        try:
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs
        except:
            #山札が足りなくなったら、
            self.deck = np.hstack((self.deck, self.num2Card(self.trash)))
            self.trash = []
            cs = self.get_card_from_deck(num)
            self.players[pid].get_card(cs)
            return cs

    def game_start(self):
        while not self.is_game_finished():
            self.show_player_cards(self.turn)
            action, color = self.give_turn(self.turn, self.desk, self.desk_color)
            if action >= 0:
                
                logging.debug("player"+ str(self.turn)+ ": submit "+str(Card(action))+ " to "+ str(Card(self.desk)))
                self.desk = action
                #actionがワイルドカードの時
                if action <= 51:
                    self.desk_color = None
                else:
                    self.desk_color = color

                if action in [10, 23, 36, 49]:
                    self.next_turn()
                    self.give_cards(self.turn, 2)
                    logging.debug("player"+ str(self.turn)+ " get 2 cards")
                    self.show_player_cards(self.turn)
                elif action == 52:
                    self.next_turn()
                    self.give_cards(self.turn, 4)
                    logging.debug("player"+str(self.turn)+ " get 4 cards")
                    self.show_player_cards(self.turn)
                #配ろうとしたのちにtrashに加える.
                self.trash.append(action)
            else:
                logging.debug("player"+str(self.turn)+ ": pass")
                self.give_cards(self.turn)
            
            self.next_turn()
            logging.debug("-----")
        
        logging.debug("Winner is player"+str(self.winner()))


    def winner(self):
        for i in range(Master.player_num):
            if self.players[i].number_of_cards() == 0:
                return i
            
    def show_trash(self):
        ans = []
        for c in self.trash:
            ans.append(str(c))
        return str(ans)

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
            ans.append(str(c))
        return str(ans)

    def show_player_cards(self, pid:int):
        logging.debug("player" + str(pid) + ": " + str(self.players[pid].show_my_cards()))

    def show_all_players_cards(self):
        for i in range(Master.player_num):
            self.show_player_cards(i)
        
    
    def init_turn(self):
        np.random.seed()
        self.turn = np.random.randint(0, Master.player_num)
        self.turn = 0

    def next_turn(self):
        self.turn += 1
        self.turn %= 4

    def get_card_from_deck(self, n=1):
        indices = np.random.choice(len(self.deck), n, replace=False)
        ans = self.deck[indices]
        self.deck = np.delete(self.deck, indices)
        return ans

    def init_deck(self) -> np.ndarray[Card]:
        cards = np.zeros(108, dtype=Card)
        index = 0
        for i in range(54):
            c = i // 13
            v = i % 13
            if c < 4 and v == 0:
                cards[index] = Card(i)
                index += 1
            elif c < 4:
                cards[index] = Card(i)
                cards[index+1] = Card(i)
                index += 2
            else:
                for _ in range(4):
                    cards[index] = Card(i)
                    index += 1
        return cards
        

class Test:
    def __init__(self) -> None:
        np.random.seed(0)
        start = time.time()
        for i in range(1000):
            m = Master()
        end = time.time()
        print(end - start)
    
    def testonece():
        m = Master()
if __name__ == "__main__":
    Test()