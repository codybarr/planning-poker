// src/client.tsx
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";
import { usePartySocket } from "partysocket/react";

// Define state interface
interface Player {
  name: string;
  vote: string | null;
}

interface RoomState {
  players: Record<string, Player>;
  revealed: boolean;
}

interface Message {
  type: "state" | "vote" | "reveal" | "reset" | "setUsername";
  state?: RoomState;
  vote?: string;
  username?: string;
}

// Helper to generate a random room ID
const generateRoomId = () =>
  `session-${Math.random().toString(36).substr(2, 9)}`;

function PokerApp() {
  const { roomId } = useParams<{ roomId: string }>();
  const [state, setState] = useState<RoomState>({
    players: {},
    revealed: false,
  });
  const [room] = useState<string>(roomId || generateRoomId());
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem(`username_${room}`) || ""
  );
  const [tempUsername, setTempUsername] = useState<string>("");

  const ws = usePartySocket({
    room,
    onMessage: (event: MessageEvent) => {
      const data: Message = JSON.parse(event.data);
      if (data.type === "state") {
        console.log(data.state?.players);
        setState(data.state || { players: {}, revealed: false });
      }
    },
    onOpen: () => {
      ws.send(JSON.stringify({ type: "setUsername", username }));
    },
  });

  const submitVote = (vote: number) => {
    ws.send(JSON.stringify({ type: "vote", vote: vote.toString() }));
  };

  const revealVotes = () => {
    ws.send(JSON.stringify({ type: "reveal" }));
  };

  const resetRound = () => {
    ws.send(JSON.stringify({ type: "reset" }));
  };

  const handleSetUsername = () => {
    if (tempUsername.trim()) {
      const newUsername = tempUsername.trim();
      ws.send(JSON.stringify({ type: "setUsername", username: newUsername }));
      setUsername(newUsername);
      localStorage.setItem(`username_${room}`, newUsername); // Persist username per room
      setTempUsername("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Planning Poker - Room: {room}</h1>
      <div>
        <h3>Connected Players</h3>
        <ul>
          {Object.entries(state.players).map(([id, player]) => (
            <li key={id}>
              {player.name}:{" "}
              {state.revealed ? player.vote || "No vote" : "Hidden"}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Your Username</h3>
        <p>
          Current: {username || state.players[ws.id || ""]?.name || "Not set"}
        </p>
        <input
          type="text"
          value={tempUsername}
          onChange={(e) => setTempUsername(e.target.value)}
          placeholder="Enter new username"
        />
        <button onClick={handleSetUsername}>Set Username</button>
      </div>
      <div>
        <h3>Vote</h3>
        {[1, 2, 3, 5, 8, 13].map((value) => (
          <button
            key={value}
            onClick={() => submitVote(value)}
            style={{ margin: "5px" }}
          >
            {value}
          </button>
        ))}
      </div>
      <button onClick={revealVotes}>Reveal Votes</button>
      <button onClick={resetRound} style={{ marginLeft: "10px" }}>
        Reset Round
      </button>
      <div>
        <p>
          Share this room:{" "}
          <a href={`${window.location.origin}/#/room/${room}`}>
            {window.location.origin}/#/room/{room}
          </a>
        </p>
      </div>
    </div>
  );
}

function RoomSelector() {
  const [inputRoom, setInputRoom] = useState<string>("");

  const joinRoom = () => {
    if (inputRoom.trim()) {
      window.location.hash = `/room/${inputRoom.trim()}`;
    }
  };

  const createRoom = () => {
    const newRoom = generateRoomId();
    window.location.hash = `/room/${newRoom}`;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to Planning Poker</h1>
      <input
        type="text"
        value={inputRoom}
        onChange={(e) => setInputRoom(e.target.value)}
        placeholder="Enter room ID"
      />
      <button onClick={joinRoom}>Join Room</button>
      <button onClick={createRoom} style={{ marginLeft: "10px" }}>
        Create New Room
      </button>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(
  <HashRouter>
    <Routes>
      <Route path="/room/:roomId" element={<PokerApp />} />
      <Route path="/" element={<RoomSelector />} />
    </Routes>
  </HashRouter>
);
