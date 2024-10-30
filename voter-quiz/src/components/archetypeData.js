// src/components/archetypeData.js
export const archetypes = {
  anxiousDemocrat: {
    title: "The Anxious Democrat",
    description: "A Political Worrier with a side of hope",
    profile:
      "You're politically engaged and deeply invested in progressive causes, balancing concern about the future with determination to make positive change.",
    detail:
      "Your commitment to issues like healthcare, climate change, and reproductive rights reflects your progressive values. While you may feel anxious about political developments, you channel that energy into civic engagement and advocacy.",
    personalityTraits: ["PASSIONATE", "VIGILANT", "PROGRESSIVE"],
    traits: {
      issuesFocus: ["Healthcare", "Climate Change", "Reproductive Rights"],
      newsConsumption: "High",
      socialMedia: "Moderate to High",
      emotionalState: "Anxious but Engaged",
    },
    minimumVotingIntent: true,
  },

  civicMinded: {
    title: "The Civic-Minded Voter",
    description: "A Democracy Guardian with years of wisdom",
    profile:
      "You're a dedicated voter who sees participation in democracy as both a privilege and responsibility.",
    detail:
      "Your approach to politics is measured and thoughtful, prioritizing civic duty over partisan loyalty. You stay informed on key issues while maintaining a balanced perspective.",
    personalityTraits: ["DEDICATED", "THOUGHTFUL", "BALANCED"],
    traits: {
      issuesFocus: ["Civic Participation", "Education", "Local Government"],
      newsConsumption: "Moderate",
      socialMedia: "Low",
      emotionalState: "Steady",
    },
    minimumVotingIntent: true,
  },

  youngProgressive: {
    title: "The Young Progressive",
    description: "A Digital Activist with a zest for change",
    profile:
      "You're part of a new generation of politically engaged citizens using digital platforms to advocate for change.",
    detail:
      "Your high engagement with political content online reflects your commitment to issues like climate change and social justice. You see voting as one of many tools for creating systemic change.",
    personalityTraits: ["ENERGETIC", "INNOVATIVE", "ENGAGED"],
    traits: {
      issuesFocus: ["Climate Change", "Social Justice", "Economic Inequality"],
      newsConsumption: "High",
      socialMedia: "Very High",
      emotionalState: "Energized",
    },
    minimumVotingIntent: true,
  },

  politicalSkeptic: {
    title: "The Political Skeptic",
    description: "A Critical Observer seeking better alternatives",
    profile:
      "You approach politics with a critical eye, questioning traditional party structures while remaining engaged in civic discourse.",
    detail:
      "While you may feel disconnected from mainstream political institutions, you maintain an active interest in political issues and seek alternative ways to create change.",
    personalityTraits: ["ANALYTICAL", "INDEPENDENT", "QUESTIONING"],
    traits: {
      issuesFocus: ["Government Reform", "Transparency", "Accountability"],
      newsConsumption: "Moderate to High",
      socialMedia: "Moderate",
      emotionalState: "Questioning",
    },
    minimumVotingIntent: false,
  },

  disengagedCitizen: {
    title: "The Disengaged Citizen",
    description: "A Political Outsider seeking connection",
    profile:
      "You've stepped back from traditional political participation, feeling disconnected from the current political system.",
    detail:
      "Whether due to disillusionment, lack of trust, or other priorities, you've chosen to focus your energy elsewhere. However, you remain open to re-engaging when you feel meaningful change is possible.",
    personalityTraits: ["DISTANT", "PRACTICAL", "SELECTIVE"],
    traits: {
      issuesFocus: ["Daily Life Issues", "Community Matters"],
      newsConsumption: "Low",
      socialMedia: "Low",
      emotionalState: "Detached",
    },
    minimumVotingIntent: false,
  },

  highInfoPartisan: {
    title: "The High-Information Partisan",
    description: "A Political Expert with strong convictions",
    profile:
      "You're deeply engaged in political news and strongly aligned with your chosen party's positions.",
    detail:
      "Your high consumption of political news and active participation in political discussions reflect your strong commitment to your political beliefs and party values.",
    personalityTraits: ["INFORMED", "COMMITTED", "ANALYTICAL"],
    traits: {
      issuesFocus: ["Party Platform", "Policy Details", "Electoral Strategy"],
      newsConsumption: "Very High",
      socialMedia: "High",
      emotionalState: "Passionate",
    },
    minimumVotingIntent: true,
  },

  pragmaticCentrist: {
    title: "The Pragmatic Centrist",
    description: "A Balanced Voice seeking practical solutions",
    profile:
      "You maintain a measured approach to politics, focusing on practical solutions rather than ideological positions.",
    detail:
      "Your political perspective emphasizes finding common ground and workable solutions, while remaining skeptical of extreme positions from any side.",
    personalityTraits: ["PRACTICAL", "BALANCED", "SOLUTION-ORIENTED"],
    traits: {
      issuesFocus: [
        "Economic Growth",
        "Bipartisan Solutions",
        "Practical Reforms",
      ],
      newsConsumption: "Moderate",
      socialMedia: "Moderate",
      emotionalState: "Measured",
    },
    minimumVotingIntent: true,
  },
};

export const determineArchetype = (answers) => {
  let scores = Object.keys(archetypes).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  const planToVote = answers[1] === "Yes, I plan on voting";

  // First filter out archetypes that don't match voting intention
  Object.keys(scores).forEach((key) => {
    if (archetypes[key].minimumVotingIntent && !planToVote) {
      delete scores[key];
    }
  });

  // Only proceed with scoring for valid archetypes
  if (Object.keys(scores).length > 0) {
    // Voting motivation
    if (planToVote) {
      switch (answers[2]) {
        case "To fulfill my civic duty":
          scores.civicMinded += 3;
          scores.pragmaticCentrist += 1;
          break;
        case "To influence change in my community":
          scores.youngProgressive += 3;
          scores.anxiousDemocrat += 1;
          break;
        case "To support a specific candidate or party":
          scores.highInfoPartisan += 3;
          break;
      }
    } else {
      scores.disengagedCitizen += 2;
      scores.politicalSkeptic += 2;
    }

    // Emotional state
    switch (answers[5]) {
      case "Anxious":
      case "Scared":
        scores.anxiousDemocrat += 2;
        break;
      case "Frustrated":
        scores.politicalSkeptic += 2;
        break;
      case "Hopeful":
        scores.pragmaticCentrist += 2;
        break;
      case "Indifferent":
        scores.disengagedCitizen += 2;
        break;
      case "Excited":
        scores.youngProgressive += 2;
        break;
    }

    // News consumption (answers[10])
    if (answers[10] === "10+") {
      scores.highInfoPartisan += 3;
    } else if (answers[10] === "0-1") {
      scores.disengagedCitizen += 2;
    }

    // Social media political content (answers[11])
    if (answers[11] === "76-100%" || answers[11] === "51-75%") {
      scores.youngProgressive += 2;
      scores.highInfoPartisan += 1;
    }
  }

  // Return the archetype with the highest score
  return Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
};
