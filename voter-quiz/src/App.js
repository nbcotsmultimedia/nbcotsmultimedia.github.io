// App.js
import React from "react";
import "./App.css";
// import Quiz from './components/Quiz';  // Comment out regular quiz
import TestEmblem from "./components/TestEmblem"; // Import test component

function App() {
  return (
    <div className="app">
      <TestEmblem /> {/* Use test component instead of Quiz */}
    </div>
  );
}

export default App;
