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

// Quiz questions configuration
export const QUESTIONS = [
  {
    id: 1,
    text: "Are you planning to vote in the upcoming election?",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    options: [
      INTENTION_CHOICES.YES,
      INTENTION_CHOICES.NO,
      INTENTION_CHOICES.UNSURE,
    ],
  },
  {
    id: 2,
    text: "What is your main reason for voting?",
    options: [
      MOTIVATION_CHOICES.OPINION,
      MOTIVATION_CHOICES.SUPPORT_CANDIDATE,
      MOTIVATION_CHOICES.CIVIC_DUTY,
      MOTIVATION_CHOICES.COMMUNITY_CHANGE,
    ],
    showIf: (answers) => answers[1] === INTENTION_CHOICES.YES,
  },
  {
    id: 3,
    text: "What's holding you back from voting in this election?",
    options: [
      MOTIVATION_CHOICES.DISLIKE_CANDIDATES,
      MOTIVATION_CHOICES.NOT_INTERESTED,
      MOTIVATION_CHOICES.WONT_MATTER,
      MOTIVATION_CHOICES.CANT_VOTE,
      MOTIVATION_CHOICES.NOT_REGISTERED,
      MOTIVATION_CHOICES.INELIGIBLE,
    ],
    showIf: (answers) =>
      [INTENTION_CHOICES.NO, INTENTION_CHOICES.UNSURE].includes(answers[1]),
  },
  {
    id: 4,
    text: "Did you vote in the last presidential election?",
    options: [
      "Yes, I voted",
      "No, I was eligible but did not vote",
      "No, I was not eligible to vote at the time",
    ],
  },
  {
    id: 5,
    text: "Which word best describes your overall feeling about the upcoming election?",
    options: Object.values(FEELING_CHOICES),
  },
  {
    id: 6,
    text: "What is your age?",
    options: [
      "Under 18",
      "18-24",
      "25-34",
      "35-44",
      "45-54",
      "55-64",
      "65 and older",
    ],
  },
  {
    id: 7,
    text: "Which political party do you identify with, if any?",
    options: [
      "Democratic Party",
      "Republican Party",
      "Independent",
      "None",
      "Other",
    ],
  },
  {
    id: 8,
    text: "Which of these issues is most important to you?",
    options: Object.values(KEY_ISSUE_CHOICES),
  },
  {
    id: 9,
    text: "How many hours per week do you spend following election news?",
    options: ["0-1", "1-3", "3-5", "5-10", "10+"],
  },
  {
    id: 10,
    text: "What percentage of your social media feed is related to politics?",
    options: ["0-25%", "26-50%", "51-75%", "76-100%"],
  },
];
