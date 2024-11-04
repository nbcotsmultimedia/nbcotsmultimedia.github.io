// index.js - This is the entry point of your React application

// Import necessary dependencies
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Import global styles
import App from "./App"; // Import the main App component
import reportWebVitals from "./reportWebVitals";

// Create the root element where React will render your app
// Looks for an HTML element with id="root"
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component inside React.StrictMode
// StrictMode helps identify potential problems in your app during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
