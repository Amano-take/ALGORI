import random
import time
import os, sys
import numpy as np
# ここどうすればいいんだろうか？
sys.path.append("d:\\Study\\Programming\\ALGORI\\Game")
from Player import Player
from Card import Card
import logging
from Master import Master


class RealMaster(Master):
    #TODO: pass後にカードを提出できるようにする。
    def game_start(self):
        show_flag = self.level <= logging.DEBUG
        while not self.is_game_finished():
            #手札を表示するかどうか
            if show_flag:
                self.show_player_cards(self.turn)
                if self.desk_color is not None:
                    self.logging.debug(str(Card(self.desk)) + " " + str(Player.colors[(self.desk_color)]) + " on desk")
            #rest確認後、ターンを渡す
            if self.player_rest[self.turn] == 0:
                action, color = self.give_turn(self.turn, self.desk, self.desk_color)
            #パスを強制しrestを一つ減らす。
            else:
                self.player_rest[self.turn] -= 1
                self.logging.debug("player" + str(self.turn) + " is binded so skip this turn. reminer is " + str(self.player_rest[self.turn]))
                action, color = -1, None
                

            #カードが出る場合
            if action >= 0:
                #TODO プレイヤー0に他playerが出したカードを通知
                self.deal_action_color(action, color, show_flag)
            #出ない場合
            else:
                #TODO passした後に通知、またパス後に出す仕組みを作る
                self.logging.debug("player"+str(self.turn)+ ": pass")
                self.give_cards(self.turn)
            
            self.next_turn()
            self.logging.debug("-----")
