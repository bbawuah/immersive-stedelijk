import { Client, Room } from 'colyseus';
import { XRTeleportationData } from '../../components/experience/vr/types';
import { Physics } from '../../shared/physics/physics';
import { IMoveProps, IUserDirection } from '../../shared/physics/types';
import { ActionNames } from '../../store/store';
import { Player } from '../player/player';
import { State } from '../state/state';
import Peer from 'simple-peer';

export class Gallery extends Room<State> {
  public maxClients = 30; //Might need to change this amount.
  private physics: Physics;
  public patchRate = 100;
  public clients: Client[] = [];

  constructor() {
    super();
    this.physics = new Physics();
  }

  public onCreate() {
    // initialize empty room state
    this.setState(new State());
    // this.setSimulationInterval((deltaTime) => this.update(deltaTime));

    // Called every time this room receives a "move" message
    this.onMessage('move', (client, data: IMoveProps) => {
      const { x, y, z, rx, ry, rz } = data;
      const player = this.state.players.get(client.sessionId);
      // Get the player

      if (player) {
        player.x = x;
        player.y = y;
        player.z = z;
        player.rx = rx;
        player.ry = ry;
        player.rz = rz;
      }

      // Loopen door nieuwe array en voor elke positie

      this.broadcast(
        'move',
        { player },
        {
          afterNextPatch: true,
        }
      );
    });

    this.onMessage('teleport', (client, data: XRTeleportationData) => {
      const player = this.state.players.get(client.sessionId);
      const { position, worldDirection, animationState } = data;

      if (player) {
        player.x = position.x;
        player.y = position.y + 0.5;
        player.z = position.z;
        player.rx = worldDirection.x;
        player.ry = worldDirection.y;
        player.rz = worldDirection.z;
        player.animationState = animationState;
      }

      this.broadcast(
        'move',
        { player },
        {
          afterNextPatch: true,
        }
      );
    });

    this.onMessage('animationState', (client, data: ActionNames) => {
      const player = this.state.players.get(client.sessionId);

      if (player) {
        player.animationState = data;
      }

      this.broadcast(
        'animationState',
        { player },
        {
          afterNextPatch: true,
        }
      );
    });

    this.onMessage(
      'sending private message',
      (client, data: { to: string; signal: Peer.SignalData }) => {
        const { to, signal } = data;
        const receiver = this.clients.find((v) => v.sessionId === to);

        if (receiver) {
          receiver.send('sending private message', {
            signal,
            senderId: client.sessionId,
          });
        }
      }
    );

    this.onMessage(
      'answerCall',
      (client, data: { signal: Peer.SignalData; to: string }) => {
        const { signal, to } = data;
        const receiver = this.clients.find((v) => v.sessionId === to);

        if (receiver) {
          receiver.send('callAccepted', { signal, id: client.sessionId });
        }
      }
    );
  }

  // Called every time a client joins
  public onJoin(client: Client, options: { id: string }) {
    const { id } = options;
    console.log('user joined');
    this.state.players.set(
      client.sessionId,
      new Player(client.sessionId, id, this.physics)
    ); //Store instance of user in state

    this.clients.push(client);

    const players = (this.state as State).players; // get player from store

    this.onMessage('test', (client, data: string) => {
      console.log(`${client.sessionId} has sent this message ${data}`);
    });

    if (players) {
      client.send('id', { id: client.sessionId });
      this.broadcast('spawnPlayer', { players }); //Optimize this to only sending the new player
    }

    this.onMessage('sending signal', (payload: any) => {
      console.log(`from sending signal, ${payload}`);
      const { userToSignalId, callerId, signal } = payload;
      const client = this.clients.find(
        (user) => user.sessionId === userToSignalId
      );

      if (client) {
        client.send('user joined', {
          signal: signal,
          callerId: callerId,
        });
      }
    });

    this.onMessage('returning signal', (payload: any) => {
      const { signal, callerId } = payload;
      const caller = this.clients.find((user) => user.sessionId === callerId);

      if (caller) {
        caller.send('receiving returned signal', {
          signal: signal,
          id: client.sessionId,
        });
      }
      // io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });

      console.log('returning signal');
    });
  }

  // public update(deltaTime: number) {
  //   // implement your physics or world updates here!
  //   // this is a good place to update the room state

  //   this.physics.updatePhysics(deltaTime / 1000);
  // }

  public onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    const newClientList = this.clients.filter(
      (user) => user.sessionId !== client.sessionId
    );

    this.clients = newClientList;

    const players = this.state.players;

    if (players) {
      //Optimize this to only sending the player that left
      client.send('leave', { message: 'you left' });
      this.broadcast('removePlayer', {
        players,
      });
    }
  }

  onDispose() {
    console.log('Dispose ChatRoom');
  }
}
