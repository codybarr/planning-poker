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
  type: "state" | "vote" | "reveal" | "reset" | "setUsername" | "throwPizza";
  state?: RoomState;
  vote?: string;
  username?: string;
  targetId?: string;
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
    () => localStorage.getItem(`username_${roomId}`) || "",
  );
  const [connectionId] = useState<string>(() => {
    // Try to restore connection ID from localStorage
    const storedId = localStorage.getItem(`connectionId_${roomId}`);
    return storedId || generateConnectionId();
  });
  const [isSettingUsername, setIsSettingUsername] = useState<boolean>(false);

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
        if (data.state?.players) {
          localStorage.setItem(
            `username_${roomId}`,
            data.state.players[connectionId].name,
          );
        }
        setState(data.state || { adminId: null, players: {}, revealed: false });
      }

      if (data.type === "throwPizza") {
        handleThrowPizza(data.targetId);
      }
    },
    onOpen: () => {
      // Send the stored username immediately
      if (username) {
        ws.send(JSON.stringify({ type: "setUsername", username }));
      }
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
    if (username.trim()) {
      const newUsername = username.trim();
      ws.send(JSON.stringify({ type: "setUsername", username: newUsername }));
      setUsername(newUsername);
      localStorage.setItem(`username_${roomId}`, newUsername); // Persist username per room
      setIsSettingUsername(false);
    }
  };

  const handleThrowPizza = (targetId: string) => {
    const targetPlayer = state.players[targetId];
  };

  const isCurrentVote = (vote: number) =>
    state.players?.[ws.id]?.vote === vote.toString();

  const isAdmin = (id: string) => state.adminId === id;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-indigo-50 p-6">
      <h1 className="text-center text-3xl font-bold text-indigo-700">
        Planning Poker - Room: {roomId}
      </h1>
      <div className="mt-6 flex flex-1 gap-6">
        <div className="w-[30vw] rounded-xl bg-white/90 p-8 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-indigo-700">
                Your Username
              </h2>

              <div className="mt-4 flex flex-col items-start gap-3 rounded-lg bg-gray-50 p-4">
                <p className="text-lg text-gray-600">
                  {username || state.players[ws.id || ""]?.name || "Not set"}
                </p>
                {isSettingUsername ? (
                  <div className="flex gap-4">
                    <input
                      type="text"
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={username}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      onClick={handleSetUsername}
                      className="text-sm text-blue-600 underline hover:cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSettingUsername(true)}
                    className="text-sm text-blue-600 underline hover:cursor-pointer"
                  >
                    Set Username
                  </button>
                )}
              </div>
            </div>

            {/* Connected Players */}
            <div>
              <h2 className="text-2xl font-bold text-indigo-700">
                Connected Players
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {Object.entries(state.players)
                  .sort(sortAdminTop(state.adminId))
                  .map(([id, player]) => (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-4"
                    >
                      <div>
                        <span className={cn(id === ws.id && "font-bold")}>
                          {player.name}
                        </span>
                        {isAdmin(id) && (
                          <span className="ml-2 text-sm text-indigo-600">
                            (Admin)
                          </span>
                        )}
                      </div>
                      <span className="text-gray-600">
                        {state.revealed &&
                          (player.vote ? player.vote : "No vote")}
                        {!state.revealed && (player.vote ? "👍" : "🤔")}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin(ws.id) && (
            <div className="mt-4">
              <h2 className="mb-4 text-2xl font-bold text-indigo-700">
                Admin Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={revealVotes}
                  className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 text-white transition-colors hover:cursor-pointer hover:bg-emerald-700"
                >
                  Reveal Votes
                </button>
                <button
                  onClick={resetRound}
                  className="flex-1 rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:cursor-pointer hover:bg-red-700"
                >
                  Reset Round
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between rounded-xl bg-white/90 p-8 shadow-2xl backdrop-blur-lg">
          {/* Vote */}
          <div>
            <h2 className="text-center text-2xl font-bold text-indigo-700">
              Vote
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {state.revealed ? (
                <div className="col-span-3 space-y-4">
                  {Object.entries(state.players)
                    .sort(sortAdminTop(state.adminId))
                    .map(([id, player]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                      >
                        <span className="font-medium">{player.name}</span>
                        <span className="font-bold text-indigo-600">
                          {player.vote}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                [1, 2, 3, 5, 8, 13, 21, 34, 55].map((value) => (
                  <button
                    key={value}
                    onClick={() => submitVote(value)}
                    className={cn(
                      "rounded-lg px-6 py-3 transition-all hover:cursor-pointer",
                      isCurrentVote(value)
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-200 bg-white hover:bg-gray-50",
                    )}
                  >
                    {value}
                  </button>
                ))
              )}
            </div>
          </div>

          <p className="text-center">
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
    </div>
  );
}
