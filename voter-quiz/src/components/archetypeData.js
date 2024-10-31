// Archetype definitions
export const archetypes = {
  concernedProgressive: {
    title: "The Concerned Progressive",
    description: "Channeling worry into meaningful action",
    profile:
      "You care deeply about progressive causes and stay actively involved in politics, even though current events sometimes make you worried.",
    detail:
      "You're especially interested in issues like healthcare, climate change, and civil rights. While political news can make you anxious, you channel those feelings into taking action and supporting causes you believe in.",
    personalityTraits: ["EMPATHETIC", "VIGILANT", "DETERMINED"],
    traits: {
      issuesFocus: ["Healthcare", "Climate Change", "Civil Rights"],
      newsConsumption: "High",
      socialMedia: "Moderate to High",
      emotionalState: "Concerned but Active",
    },
    minimumVotingIntent: true,
  },

  civicMinded: {
    title: "The Civic-Minded Voter",
    description: "A Democracy Guardian with years of wisdom",
    profile:
      "You see voting and civic participation as both a privilege and a responsibility.",
    detail:
      "You stay informed about issues and make voting decisions carefully. You believe that every vote matters and that being an active citizen makes our democracy stronger.",
    personalityTraits: ["DUTIFUL", "CONSISTENT", "METHODICAL"],
    traits: {
      issuesFocus: ["Civic Participation", "Education", "Local Government"],
      newsConsumption: "Moderate",
      socialMedia: "Low",
      emotionalState: "Steady",
    },
    minimumVotingIntent: true,
  },

  passionateActivist: {
    title: "The Passionate Activist",
    description: "Energetically working for political and social change",
    profile:
      "You're deeply committed to creating change and use multiple channels to advocate for causes you believe in.",
    detail:
      "You're dedicated to making a difference, especially on issues like climate change and social justice. You see voting as one of many ways to create change, alongside activism and community involvement.",
    personalityTraits: ["MOTIVATED", "OUTSPOKEN", "RESOLUTE"],
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
      "While you may not fully trust the current political system, you stay informed and think critically about issues. You're interested in finding new ways to improve how democracy works.",
    personalityTraits: ["ANALYTICAL", "DISCERNING", "INDEPENDENT"],
    traits: {
      issuesFocus: ["Government Reform", "Transparency", "Accountability"],
      newsConsumption: "Moderate to High",
      socialMedia: "Moderate",
      emotionalState: "Questioning",
    },
    minimumVotingIntent: false,
  },

  selectiveEngager: {
    title: "The Selective Engager",
    description: "Choosing when and how to engage with politics",
    profile:
      "You take a measured approach to political engagement, focusing your attention on specific issues or moments that matter most to you.",
    detail:
      "Rather than constant political involvement, you choose specific issues and times to engage. You stay aware of major events while maintaining balance with other life priorities.",
    personalityTraits: ["DELIBERATE", "MEASURED", "AUTONOMOUS"],
    traits: {
      issuesFocus: ["Selected Key Issues", "Local Impact"],
      newsConsumption: "Low to Moderate",
      socialMedia: "Low",
      emotionalState: "Balanced",
    },
    minimumVotingIntent: false,
  },

  issuesExpert: {
    title: "The Issues Expert",
    description: "Deeply knowledgeable about political issues and policy",
    profile:
      "You follow politics closely and have well-researched opinions about political issues and policy details.",
    detail:
      "You spend significant time following political news and understanding policy details. You're confident in your political knowledge and enjoy exploring complex political topics.",
    personalityTraits: ["THOROUGH", "STUDIOUS", "PRECISE"],
    traits: {
      issuesFocus: ["Policy Details", "Multiple Issues", "Current Events"],
      newsConsumption: "Very High",
      socialMedia: "High",
      emotionalState: "Engaged",
    },
    minimumVotingIntent: true,
  },

  pragmaticCentrist: {
    title: "The Pragmatic Centrist",
    description: "Finding common ground and practical solutions",
    profile:
      "You prefer finding middle ground and practical solutions rather than sticking to strict party positions.",
    detail:
      "You believe the best solutions often come from combining different viewpoints and focusing on what works rather than ideology. You're interested in bringing people together to solve problems.",
    personalityTraits: ["REASONABLE", "COLLABORATIVE", "ADAPTABLE"],
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

// Updated archetype determination algorithm
export const determineArchetype = (answers) => {
  let scores = Object.keys(archetypes).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  const planToVote = answers[1] === "Yes, I plan on voting";
  const partyAffiliation = answers[7];

  // First filter out archetypes that don't match voting intention
  Object.keys(scores).forEach((key) => {
    if (archetypes[key].minimumVotingIntent && !planToVote) {
      delete scores[key];
    }
  });

  // Filter out incompatible archetypes based on party affiliation
  if (partyAffiliation === "Republican Party") {
    delete scores.concernedProgressive;
    delete scores.passionateActivist;
  } else if (partyAffiliation === "Democratic Party") {
    // Keep progressive archetypes
  } else if (partyAffiliation === "Independent") {
    scores.pragmaticCentrist += 2;
    scores.politicalSkeptic += 1;
  } else if (partyAffiliation === "None") {
    scores.selectiveEngager += 2;
  }

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
          scores.passionateActivist += 3;
          scores.concernedProgressive += 2;
          break;
        case "To support a specific candidate or party":
          scores.issuesExpert += 3;
          break;
        case "To express my opinion on important issues":
          scores.civicMinded += 2;
          scores.pragmaticCentrist += 2;
          break;
      }
    } else {
      scores.selectiveEngager += 2;
      scores.politicalSkeptic += 2;
    }

    // Emotional state
    switch (answers[5]) {
      case "Anxious":
      case "Scared":
        scores.concernedProgressive += 3;
        break;
      case "Frustrated":
        scores.politicalSkeptic += 2;
        break;
      case "Hopeful":
        scores.pragmaticCentrist += 2;
        scores.passionateActivist += 1;
        break;
      case "Indifferent":
        scores.selectiveEngager += 2;
        break;
      case "Excited":
        scores.passionateActivist += 2;
        break;
      case "Confused":
        scores.selectiveEngager += 1;
        scores.politicalSkeptic += 1;
        break;
    }

    // Key issues alignment
    const keyIssue = answers[8];
    if (keyIssue === "Climate change and the environment") {
      scores.passionateActivist += 2;
      scores.concernedProgressive += 2;
    } else if (keyIssue === "Economy and jobs") {
      scores.pragmaticCentrist += 2;
      scores.issuesExpert += 1;
    } else if (
      keyIssue === "Healthcare" ||
      keyIssue === "Abortion and reproductive rights"
    ) {
      scores.concernedProgressive += 2;
    } else if (keyIssue === "Education" || keyIssue === "Local Government") {
      scores.civicMinded += 2;
    } else if (keyIssue === "Racial and ethnic inequality") {
      scores.passionateActivist += 2;
    }

    // News consumption (answers[9])
    if (answers[9] === "10+") {
      scores.issuesExpert += 3;
      scores.concernedProgressive += 1;
    } else if (answers[9] === "0-1") {
      scores.selectiveEngager += 2;
    } else if (answers[9] === "1-3") {
      scores.pragmaticCentrist += 1;
      scores.selectiveEngager += 1;
    } else if (answers[9] === "5-10") {
      scores.passionateActivist += 1;
      scores.issuesExpert += 1;
    }

    // Social media political content (answers[10])
    if (answers[10] === "76-100%" || answers[10] === "51-75%") {
      scores.passionateActivist += 2;
      scores.issuesExpert += 1;
      scores.concernedProgressive += 1;
    } else if (answers[10] === "0-25%") {
      scores.selectiveEngager += 2;
      scores.civicMinded += 1;
    } else if (answers[10] === "26-50%") {
      scores.pragmaticCentrist += 1;
    }

    // Age-based adjustments (more subtle now)
    const age = answers[6];
    if (age === "18-24" || age === "25-34") {
      scores.passionateActivist += 1;
    } else if (age === "65 and older") {
      scores.civicMinded += 1;
    }
  }

  // If no valid archetypes remain, default to pragmaticCentrist
  if (Object.keys(scores).length === 0) {
    return "pragmaticCentrist";
  }

  // Return the archetype with the highest score
  return Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
};
