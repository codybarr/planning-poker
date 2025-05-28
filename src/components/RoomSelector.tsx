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
