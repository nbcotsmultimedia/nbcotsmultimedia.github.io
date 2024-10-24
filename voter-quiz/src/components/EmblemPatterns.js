// src/components/EmblemPatterns.js

import { PATTERNS } from "./PatternConstants";

// Extract the patterns we need from PATTERNS
const {
  intention: intentionPatterns,
  motivation: motivationPatterns,
  issue: issuePatterns,
} = PATTERNS;

// Mapping for voting intention patterns
export const INTENTION_PATTERNS = {
  "Yes, I plan on voting": intentionPatterns.yes,
  "No, I do not plan on voting": intentionPatterns.no,
  "I am unsure": intentionPatterns.unsure,
};

// Mapping for voting motivation patterns
export const MOTIVATION_PATTERNS = {
  // For "Yes" voters
  "To express my opinion on important issues":
    motivationPatterns.voting.opinion,
  "To support a specific candidate or party":
    motivationPatterns.voting.supportCandidate,
  "To fulfill my civic duty": motivationPatterns.voting.civicDuty,
  "To influence change in my community":
    motivationPatterns.voting.communityChange,

  // For "No" or "Unsure" voters
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

// Mapping for key issue patterns
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

// Color schemes for different feelings
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
    keyIssue: ["#E48569", "#8E5572"], // Burnt sienna & Magenta haze
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

// Helper function to get feeling color scheme
export const getFeelingColors = (feeling) => {
  return FEELING_SCHEMES[feeling] || FEELING_SCHEMES["Indifferent"];
};

// Helper function to get pattern based on answer type
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
