// src/components/Quiz.js

import React, { useState } from "react";
import "./Quiz.css";
import VoterEmblem from "./VoterEmblem";

function Quiz() {
  // Quiz questions configuration - defines all possible questions and their conditions
  const questions = [
    {
      id: 1,
      text: "Are you planning to vote in the upcoming election?",
      options: [
        "Yes, I plan on voting",
        "No, I do not plan on voting",
        "I am unsure",
      ],
    },
    {
      id: 2,
      text: "What is your main reason for voting?",
      options: [
        "To express my opinion on important issues",
        "To support a specific candidate or party",
        "To fulfill my civic duty",
        "To influence change in my community",
      ],
      // This question only appears if they answered "Yes, I plan on voting"
      showIf: (answers) => answers[1] === "Yes, I plan on voting",
    },
    {
      id: 3,
      text: "What's holding you back from voting in this election?",
      options: [
        "I don't think any of the candidates will make a good president",
        "I'm just not interested in politics",
        "I don't feel my vote will make a difference",
        "Personal circumstances prevent me from voting (work, health, transportation)",
        "I'm not registered to vote",
        "I'm not eligible to vote",
      ],
      // This question only appears if they answered "No" or "Unsure"
      showIf: (answers) =>
        ["No, I do not plan on voting", "I am unsure"].includes(answers[1]),
    },
    {
      id: 4,
      text: "Did you vote in the last presidential election?",
      options: [
        "Yes, I voted",
        "No, I was eligible but did not vote",
        "No, I was not eligible to vote at the time",
      ],
    },
    {
      id: 5,
      text: "Which word best describes your overall feeling about the upcoming election?",
      options: [
        "Hopeful",
        "Excited",
        "Anxious",
        "Frustrated",
        "Indifferent",
        "Confused",
        "Scared",
      ],
    },
    {
      id: 6,
      text: "What is your age?",
      options: [
        "Under 18",
        "18-24",
        "25-34",
        "35-44",
        "45-54",
        "55-64",
        "65 and older",
      ],
    },
    {
      id: 7,
      text: "What gender most accurately describes you?",
      options: ["Man", "Woman", "Non-binary", "Other/I prefer not to say"],
    },
    {
      id: 8,
      text: "Which political party do you identify with, if any?",
      options: [
        "Democratic Party",
        "Republican Party",
        "Independent",
        "None",
        "Other",
      ],
    },
    {
      id: 9,
      text: "Which of these issues is most important to you?",
      options: [
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
    },
    {
      id: 10,
      text: "How many hours per week do you spend following election news?",
      options: ["0-1", "1-3", "3-5", "5-10", "10+"],
    },
    {
      id: 11,
      text: "What percentage of your social media feed is related to politics?",
      options: ["0-25%", "26-50%", "51-75%", "76-100%"],
    },
  ];

  // State management - track quiz progress and user responses
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Helper function to get questions that should be visible based on previous answers
  const getVisibleQuestions = () => {
    return questions.filter((question) => {
      if (!question.showIf) return true;
      return question.showIf(answers);
    });
  };

  // Navigation handlers
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleOptionClick = (option) => {
    const visibleQuestions = getVisibleQuestions();
    const currentQuestion = questions[currentQuestionIndex];

    // Save the user's answer
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentQuestion.id]: option,
    }));

    // Add small delay for animation and user feedback
    setTimeout(() => {
      if (currentQuestionIndex < visibleQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setIsCompleted(true);
      }
    }, 300);
  };

  // Add function to restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsCompleted(false);
  };

  // Compute derived values
  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const progress = (currentQuestionIndex / visibleQuestions.length) * 100;

  // Render functions for different quiz states
  const renderQuiz = () => (
    <>
      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Navigation and question counter */}
      <div className="quiz-header">
        {currentQuestionIndex > 0 && (
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
        )}
        <div className="question-counter">
          Question {currentQuestionIndex + 1} of {visibleQuestions.length}
        </div>
      </div>

      {/* Question text */}
      <h2 className="question">{currentQuestion.text}</h2>

      {/* Answer options */}
      <div className="options">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            className={`option-button ${
              answers[currentQuestion.id] === option ? "selected" : ""
            }`}
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </>
  );

  const renderResults = () => (
    <div className="results-page">
      <h2 className="results-title">Your Voter Profile</h2>

      {/* Voter emblem visualization */}
      <div className="voter-emblem-container">
        <VoterEmblem answers={answers} />
      </div>

      {/* Answer summary */}
      <div className="results-summary">
        <h3>Your Responses:</h3>
        {Object.entries(answers).map(([questionId, answer]) => {
          const question = questions.find((q) => q.id === parseInt(questionId));
          return (
            <div key={questionId} className="response-item">
              <p className="question-text">{question.text}</p>
              <p className="answer-text">{answer}</p>
            </div>
          );
        })}
      </div>

      <button className="restart-button" onClick={handleRestartQuiz}>
        Take Quiz Again
      </button>
    </div>
  );

  // Main render
  return (
    <div className="quiz-container">
      {!isCompleted ? renderQuiz() : renderResults()}
    </div>
  );
}

export default Quiz;
