import { useState, useEffect } from "react";
import { usePartySocket } from "partysocket/react";
import { useParams } from "react-router-dom";
import cn from "classnames";

// Define state interface
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
  type: "state" | "vote" | "reveal" | "reset" | "setUsername";
  state?: RoomState;
  vote?: string;
  username?: string;
}

// Generate a random connection ID
const generateConnectionId = () => crypto.randomUUID();

const sortAdminTop =
  (adminId: string | null) =>
  ([id1]: [string, Player], [id2]: [string, Player]) => {
    if (!adminId) return 0;
    if (id1 === adminId) return -1;
    if (id2 === adminId) return 1;
    return id1.localeCompare(id2);
  };

export default function PokerRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [state, setState] = useState<RoomState>({
    adminId: null,
    players: {},
    revealed: false,
  });
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem(`username_${roomId}`) || ""
  );
  const [tempUsername, setTempUsername] = useState<string>("");
  const [connectionId] = useState<string>(() => {
    // Try to restore connection ID from localStorage
    const storedId = localStorage.getItem(`connectionId_${roomId}`);
    return storedId || generateConnectionId();
  });

  // Update connection ID in localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`connectionId_${roomId}`, connectionId);
  }, [connectionId, roomId]);

  const ws = usePartySocket({
    id: connectionId,
    room: roomId,
    onMessage: (event: MessageEvent) => {
      const data: Message = JSON.parse(event.data);
      if (data.type === "state") {
        console.log({
          players: data.state?.players,
          adminId: data.state?.adminId,
          revealed: data.state?.revealed,
        });
        setState(data.state || { adminId: null, players: {}, revealed: false });
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
      localStorage.setItem(`username_${roomId}`, newUsername); // Persist username per room
      setTempUsername("");
    }
  };

  const isCurrentVote = (vote: number) =>
    state.players?.[ws.id]?.vote === vote.toString();

  const isAdmin = (id: string) => state.adminId === id;

  return (
    <div className="flex flex-col gap-3 p-6">
      <h1 className="text-2xl font-bold">Planning Poker - Room: {roomId}</h1>
      <div>
        <h3 className="text-lg font-semibold">Connected Players</h3>
        <ul className="list-disc list-inside">
          {Object.entries(state.players)
            .sort(sortAdminTop(state.adminId))
            .map(([id, player]) => (
              <li key={id}>
                {player.name}:{" "}
                {state.revealed && (player.vote ? player.vote : "No vote")}
                {!state.revealed && (player.vote ? "👍" : "🤔")}
                {isAdmin(id) && " (Admin)"}
              </li>
            ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Your Username</h3>
        <p>
          Current: {username || state.players[ws.id || ""]?.name || "Not set"}
        </p>
        <input
          className="border border-gray-300 rounded px-2 py-1"
          type="text"
          value={tempUsername}
          onChange={(e) => setTempUsername(e.target.value)}
          placeholder="Enter new username"
        />
        <button
          className="ml-2 border border-gray-300 rounded px-2 py-1"
          onClick={handleSetUsername}
        >
          Set Username
        </button>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Vote</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 5, 8, 13].map((value) => (
            <button
              className={cn(
                isCurrentVote(value) && "bg-blue-500 text-white",
                "px-2 py-1 border border-gray-300 rounded w-12 h-12"
              )}
              key={value}
              onClick={() => submitVote(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {isAdmin(ws.id) && (
        <div>
          <h3 className="text-lg font-semibold">Admin Actions</h3>
          <div className="flex gap-2">
            <button
              className="border border-gray-300 rounded px-2 py-1"
              onClick={revealVotes}
            >
              Reveal Votes
            </button>
            <button
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              onClick={resetRound}
            >
              Reset Round
            </button>
          </div>
        </div>
      )}
      <div>
        <p>
          Share this room:{" "}
          <a
            className="text-blue-700 hover:underline"
            href={`${window.location.origin}/#/room/${roomId}`}
          >
            {window.location.origin}/#/room/{roomId}
          </a>
        </p>
      </div>
    </div>
  );
}
