import React from "react";
import { getFeelingColors } from "./EmblemPatterns";

const EmblemBreakdown = ({ answers }) => {
  // Get pattern colors based on feeling
  const colorScheme = getFeelingColors(answers[5] || "Indifferent");

  // Helper function to render single pattern layer
  const renderPatternLayer = (pattern, type, transform, colors) => {
    if (!pattern) return null;

    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16">
        <g transform="translate(50,50)">
          <g transform={transform}>
            <path d={pattern.bd} fill={colors[0]} opacity={0.9} />
            <path d={pattern.be} fill={colors[1]} opacity={0.9} />
          </g>
        </g>
      </svg>
    );
  };

  // Updated ColorSchemeIndicator to show 6 colors
  const ColorSchemeIndicator = ({ colors, label }) => (
    <div className="flex flex-col items-center mx-2">
      <div className="relative w-20 h-12">
        {" "}
        {/* Increased size to accommodate 6 circles */}
        {/* Top row */}
        <div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: colors[0],
            left: "0",
            top: "0",
          }}
        />
        <div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: colors[1],
            left: "25%",
            top: "0",
          }}
        />
        <div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: colors[2] || colors[0], // Fallback if only 2 colors provided
            left: "50%",
            top: "0",
          }}
        />
        {/* Bottom row */}
        <div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: colors[3] || colors[1],
            left: "12.5%",
            top: "50%",
          }}
        />
        <div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: colors[4] || colors[0],
            left: "37.5%",
            top: "50%",
          }}
        />
        <div
          className="absolute w-6 h-6 rounded-full"
          style={{
            backgroundColor: colors[5] || colors[1],
            left: "62.5%",
            top: "50%",
          }}
        />
      </div>
      <span className="text-xs mt-1">{label}</span>
    </div>
  );

  return (
    <div className="w-full">
      {/* Individual emblem elements */}
      <div className="flex justify-center items-center space-x-4 mb-6">
        <div className="flex flex-col items-center">
          <div className="h-20 flex items-center">
            {answers[8] &&
              renderPatternLayer(
                getPattern("issue", answers[8]),
                "issue",
                "translate(-40,-40) scale(0.8)",
                [colorScheme.keyIssue[0], colorScheme.keyIssue[1]]
              )}
          </div>
          <span className="text-xs">Issue Pattern</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-20 flex items-center">
            {answers[1] &&
              renderPatternLayer(
                getPattern("intention", answers[1]),
                "intention",
                "translate(-25,-25) scale(0.5)",
                [colorScheme.votingIntention[0], colorScheme.votingIntention[1]]
              )}
          </div>
          <span className="text-xs">Intention Pattern</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-20 flex items-center">
            {(answers[2] || answers[3]) &&
              renderPatternLayer(
                getPattern("motivation", answers[2] || answers[3]),
                "motivation",
                "translate(-20,-20) scale(0.4)",
                [
                  colorScheme.votingMotivation[0],
                  colorScheme.votingMotivation[1],
                ]
              )}
          </div>
          <span className="text-xs">Motivation Pattern</span>
        </div>
      </div>

      {/* Color scheme indicators */}
      <div className="flex justify-center items-center mb-4">
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
