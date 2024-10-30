import React, { useState, useEffect } from "react";
import "./Quiz.css";
import { ProgressBar } from "./ProgressComponents";
import ProgressiveEmblem from "./ProgressiveEmblem";
import IntentionSelection from "./IntentionSelection";
import QuizResults from "./QuizResults";
import { QUESTIONS } from "./QuizConstants";

const QuestionDisplay = ({ currentQuestion, onOptionClick, answers }) => (
  <>
    <h2 className="question">{currentQuestion.text}</h2>
    <div className="options">
      {currentQuestion.options.map((option, index) => (
        <button
          key={index}
          className={`option-button ${
            answers[currentQuestion.id] === option ? "selected" : ""
          }`}
          onClick={() => onOptionClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  </>
);

function Quiz() {
  const [state, setState] = useState({
    currentQuestionIndex: 0,
    answers: {},
    isCompleted: false,
  });

  const { currentQuestionIndex, answers, isCompleted } = state;

  // Initialize Pym
  useEffect(() => {
    window.pymChild = new window.pym.Child({ polling: 500 });
    return () => {
      window.pymChild.remove();
    };
  }, []);

  // Update height on state changes
  useEffect(() => {
    if (window.pymChild) {
      window.pymChild.sendHeight();
    }
  }, [currentQuestionIndex, answers, isCompleted]);

  const updateState = (newState) => {
    setState((prevState) => ({
      ...prevState,
      ...newState,
    }));
    // Send height after state update
    requestAnimationFrame(() => {
      if (window.pymChild) {
        window.pymChild.sendHeight();
      }
    });
  };

  const getVisibleQuestions = () => {
    return QUESTIONS.filter(
      (question) => !question.showIf || question.showIf(answers)
    );
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      updateState({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  };

  const handleOptionClick = (option) => {
    const visibleQuestions = getVisibleQuestions();
    const currentQuestion = visibleQuestions[currentQuestionIndex];
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: option,
    };
    const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

    setTimeout(() => {
      updateState({
        answers: newAnswers,
        currentQuestionIndex: isLastQuestion
          ? currentQuestionIndex
          : currentQuestionIndex + 1,
        isCompleted: isLastQuestion,
      });
    }, 300);
  };

  const handleRestartQuiz = () => {
    updateState({
      currentQuestionIndex: 0,
      answers: {},
      isCompleted: false,
    });
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentQuestionIndex];

  if (isCompleted) {
    return (
      <div className="quiz-container">
        <QuizResults
          answers={answers}
          visibleQuestions={visibleQuestions}
          currentQuestionIndex={currentQuestionIndex}
          onRetake={handleRestartQuiz}
        />
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <ProgressBar
        visibleQuestions={visibleQuestions}
        currentQuestionIndex={currentQuestionIndex}
        onNavigate={(index) => updateState({ currentQuestionIndex: index })}
      />

      <div className="emblem-visualization">
        {[1, 2].includes(currentQuestion.id) ? (
          <IntentionSelection
            currentQuestion={currentQuestion.id}
            selectedAnswer={answers[1]}
          />
        ) : (
          <ProgressiveEmblem
            answers={answers}
            currentQuestionId={currentQuestion.id}
            newsHours={answers[9]}
          />
        )}
      </div>

      <QuestionDisplay
        currentQuestion={currentQuestion}
        onOptionClick={handleOptionClick}
        answers={answers}
      />
    </div>
  );
}

export default Quiz;
