import * as SocketIO from 'socket.io';
import { TestToolConst } from '../../consts/test-tool.consts';

export class TestToolSocketService {
  public static io = (<any>global).__IO as SocketIO.Server;

  public static handlePlayer(_: SocketIO.Socket, next: (err?: any) => void) {
    return next();
  }

  public static async getAllClientOfRoom(room: string) {
    return new Promise((resolve) => {
      TestToolSocketService.io
        .of('/')
        .in(room)
        .clients((error: any, clients: any) => {
          resolve(clients);
        });
    });
  }

  public static async sendEvent(name: string, data: any) {
    const socketIds = Object.keys(
      TestToolSocketService.io.of('/').to(TestToolConst.DEALER).connected,
    );
    const _sock = TestToolSocketService.io.of('/').adapter.nsp.sockets[socketIds[0]];
    _sock.emit(name, data);
  }
}
