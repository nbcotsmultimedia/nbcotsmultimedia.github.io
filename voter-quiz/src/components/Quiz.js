// src/components/Quiz.js

import React, { useState } from "react";
import "./Quiz.css";
import EmblemRenderer from "./EmblemRenderer";
import ProgressiveEmblem from "./ProgressiveEmblem";
import ArchetypeResult from "./ArchetypeResult";
import { determineArchetype, archetypes } from "./archetypeData";
import IntentionSelection from "./IntentionSelection";
import ActionButtons from "./ActionButtons";
import { QUESTIONS } from "./QuizConstants"; // Move questions to constants

function Quiz() {
  // Quiz questions configuration - defines all possible questions and their conditions
  const questions = [
    {
      id: 1,
      text: "Are you planning to vote in the upcoming election?",
      description:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
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
      id: 8,
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
      id: 9,
      text: "How many hours per week do you spend following election news?",
      options: ["0-1", "1-3", "3-5", "5-10", "10+"],
    },
    {
      id: 10,
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
    const currentVisibleQuestion = visibleQuestions[currentQuestionIndex];

    // Store answer using the actual question ID
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentVisibleQuestion.id]: option, // Use the question's ID directly
    }));

    // Debug logging (optional, can be removed)
    console.log("Question ID:", currentVisibleQuestion.id);
    console.log("Selected option:", option);

    // Move to next question or complete quiz
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 300);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
      }, 300);
    }
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
          <div className="progress-dots">
            {visibleQuestions.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${
                  index <= currentQuestionIndex ? "active" : ""
                }`}
              />
            ))}
          </div>
        </div>
        <div className="progress-title">
          Question {currentQuestionIndex + 1} of {visibleQuestions.length}
        </div>
      </div>

      {/* Navigation and question counter */}
      <div className="quiz-header">
        {currentQuestionIndex > 0 && (
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
        )}
      </div>

      {/* Progressive Emblem Visualization */}
      <div className="emblem-visualization w-full flex justify-center items-center">
        {currentQuestion.id === 1 || currentQuestion.id === 2 ? (
          <IntentionSelection
            currentQuestion={currentQuestion.id}
            selectedAnswer={answers[1]}
          />
        ) : (
          <ProgressiveEmblem
            answers={answers}
            currentQuestionId={currentQuestion.id}
            newsHours={answers[9]} // This is correct - using question 9 for news hours
          />
        )}
      </div>

      {/* Question text and description */}
      <h2 className="question">{currentQuestion.text}</h2>
      {currentQuestion.description && (
        <p className="question-description">{currentQuestion.description}</p>
      )}

      {/* Answer options with fixed selection logic */}
      <div className="options">
        {currentQuestion.options.map((option, index) => {
          const isSelected = answers[currentQuestion.id] === option; // Use question.id instead of index

          return (
            <button
              key={index}
              className={`option-button ${isSelected ? "selected" : ""}`}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </>
  );

  // Results page
  const renderResults = () => {
    const archetypeKey = determineArchetype(answers);
    const archetype = archetypes[archetypeKey];

    // Debug logging
    console.log("All answers:", answers);
    console.log("Archetype:", archetypeKey, archetype);

    // Use answers[9] for news hours, NOT answers[10]
    const newsHoursValue = answers[9] || "0-1"; // Changed from answers[10]
    console.log("News hours value:", newsHoursValue);

    const getResponseText = () => {
      const responseText = {
        votingIntention: answers[1] || "Not specified",
        motivation: answers[2] || answers[3] || "Not specified",
        keyIssue: answers[8] || "Not specified",
        feeling: answers[5] || "Not specified",
      };

      return responseText;
    };

    const responseText = getResponseText();

    return (
      <div className="results-page">
        {/* Progress bar */}
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
            <div className="progress-dots">
              {visibleQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`progress-dot ${
                    index <= currentQuestionIndex ? "active" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="voter-emblem-container">
          <EmblemRenderer
            answers={answers}
            newsHours={answers[9]} // Pass the formatted news hours value
          />
        </div>

        <div className="profile-section">
          <p className="profile-tag">You are</p>
          <h2 className="profile-title">
            {archetype?.title || "Archetype Title"}
          </h2>
          <p className="profile-text">{archetype?.profile || "Profile text"}</p>
          <p className="profile-detail">{archetype?.detail || "Detail text"}</p>
        </div>

        {/* Response categories */}
        <div className="response-categories">
          <div className="category">
            <h3>VOTING INTENTION</h3>
            <p className="category-response">{responseText.votingIntention}</p>
          </div>
          <div className="category">
            <h3>MOTIVATION</h3>
            <p className="category-response">{responseText.motivation}</p>
          </div>
          <div className="category">
            <h3>KEY POLICY ISSUE</h3>
            <p className="category-response">{responseText.keyIssue}</p>
          </div>
          <div className="category">
            <h3>FEELING</h3>
            <p className="category-response">{responseText.feeling}</p>
          </div>
        </div>

        {/* Action buttons */}
        <ActionButtons
          onShare={() => {
            // Your share logic here
          }}
          onRetake={handleRestartQuiz}
        />
      </div>
    );
  };

  // Main render
  return (
    <div className="quiz-container">
      {!isCompleted ? renderQuiz() : renderResults()}
    </div>
  );
}

export default Quiz;
