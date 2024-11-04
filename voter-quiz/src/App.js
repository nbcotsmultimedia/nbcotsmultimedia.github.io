// App.js

import React from "react";
import "./App.css";
import Quiz from "./components/Quiz";
import EmblemGenerator from "./components/EmblemGenerator"; // This matches the default export

function App() {
  return (
    <div className="app">
      <Quiz />
      {/* <EmblemGenerator /> */}
    </div>
  );
}

export default App;
