import React from "react";

// Draw Share Icon SVG
const ShareIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.66667 8V13.3333C2.66667 13.687 2.80715 14.0261 3.0572 14.2761C3.30724 14.5262 3.64638 14.6667 4.00001 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.687 13.3333 13.3333V8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.6667 3.99992L7.99999 1.33325L5.33333 3.99992"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 1.33325V9.99992"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Draw Retake Quiz Icon SVG
const RetakeIcon = () => (
  <svg
    width="18"
    height="15"
    viewBox="0 0 18 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1.72559V6.08922H5.36364"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 13.3617V8.99805H12.6364"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.1745 5.36192C14.8057 4.31958 14.1788 3.38766 13.3524 2.65313C12.526 1.91859 11.5269 1.40538 10.4485 1.16138C9.3701 0.917371 8.24745 0.950528 7.18532 1.25775C6.12318 1.56498 5.15618 2.13625 4.37455 2.91828L1 6.08919M17 8.99828L13.6255 12.1692C12.8438 12.9512 11.8768 13.5225 10.8147 13.8297C9.75255 14.1369 8.6299 14.1701 7.55148 13.9261C6.47307 13.6821 5.47404 13.1689 4.64761 12.4343C3.82119 11.6998 3.1943 10.7679 2.82545 9.72555"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Create Action Buttons
const ActionButtons = ({ onShare, onRetake }) => {
  return (
    <div className="action-buttons">
      <button className="action-button action-button-share" onClick={onShare}>
        <ShareIcon />
        <span>Save your results</span>
      </button>

      <button className="action-button action-button-retake" onClick={onRetake}>
        <RetakeIcon />
        <span>Take quiz again</span>
      </button>
    </div>
  );
};

export default ActionButtons;
