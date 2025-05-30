// src/client.tsx

import { HashRouter, Route, Routes } from "react-router-dom";
import RoomSelector from "./components/RoomSelector.tsx";
import PokerRoom from "./components/PokerRoom.tsx";
import EmojiThrower from "./components/EmojiThrower.tsx";
import "./styles.css";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/room/:roomId" element={<PokerRoom />} />
        <Route path="/emojis" element={<EmojiThrower />} />
        <Route path="/" element={<RoomSelector />} />
      </Routes>
    </HashRouter>
  );
}
