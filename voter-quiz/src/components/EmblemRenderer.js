// EmblemRenderer.js
import React from "react";
import { PATTERNS_MAP, FEELING_SCHEMES } from "./EmblemPatterns";

function EmblemRenderer({
  answers,
  progressive = false,
  currentQuestion = 0,
  newsHours,
}) {
  // Utility functions
  const getRepetition = () => {
    const hours = progressive && currentQuestion >= 9 ? answers[9] : newsHours;
    if (!hours) return 1;

    const repetitionMap = {
      "0-1": 1,
      "1-3": 1,
      "3-5": 4,
      "5-10": 16,
      "10+": 16,
    };
    return repetitionMap[hours] || 1;
  };

  const shouldRenderPattern = (type) => {
    if (!progressive) return true;
    const thresholds = { intention: 1, motivation: 2, issue: 7 };
    return currentQuestion >= thresholds[type];
  };

  const getPattern = (type) => {
    if (!shouldRenderPattern(type)) return null;

    let answer;
    if (type === "motivation") {
      answer = answers[2] || answers[3];
    } else if (type === "intention") {
      answer = answers[1];
    } else if (type === "issue") {
      answer = answers[8];
    }

    if (!answer) return null;

    if (type === "motivation") {
      const isVoting = answers[1] === "Yes, I plan on voting";
      const patterns = isVoting
        ? PATTERNS_MAP.motivation.voting
        : PATTERNS_MAP.motivation.nonVoting;
      return patterns[answer];
    }

    return PATTERNS_MAP[type]?.[answer];
  };

  const renderPatternLayer = (pattern, type, transform, opacity) => {
    if (!pattern) return null;

    const colorScheme =
      FEELING_SCHEMES[answers?.[5] || "Indifferent"] ||
      FEELING_SCHEMES.Indifferent;
    const colors = {
      issue: colorScheme.keyIssue,
      intention: colorScheme.votingIntention,
      motivation: colorScheme.votingMotivation,
    };

    if (type === "issue" && repetition > 1) {
      return (
        <g className="pattern-layer" transform={transform}>
          {Array.from({ length: repetition }).map((_, index) => {
            const gridSize = Math.sqrt(repetition);
            const x = (index % gridSize) * (100 / gridSize);
            const y = Math.floor(index / gridSize) * (100 / gridSize);
            return (
              <g
                key={index}
                transform={`translate(${x},${y}) scale(${1 / gridSize})`}
              >
                <path d={pattern.bd} fill={colors[type][0]} opacity={opacity} />
                <path d={pattern.be} fill={colors[type][1]} opacity={opacity} />
              </g>
            );
          })}
        </g>
      );
    }

    return (
      <g className={`pattern-layer ${type}`} transform={transform}>
        <path d={pattern.bd} fill={colors[type][0]} opacity={opacity} />
        <path d={pattern.be} fill={colors[type][1]} opacity={opacity} />
      </g>
    );
  };

  // Calculate values
  const opacity = !progressive ? 0.9 : currentQuestion >= 5 ? 0.9 : 0.5;
  const repetition = getRepetition();

  // Get patterns
  const issuePattern = getPattern("issue");
  const intentionPattern = getPattern("intention");
  const motivationPattern = getPattern("motivation");

  // Adjusted scales and positions
  const transforms = {
    issue: "translate(-50,-50) scale(1)",
    intention: "translate(-35,-35) scale(0.7)",
    motivation: "translate(-30,-30) scale(0.6)",
  };

  return (
    <div className={progressive ? "progressive-emblem" : "emblem-container"}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="emblem-svg"
      >
        <g transform="translate(50,50)">
          {renderPatternLayer(issuePattern, "issue", transforms.issue, opacity)}
          {renderPatternLayer(
            intentionPattern,
            "intention",
            transforms.intention,
            opacity
          )}
          {renderPatternLayer(
            motivationPattern,
            "motivation",
            transforms.motivation,
            opacity
          )}
        </g>
      </svg>
    </div>
  );
}

export default EmblemRenderer;
