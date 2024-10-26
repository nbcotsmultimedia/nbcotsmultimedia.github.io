// DownloadResults.js
import React from "react";
import EmblemRenderer from "./EmblemRenderer";
import { getPattern, getFeelingColors } from "./EmblemPatterns";

const PatternDisplay = ({ type, pattern, colors }) => {
  // Ensure we have valid colors before rendering
  if (!colors || !colors[0] || !colors[1] || !pattern) {
    return <div className="pattern-icon" />;
  }

  return (
    <div className="category-icon-container">
      {/* Background pattern element */}
      <div className="pattern-background">
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <g transform="translate(50,50)">
            <g transform="translate(-40,-40) scale(0.8)">
              <path d={pattern.bd} fill={colors[0]} />
            </g>
          </g>
        </svg>
      </div>
      {/* Main icon */}
      <div className="pattern-icon">
        <svg viewBox="0 0 100 100">
          <g transform="translate(50,50)">
            <g transform="translate(-40,-40) scale(0.8)">
              <path d={pattern.bd} fill={colors[0]} opacity={0.9} />
              <path d={pattern.be} fill={colors[1]} opacity={0.9} />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

const FeelingIndicator = ({ colors }) => {
  // Ensure we have valid colors before rendering
  if (!colors || !colors[0] || !colors[1]) {
    return <div className="feeling-indicator" />;
  }

  return (
    <div className="category-icon-container">
      {/* Background pattern */}
      <div className="pattern-background">
        <div
          style={{
            backgroundColor: colors[0],
            width: "100%",
            height: "100%",
            borderRadius: "50%",
          }}
        />
      </div>
      {/* Main indicator */}
      <div className="feeling-indicator">
        <div
          className="feeling-circle feeling-circle-1"
          style={{ backgroundColor: colors[0] }}
        />
        <div
          className="feeling-circle feeling-circle-2"
          style={{ backgroundColor: colors[1] }}
        />
      </div>
    </div>
  );
};

const NBCLogo = () => (
  <svg viewBox="0 0 1000 1000" className="nbc-logo" aria-label="NBC Logo">
    <path
      d="M500 722.7L363.8 622.5c-4.8-3.3-10.1-6-15.9-7.8-30.5-9.5-63 7.5-72.5 38.1-9.5 30.5 7.5 63 38.1 72.5 5.9 1.8 11.8 2.6 17.7 2.6L500 722.7z"
      fill="currentColor"
    />
    <path
      d="M500 696.8l-75-180.5c-2.3-5.4-5.1-10.6-8.9-15.4-20.2-25-57.5-28.9-81.8-8.8-25 20.1-29 56.7-8.8 81.6 3.9 4.8 8.5 8.7 13.3 12.1L500 696.8z"
      fill="currentColor"
    />
    <path
      d="M524.7 396.5c-31.7-3.8-60.5 18.8-64.4 50.6-0.3 2.9-0.4 5.8-0.3 8.6h23.3c5.7 0 15.9-0.4 18.8 6.3-15.9 10.1-38.6 18.6-34.4 46l24.5 157.8l78.3-187.7c2.3-5.4 4.1-11.1 4.8-17.2C579.1 429.2 556.5 400.3 524.7 396.5z"
      fill="currentColor"
    />
    <path
      d="M475.3 447.1c-3.8-31.7-32.6-54.4-64.4-50.6s-54.4 32.6-50.6 64.4c0.7 6.1 2.6 11.8 4.8 17.2l78.3 187.7l31.2-201c0.8-6.6 1.2-12.4 0.5-18.5L475.3 447.1z"
      fill="currentColor"
    />
    <path
      d="M435.9 696.8l75-180.5c2.3-5.4 5.1-10.6 8.9-15.4 20.2-25 57.5-28.9 81.8-8.8 25 20.1 29 56.7 8.8 81.6-3.9 4.8-8.5 8.7-13.3 12.1L435.9 696.8z"
      fill="currentColor"
    />
    <path
      d="M500 722.7l136.2-100.2c4.8-3.3 10.1-6 15.9-7.8 30.5-9.5 63 7.5 72.5 38.1 9.5 30.5-7.5 63-38.1 72.5-5.9 1.8-11.8 2.6-17.7 2.6L500 722.7z"
      fill="currentColor"
    />
  </svg>
);

const DownloadResults = ({ archetype, answers }) => {
  if (!archetype || !answers) return null;

  const responseText = {
    votingIntention: answers[1] || "No, I do not plan on voting",
    motivation:
      answers[2] || answers[3] || "I don't feel my vote will make a difference",
    keyIssue: answers[8] || "Climate change and the environment",
    feeling: answers[5] || "Frustrated",
  };

  const colorScheme = getFeelingColors(answers[5] || "Indifferent");

  const getColorsForType = (type) => {
    switch (type) {
      case "intention":
        return colorScheme.votingIntention;
      case "motivation":
        return colorScheme.votingMotivation;
      case "issue":
        return colorScheme.keyIssue;
      default:
        return colorScheme.votingMotivation;
    }
  };

  const getAnswerForType = (type) => {
    switch (type) {
      case "intention":
        return answers[1];
      case "motivation":
        return answers[2] || answers[3];
      case "issue":
        return answers[8];
      default:
        return null;
    }
  };

  return (
    <div className="download-container">
      <h1 className="download-header">MY VOTING PERSONALITY</h1>

      <div className="download-emblem">
        <EmblemRenderer answers={answers} newsHours={answers[9]} />
      </div>

      <h2 className="download-title">
        {archetype?.title || "The Reluctant Voter"}
      </h2>
      <div className="download-traits">
        <span>DISCERNING</span>
        <span className="trait-separator">·</span>
        <span>RESILIENT</span>
        <span className="trait-separator">·</span>
        <span>INQUISITIVE</span>
      </div>

      <p className="download-profile">
        {archetype?.profile ||
          "You approach politics with a degree of skepticism, yet maintain a sense of civic responsibility."}
      </p>

      <div className="download-categories">
        {[
          ["VOTING INTENTION", responseText.votingIntention, "intention"],
          ["MOTIVATION", responseText.motivation, "motivation"],
          ["KEY POLICY ISSUE", responseText.keyIssue, "issue"],
          ["FEELING", responseText.feeling, "feeling"],
        ].map(([title, text, type], index) => (
          <div key={type} className="download-category-wrapper">
            {type === "feeling" ? (
              <FeelingIndicator colors={getColorsForType(type)} />
            ) : (
              <PatternDisplay
                type={type}
                pattern={getPattern(type, getAnswerForType(type))}
                colors={getColorsForType(type)}
              />
            )}
            <div className="category-content-download">
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="nbc-logo-container">
        <NBCLogo />
      </div>
    </div>
  );
};

export default DownloadResults;
