import React from "react";
import DownloadResults from "./DownloadResults";

const DownloadPreview = () => {
  // Sample data that matches your quiz structure
  const sampleData = {
    archetype: {
      title: "The Reluctant Voter",
      profile:
        "You approach politics with a degree of skepticism, yet maintain a sense of civic responsibility.",
    },
    answers: {
      1: "No, I do not plan on voting",
      2: "I don't feel my vote will make a difference",
      3: null,
      4: null,
      5: "Frustrated",
      6: null,
      7: null,
      8: "Climate change and the environment",
      9: "3-5",
    },
  };

  return (
    <div className="min-h-screen bg-gray-200 p-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto">
        <DownloadResults
          archetype={sampleData.archetype}
          answers={sampleData.answers}
        />
      </div>
    </div>
  );
};

export default DownloadPreview;
