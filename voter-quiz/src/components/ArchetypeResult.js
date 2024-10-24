// src/components/ArchetypeResult.js
import React from "react";
import { archetypes } from "./archetypeData"; // We'll create this file in the same directory

const ArchetypeResult = ({ archetypeKey }) => {
  const archetype = archetypes[archetypeKey];

  return (
    <div className="results-content">
      <div className="archetype-card">
        <div className="archetype-header">
          <h2 className="archetype-title">{archetype.title}</h2>
          <p className="archetype-subtitle">{archetype.description}</p>
        </div>
        <div className="archetype-content">
          <div className="profile-section">
            <p className="profile-text">{archetype.profile}</p>
            <p className="detail-text">{archetype.detail}</p>
          </div>

          <div className="traits-section">
            <h3 className="traits-title">Your Political Profile:</h3>
            <div className="traits-grid">
              <div>
                <h4 className="traits-subtitle">Key Issues</h4>
                <div className="issues-container">
                  {archetype.traits.issuesFocus.map((issue, index) => (
                    <span key={index} className="issue-tag">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="traits-subtitle">Engagement</h4>
                <ul className="engagement-list">
                  <li>News: {archetype.traits.newsConsumption}</li>
                  <li>Social Media: {archetype.traits.socialMedia}</li>
                  <li>Disposition: {archetype.traits.emotionalState}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchetypeResult;
