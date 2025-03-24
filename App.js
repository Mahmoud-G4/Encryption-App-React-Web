import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainScreen from "./assets/components/Main-Screen";
import CCracker from "./assets/components/CCrack";
import RFCracker from "./assets/components/RCrack";
import VCracker from "./assets/components/VCrack";

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
