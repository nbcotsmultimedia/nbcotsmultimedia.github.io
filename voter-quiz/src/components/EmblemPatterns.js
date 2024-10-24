// src/components/EmblemPatterns.js

// This file contains the visual patterns and color schemes used to generate voter emblems
// Each pattern is an SVG path that creates a unique visual representation

import { PATTERNS } from "./PatternConstants";

// Extract the patterns needed for different voter characteristics
const {
  intention: intentionPatterns,
  motivation: motivationPatterns,
  issue: issuePatterns,
} = PATTERNS;

// Mapping for voting intention icons (Yes, No, Unsure)
export const INTENTION_PATTERNS = {
  "Yes, I plan on voting": intentionPatterns.yes,
  "No, I do not plan on voting": intentionPatterns.no,
  "I am unsure": intentionPatterns.unsure,
};

// Mapping for voting motivation icons
export const MOTIVATION_PATTERNS = {
  // Patterns for "Yes" voters - showing different reasons for voting
  "To express my opinion on important issues":
    motivationPatterns.voting.opinion,
  "To support a specific candidate or party":
    motivationPatterns.voting.supportCandidate,
  "To fulfill my civic duty": motivationPatterns.voting.civicDuty,
  "To influence change in my community":
    motivationPatterns.voting.communityChange,

  // Patterns for "No" or "Unsure" voters - showing reasons for not voting
  "I don't think any of the candidates will make a good president":
    motivationPatterns.nonVoting.dontLikeCandidates,
  "I'm just not interested in politics":
    motivationPatterns.nonVoting.notInterested,
  "I do not feel my vote will make a difference":
    motivationPatterns.nonVoting.voteWontMatter,
  "I am unable to vote due to personal circumstances":
    motivationPatterns.nonVoting.cantVote,
  "I am not registered to vote": motivationPatterns.nonVoting.notRegistered,
  "I am not eligible to vote": motivationPatterns.nonVoting.ineligible,
};

// Mapping for key issue icons that represent voter's primary concern
export const ISSUE_PATTERNS = {
  "Economy and jobs": issuePatterns["economy-and-jobs"],
  Healthcare: issuePatterns.healthcare,
  "Climate change and the environment":
    issuePatterns["climate-change-and-the-environment"],
  Immigration: issuePatterns.immigration,
  Education: issuePatterns.education,
  "National security and foreign policy":
    issuePatterns["national-security-and-foreign-policy"],
  "Gun policy": issuePatterns["gun-policy"],
  "Abortion and reproductive rights":
    issuePatterns["abortion-and-reproductive-rights"],
  "Racial and ethnic inequality": issuePatterns["racial-and-ethnic-inequality"],
  "Crime and criminal justice": issuePatterns["crime-and-criminal-justice"],
};

// Color schemes for different emotional responses to the election
export const FEELING_SCHEMES = {
  // Each scheme contains three color pairs for different pattern layers
  Hopeful: {
    keyIssue: ["#F5B517", "#FFB451"], // Golden tones
    votingIntention: ["#F8623F", "#F8A6CA"], // Warm coral & pink
    votingMotivation: ["#3439FF", "#42CEEA"], // Bright blues
  },
  Anxious: {
    keyIssue: ["#4B083B", "#6D155C"], // Deep purples
    votingIntention: ["#F53864", "#BD1864"], // Hot pinks
    votingMotivation: ["#F77FFE", "#F7A8ED"], // Light pinks
  },
  // ... (other feeling schemes follow the same pattern)
};

// Helper function to get the color scheme based on the user's feeling
export const getFeelingColors = (feeling) => {
  return FEELING_SCHEMES[feeling] || FEELING_SCHEMES["Indifferent"];
};

// Helper function to look up the correct pattern based on answer type and value
export const getPattern = (type, answer) => {
  let pattern;

  switch (type) {
    case "intention":
      pattern = INTENTION_PATTERNS[answer];
      console.log("Intention pattern lookup:", { answer, found: !!pattern });
      break;
    case "motivation":
      pattern = MOTIVATION_PATTERNS[answer];
      console.log("Motivation pattern lookup:", { answer, found: !!pattern });
      break;
    case "issue":
      pattern = ISSUE_PATTERNS[answer];
      console.log("Issue pattern lookup:", { answer, found: !!pattern });
      break;
    default:
      pattern = null;
  }

  if (!pattern) {
    console.warn(`No pattern found for ${type} answer: "${answer}"`);
  }

  return pattern;
};
