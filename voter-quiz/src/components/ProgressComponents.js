// src/components/ProgressComponents.js
import React from "react";

export const ProgressDots = ({ count, activeIndex }) => (
  <div className="progress-dots">
    {[...Array(count)].map((_, index) => (
      <div
        key={index}
        className={`progress-dot ${index <= activeIndex ? "active" : ""}`}
      />
    ))}
  </div>
);

// ProgressBar component
export const ProgressBar = ({
  visibleQuestions,
  currentQuestionIndex,
  showTitle = true,
}) => (
  <div className="progress-track">
    <div className="progress-container">
      <div className="progress-line-bg" />
      <div
        className="progress-line-fill"
        style={{
          width: `${
            (currentQuestionIndex / (visibleQuestions.length - 1)) * 100
          }%`,
        }}
      />
      <ProgressDots
        count={visibleQuestions.length}
        activeIndex={currentQuestionIndex}
      />
    </div>
    {showTitle && (
      <div className="progress-title">
        Question {currentQuestionIndex + 1} of {visibleQuestions.length}
      </div>
    )}
  </div>
);
