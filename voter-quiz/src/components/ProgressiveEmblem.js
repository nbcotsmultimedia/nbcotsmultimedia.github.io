// src/components/ProgressiveEmblem.js
import React from "react";
import EmblemRenderer from "./EmblemRenderer";

function ProgressiveEmblem({ answers, currentQuestion }) {
  // Determine the news hours based on the current question
  const newsHours = currentQuestion >= 10 ? answers[9] : null;

  return (
    <div className="progressive-emblem">
      <EmblemRenderer
        answers={answers}
        progressive={true}
        currentQuestion={currentQuestion}
        newsHours={newsHours}
      />
    </div>
  );
}

export default ProgressiveEmblem;
