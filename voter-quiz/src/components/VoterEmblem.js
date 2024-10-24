import React from "react";
import { PATTERNS } from "./PatternConstants";

function VoterEmblem({ answers }) {
  function getPatternPaths(type, answer) {
    try {
      if (!answer || typeof answer !== "string") return null;

      switch (type) {
        case "intention":
          if (answer === "Yes, I plan on voting") return PATTERNS.intention.yes;
          if (answer === "No, I do not plan on voting")
            return PATTERNS.intention.no;
          if (answer === "I am unsure") return PATTERNS.intention.unsure;
          return null;

        case "issue": {
          const issueKey = answer
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          return PATTERNS.issue[issueKey] || null;
        }

        case "motivation": {
          if (!answers || !answers[1]) return null;

          if (answers[1] === "Yes, I plan on voting") {
            const votingPatternMap = {
              "To express my opinion on important issues":
                PATTERNS.motivation.voting.opinion,
              "To support a specific candidate or party":
                PATTERNS.motivation.voting.supportCandidate,
              "To fulfill my civic duty": PATTERNS.motivation.voting.civicDuty,
              "To influence change in my community":
                PATTERNS.motivation.voting.communityChange,
            };
            return votingPatternMap[answer] || null;
          } else {
            const nonVotingPatternMap = {
              "I don't think any of the candidates will make a good president":
                PATTERNS.motivation.nonVoting.dontLikeCandidates,
              "I'm just not interested in politics":
                PATTERNS.motivation.nonVoting.notInterested,
              "I don't feel my vote will make a difference":
                PATTERNS.motivation.nonVoting.voteWontMatter,
              "Personal circumstances prevent me from voting (work, health, transportation)":
                PATTERNS.motivation.nonVoting.cantVote,
              "I'm not registered to vote":
                PATTERNS.motivation.nonVoting.notRegistered,
              "I'm not eligible to vote":
                PATTERNS.motivation.nonVoting.ineligible,
            };
            return nonVotingPatternMap[answer] || null;
          }
        }

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error in getPatternPaths for type ${type}:`, error);
      return null;
    }
  }

  const intentionPattern = answers
    ? getPatternPaths("intention", answers[1])
    : null;
  const issuePattern = answers ? getPatternPaths("issue", answers[8]) : null;
  const motivationPattern = answers
    ? getPatternPaths("motivation", answers[2] || answers[3])
    : null;

  return (
    <div className="voter-emblem">
      <h3>Your Voter Emblem</h3>

      <div className="emblem-container">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="emblem-svg"
        >
          {/* Center point for transformations */}
          <g transform="translate(100,100)">
            {/* Issue Pattern Layer - Largest (100% scale) */}
            {issuePattern && (
              <g
                className="pattern-layer"
                transform="translate(-50,-50) scale(1)"
              >
                <path d={issuePattern.bd} fill="#999" opacity="0.8" />
                <path d={issuePattern.be} fill="#c5c5c5" opacity="0.8" />
              </g>
            )}

            {/* Intention Pattern Layer - Medium (80% scale) */}
            {intentionPattern && (
              <g
                className="pattern-layer"
                transform="translate(-40,-40) scale(0.8)"
              >
                <path d={intentionPattern.bd} fill="#999" opacity="0.8" />
                <path d={intentionPattern.be} fill="#c5c5c5" opacity="0.8" />
              </g>
            )}

            {/* Motivation Pattern Layer - Smallest (60% scale) */}
            {motivationPattern && (
              <g
                className="pattern-layer motivation"
                transform="translate(-30,-30) scale(0.6)"
              >
                <path d={motivationPattern.bd} fill="#999" opacity="0.8" />
                <path d={motivationPattern.be} fill="#c5c5c5" opacity="0.8" />
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Debug info */}
      <div
        style={{ margin: "20px", padding: "10px", border: "1px solid #ccc" }}
      >
        <h4>Debug Info:</h4>
        <div>Intention Answer: {answers?.[1]}</div>
        <div>Issue Answer: {answers?.[8]}</div>
        <div>Motivation Answer: {answers?.[2] || answers?.[3]}</div>
        <pre>{JSON.stringify(answers, null, 2)}</pre>
      </div>
    </div>
  );
}

export default VoterEmblem;
