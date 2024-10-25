import React from "react";
import EmblemRenderer from "./EmblemRenderer";

const ProgressiveEmblem = ({ answers, currentQuestionId, newsHours }) => {
  const QUESTION_ORDER = {
    1: 1, // Voting intention
    2: 2, // Voting motivation (Yes)
    3: 2, // Voting motivation (No/Unsure)
    4: 3, // Past voting
    5: 4, // Feeling
    6: 5, // Age
    7: 6, // Party
    8: 7, // Key issue
    9: 8, // News hours
    10: 9, // Social media
  };

  return (
    <div className="progressive-emblem">
      <EmblemRenderer
        answers={answers}
        progressive={true}
        currentQuestion={QUESTION_ORDER[currentQuestionId] || 1}
        newsHours={answers[9]}
      />
    </div>
  );
};

export default ProgressiveEmblem;
