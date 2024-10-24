// src/components/EmblemPatterns.js

// Mapping for voting intention patterns
export const INTENTION_PATTERNS = {
  "Yes, I plan on voting": intentionYes,
  "No, I do not plan on voting": intentionNo,
  "I am unsure": intentionUnsure,
};

// Mapping for voting motivation patterns
export const MOTIVATION_PATTERNS = {
  // For "Yes" voters
  "To express my opinion on important issues": motivationOpinion,
  "To support a specific candidate or party": motivationSupportCandidate,
  "To fulfill my civic duty": motivationCivic,
  "To influence change in my community": motivationChange,

  // For "No" or "Unsure" voters
  "I don't think any of the candidates will make a good president":
    motivationDontLikeCandidates,
  "I'm just not interested in politics": motivationNotInterested, // Updated to match exact answer
  "I do not feel my vote will make a difference": motivationVoteWontMatter,
  "I am unable to vote due to personal circumstances": motivationCantVote,
  "I am not registered to vote": motivationNotRegistered,
  "I am not eligible to vote": motivationIneligible,
};

// Mapping for key issue patterns
export const ISSUE_PATTERNS = {
  "Economy and jobs": issueEconomy,
  Healthcare: issueHealthcare,
  "Climate change and the environment": issueClimate,
  Immigration: issueImmigration,
  Education: issueEducation,
  "National security and foreign policy": issueForeignPolicy,
  "Gun policy": issueGunPolicy,
  "Abortion and reproductive rights": issueAbortion,
  "Racial and ethnic inequality": issueRacialEquity,
  "Crime and criminal justice": issueCrime,
};

// Color schemes for different feelings
export const FEELING_SCHEMES = {
  Hopeful: {
    keyIssue: ["#F5B517", "#FFB451"], // Goldenrod tones
    votingIntention: ["#F8623F", "#F8A6CA"], // Coral tones
    votingMotivation: ["#42CEEA", "#3439FF"], // Blue tones
  },
  Excited: {
    keyIssue: ["#F8623F", "#F8A6CA"], // Coral tones
    votingIntention: ["#FFB451", "#F5B517"], // Goldenrod tones
    votingMotivation: ["#3439FF", "#42CEEA"], // Blue tones
  },
  Anxious: {
    keyIssue: ["#4E8838", "#015155"], // Purple tones
    votingIntention: ["#F53864", "#F8A6CA"], // Pink tones
    votingMotivation: ["#F77FFE", "#F8A6CA"], // Magenta tones
  },
  Frustrated: {
    keyIssue: ["#FF5B14", "#F54923"], // Orange tones
    votingIntention: ["#E21728", "#C21C68"], // Red tones
    votingMotivation: ["#1B1AA2", "#779F02"], // Navy tones
  },
  Indifferent: {
    keyIssue: ["#000000", "#CCCCCC"], // Gray tones
    votingIntention: ["#AAAAAA", "#444444"], // Light gray tones
    votingMotivation: ["#555555", "#888888"], // Dark gray tones
  },
  Confused: {
    keyIssue: ["#485869", "#E85572"], // Sienna tones
    votingIntention: ["#E8B896", "#C5D060"], // Pale lime tones
    votingMotivation: ["#9EBA89", "#5C573E"], // Olive tones
  },
  Scared: {
    keyIssue: ["#17144D", "#2B3B7C"], // Navy tones
    votingIntention: ["#E3A05C", "#663A5C"], // Purple tones
    votingMotivation: ["#00EC3B", "#9EC112"], // Citrine tones
  },
};

// Helper function to get feeling color scheme
export const getFeelingColors = (feeling) => {
  return FEELING_SCHEMES[feeling] || FEELING_SCHEMES["Indifferent"];
};

// Helper function to get pattern based on answer type
// Add this helper function to EmblemPatterns.js
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
