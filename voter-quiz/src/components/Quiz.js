// #region - Imports

// Import the core React library and useState, a React function that lets us create variables that can change (called "state"), from React
// The curly braces are used to get a specific function from React
import React, { useState } from "react";
// Tell React to load the CSS file 'Quiz.css' in the current directory (./)
import "./Quiz.css";
// Import emblem component
import VoterEmblem from "./VoterEmblem";

// #endregion

// #region - Functions

function Quiz() {
  // Create an array of all the quiz questions
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

  // Creates  variable called currentQuestionIndex that starts with value 0
  // Create a function called setCurrentQuestionIndex that we use to update it
  // Tell React to watch this value for changes
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Store all the user's responses in an object -- { 1: "Yes, I plan on voting", 2: "Yes, I voted" }
  const [answers, setAnswers] = useState({});

  // Add a new state for tracking quiz completion
  const [isCompleted, setIsCompleted] = useState(false);

  // Function to get visible questions based on answers
  const getVisibleQuestions = () => {
    return questions.filter((question) => {
      // If question has no conditions, always show it
      if (!question.showIf) return true;
      // Otherwise, check if it should be shown based on previous answers
      return question.showIf(answers);
    });
  };

  // Add ability to go back to previous question
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // This function runs whenever a user clicks an answer button
  // Update handle option click to check for completion
  const handleOptionClick = (option) => {
    const visibleQuestions = getVisibleQuestions();
    // Get the current question object we're dealing with
    const currentQuestion = questions[currentQuestionIndex];

    // 1. Update answers state (save the user's answer)
    setAnswers((prevAnswers) => ({
      ...prevAnswers, // Keep all existing answers
      [currentQuestion.id]: option, // Add new answer
    }));

    // Wait a short time (for animation and user to see their selection), then move to the next question

    // 2. Update question index state
    setTimeout(() => {
      // Check if there are more questions
      if (currentQuestionIndex < visibleQuestions.length - 1) {
        // If yes, go to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Quiz is complete!
        setIsCompleted(true);
      }
    }, 300); // 300 milliseconds = 0.3 seconds
  };

  // Add function to restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsCompleted(false);
  };

  const visibleQuestions = getVisibleQuestions();
  // Get the current question object from our questions array -- to display current question and options
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  // Calculate what percentage of questions have been answered -- to update progress bar
  // Updated progress calculation to work with conditional questions
  const progress = (currentQuestionIndex / visibleQuestions.length) * 100;

  return (
    // Main container for the entire quiz
    <div className="quiz-container">
      {/* Conditional rendering: show quiz UI if not completed, otherwise show results */}
      {!isCompleted ? (
        // Fragment (<>) used to group multiple elements without adding extra DOM node
        <>
          {/* Progress bar section */}
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Navigation and question counter */}
          <div className="quiz-header">
            {/* Only show back button if we're not on the first question */}
            {currentQuestionIndex > 0 && (
              <button
                className="back-button"
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex - 1)
                }
              >
                ← Back
              </button>
            )}
            <div className="question-counter">
              Question {currentQuestionIndex + 1} of {visibleQuestions.length}
            </div>
          </div>

          {/* Current question text */}
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
      ) : (
        // Results page shown when quiz is completed
        <div className="results-page">
          {/* Results page title */}
          <h2 className="results-title">Your Voter Profile</h2>

          {/* Voter emblem visualization */}
          <div className="voter-emblem-container">
            <VoterEmblem answers={answers} />
          </div>

          {/* Summary of all answers */}
          <div className="results-summary">
            <h3>Your Responses:</h3>
            {/* Map through all answers to display them */}
            {Object.entries(answers).map(([questionId, answer]) => {
              // Find the question text for this answer
              const question = questions.find(
                (q) => q.id === parseInt(questionId)
              );
              return (
                <div key={questionId} className="response-item">
                  <p className="question-text">{question.text}</p>
                  <p className="answer-text">{answer}</p>
                </div>
              );
            })}
          </div>

          {/* Button to restart quiz */}
          <button className="restart-button" onClick={handleRestartQuiz}>
            Take Quiz Again
          </button>
        </div>
      )}
    </div>
  );
}

// #endregion

// #region - Exports

// Make our Quiz component available to other files
export default Quiz;

// #endregion
