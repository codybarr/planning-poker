import { useState } from "react";

// Helper to generate a random room ID
const generateRoomId = () => `session-${crypto.randomUUID()}`;

export default function RoomSelector() {
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

  const handleInputRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
    setInputRoom(value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white/90 p-8 shadow-2xl backdrop-blur-lg">
        <h1 className="mb-8 text-center text-4xl font-bold text-indigo-700">
          Planning Poker
        </h1>
        <div className="space-y-4">
          <input
            type="text"
            value={inputRoom}
            onChange={handleInputRoomChange}
            pattern="^[a-zA-Z0-9_-]+$"
            placeholder="Enter room ID"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex justify-center gap-4">
            <button
              onClick={joinRoom}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
            >
              Join Room
            </button>
            <button
              onClick={createRoom}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-white transition-colors hover:bg-emerald-700"
            >
              Create New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
