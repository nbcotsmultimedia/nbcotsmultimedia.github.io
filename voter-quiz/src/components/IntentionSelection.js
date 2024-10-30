import React from "react";
import EmblemRenderer from "./EmblemRenderer";
import { INTENTION_CHOICES } from "./QuizConstants";

const IntentionSelection = ({ currentQuestion, selectedAnswer }) => {
  const intentions = [
    INTENTION_CHOICES.YES,
    INTENTION_CHOICES.NO,
    INTENTION_CHOICES.UNSURE,
  ];

  // If we're on question 2, only show the selected intention
  const displayIntentions =
    currentQuestion === 2
      ? intentions.filter((intention) => intention === selectedAnswer)
      : intentions;

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div
        className={`w-full flex ${
          currentQuestion === 2 ? "justify-center" : "justify-between"
        }`}
      >
        {displayIntentions.map((intention) => (
          <div
            key={intention}
            className="aspect-square transition-all duration-500 opacity-50"
          >
            <EmblemRenderer
              answers={{ 1: intention }}
              progressive={true}
              currentQuestion={currentQuestion}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntentionSelection;
