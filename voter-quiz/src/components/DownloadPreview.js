import React from "react";
import DownloadResults from "./DownloadResults";
import { getPattern, getFeelingColors, PATTERNS_MAP } from "./EmblemPatterns";
import { archetypes } from "./archetypeData";

const TEST_DATA = {
  votingIntentions: [
    "Yes, I plan on voting",
    "No, I do not plan on voting",
    "I am unsure",
  ],
  votingMotivations: {
    voting: [
      "To express my opinion on important issues",
      "To support a specific candidate or party",
      "To fulfill my civic duty",
      "To influence change in my community",
    ],
    nonVoting: [
      "I don't feel my vote will make a difference",
      "I am unable to vote due to personal circumstances",
      "I'm not registered to vote",
      "I'm just not interested in politics",
      "I don't think any of the candidates will make a good president",
      "I'm not eligible to vote",
    ],
  },
  feelings: [
    "Anxious",
    "Scared",
    "Frustrated",
    "Hopeful",
    "Excited",
    "Indifferent",
  ],
  ages: ["18-24", "25-34", "35-44", "45-54", "55-64", "65 and older"],
  partyAffiliation: [
    "Democratic Party",
    "Republican Party",
    "Independent",
    "None",
  ],
  issues: [
    "Economy and jobs",
    "Healthcare",
    "Climate change and the environment",
    "Immigration",
    "Education",
    "National security and foreign policy",
    "Gun policy",
    "Abortion and reproductive rights",
    "Racial and ethnic inequality",
    "Crime and criminal justice",
  ],
  newsHours: ["0-1", "1-3", "3-5", "5-10", "10+"],
  socialMediaPercent: ["0-25%", "26-50%", "51-75%", "76-100%"],
};

const generateRandomCombination = () => {
  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const archetypeKeys = Object.keys(archetypes);
  const randomArchetypeKey = randomFrom(archetypeKeys);
  const selectedArchetype = archetypes[randomArchetypeKey];

  const votingIntention = randomFrom(TEST_DATA.votingIntentions);
  const motivations =
    votingIntention === "Yes, I plan on voting"
      ? TEST_DATA.votingMotivations.voting
      : TEST_DATA.votingMotivations.nonVoting;

  return {
    archetype: selectedArchetype,
    answers: {
      1: votingIntention,
      2:
        votingIntention === "Yes, I plan on voting"
          ? randomFrom(motivations)
          : null,
      3:
        votingIntention !== "Yes, I plan on voting"
          ? randomFrom(motivations)
          : null,
      5: randomFrom(TEST_DATA.feelings),
      6: randomFrom(TEST_DATA.ages),
      8: randomFrom(TEST_DATA.issues),
      9: randomFrom(TEST_DATA.newsHours),
      10: randomFrom(TEST_DATA.newsHours),
      11: randomFrom(TEST_DATA.socialMediaPercent),
    },
  };
};

const DownloadPreview = () => {
  const testData = generateRandomCombination();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="download-container" style={{ padding: "64px" }}>
        <DownloadResults
          archetype={testData.archetype}
          answers={testData.answers}
        />
      </div>
    </div>
  );
};

export default DownloadPreview;
