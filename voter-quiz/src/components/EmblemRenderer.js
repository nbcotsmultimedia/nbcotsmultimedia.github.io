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

    const answer =
      type === "motivation"
        ? answers[answers[1] === "Yes, I plan on voting" ? 2 : 3]
        : answers[type === "intention" ? 1 : 8];

    console.log(`Pattern lookup for ${type}:`, {
      votingIntent: answers[1],
      answerIndex: answers[1] === "Yes, I plan on voting" ? 2 : 3,
      answer,
    });

    if (!answer) return null;

    if (type === "motivation") {
      const patterns =
        answers[1] === "Yes, I plan on voting"
          ? PATTERNS_MAP.motivation.voting
          : PATTERNS_MAP.motivation.nonVoting;
      return patterns[answer];
    }

    return PATTERNS_MAP[type][answer];
  };

  const renderPatternLayer = (pattern, type, transform, opacity) => {
    if (!pattern) return null;

    const colors = {
      issue: [
        colorScheme?.keyIssue?.[0] || "#CCCCCC",
        colorScheme?.keyIssue?.[1] || "#DDDDDD",
      ],
      intention: [
        colorScheme?.votingIntention?.[0] || "#AAAAAA",
        colorScheme?.votingIntention?.[1] || "#BBBBBB",
      ],
      motivation: [
        colorScheme?.votingMotivation?.[0] || "#888888",
        colorScheme?.votingMotivation?.[1] || "#999999",
      ],
    };

    if (type === "issue") {
      return (
        <g className="pattern-layer" transform={transform}>
          {Array.from({ length: repetition }).map((_, index) => {
            const x =
              (index % Math.sqrt(repetition)) * (100 / Math.sqrt(repetition));
            const y =
              Math.floor(index / Math.sqrt(repetition)) *
              (100 / Math.sqrt(repetition));
            return (
              <g
                key={index}
                transform={`translate(${x},${y}) scale(${
                  1 / Math.sqrt(repetition)
                })`}
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
  const colorScheme =
    FEELING_SCHEMES[answers?.[5] || "Indifferent"] ||
    FEELING_SCHEMES.Indifferent;

  // Get patterns
  const issuePattern = getPattern("issue");
  const intentionPattern = getPattern("intention");
  const motivationPattern = getPattern("motivation");

  return (
    <div className={progressive ? "progressive-emblem" : "voter-emblem"}>
      <div className="emblem-container">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="emblem-svg"
        >
          <g transform="translate(50,50)">
            {renderPatternLayer(
              issuePattern,
              "issue",
              "translate(-40,-40) scale(0.8)",
              opacity
            )}
            {renderPatternLayer(
              intentionPattern,
              "intention",
              "translate(-25,-25) scale(0.5)",
              opacity
            )}
            {renderPatternLayer(
              motivationPattern,
              "motivation",
              "translate(-20,-20) scale(0.4)",
              opacity
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default EmblemRenderer;
