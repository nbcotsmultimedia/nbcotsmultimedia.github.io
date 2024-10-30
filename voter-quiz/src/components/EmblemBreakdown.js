// EmblemBreakdown.js
import React from "react";
import { getFeelingColors } from "./EmblemPatterns";

const EmblemBreakdown = ({ answers }) => {
  // Get pattern colors based on feeling
  const colorScheme = getFeelingColors(answers[5] || "Indifferent");

  // Helper function to render single pattern layer
  const renderPatternLayer = (pattern, type, transform) => {
    if (!pattern) return null;

    const colors = {
      issue: colorScheme.keyIssue,
      intention: colorScheme.votingIntention,
      motivation: colorScheme.votingMotivation,
    }[type];

    return (
      <svg viewBox="0 0 100 100">
        <g transform="translate(50,50)">
          <g transform={transform}>
            <path d={pattern.bd} fill={colors[0]} opacity={0.9} />
            <path d={pattern.be} fill={colors[1]} opacity={0.9} />
          </g>
        </g>
      </svg>
    );
  };

  // Color scheme indicator component
  const ColorSchemeIndicator = ({ colors, label }) => (
    <div className="color-indicator">
      <div className="color-circles">
        {[
          colors[0],
          colors[1],
          colors[2] || colors[0],
          colors[3] || colors[1],
          colors[4] || colors[0],
          colors[5] || colors[1],
        ].map((color, index) => (
          <div
            key={index}
            className="color-circle"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className="color-label">{label}</span>
    </div>
  );

  return (
    <div className="emblem-breakdown">
      {/* Individual emblem elements */}
      <div className="breakdown-row">
        <div className="pattern-preview">
          {answers[8] &&
            renderPatternLayer(
              getPattern("issue", answers[8]),
              "issue",
              "translate(-40,-40) scale(0.8)"
            )}
          <span className="pattern-label">Issue Pattern</span>
        </div>
        <div className="pattern-preview">
          {answers[1] &&
            renderPatternLayer(
              getPattern("intention", answers[1]),
              "intention",
              "translate(-25,-25) scale(0.5)"
            )}
          <span className="pattern-label">Intention Pattern</span>
        </div>
        <div className="pattern-preview">
          {(answers[2] || answers[3]) &&
            renderPatternLayer(
              getPattern("motivation", answers[2] || answers[3]),
              "motivation",
              "translate(-20,-20) scale(0.4)"
            )}
          <span className="pattern-label">Motivation Pattern</span>
        </div>
      </div>

      {/* Color scheme indicators */}
      <div className="color-scheme-row">
        <ColorSchemeIndicator colors={colorScheme.keyIssue} label="Issue" />
        <ColorSchemeIndicator
          colors={colorScheme.votingIntention}
          label="Intention"
        />
        <ColorSchemeIndicator
          colors={colorScheme.votingMotivation}
          label="Motivation"
        />
      </div>
    </div>
  );
};

export default EmblemBreakdown;
