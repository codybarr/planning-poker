// src/client.tsx

import { HashRouter, Route, Routes } from "react-router-dom";
import RoomSelector from "./components/RoomSelector.tsx";
import PokerRoom from "./components/PokerRoom.tsx";

import "./styles.css";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/room/:roomId" element={<PokerRoom />} />
        <Route path="/" element={<RoomSelector />} />
      </Routes>
    </HashRouter>
  );
}
