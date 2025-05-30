// party/server.ts
import * as Party from "partykit/server";

interface Player {
  name: string;
  vote: string | null;
}

interface RoomState {
  adminId: string | null;
  players: Record<string, Player>;
  revealed: boolean;
}

interface Message {
  type: "vote" | "reveal" | "reset" | "setUsername" | "throwPizza";
  vote?: string;
  username?: string;
  targetId?: string;
  senderId?: string;
}

export default class Server implements Party.Server {
  state: RoomState = {
    adminId: null,
    players: {},
    revealed: false,
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Check if this player already exists in the room
    const existingPlayer = this.state.players[conn.id];
    
    if (!existingPlayer) {
      // Only assign a default name if this is a new player
      this.state.players[conn.id] = {
        name: `Player ${Object.keys(this.state.players).length + 1}`,
        vote: null,
      };
    }
    
    if (!this.state.adminId) {
      this.state.adminId = conn.id;
    }
    
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    const data: Message = JSON.parse(message);
    switch (data.type) {
      case "vote":
        if (typeof data.vote === "string") {
          this.state.players[sender.id].vote = data.vote;
        }
        break;
      case "reveal":
        this.state.revealed = true;
        break;
      case "reset":
        Object.keys(this.state.players).forEach(playerId => {
          this.state.players[playerId].vote = null;
        });
        this.state.revealed = false;
        break;
      case "setUsername":
        if (typeof data.username === "string") {
          this.state.players[sender.id].name =
            data.username || `Player ${Object.keys(this.state.players).length}`;
        }
        break;
      case "throwPizza":
        if (data.targetId && data.targetId in this.state.players) {
          // Broadcast the pizza throw to all clients
          this.room.broadcast(JSON.stringify({
            type: "throwPizza",
            senderId: sender.id,
            targetId: data.targetId
          }));
        }
        break;
      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
    
    this.broadcastState();
  }

  onClose(conn: Party.Connection) {
    delete this.state.players[conn.id];
    this.broadcastState();
  }

  broadcastState() {
    this.room.broadcast(JSON.stringify({ type: "state", state: this.state }));
  }
}

Server satisfies Party.Worker;
