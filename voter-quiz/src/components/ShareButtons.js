import React, { useCallback } from "react";
import html2canvas from "html2canvas";
import DownloadResults from "./DownloadResults";
import { createRoot } from "react-dom/client";

// Social share URLs
const SHARE_URLS = {
  twitter: (text, url) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`,
  facebook: (url) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: (url) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`,
};

const ShareButtons = ({ archetype, answers }) => {
  const shareText = `I'm a ${archetype?.title} voter! Take the quiz to discover your voter archetype.`;
  const shareUrl = window.location.href;

  // Social media share handlers
  const handleTwitterShare = () => {
    window.open(SHARE_URLS.twitter(shareText, shareUrl), "_blank");
  };

  const handleFacebookShare = () => {
    window.open(SHARE_URLS.facebook(shareUrl), "_blank");
  };

  const handleLinkedInShare = () => {
    window.open(SHARE_URLS.linkedin(shareUrl), "_blank");
  };

  // Native share handler
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Voter Archetype",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("Share link copied to clipboard!");
    }
  };

  const handleDownload = useCallback(async () => {
    try {
      // Create temporary container
      const downloadContainer = document.createElement("div");
      downloadContainer.style.position = "absolute";
      downloadContainer.style.left = "-9999px";
      document.body.appendChild(downloadContainer);

      // Create root and render
      const root = createRoot(downloadContainer);
      root.render(<DownloadResults archetype={archetype} answers={answers} />);

      // Wait for any images to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = downloadContainer.firstChild;
      const canvas = await html2canvas(element, {
        backgroundColor: "white",
        scale: 2,
        logging: false,
        width: 800,
        height: 1200,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `voter-archetype-${archetype?.title
          ?.toLowerCase()
          .replace(/\s+/g, "-")}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // Clean up
        root.unmount();
        document.body.removeChild(downloadContainer);
      }, "image/png");
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Failed to download results. Please try again.");
    }
  }, [archetype, answers]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-4">
        <button
          onClick={handleTwitterShare}
          className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-opacity-90"
        >
          Share on Twitter
        </button>
        <button
          onClick={handleFacebookShare}
          className="px-4 py-2 bg-[#4267B2] text-white rounded-lg hover:bg-opacity-90"
        >
          Share on Facebook
        </button>
        <button
          onClick={handleLinkedInShare}
          className="px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-opacity-90"
        >
          Share on LinkedIn
        </button>
      </div>
      <div className="flex justify-center gap-4">
        <button
          onClick={handleNativeShare}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-opacity-90"
        >
          Share...
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-opacity-90"
        >
          Download Image
        </button>
      </div>
    </div>
  );
};

export default ShareButtons;
