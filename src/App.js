import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainScreen from "./components/Main-Screen";
import CCracker from "./components/CCrack";
import RFCracker from "./components/RCrack";
import VCracker from "./components/VCrack";

export default function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "#121212", minHeight: "100vh", color: "#BB86FC" }}>
        <Routes>
          <Route path="/" element={<MainScreen />} />
          <Route path="/ccracker" element={<CCracker />} />
          <Route path="/rfcracker" element={<RFCracker />} />
          <Route path="/vcracker" element={<VCracker />} />
        </Routes>
      </div>
    </Router>
  );
}
