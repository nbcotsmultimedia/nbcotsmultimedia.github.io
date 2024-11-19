// Configuration file for story content and image paths

// Varied placeholder text for each section
const LOREM_VARIANTS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Pellentesque habitant morbi tristique senectus et netus et malesuada fames.",
  "Nullam lobortis placerat aliquam. Aenean condimentum mauris sit amet cursus.",
  "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
];

const CONFIG = {
  // Array of image paths with padded numbers (01-23)
  illustrations: Array.from(
    { length: 23 },
    (_, i) => `images/screen${String(i + 1).padStart(2, "0")}.jpg`
  ),

  // Array of section content with placeholder text
  sections: Array.from({ length: 23 }, (_, i) => ({
    title: `Step ${i + 1}`,
    content: LOREM_VARIANTS[i % LOREM_VARIANTS.length],
  })),
};
