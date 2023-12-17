import os, sys, time, random
import socketio
import numpy as np
#ここどうすればいいんだろうか？
sys.path.append('d:\\Study\\Programming\\ALGORI\\Game')
sys.path.append('d:\\Study\\Programming\\ALGORI\\ProbabilityModel')
from ProbabilityModel.ProbabilityModel import ProbabilityModel
from Player import Player, RandomPlayer
from Card import Card
from Ruler import Ruler
from Master import Master
import logging, logging.config
from numba import jit, njit

class MiniMaster():
    """
    ほしい情報
    ほかのプレイヤーが何に対してパスを行ったか？
    他のプレイヤーのカードの枚数
    """
    Rule = Ruler()

    def __init__(self) -> None:
        self.probModel = ProbabilityModel()

    def start(self, players:list, start_card: np.int8, my_name:str):
        """
        players: [Player1, Player2, ...] 4人 player1's next is player2\n
        first_playerに対応.
        """
        self.players = players
        self.turn = 0
        self.is_reverse = False
        self.players_rest = np.zeros(4, dtype=np.int8)
        self.trash = []
        self.force_draw = False

        my_turn = self.players.index(my_name)
        self.dict_turn2probId = {my_turn + i: i for i in range(4)}


        self.desk = start_card
        #wild
        if start_card == 53:
            return self.players[0]

        self.desk_color = start_card // 13

        #reverse
        if start_card % 13 == 12:
            self.is_reverse = True
            self.turn = 3
        #skip
        elif start_card % 13 == 11:
            self.turn = 1
        #+2
        elif start_card % 13 == 10:
            self.other_player_draw(0, 2)
            self.turn = 1

        return None
    
    def receive_first_color_of_wild(self, color:int):
        self.desk_color = color

    def next_turn(self):
        if self.is_reverse:
            self.turn = (self.turn - 1) % 4
        else:
            self.turn = (self.turn + 1) % 4

    def reverse_turn(self):
        self.is_reverse = not self.is_reverse

    def receive_draw(self, turn):
        if turn != self.turn:
            self.deal_with_penalty(turn)
            return
        
        if self.players_rest[turn] != 0:
            self.players_rest[turn] -= 1
            self.other_player_draw(self.turn, 1)
            self.next_turn()
            return

        if self.force_draw:
            self.force_draw = False
            self.next_turn()
            return
        
        self.probModel.other_player_pass(self.dict_turn2probId[turn], self.desk, self.desk_color)

    def receive_play_draw_card(self, playerid, is_play_card:bool, card:np.int8, color_of_wild:int):
        player_turn = self.players.index(playerid)
        if player_turn != self.turn:
            self.deal_with_penalty(player_turn)
            return
        
        if is_play_card:
            self.desk = card
            if color_of_wild != -1:
                self.desk_color = color_of_wild
            else:
                self.desk_color = card // 13

    
    def other_player_submit_card(self, playerid:int, card:np.int8, color:int):
        
        turn = self.players.index(playerid)
        #check the card is valid for the desk,color
        if not MiniMaster.Rule.canSubmit_byint(self.desk, self.desk_color)[card]:
            return
        if self.turn != turn:
            return
        
        self.probModel.other_player_submit_card(self.dict_turn2probId[turn], card)
        self.desk = card
        if color != -1:
            self.desk_color = color
        else:
            self.desk_color = card // 13
        self.next_turn()

    def other_player_draw(self, turn:int, draw_num):
        self.probModel.other_player_get_card(self.dict_turn2probId[turn], draw_num)

    def _next_turn(self):
        if self.is_reverse:
            return (self.turn - 1) % 4
        
        else:
            return (self.turn + 1) % 4
        

    def deal_with_action(self, action:int):
        if action in Master.card_plus_two:
            self.other_player_draw(self._next_turn(), 2)
            self.force_draw = True
        elif action in Master.card_skip:
            self.next_turn()
        elif action in Master.card_reverse:
            self.reverse_turn()
        elif action in Master.card_plus_four:
            self.other_player_draw(self._next_turn(), 4)
            self.force_draw = True
        elif action in Master.card_shuffle:
            pass
        elif action in Master.card_skipbind2:
            self.next_turn()
            self.players_rest[(self.turn + 1) % 4] += 2
            self.force_draw = True
        #配ろうとしたのちにtrashに加える.
        self.trash.append(action)
        self.next_turn()


    def deal_with_penalty(self, playerid:int):
        """二枚引く"""
        if self.turn == self.players.index(playerid):
            self.probModel.other_player_get_card(self.dict_turn2probId[self.turn], 2)
            self.next_turn()
        else:
            self.probModel.other_player_get_card(self.dict_turn2probId[self.players.index(playerid)], 2)


    def receive_shuffle(self, af_cards, num_cards, my_cards:np.ndarray[np.int8]):
        self.probModel.shuffle(self.turn, my_cards, af_cards, self.is_reverse)
        for i in range(4):
            t = self.dict_turn2probId[i]
            if t != 0:
                assert self.probModel.have_num_card[t-1] == num_cards[i]
        return np.copy(af_cards)

