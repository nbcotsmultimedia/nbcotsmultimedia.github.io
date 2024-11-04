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

// Patterns mapping
export const PATTERNS_MAP = {
  intention: {
    "Yes, I plan on voting": PATTERNS.intention.yes,
    "No, I do not plan on voting": PATTERNS.intention.no,
    "I am unsure": PATTERNS.intention.unsure,
  },
  motivation: {
    voting: {
      "To express my opinion on important issues":
        PATTERNS.motivation.voting.opinion,
      "To support a specific candidate or party":
        PATTERNS.motivation.voting.supportCandidate,
      "To fulfill my civic duty": PATTERNS.motivation.voting.civicDuty,
      "To influence change in my community":
        PATTERNS.motivation.voting.communityChange,
    },
    nonVoting: {
      "I don't think any of the candidates will make a good president":
        PATTERNS.motivation.nonVoting.dontLikeCandidates,
      "I'm just not interested in politics":
        PATTERNS.motivation.nonVoting.notInterested,
      "I don't feel my vote will make a difference":
        PATTERNS.motivation.nonVoting.voteWontMatter,
      "I am unable to vote due to personal circumstances":
        PATTERNS.motivation.nonVoting.cantVote,
      "I'm not registered to vote": PATTERNS.motivation.nonVoting.notRegistered,
      "I'm not eligible to vote": PATTERNS.motivation.nonVoting.ineligible,
    },
  },
  issue: {
    "Economy and jobs": PATTERNS.issue["economy-and-jobs"],
    Healthcare: PATTERNS.issue.healthcare,
    "Climate change and the environment":
      PATTERNS.issue["climate-change-and-the-environment"],
    Immigration: PATTERNS.issue.immigration,
    Education: PATTERNS.issue.education,
    "National security and foreign policy":
      PATTERNS.issue["national-security-and-foreign-policy"],
    "Gun policy": PATTERNS.issue["gun-policy"],
    "Abortion and reproductive rights":
      PATTERNS.issue["abortion-and-reproductive-rights"],
    "Racial and ethnic inequality":
      PATTERNS.issue["racial-and-ethnic-inequality"],
    "Crime and criminal justice": PATTERNS.issue["crime-and-criminal-justice"],
  },
};

// Helper function to get the correct pattern based on answer type and value
export const getPattern = (type, answer) => {
  if (!answer) return null;

  switch (type) {
    case "intention":
      return PATTERNS_MAP.intention[answer];

    case "motivation":
      // Check if it's a voting or non-voting motivation
      if (answer in PATTERNS_MAP.motivation.voting) {
        return PATTERNS_MAP.motivation.voting[answer];
      } else if (answer in PATTERNS_MAP.motivation.nonVoting) {
        return PATTERNS_MAP.motivation.nonVoting[answer];
      }
      return null;

    case "issue":
      return PATTERNS_MAP.issue[answer];

    default:
      return null;
  }
};

// Color schemes for different emotional responses to the election
export const FEELING_SCHEMES = {
  Hopeful: {
    keyIssue: ["#F5B517", "#FFB451"], // Goldenrod & Med yellow
    votingIntention: ["#F8623F", "#F8A6CA"], // Hot coral & Lavender pink
    votingMotivation: ["#3439FF", "#42CEEA"], // Royal blue & Bright blue
  },
  Anxious: {
    keyIssue: ["#4B083B", "#6D155C"], // Eggplant & Dark purple
    votingIntention: ["#F53864", "#BD1864"], // Hot coral & Magenta
    votingMotivation: ["#F77FFE", "#F7A8ED"], // Pepto pink & Pale pink
  },
  Frustrated: {
    keyIssue: ["#FF5B14", "#C44923"], // Bright orange & Burnt orange
    votingIntention: ["#E5172B", "#C21C68"], // Bright red & Magenta
    votingMotivation: ["#770F02", "#1B1A42"], // Dark burgundy & Dark navy
  },
  Indifferent: {
    keyIssue: ["#A0A0A0", "#C8C8C8"], // Lighter mid-gray & Very light gray
    votingIntention: ["#666666", "#989898"], // Darker gray & Medium gray
    votingMotivation: ["#424242", "#747474"], // Deep gray & Gray tone
  },
  Confused: {
    keyIssue: ["#E48569", "#ff9689"], // Burnt sienna & Coral pink
    votingIntention: ["#CBE896", "#C5D86D"], // Pale lime & Mindaro
    votingMotivation: ["#5C573E", "#95AA89"], // Olive & Dark olive
  },
  Scared: {
    keyIssue: ["#171A4D", "#28407C"], // Dark navy & Medium navy
    votingIntention: ["#3E0A5C", "#6634BB"], // Russian violet & Grape
    votingMotivation: ["#D8E63B", "#a7a871"], // Pear & Sage
  },
  Excited: {
    keyIssue: ["#119822", "#2a7221"], // Forest green & Office green
    votingIntention: ["#06D6A0", "#E4CC37"], // Emerald & Citrine
    votingMotivation: ["#145C9E", "#BBADFF"], // Lapis lazuli & Mauve
  },
};

// Helper function to get the color scheme based on the user's feeling
export const getFeelingColors = (feeling) => {
  return FEELING_SCHEMES[feeling] || FEELING_SCHEMES["Indifferent"];
};
