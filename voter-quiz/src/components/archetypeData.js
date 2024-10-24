// src/components/archetypeData.js
export const archetypes = {
  anxiousDemocrat: {
    title: "The Anxious Democrat",
    description: "A Political Worrier with a side of hope",
    profile:
      "You're politically engaged and deeply invested in progressive causes, balancing concern about the future with determination to make positive change.",
    detail:
      "Your commitment to issues like healthcare, climate change, and reproductive rights reflects your progressive values. While you may feel anxious about political developments, you channel that energy into civic engagement and advocacy.",
    traits: {
      issuesFocus: ["Healthcare", "Climate Change", "Reproductive Rights"],
      newsConsumption: "Moderate to High",
      socialMedia: "Moderate",
      emotionalState: "Anxious but Hopeful",
    },
  },
  civicMinded: {
    title: "The Civic-Minded Voter",
    description: "A Democracy Guardian with years of wisdom",
    profile:
      "You're a dedicated voter who sees participation in democracy as both a privilege and responsibility.",
    detail:
      "Your approach to politics is measured and thoughtful, prioritizing civic duty over partisan loyalty. You stay informed on key issues while maintaining a balanced perspective.",
    traits: {
      issuesFocus: ["Healthcare", "Economy", "National Security"],
      newsConsumption: "Low to Moderate",
      socialMedia: "Low",
      emotionalState: "Balanced",
    },
  },
  youngProgressive: {
    title: "The Young Progressive",
    description: "A Digital Activist with a zest for change",
    profile:
      "You're part of a new generation of politically engaged citizens using digital platforms to advocate for change.",
    detail:
      "Your high engagement with political content online reflects your commitment to issues like climate change and social justice. You see voting as a crucial tool for creating systemic change.",
    traits: {
      issuesFocus: ["Climate Change", "Social Justice", "Economic Inequality"],
      newsConsumption: "High",
      socialMedia: "High",
      emotionalState: "Energized",
    },
  },
  frustratedIndependent: {
    title: "The Frustrated Independent",
    description: "A Political Maverick with a sprinkle of cynicism",
    profile:
      "You're a political maverick with a sprinkle of cynicism, navigating the tumultuous waters of today's political landscape.",
    detail:
      "You embrace your independence, often feeling caught between the extremes of party loyalty and personal conviction. Your diverse interests reflect a nuanced understanding of the issues that matter most to you.",
    traits: {
      issuesFocus: ["Economy", "Healthcare", "Immigration"],
      newsConsumption: "Moderate",
      socialMedia: "Low",
      emotionalState: "Frustrated",
    },
  },
  reluctantVoter: {
    title: "The Reluctant Voter",
    description: "A Disillusioned Participant with a sense of duty",
    profile:
      "You approach politics with a degree of skepticism, yet maintain a sense of civic responsibility.",
    detail:
      "While you may feel disconnected from the political process, you recognize the importance of participating in democracy, even if sometimes reluctantly.",
    traits: {
      issuesFocus: ["Economy"],
      newsConsumption: "Low",
      socialMedia: "Low",
      emotionalState: "Indifferent",
    },
  },
  highInfoPartisan: {
    title: "The High-Information Partisan",
    description: "A Political Junkie with unwavering loyalty",
    profile:
      "You're deeply engaged in political news and strongly aligned with your chosen party's positions.",
    detail:
      "Your high consumption of political news and active participation in political discussions reflect your strong commitment to your political beliefs and party values.",
    traits: {
      issuesFocus: ["Party-Aligned Issues"],
      newsConsumption: "Very High",
      socialMedia: "High",
      emotionalState: "Varied",
    },
  },
  hopefulRepublican: {
    title: "The Hopeful Republican",
    description: "An Economic Optimist with a dash of patriotism",
    profile:
      "You maintain an optimistic outlook about America's future, particularly regarding economic opportunities and growth.",
    detail:
      "Your focus on economic issues and traditional values shapes your political perspective, while maintaining hope for positive change through conservative policies.",
    traits: {
      issuesFocus: ["Economy", "Jobs", "Immigration"],
      newsConsumption: "Moderate",
      socialMedia: "Moderate",
      emotionalState: "Hopeful",
    },
  },
};

// Add the determineArchetype function to the same file for simplicity
export const determineArchetype = (answers) => {
  let scores = {
    anxiousDemocrat: 0,
    civicMinded: 0,
    youngProgressive: 0,
    frustratedIndependent: 0,
    reluctantVoter: 0,
    highInfoPartisan: 0,
    hopefulRepublican: 0,
  };

  // Voting intention and motivation
  if (answers[1] === "Yes, I plan on voting") {
    if (answers[2] === "To fulfill my civic duty") scores.civicMinded += 2;
    if (answers[2] === "To influence change in my community")
      scores.youngProgressive += 2;
    if (answers[2] === "To support a specific candidate or party")
      scores.highInfoPartisan += 2;
  } else {
    scores.reluctantVoter += 3;
  }

  // Emotional state
  switch (answers[5]) {
    case "Anxious":
    case "Scared":
      scores.anxiousDemocrat += 2;
      break;
    case "Frustrated":
      scores.frustratedIndependent += 2;
      break;
    case "Hopeful":
    case "Excited":
      scores.hopefulRepublican += 2;
      break;
    case "Indifferent":
      scores.reluctantVoter += 2;
      break;
  }

  // Age
  if (["18-24", "25-34"].includes(answers[6])) {
    scores.youngProgressive += 2;
  }
  if (["55-64", "65 and older"].includes(answers[6])) {
    scores.civicMinded += 2;
  }

  // Party affiliation
  switch (answers[8]) {
    case "Democratic Party":
      scores.anxiousDemocrat += 2;
      scores.highInfoPartisan += 1;
      break;
    case "Republican Party":
      scores.hopefulRepublican += 2;
      scores.highInfoPartisan += 1;
      break;
    case "Independent":
      scores.frustratedIndependent += 2;
      break;
    case "None":
      scores.reluctantVoter += 2;
      break;
  }

  // News consumption
  if (answers[10] === "10+") {
    scores.highInfoPartisan += 3;
  }
  if (answers[10] === "0-1") {
    scores.reluctantVoter += 2;
  }

  // Social media political content
  if (answers[11] === "76-100%" || answers[11] === "51-75%") {
    scores.youngProgressive += 1;
    scores.highInfoPartisan += 1;
  }

  return Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
};
