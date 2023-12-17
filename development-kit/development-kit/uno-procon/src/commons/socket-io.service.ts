import * as SocketIO from 'socket.io';

import {
  EmitChallenge,
  EmitDrawCard,
  EmitFinishGame,
  EmitFinishTurn,
  EmitFirstPlayer,
  EmitJoinRoom,
  EmitNextPlayer,
  EmitPenalty,
  EmitPlayCard,
  EmitPlayDrawCard,
  EmitPointedNotSayUno,
  EmitPublicCard,
  EmitReceiverCard,
  EmitShuffleWild,
  EmitUpdateColor,
  SocketConst,
} from './consts/socket.const';

export class SocketService {
  public static io = (<any>global).__IO as SocketIO.Server;

  public static handlePlayer(_: SocketIO.Socket, next: (err?: any) => void) {
    return next();
  }

  /**
   * 接続しているsocketクライアント一覧を取得
   * @param room ディラーコード
   * @returns {Promise}
   */
  public static async getAllClientOfRoom(room: string): Promise<SocketIO.Namespace> {
    return new Promise((resolve) => {
      SocketService.io
        .of('/')
        .in(room)
        .clients((_: any, clients: any) => {
          resolve(clients);
        });
    });
  }

  /**
   * socket情報を取得
   * @param socketId
   * @returns {SocketIO.Socket}
   */
  public static getSocketById(socketId: string): SocketIO.Socket {
    const _sock = SocketService.io.of('/').adapter.nsp.sockets[socketId];
    return _sock;
  }

  /**
   * プレイヤーが増えたことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitJoinRoom} data 送信データ
   * @returns
   */
  public static async broadcastJoinRoom(room: string, data: EmitJoinRoom) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.JOIN_ROOM, data);
    return;
  }

  /**
   * 対戦開始を全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitFirstPlayer} data 送信データ
   * @returns
   */
  public static broadcastFirstPlayer(room: string, data: EmitFirstPlayer) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.FIRST_PLAYER, data);
    return;
  }

  /**
   * 手札にカードが増えたことをプレイヤーに通知
   * @param {string} socketId 送信するsocketID
   * @param {EmitReceiverCard} data 送信データ
   * @returns
   */
  public static sendCardToPlayer(socketId: string, data: EmitReceiverCard) {
    const _sock = SocketService.io.of('/').adapter.nsp.sockets[socketId];
    _sock.emit(SocketConst.EMIT.RECEIVER_CARD, data);
    return;
  }

  /**
   * 色変更を指定するようプレイヤーに通知
   * @param {string} socketId 送信するsocketID
   * @returns
   */
  public static async sendChoseColorOfWild(socketId: string) {
    const _sock = SocketService.io.of('/').adapter.nsp.sockets[socketId];
    _sock.emit(SocketConst.EMIT.COLOR_OF_WILD, {});
    return;
  }

  /**
   * 場札の色が更新されたことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitUpdateColor} data 送信データ
   * @returns
   */
  public static async broadcastUpdateColor(room: string, data: EmitUpdateColor) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.UPDATE_COLOR, data);
    return;
  }

  /**
   * シャッフルワイルドで再配布されたカードをプレイヤーに通知
   * @param {string} socketId 送信するsocketID
   * @param {EmitShuffleWild} data 送信データ
   * @returns
   */
  public static sendCardShuffleWild(socketId: string, data: EmitShuffleWild) {
    const _sock = SocketService.io.of('/').adapter.nsp.sockets[socketId];
    _sock.emit(SocketConst.EMIT.SHUFFLE_WILD, data);
    return;
  }

  /**
   * 手番が変わったことを次のプレイヤーに通知
   * @param {string} socketId 送信するsocketID
   * @param {EmitNextPlayer} data 送信データ
   * @returns
   */
  public static sendNextPlayer(socketId: string, data: EmitNextPlayer) {
    const _sock = SocketService.io.of('/').adapter.nsp.sockets[socketId];
    _sock.emit(SocketConst.EMIT.NEXT_PLAYER, data);
    return;
  }

  /**
   * 場にカードを出したことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitPlayCard} data 送信データ
   * @returns
   */
  public static broadcastPlayCard(room: string, data: EmitPlayCard) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.PLAY_CARD, data);
    return;
  }

  /**
   * 山札からカードを引いたことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitDrawCard} data 送信データ
   * @returns
   */
  public static broadcastDrawCard(room: string, data: EmitDrawCard) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.DRAW_CARD, data);
    return;
  }

  /**
   * 山札から引いたカードを場に出したことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitPlayDrawCard} data 送信データ
   * @returns
   */
  public static broadcastPlayDrawCard(room: string, data: EmitPlayDrawCard) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.PLAY_DRAW_CARD, data);
    return;
  }

  /**
   * チャレンジの結果を全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitChallenge} data 送信データ
   * @returns
   */
  public static broadcastChallenge(room: string, data: EmitChallenge) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.CHALLENGE, data);
    return;
  }

  /**
   * 公開する手札をプレイヤーに通知
   * @param {string} socketId 送信するsocketID
   * @param {EmitPublicCard} data 送信データ
   * @returns
   */
  public static sendPublicCard(socketId: string, data: EmitPublicCard) {
    const _sock = SocketService.io.of('/').adapter.nsp.sockets[socketId];
    _sock.emit(SocketConst.EMIT.PUBLIC_CARD, data);
    return;
  }

  /**
   * UNO宣言漏れの指摘を全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitPointedNotSayUno} data 送信データ
   * @returns
   */
  public static broadcastPointedNotSayUno(room: string, data: EmitPointedNotSayUno) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.POINTED_NOT_SAY_UNO, data);
    return;
  }

  /**
   * 対戦が終了したことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitFinishTurn} data 送信データ
   * @returns
   */
  public static broadcastFinishTurn(room: string, data: EmitFinishTurn) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.FINISH_TURN, data);
    return;
  }

  /**
   * 試合が終了したことを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitFinishGame} data 送信データ
   * @returns
   */
  public static broadcastFinishGame(room: string, data: EmitFinishGame) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.FINISH_GAME, data);
    return;
  }

  /**
   * ペナルティを全体に通知
   * @param {string} room ディーラーコード
   * @param {EmitPenalty} data 送信データ
   * @returns
   */
  public static broadcastPenalty(room: string, data: EmitPenalty) {
    SocketService.io.of('/').to(room).emit(SocketConst.EMIT.PENALTY, data);
    return;
  }
}
