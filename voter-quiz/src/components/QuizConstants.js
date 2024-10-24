// src/components/QuizConstants.js

// Constants for voting intention options
export const INTENTION_CHOICES = {
  YES: "Yes, I plan on voting",
  NO: "No, I do not plan on voting",
  UNSURE: "I am unsure",
};

// Constants for motivation responses
export const MOTIVATION_CHOICES = {
  // Motivations for "Yes" voters
  OPINION: "To express my opinion on important issues",
  SUPPORT_CANDIDATE: "To support a specific candidate or party",
  CIVIC_DUTY: "To fulfill my civic duty",
  COMMUNITY_CHANGE: "To influence change in my community",

  // Reasons for "No" or "Unsure" voters
  DISLIKE_CANDIDATES:
    "I don't think any of the candidates will make a good president",
  NOT_INTERESTED: "I'm just not interested in politics",
  WONT_MATTER: "I don't feel my vote will make a difference",
  CANT_VOTE: "I am unable to vote due to personal circumstances",
  NOT_REGISTERED: "I'm not registered to vote",
  INELIGIBLE: "I'm not eligible to vote",
};

// Constants for emotional responses about the election
export const FEELING_CHOICES = {
  HOPEFUL: "Hopeful",
  ANXIOUS: "Anxious",
  FRUSTRATED: "Frustrated",
  INDIFFERENT: "Indifferent",
  CONFUSED: "Confused",
  SCARED: "Scared",
  EXCITED: "Excited",
};

// Constants for key political issues
export const KEY_ISSUE_CHOICES = {
  ECONOMY: "Economy and jobs",
  HEALTHCARE: "Healthcare",
  CLIMATE: "Climate change and the environment",
  IMMIGRATION: "Immigration",
  EDUCATION: "Education",
  NATIONAL_SECURITY: "National security and foreign policy",
  GUN_POLICY: "Gun policy",
  ABORTION: "Abortion and reproductive rights",
  RACIAL_INEQUALITY: "Racial and ethnic inequality",
  CRIME: "Crime and criminal justice",
};
