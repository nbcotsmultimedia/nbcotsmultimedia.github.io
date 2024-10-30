// DownloadResults.js

// Imports
import React from "react";
import EmblemRenderer from "./EmblemRenderer";
import { getPattern, getFeelingColors } from "./EmblemPatterns";
import { archetypes } from "./archetypeData";
import "./Quiz.css";

// Renders SVG patterns with specific colors based on user responses
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

// Shows a circular indicator with two colors to represent emotions
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

// Renders the NBC logo in SVG format
const NBCLogo = () => (
  <svg
    version="1.1"
    viewBox="0 0 1920 1080"
    className="nbc-logo"
    aria-label="NBC Logo"
  >
    <g>
      <path
        className="logo-path"
        d="M997.99,687.75l140.47-96.28c4.4-3.02,9.23-5.46,14.57-7.12 c27.91-8.68,57.57,6.9,66.25,34.81c8.68,27.91-6.9,57.57-34.81,66.25c-5.37,1.67-10.81,2.4-16.14,2.4L997.99,687.75z"
      />
      <path
        className="logo-path"
        d="M1006.45,664.14L1074.92,499c2.06-4.98,4.65-9.71,8.17-14.07 c18.43-22.83,51.92-26.43,74.8-8.04c22.88,18.39,26.49,51.8,8.06,74.62c-3.55,4.39-7.73,7.99-12.13,11.02L1006.45,664.14z"
      />
      <path
        className="logo-path"
        d="M1029,395.66c-29.02-3.48-55.36,17.22-58.85,46.24c-0.32,2.67-0.39,5.29-0.3,7.88 c8.08,0,19.89,0,21.28,0c5.23,0,14.53-0.33,17.17,5.76c-14.53,9.19-35.26,17.03-31.47,42.07l22.43,144.29l71.57-171.67 c2.07-4.95,3.74-10.13,4.41-15.71C1078.72,425.49,1058.02,399.14,1029,395.66z"
      />
      <path
        className="logo-path"
        d="M949.87,441.9c-3.48-29.02-29.83-49.72-58.85-46.24s-49.72,29.83-46.24,58.85 c0.67,5.58,2.34,10.77,4.41,15.71l71.57,171.67l28.57-183.78C950.16,452.74,950.54,447.45,949.87,441.9z"
      />
      <path
        className="logo-path"
        d="M913.57,664.14L845.1,499c-2.06-4.98-4.65-9.71-8.17-14.07 c-18.43-22.83-51.92-26.43-74.8-8.04c-22.88,18.39-26.49,51.8-8.06,74.62c3.55,4.39,7.73,7.99,12.13,11.02L913.57,664.14z"
      />
      <path
        className="logo-path"
        d="M922.01,687.75l-140.47-96.28c-4.4-3.02-9.23-5.46-14.57-7.12 c-27.91-8.68-57.57,6.9-66.25,34.81c-8.68,27.91,6.9,57.57,34.81,66.25c5.37,1.67,10.81,2.4,16.14,2.4L922.01,687.75z"
      />
    </g>
  </svg>
);
// Creates a visual report/card showing a user's "voting personality"
const DownloadResults = ({ archetype, answers }) => {
  if (!archetype || !answers) return null;

  const archetypeData = archetypes[archetype];

  // Response Processing
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
      {/* NBC Logo */}
      <div className="logo-header">
        <NBCLogo />
      </div>

      {/* Archetype Title */}
      <h1 className="download-header">MY VOTING PERSONALITY</h1>

      <div className="download-emblem">
        <EmblemRenderer answers={answers} newsHours={answers[9]} />
      </div>

      {/* Large Complete Emblem */}
      <h2 className="download-title">
        {archetype.title || "The Reluctant Voter"}
      </h2>

      {/* Three Archetype Traits */}
      <div className="download-traits">
        {archetype.personalityTraits?.map((trait, index) => (
          <React.Fragment key={trait}>
            <span>{trait}</span>
            {index < archetype.personalityTraits.length - 1 && (
              <span className="trait-separator">·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Archetype Summary Text */}
      <p className="download-profile">
        {archetype.profile ||
          "You approach politics with a degree of skepticism, yet maintain a sense of civic responsibility."}
      </p>

      {/* Categories Grid */}
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
      <div className="quiz-link">
        See your voting personality at{" "}
        <a
          href={`https://${getComputedStyle(document.documentElement)
            .getPropertyValue("--quiz-url")
            .trim()
            .replace(/['"]+/g, "")}`}
        >
          {getComputedStyle(document.documentElement)
            .getPropertyValue("--quiz-url")
            .trim()
            .replace(/['"]+/g, "")}
        </a>
      </div>
    </div>
  );
};

export default DownloadResults;
