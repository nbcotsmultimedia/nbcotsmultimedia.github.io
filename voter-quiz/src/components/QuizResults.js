// src/components/QuizResults.js
import React from "react";
import { ProgressBar } from "./ProgressComponents";
import EmblemRenderer from "./EmblemRenderer";
import ActionButtons from "./ActionButtons";
import { determineArchetype, archetypes } from "./archetypeData";

const ResponseCategories = ({ responseText }) => (
  <div className="response-categories">
    {Object.entries({
      "VOTING INTENTION": responseText.votingIntention,
      MOTIVATION: responseText.motivation,
      "KEY POLICY ISSUE": responseText.keyIssue,
      FEELING: responseText.feeling,
    }).map(([title, response]) => (
      <div key={title} className="category">
        <h3>{title}</h3>
        <p className="category-response">{response}</p>
      </div>
    ))}
  </div>
);

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
    <>
      <ProgressBar
        visibleQuestions={visibleQuestions}
        currentQuestionIndex={currentQuestionIndex}
        showTitle={false} // Hide the title in results
      />

      <div className="voter-emblem-container">
        <EmblemRenderer answers={answers} newsHours={answers[9]} />
      </div>

      <div className="profile-section">
        <p className="profile-tag">You are</p>
        <h2 className="profile-title">
          {archetype?.title || "Archetype Title"}
        </h2>
        <p className="profile-text">{archetype?.profile || "Profile text"}</p>
        <p className="profile-detail">{archetype?.detail || "Detail text"}</p>
      </div>

      <ResponseCategories responseText={responseText} />

      <ActionButtons
        onShare={() => {
          /* Share logic here */
        }}
        onRetake={onRetake}
      />
    </>
  );
};

export default QuizResults;
