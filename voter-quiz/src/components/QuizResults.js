// QuizResults.js

import React from "react";
import { ProgressBar } from "./ProgressComponents";
import EmblemRenderer from "./EmblemRenderer";
import ActionButtons from "./ActionButtons";
import ShareButton from "./ShareButton";
import { determineArchetype, archetypes } from "./archetypeData";
import { getPattern, getFeelingColors } from "./EmblemPatterns";

const PatternDisplay = ({ type, pattern, colors, transform }) => (
  <div className="h-16 flex items-center justify-center">
    <div className="w-16 h-16">
      <svg viewBox="0 0 100 100">
        <g transform="translate(50,50)">
          <g transform={transform}>
            {pattern && (
              <>
                <path d={pattern.bd} fill={colors[0]} opacity={0.9} />
                <path d={pattern.be} fill={colors[1]} opacity={0.9} />
              </>
            )}
          </g>
        </g>
      </svg>
    </div>
  </div>
);

const ColorSchemeDisplay = ({ colors }) => (
  <div className="h-16 flex items-center justify-center">
    <div className="relative w-12 h-6">
      <div
        className="absolute w-6 h-6 rounded-full left-0"
        style={{ backgroundColor: colors[0] }}
      />
      <div
        className="absolute w-6 h-6 rounded-full left-4"
        style={{ backgroundColor: colors[1] }}
      />
    </div>
  </div>
);

const ResponseCategories = ({ responseText, answers }) => {
  const colorScheme = getFeelingColors(answers[5] || "Indifferent");

  return (
    // Two-Column Grid
    <div className="grid grid-cols-2 gap-6">
      {" "}
      {/* Intention */}
      <div className="category flex flex-col items-center">
        <PatternDisplay
          type="intention"
          pattern={answers[1] ? getPattern("intention", answers[1]) : null}
          colors={[
            colorScheme.votingIntention[0],
            colorScheme.votingIntention[1],
          ]}
          transform="translate(-25,-25) scale(0.5)"
        />
        <h3 className="text-sm font-semibold uppercase mb-2">
          VOTING INTENTION
        </h3>
        <p className="text-center">{responseText.votingIntention}</p>
      </div>
      {/* Motivation */}
      <div className="category flex flex-col items-center">
        <PatternDisplay
          type="motivation"
          pattern={
            answers[2] || answers[3]
              ? getPattern("motivation", answers[2] || answers[3])
              : null
          }
          colors={[
            colorScheme.votingMotivation[0],
            colorScheme.votingMotivation[1],
          ]}
          transform="translate(-25,-25) scale(0.5)"
        />
        <h3 className="text-sm font-semibold uppercase mb-2">MOTIVATION</h3>
        <p className="text-center">{responseText.motivation}</p>
      </div>
      {/* Issue */}
      <div className="category flex flex-col items-center">
        <PatternDisplay
          type="issue"
          pattern={answers[8] ? getPattern("issue", answers[8]) : null}
          colors={[colorScheme.keyIssue[0], colorScheme.keyIssue[1]]}
          transform="translate(-25,-25) scale(0.5)"
        />
        <h3 className="text-sm font-semibold uppercase mb-2">
          KEY POLICY ISSUE
        </h3>
        <p className="text-center">{responseText.keyIssue}</p>
      </div>
      {/* Feeing */}
      <div className="category flex flex-col items-center">
        <ColorSchemeDisplay colors={colorScheme.votingMotivation} />
        <h3 className="text-sm font-semibold uppercase mb-2">FEELING</h3>
        <p className="text-center">{responseText.feeling}</p>
      </div>
    </div>
  );
};

const QuizResults = ({
  answers,
  visibleQuestions,
  currentQuestionIndex,
  onRetake,
}) => {
  const archetypeKey = determineArchetype(answers);
  const archetype = archetypes[archetypeKey];

  const responseText = {
    votingIntention: answers[1] || "Not specified",
    motivation: answers[2] || answers[3] || "Not specified",
    keyIssue: answers[8] || "Not specified",
    feeling: answers[5] || "Not specified",
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Progress Bar */}
      {/* <ProgressBar
        visibleQuestions={visibleQuestions}
        currentQuestionIndex={currentQuestionIndex}
        showTitle={false}
      /> */}

      {/* Emblem */}
      <div className="voter-emblem-container my-8">
        <EmblemRenderer answers={answers} newsHours={answers[9]} />
      </div>

      {/* Profile Details */}
      <div className="profile-section mb-8 text-center">
        <p className="profile-tag">You are</p>
        <h2 className="profile-title text-2xl font-bold my-2">
          {archetype?.title || "Archetype Title"}
        </h2>
        <p className="profile-text">{archetype?.profile || "Profile text"}</p>
      </div>

      {/* Category Grid */}
      <ResponseCategories responseText={responseText} answers={answers} />

      <div className="mt-8 space-y-4">
        {/* Download / Retake Buttons */}
        <ShareButton
          archetype={archetype}
          answers={answers}
          onRetake={onRetake}
        />

        {/* Debug Link */}
        {/* {process.env.NODE_ENV === "development" && (
          <Link
            to="/preview-download"
            className="block text-center p-2 text-blue-600 hover:underline"
          >
            View Download Preview
          </Link>
        )} */}
      </div>
    </div>
  );
};

export default QuizResults;
