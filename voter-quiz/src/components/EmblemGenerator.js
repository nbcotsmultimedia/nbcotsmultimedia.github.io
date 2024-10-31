// src/components/EmblemGenerator.js
import React, { useState } from "react";
import {
  INTENTION_CHOICES,
  MOTIVATION_CHOICES,
  FEELING_CHOICES,
  KEY_ISSUE_CHOICES,
} from "./QuizConstants";
import EmblemRenderer from "./EmblemRenderer";

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateRandomAnswers = () => {
  const votingIntention = getRandomItem(Object.values(INTENTION_CHOICES));

  const motivationChoices =
    votingIntention === INTENTION_CHOICES.YES
      ? [
          MOTIVATION_CHOICES.OPINION,
          MOTIVATION_CHOICES.SUPPORT_CANDIDATE,
          MOTIVATION_CHOICES.CIVIC_DUTY,
          MOTIVATION_CHOICES.COMMUNITY_CHANGE,
        ]
      : [
          MOTIVATION_CHOICES.DISLIKE_CANDIDATES,
          MOTIVATION_CHOICES.NOT_INTERESTED,
          MOTIVATION_CHOICES.WONT_MATTER,
          MOTIVATION_CHOICES.CANT_VOTE,
        ];

  return {
    1: votingIntention,
    2:
      votingIntention === INTENTION_CHOICES.YES
        ? getRandomItem(motivationChoices)
        : null,
    3:
      votingIntention !== INTENTION_CHOICES.YES
        ? getRandomItem(motivationChoices)
        : null,
    4: getRandomItem([
      "Yes, I voted",
      "No, I was eligible but did not vote",
      "No, I was not eligible to vote at the time",
    ]),
    5: getRandomItem(Object.values(FEELING_CHOICES)),
    6: getRandomItem([
      "18-24",
      "25-34",
      "35-44",
      "45-54",
      "55-64",
      "65 and older",
    ]),
    7: getRandomItem([
      "Democratic Party",
      "Republican Party",
      "Independent",
      "None",
      "Other",
    ]),
    8: getRandomItem(Object.values(KEY_ISSUE_CHOICES)),
    9: getRandomItem(["0-1", "1-3", "3-5", "5-10", "10+"]),
    10: getRandomItem(["0-25%", "26-50%", "51-75%", "76-100%"]),
  };
};

const downloadSVG = (svgElement, index) => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `voting-emblem-${index}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const EmblemGenerator = () => {
  const [emblems, setEmblems] = useState([]);

  const generateEmblems = (count) => {
    const newEmblems = Array(count)
      .fill(null)
      .map(() => generateRandomAnswers());
    setEmblems(newEmblems);
  };

  const downloadAllEmblems = () => {
    const svgElements = document.querySelectorAll(".emblem-container svg");
    svgElements.forEach((svg, index) => {
      downloadSVG(svg, index + 1);
    });
  };

  return (
    <div className="p-4">
      <div className="mb-4 space-x-4">
        <button
          onClick={() => generateEmblems(20)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generate 20 Random Emblems
        </button>
        {emblems.length > 0 && (
          <button
            onClick={downloadAllEmblems}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Download All SVGs
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {emblems.map((answers, index) => (
          <div key={index} className="emblem-container border p-4 rounded">
            <EmblemRenderer
              answers={answers}
              progressive={false}
              currentQuestion={10}
              newsHours={answers[9]}
            />
            <div className="mt-2 text-sm">
              <p>Voting: {answers[1]}</p>
              <p>Feeling: {answers[5]}</p>
              <p>Key Issue: {answers[8]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmblemGenerator;
