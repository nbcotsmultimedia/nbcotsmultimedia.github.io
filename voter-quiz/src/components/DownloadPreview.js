import React, { useState } from "react";
import DownloadResults from "./DownloadResults";
import EmblemRenderer from "./EmblemRenderer";
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

const SpacingControl = ({ label, value, onChange, min = 0, max = 200 }) => (
  <div className="flex items-center gap-2 mb-2">
    <label className="w-32 text-sm">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-32"
    />
    <span className="w-12 text-sm">{value}px</span>
  </div>
);

const DebugDownloadResults = () => {
  const [showGrid, setShowGrid] = useState(false);
  const [spacing, setSpacing] = useState({
    containerPadding: 64,
    headerMargin: 64,
    categoryGap: 64,
    iconSize: 100,
  });

  const [testData, setTestData] = useState(generateRandomCombination());

  const generateNew = () => {
    setTestData(generateRandomCombination());
  };

  const handleArchetypeChange = (archetypeKey) => {
    setTestData((prev) => ({
      ...prev,
      archetype: archetypes[archetypeKey],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg w-96 z-50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Debug Controls</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded ${
                showGrid ? "bg-blue-100" : "bg-gray-100"
              }`}
              title="Toggle Grid"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={generateNew}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Generate Random Combination
          </button>

          <div>
            <h4 className="font-semibold mb-2">Select Archetype</h4>
            <select
              className="w-full p-2 border rounded"
              value={Object.keys(archetypes).find(
                (key) => archetypes[key].title === testData.archetype.title
              )}
              onChange={(e) => handleArchetypeChange(e.target.value)}
            >
              {Object.entries(archetypes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Test Answers</h4>
            <div className="space-y-2">
              <select
                className="w-full p-2 border rounded text-sm"
                value={testData.answers[1] || ""}
                onChange={(e) =>
                  setTestData((d) => ({
                    ...d,
                    answers: { ...d.answers, 1: e.target.value },
                  }))
                }
              >
                <option value="">Select Voting Intention</option>
                {TEST_DATA.votingIntentions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-2 border rounded text-sm"
                value={testData.answers[5] || ""}
                onChange={(e) =>
                  setTestData((d) => ({
                    ...d,
                    answers: { ...d.answers, 5: e.target.value },
                  }))
                }
              >
                <option value="">Select Feeling</option>
                {TEST_DATA.feelings.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-2 border rounded text-sm"
                value={testData.answers[8] || ""}
                onChange={(e) =>
                  setTestData((d) => ({
                    ...d,
                    answers: { ...d.answers, 8: e.target.value },
                  }))
                }
              >
                <option value="">Select Policy Issue</option>
                {TEST_DATA.issues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-2 border rounded text-sm"
                value={testData.answers[9] || ""}
                onChange={(e) =>
                  setTestData((d) => ({
                    ...d,
                    answers: { ...d.answers, 9: e.target.value },
                  }))
                }
              >
                <option value="">Select News Hours</option>
                {TEST_DATA.newsHours.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm bg-gray-50 p-2 rounded">
            <div className="font-semibold mb-1">Current Combination:</div>
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>

          <div className="text-sm bg-gray-50 p-2 rounded">
            <div className="font-semibold mb-1">Pattern Debug:</div>
            <div>Selected Issue: {testData.answers[8]}</div>
            <div>
              Has Pattern:{" "}
              {getPattern("issue", testData.answers[8]) ? "Yes" : "No"}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Spacing</h4>
            <SpacingControl
              label="Container Padding"
              value={spacing.containerPadding}
              onChange={(val) =>
                setSpacing((s) => ({ ...s, containerPadding: val }))
              }
            />
            <SpacingControl
              label="Header Margin"
              value={spacing.headerMargin}
              onChange={(val) =>
                setSpacing((s) => ({ ...s, headerMargin: val }))
              }
            />
            <SpacingControl
              label="Category Gap"
              value={spacing.categoryGap}
              onChange={(val) =>
                setSpacing((s) => ({ ...s, categoryGap: val }))
              }
            />
            <SpacingControl
              label="Icon Size"
              value={spacing.iconSize}
              onChange={(val) => setSpacing((s) => ({ ...s, iconSize: val }))}
            />
          </div>
        </div>
      </div>

      <div className="relative">
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-12 gap-4">
              {Array(12)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-full border border-blue-200 bg-blue-50/20"
                  />
                ))}
            </div>
          </div>
        )}

        <div
          className="download-container"
          style={{
            "--container-padding": `${spacing.containerPadding}px`,
            "--header-margin": `${spacing.headerMargin}px`,
            "--category-gap": `${spacing.categoryGap}px`,
            "--icon-size": `${spacing.iconSize}px`,
            padding: spacing.containerPadding,
          }}
        >
          <DownloadResults
            archetype={testData.archetype}
            answers={testData.answers}
          />
        </div>
      </div>
    </div>
  );
};

export default DebugDownloadResults;
