// normalization.js - Utility functions for data normalization

/**
 * Normalize a string for comparison (removes diacritics, spaces, and converts to lowercase)
 * @param {string} str - The string to normalize
 * @returns {string} Normalized string
 */
export function normalizeString(str) {
  if (!str) return "";
  // Remove diacritical marks, convert to lowercase, and remove spaces
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

/**
 * Normalize a value to a 0-100 scale
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value in the range
 * @param {number} max - Maximum value in the range
 * @returns {number} Normalized value (0-100)
 */
export function normalizeValue(value, min, max) {
  // Handle edge case: if min and max are the same, return 50
  if (min === max) return 50;

  // Normalize to 0-100 scale
  return ((value - min) / (max - min)) * 100;
}

/**
 * Normalize a value to a 0-1 scale
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value in the range
 * @param {number} max - Maximum value in the range
 * @returns {number} Normalized value (0-1)
 */
export function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Normalize a value to a 0-1 scale and invert it (1 becomes 0, 0 becomes 1)
 * @param {number} value - Value to normalize
 * @param {number} min - Minimum value in the range
 * @param {number} max - Maximum value in the range
 * @returns {number} Inverse normalized value (0-1)
 */
export function inverseNormalize(value, min, max) {
  return 1 - normalize(value, min, max);
}
