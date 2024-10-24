// src/components/VoterEmblem.js
import React from "react";
import { PATTERNS } from "./PatternConstants";

function VoterEmblem({ answers }) {
  // Get correct pattern based on answer
  function getPatternPaths(type, answer) {
    switch (type) {
      case "intention":
        if (answer === "Yes, I plan on voting") return PATTERNS.intention.yes;
        if (answer === "No, I do not plan on voting")
          return PATTERNS.intention.no;
        if (answer === "I am unsure") return PATTERNS.intention.unsure;
        return null;
      case "issue":
        return PATTERNS.issue[answer.toLowerCase().replace(/\s+/g, "-")];
      default:
        return null;
    }
  }

  // Get patterns based on answers
  const intentionPattern = getPatternPaths("intention", answers[1]);
  const issuePattern = getPatternPaths("issue", answers[8]); // Key issue pattern
  const motivationPattern = getPatternPaths("motivation", answers[2 | 3]);

  return (
    <div className="voter-emblem">
      <h3>Your Voter Emblem</h3>

      <div className="emblem-container">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="emblem-svg"
        >
          {/* Issue Pattern Layer */}
          {issuePattern && (
            <g className="pattern-layer">
              <path d={issuePattern.bd} fill="#999" opacity="0.8" />
              <path d={issuePattern.be} fill="#c5c5c5" opacity="0.8" />
            </g>
          )}

          {/* Intention Pattern Layer */}
          {intentionPattern && (
            <g className="pattern-layer">
              <path d={intentionPattern.bd} fill="#999" opacity="0.8" />
              <path d={intentionPattern.be} fill="#c5c5c5" opacity="0.8" />
            </g>
          )}

          {/* Motivation Pattern Layer */}
          {motivationPattern && (
            <g className="pattern-layer motivation">
              <path d={motivationPattern.bd} fill="#999" opacity="0.8" />
              <path d={motivationPattern.be} fill="#c5c5c5" opacity="0.8" />
            </g>
          )}
        </svg>
      </div>

      {/* Debug info */}
      <div style={{ display: "none" }}>
        <pre>{JSON.stringify(answers, null, 2)}</pre>
      </div>
    </div>
  );
}

export default VoterEmblem;
