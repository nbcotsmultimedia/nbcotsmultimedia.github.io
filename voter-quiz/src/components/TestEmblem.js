import React, { useState } from "react";
import VoterEmblem from "./VoterEmblem";

function TestEmblem() {
  const generateRandomAnswers = () => {
    const votingIntention = getRandomItem([
      "Yes, I plan on voting",
      "No, I do not plan on voting",
      "I am unsure",
    ]);

    const baseAnswers = {
      1: votingIntention,
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

    // Add motivation based on voting intention
    if (votingIntention === "Yes, I plan on voting") {
      baseAnswers[2] = getRandomItem([
        "To express my opinion on important issues",
        "To support a specific candidate or party",
        "To fulfill my civic duty",
        "To influence change in my community",
      ]);
    } else {
      baseAnswers[3] = getRandomItem([
        "I don't think any of the candidates will make a good president",
        "I'm just not interested in politics",
        "I don't feel my vote will make a difference",
        "Personal circumstances prevent me from voting (work, health, transportation)",
        "I'm not registered to vote",
        "I'm not eligible to vote",
      ]);
    }

    return baseAnswers;
  };

  const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const [answers, setAnswers] = useState(generateRandomAnswers());

  return (
    <div className="quiz-container">
      <div className="results-page">
        <h2 className="results-title">Test Emblem Generator</h2>

        <VoterEmblem answers={answers} />

        <button
          onClick={() => {
            const newAnswers = generateRandomAnswers();
            console.log("Generated new answers:", newAnswers);
            setAnswers(newAnswers);
          }}
          style={{
            margin: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Generate New Random Answers
        </button>
      </div>
    </div>
  );
}

export default TestEmblem;
