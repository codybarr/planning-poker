// party/server.ts
import * as Party from "partykit/server";

interface Player {
  name: string;
  vote: string | null;
}

interface RoomState {
  players: Record<string, Player>;
  revealed: boolean;
}

interface Message {
  type: "vote" | "reveal" | "reset" | "setUsername";
  vote?: string;
  username?: string;
}

export default class Server implements Party.Server {
  state: RoomState = {
    players: {},
    revealed: false,
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Initialize player with a default name
    this.state.players[conn.id] = {
      name: `Player ${Object.keys(this.state.players).length + 1}`,
      vote: null,
    };
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    const data: Message = JSON.parse(message);
    if (data.type === "vote" && typeof data.vote === "string") {
      this.state.players[sender.id].vote = data.vote;
      this.broadcastState();
    } else if (data.type === "reveal") {
      this.state.revealed = true;
      this.broadcastState();
    } else if (data.type === "reset") {
      for (const playerId in this.state.players) {
        this.state.players[playerId].vote = null;
      }
      this.state.revealed = false;
      this.broadcastState();
    } else if (
      data.type === "setUsername" &&
      typeof data.username === "string"
    ) {
      this.state.players[sender.id].name =
        data.username || `Player ${Object.keys(this.state.players).length}`;
      this.broadcastState();
    }
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
