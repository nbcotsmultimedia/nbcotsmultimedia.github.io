// src/components/EmblemRenderer.js

import React from "react";
import { PATTERNS } from "./PatternConstants";
import { FEELING_SCHEMES } from "./EmblemPatterns";
import {
  INTENTION_CHOICES,
  MOTIVATION_CHOICES,
  FEELING_CHOICES,
  KEY_ISSUE_CHOICES,
} from "./QuizConstants";

function EmblemRenderer({
  answers,
  progressive = false,
  currentQuestion = 0,
  newsHours,
}) {
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

  // Determine opacity based on whether feeling has been selected
  const getOpacity = () => {
    if (!progressive) return 1; // Final emblem always full opacity
    if (currentQuestion >= 5) return 1; // After feeling question, full opacity
    return 0.5; // Before feeling question, 50% opacity
  };

  // Determine repetition based on news hours
  const getPatternRepetition = (hours) => {
    // Add debug logging
    console.log("Calculating repetition for hours:", hours);

    if (!hours) {
      console.log("No hours provided, defaulting to 1");
      return 1;
    }

    // Map news consumption to repetition values
    const repetitionMap = {
      "0-1": 1,
      "1-3": 1,
      "3-5": 4,
      "5-10": 16,
      "10+": 16,
    };

    const repetition = repetitionMap[hours] || 1;
    console.log("Calculated repetition:", repetition);
    return repetition;
  };

  // Update how we determine the news hours and repetition
  const determineRepetition = () => {
    // For progressive emblem
    if (progressive) {
      console.log("Progressive mode, current question:", currentQuestion);
      // Only show pattern repetition if we've reached the news hours question
      if (currentQuestion >= 9) {
        // News hours is question 9 now
        const newsHoursAnswer = answers?.[9];
        console.log(
          "Progressive emblem - showing repetition for hours:",
          newsHoursAnswer
        );
        return getPatternRepetition(newsHoursAnswer);
      }
      console.log(
        "Progressive emblem - before news hours question, using default"
      );
      return 1;
    }

    // For final emblem
    console.log("Final emblem mode");
    return getPatternRepetition(answers?.[9]);
  };

  // Use the new determineRepetition function
  const repetition = determineRepetition();

  const opacity = getOpacity();

  // Update the pattern mapping section
  const intentionPattern =
    answers && (!progressive || currentQuestion >= 1)
      ? getPatternPaths("intention", answers[1])
      : null;

  const issuePattern =
    answers && (!progressive || currentQuestion >= 8)
      ? getPatternPaths("issue", answers[8])
      : null;

  const motivationPattern =
    answers && (!progressive || currentQuestion >= 2)
      ? getPatternPaths("motivation", answers[2] || answers[3])
      : null;

  // Get color scheme based on emotional response
  const selectedFeeling = answers?.[5] || "Indifferent";
  const colorScheme =
    FEELING_SCHEMES[selectedFeeling] || FEELING_SCHEMES.Indifferent;

  // Get news hours from the correct answer index
  const actualNewsHours = answers?.[9]; // Question 10 is at index 9

  // Render the emblem
  return (
    <div className={progressive ? "progressive-emblem" : "voter-emblem"}>
      <div className="emblem-container">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="emblem-svg"
        >
          <g transform="translate(50,50)">
            {/* Key Issue Pattern Layer */}
            {issuePattern && (
              <g
                className="pattern-layer"
                transform="translate(-40,-40) scale(0.8)"
              >
                {Array.from({ length: repetition }).map((_, index) => {
                  const x =
                    (index % Math.sqrt(repetition)) *
                    (100 / Math.sqrt(repetition));
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
                      <path
                        d={issuePattern.bd}
                        fill={colorScheme?.keyIssue?.[0] || "#CCCCCC"}
                        opacity={opacity}
                      />
                      <path
                        d={issuePattern.be}
                        fill={colorScheme?.keyIssue?.[1] || "#DDDDDD"}
                        opacity={opacity}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Voting Intention Pattern Layer */}
            {intentionPattern && (
              <g
                className="pattern-layer"
                transform="translate(-25,-25) scale(0.5)"
              >
                <path
                  d={intentionPattern.bd}
                  fill={colorScheme?.votingIntention?.[0] || "#AAAAAA"}
                  opacity={opacity}
                />
                <path
                  d={intentionPattern.be}
                  fill={colorScheme?.votingIntention?.[1] || "#BBBBBB"}
                  opacity={opacity}
                />
              </g>
            )}

            {/* Voting Motivation Pattern Layer */}
            {motivationPattern && (
              <g
                className="pattern-layer motivation"
                transform="translate(-20,-20) scale(0.4)"
              >
                <path
                  d={motivationPattern.bd}
                  fill={colorScheme?.votingMotivation?.[0] || "#888888"}
                  opacity={opacity}
                />
                <path
                  d={motivationPattern.be}
                  fill={colorScheme?.votingMotivation?.[1] || "#999999"}
                  opacity={opacity}
                />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default EmblemRenderer;
