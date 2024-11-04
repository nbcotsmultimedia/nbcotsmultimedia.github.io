// src/components/ProgressComponents.js

// Imports
import React from "react";

// Progress Dots
export const ProgressDots = ({
  count,
  activeIndex,
  onDotClick,
  showActive = true,
}) => (
  <div className="progress-dots">
    {[...Array(count)].map((_, index) => (
      <button
        key={index}
        onClick={() => index <= activeIndex && onDotClick?.(index)}
        className={`
          progress-dot 
          ${index <= activeIndex ? "active" : ""} 
          ${showActive && index === activeIndex ? "current" : ""}
          ${index < activeIndex ? "completed" : ""}
          ${
            index <= activeIndex && onDotClick
              ? "cursor-pointer"
              : "cursor-not-allowed"
          }
        `}
        disabled={index > activeIndex || !onDotClick}
        aria-label={`Go to question ${index + 1}`}
      />
    ))}
  </div>
);

// Progress Bar
export const ProgressBar = ({
  visibleQuestions,
  currentQuestionIndex,
  showTitle = true,
  onNavigate,
}) => {
  const handleProgressClick = (e) => {
    if (!onNavigate) return;

    const progressContainer = e.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const clickedPosition = Math.floor((x / width) * visibleQuestions.length);

    // Only allow navigating to completed questions or current question
    if (clickedPosition <= currentQuestionIndex) {
      onNavigate(clickedPosition);
    }
  };

  return (
    <div className="progress-track">
      <div
        className={`progress-container relative ${
          onNavigate ? "cursor-pointer" : ""
        }`}
        onClick={handleProgressClick}
      >
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
          onDotClick={onNavigate}
          showActive={!!onNavigate}
        />
      </div>
      {showTitle && (
        <div className="progress-title">
          Question {currentQuestionIndex + 1} of {visibleQuestions.length}
        </div>
      )}
    </div>
  );
};
