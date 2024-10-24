// src/components/VoterEmblem.js

import React from "react";
import { PATTERNS } from "./PatternConstants";
import { FEELING_SCHEMES } from "./EmblemPatterns";
import {
  INTENTION_CHOICES,
  MOTIVATION_CHOICES,
  FEELING_CHOICES,
  KEY_ISSUE_CHOICES,
} from "./QuizConstants";

function VoterEmblem({ answers }) {
  // Helper function to get the appropriate pattern paths based on user responses
  function getPatternPaths(type, answer) {
    if (!answer) return null;

    switch (type) {
      // Get patterns for voting intention (Yes/No/Unsure)
      case "intention": {
        const intentionMap = {
          [INTENTION_CHOICES.YES]: PATTERNS.intention.yes,
          [INTENTION_CHOICES.NO]: PATTERNS.intention.no,
          [INTENTION_CHOICES.UNSURE]: PATTERNS.intention.unsure,
        };
        return intentionMap[answer] || null;
      }

      // Get patterns for key political issues
      case "issue": {
        const issueMap = {
          [KEY_ISSUE_CHOICES.ECONOMY]: PATTERNS.issue["economy-and-jobs"],
          [KEY_ISSUE_CHOICES.HEALTHCARE]: PATTERNS.issue.healthcare,
          [KEY_ISSUE_CHOICES.CLIMATE]:
            PATTERNS.issue["climate-change-and-the-environment"],
          [KEY_ISSUE_CHOICES.IMMIGRATION]: PATTERNS.issue.immigration,
          [KEY_ISSUE_CHOICES.EDUCATION]: PATTERNS.issue.education,
          [KEY_ISSUE_CHOICES.NATIONAL_SECURITY]:
            PATTERNS.issue["national-security-and-foreign-policy"],
          [KEY_ISSUE_CHOICES.GUN_POLICY]: PATTERNS.issue["gun-policy"],
          [KEY_ISSUE_CHOICES.ABORTION]:
            PATTERNS.issue["abortion-and-reproductive-rights"],
          [KEY_ISSUE_CHOICES.RACIAL_INEQUALITY]:
            PATTERNS.issue["racial-and-ethnic-inequality"],
          [KEY_ISSUE_CHOICES.CRIME]:
            PATTERNS.issue["crime-and-criminal-justice"],
        };
        return issueMap[answer] || null;
      }

      // Get patterns for voting motivation
      case "motivation": {
        if (!answers[1]) return null;

        // Different patterns for Yes voters vs No/Unsure voters
        if (answers[1] === INTENTION_CHOICES.YES) {
          const votingMap = {
            [MOTIVATION_CHOICES.OPINION]: PATTERNS.motivation.voting.opinion,
            [MOTIVATION_CHOICES.SUPPORT_CANDIDATE]:
              PATTERNS.motivation.voting.supportCandidate,
            [MOTIVATION_CHOICES.CIVIC_DUTY]:
              PATTERNS.motivation.voting.civicDuty,
            [MOTIVATION_CHOICES.COMMUNITY_CHANGE]:
              PATTERNS.motivation.voting.communityChange,
          };
          return votingMap[answer] || null;
        } else {
          const nonVotingMap = {
            [MOTIVATION_CHOICES.DISLIKE_CANDIDATES]:
              PATTERNS.motivation.nonVoting.dontLikeCandidates,
            [MOTIVATION_CHOICES.NOT_INTERESTED]:
              PATTERNS.motivation.nonVoting.notInterested,
            [MOTIVATION_CHOICES.WONT_MATTER]:
              PATTERNS.motivation.nonVoting.voteWontMatter,
            [MOTIVATION_CHOICES.CANT_VOTE]:
              PATTERNS.motivation.nonVoting.cantVote,
            [MOTIVATION_CHOICES.NOT_REGISTERED]:
              PATTERNS.motivation.nonVoting.notRegistered,
            [MOTIVATION_CHOICES.INELIGIBLE]:
              PATTERNS.motivation.nonVoting.ineligible,
          };
          return nonVotingMap[answer] || null;
        }
      }

      default:
        return null;
    }
  }

  // Get patterns for each component of the emblem
  const intentionPattern = answers
    ? getPatternPaths("intention", answers[1])
    : null;
  const issuePattern = answers ? getPatternPaths("issue", answers[8]) : null;
  const motivationPattern = answers
    ? getPatternPaths("motivation", answers[2] || answers[3])
    : null;

  // Get color scheme based on emotional response
  const selectedFeeling = answers?.[4] || "Indifferent";
  console.log("Selected feeling:", selectedFeeling);

  const colorScheme =
    FEELING_SCHEMES[selectedFeeling] || FEELING_SCHEMES.Indifferent;
  console.log("Using color scheme:", colorScheme);

  // Render the emblem
  return (
    <div className="voter-emblem">
      <h3>Your Voter Emblem</h3>

      <div className="emblem-container">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="emblem-svg"
        >
          {/* Center and scale the emblem */}
          <g transform="translate(100,100)">
            {/* Key Issue Pattern Layer */}
            {issuePattern && (
              <g
                className="pattern-layer"
                transform="translate(-50,-50) scale(1)"
              >
                <path
                  d={issuePattern.bd}
                  fill={colorScheme.keyIssue[0]}
                  opacity="1"
                />
                <path
                  d={issuePattern.be}
                  fill={colorScheme.keyIssue[1]}
                  opacity="1"
                />
              </g>
            )}

            {/* Voting Intention Pattern Layer */}
            {intentionPattern && (
              <g
                className="pattern-layer"
                transform="translate(-30,-30) scale(0.6)"
              >
                <path
                  d={intentionPattern.bd}
                  fill={colorScheme.votingIntention[0]}
                  opacity="0.9"
                />
                <path
                  d={intentionPattern.be}
                  fill={colorScheme.votingIntention[1]}
                  opacity="0.9"
                />
              </g>
            )}

            {/* Voting Motivation Pattern Layer */}
            {motivationPattern && (
              <g
                className="pattern-layer motivation"
                transform="translate(-25,-25) scale(0.5)"
              >
                <path
                  d={motivationPattern.bd}
                  fill={colorScheme.votingMotivation[0]}
                  opacity="0.9"
                />
                <path
                  d={motivationPattern.be}
                  fill={colorScheme.votingMotivation[1]}
                  opacity="0.9"
                />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default VoterEmblem;
