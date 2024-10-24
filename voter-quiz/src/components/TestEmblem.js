// Create a new file: src/components/TestEmblem.js
import React, { useState } from "react";
import VoterEmblem from "./VoterEmblem";

function TestEmblem() {
  // Function to generate random answers
  const generateRandomAnswers = () => {
    const randomAnswers = {
      1: getRandomItem([
        "Yes, I plan on voting",
        "No, I do not plan on voting",
        "I am unsure",
      ]),
      4: getRandomItem([
        "Hopeful",
        "Excited",
        "Anxious",
        "Frustrated",
        "Indifferent",
        "Confused",
        "Scared",
      ]),
      8: getRandomItem([
        "Economy and jobs",
        "Healthcare",
        "Climate change and the environment",
        "Immigration",
        "Education",
        "National security and foreign policy",
        "Gun policy",
        "Abortion and reproductive rights",
        "Racial and ethnic inequality",
        "Crime and criminal justice",
      ]),
    };

    // Add conditional motivation answer based on voting intention
    if (randomAnswers[1] === "Yes, I plan on voting") {
      randomAnswers[2] = getRandomItem([
        "To express my opinion on important issues",
        "To support a specific candidate or party",
        "To fulfill my civic duty",
        "To influence change in my community",
      ]);
    } else {
      randomAnswers[2] = getRandomItem([
        "I don't think any of the candidates will make a good president",
        "I'm just not interested in politics",
        "I do not feel my vote will make a difference",
        "I am unable to vote due to personal circumstances",
        "I am not registered to vote",
        "I am not eligible to vote",
      ]);
    }

    return randomAnswers;
  };

  // Helper function to get random item from array
  const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // State to store current answers
  const [answers, setAnswers] = useState(generateRandomAnswers());

  return (
    <div className="quiz-container">
      <div className="results-page">
        <h2 className="results-title">Test Emblem</h2>

        {/* Display the emblem */}
        <VoterEmblem answers={answers} />

        {/* Display current answers for debugging */}
        <div
          style={{
            textAlign: "left",
            margin: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <h3>Current Answers:</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(answers, null, 2)}
          </pre>
        </div>

        {/* Button to generate new random answers */}
        <button
          className="restart-button"
          onClick={() => setAnswers(generateRandomAnswers())}
        >
          Generate New Random Answers
        </button>
      </div>
    </div>
  );
}

export default TestEmblem;
