import cn from "classnames";
import { gsap } from "gsap";
import { usePartySocket } from "partysocket/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Github from "../assets/github.svg?react";

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
  type: "state" | "vote" | "reveal" | "reset" | "setUsername" | "throwEmoji";
  state?: RoomState;
  vote?: string;
  username?: string;
  targetId?: string;
  emoji?: string;
}

// Generate a random connection ID
const generateConnectionId = () => crypto.randomUUID();

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

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
  const container = useRef<HTMLDivElement>(null);
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

      if (data.type === "throwEmoji") {
        throwEmoji(data.targetId, data.emoji);
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

  const throwEmoji = (targetId?: string, emoji?: string) => {
    if (!targetId || !emoji) return;
    console.log(`Throwing ${emoji} to ${targetId}`);

    // Throw Emoji code.
    const fromLeft = Math.random() > 0.5;
    const targetPlayer = document.querySelector(
      `[data-player-id="${targetId}"]`,
    );
    if (!container.current || !targetPlayer) return;

    const containerRect = container?.current?.getBoundingClientRect();
    const targetRect = targetPlayer.getBoundingClientRect();

    // Create emoji element
    const emojiEl = document.createElement("div");
    emojiEl.textContent = emoji;
    emojiEl.style.position = "absolute";
    emojiEl.style.left = "0px";
    emojiEl.style.top = "0px";
    emojiEl.style.fontSize = "2rem";
    emojiEl.style.pointerEvents = "none";
    container?.current?.appendChild(emojiEl);
    const emojiRect = emojiEl.getBoundingClientRect();

    const startX = fromLeft ? -50 : containerRect.width + 50; // offscreen to the left
    const startY = targetRect.top;
    const targetX = fromLeft
      ? targetRect.left - emojiRect.width
      : targetRect.left + targetRect.width;
    const targetY = targetRect.top;

    gsap.set(emojiEl, { x: startX, y: startY });

    gsap.to(emojiEl, {
      duration: 1,
      ease: "power1.in",
      motionPath: {
        path: [
          { x: startX, y: startY },
          {
            x: (startX + targetX) / 2,
            y: startY - randomRange(50, 150),
          },
          { x: targetX, y: targetY },
        ],
        curviness: 1.25,
        autoRotate: true,
      },
      onComplete: () => {
        // bounce away from target
        gsap.to(emojiEl, {
          duration: randomRange(0.1, 0.5),
          ease: "power1.out",
          x: fromLeft ? targetX - 100 : targetX + 150,
          y: targetY,
          rotation: () => Math.random() * 360,
          onComplete: () => {
            emojiEl.remove(); // Clean up after animation
          },
        });
      },
    });
  };

  const isCurrentVote = (vote: number) =>
    state.players?.[ws.id]?.vote === vote.toString();

  const isAdmin = (id: string) => state.adminId === id;

  return (
    <div
      ref={container}
      className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50 p-6"
    >
      {/* Connected Players */}
      <div className="mt-4 flex items-stretch justify-center gap-3">
        {Object.entries(state.players)
          .sort(sortAdminTop(state.adminId))
          .map(([id, player]) => (
            <div
              key={id}
              className={cn(
                isAdmin(id) ? "bg-yellow-50" : "bg-gray-50",
                "relative flex min-w-36 flex-col justify-between gap-3 overflow-hidden rounded-lg border border-gray-200 p-4",
              )}
            >
              {isAdmin(id) && (
                <span className="absolute inset-0 top-0 flex h-6 w-6 items-center justify-center text-lg">
                  👑
                </span>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-center">
                {isSettingUsername && id === ws.id ? (
                  <input
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSetUsername();
                      }
                    }}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={player.name}
                    autoFocus={true}
                    className="max-w-fit rounded-lg border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                ) : (
                  <>
                    <span className={cn(id === ws.id && "font-bold")}>
                      {player.name}
                    </span>
                    {id === ws.id && (
                      <button
                        className="hover:cursor-pointer"
                        onClick={() => setIsSettingUsername(true)}
                      >
                        ✏️
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="text-center text-6xl text-gray-600">
                {state.revealed && (player.vote ? player.vote : "🚫")}
                {!state.revealed && (
                  <span data-player-id={id}>{player.vote ? "👍" : "🤔"}</span>
                )}
              </div>
              <div className="flex min-h-10 justify-center gap-2">
                {id !== ws.id && (
                  <>
                    {["🍕", "✏️", "✈️"].map((emoji) => (
                      <button
                        key={emoji}
                        className="inline-flex aspect-square h-10 scale-100 items-center justify-center rounded-lg border border-gray-200 p-1 transition hover:cursor-pointer hover:bg-gray-100 active:scale-90"
                        onClick={() =>
                          ws.send(
                            JSON.stringify({
                              type: "throwEmoji",
                              targetId: id,
                              emoji,
                            }),
                          )
                        }
                      >
                        {emoji}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
      <div className="flex-1">{/* Voting Stats? */}</div>
      <div className="flex flex-col justify-between gap-6 rounded-xl bg-white/90 p-8 shadow-2xl backdrop-blur-lg">
        {isAdmin(ws.id) && (
          <div className="flex flex-wrap justify-center gap-4">
            {state.revealed ? (
              <button
                onClick={resetRound}
                className="rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:cursor-pointer hover:bg-red-700"
              >
                Reset Round 🔄
              </button>
            ) : (
              <button
                onClick={revealVotes}
                className="rounded-lg bg-emerald-600 px-6 py-3 text-white transition-colors hover:cursor-pointer hover:bg-emerald-700"
              >
                Reveal Votes 👀
              </button>
            )}
          </div>
        )}
        {/* Vote */}
        <div className="flex flex-wrap justify-center gap-4">
          {[1, 2, 3, 5, 8, 13, 21, 34, 55].map((value, idx) => {
            const suit = ["♥️", "♠️", "♦️", "♣️"][idx % 4];
            return (
              <button
                key={value}
                onClick={() => submitVote(value)}
                className={cn(
                  "flex aspect-[2/3] w-24 flex-col justify-between gap-6 rounded-lg p-2 transition-all hover:cursor-pointer",
                  isCurrentVote(value)
                    ? "bg-sky-500 text-white"
                    : "border border-gray-200 bg-white hover:bg-gray-50",
                )}
              >
                <span className="self-start">{suit}</span>
                <span className="self-center text-3xl font-bold">{value}</span>
                <span className="rotate-180 transform self-end">{suit}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <a
            href="https://github.com/codybarr/planning-poker"
            rel="noopener noreferrer"
            target="_blank"
            className="block scale-100 rotate-0 text-black transition hover:scale-110 hover:rotate-6 hover:text-black/70 active:scale-95"
          >
            <Github className="h-8 w-8" />
          </a>
        </div>
      </div>
    </div>
  );
}
