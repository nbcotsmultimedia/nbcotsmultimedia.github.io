import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Quiz from "./components/Quiz";
import DownloadPreview from "./components/DownloadPreview"; // Updated import path

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Quiz />} />
          <Route path="/preview-download" element={<DownloadPreview />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
