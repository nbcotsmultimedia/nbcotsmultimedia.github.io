// api.js

console.log("Updated api.js loaded - Version 2");

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpua9CZmyyG8Uh7nbEK7ea7elaOPpgvIP2KgOg_7YJqIhjQpTQh85TCFJae6WSawtgVGbXsErJ7r7J/pub?gid=0&single=true&output=csv";

function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

async function fetchDrugData() {
  try {
    console.log("Fetching drug data from:", SHEET_URL);
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    console.log("CSV data received:", csvData.substring(0, 200) + "...");

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          console.log("Papa Parse complete. Rows parsed:", results.data.length);
          console.log("First row of parsed data:", results.data[0]);

          const data = results.data.map((row) => {
            const parsedRow = {
              ...row,
              shortageUpdateDate: parseDate(row.shortageUpdateDate),
              shortageReportedDate: parseDate(row.shortageReportedDate),
            };
            console.log(`Parsed dates for ${row.genericName}:`, {
              original: {
                shortageUpdateDate: row.shortageUpdateDate,
                shortageReportedDate: row.shortageReportedDate,
              },
              parsed: {
                shortageUpdateDate: parsedRow.shortageUpdateDate,
                shortageReportedDate: parsedRow.shortageReportedDate,
              },
            });
            return parsedRow;
          });

          console.log(
            "Data processing complete. First processed item:",
            JSON.stringify(data[0], null, 2)
          );
          console.log("Total processed items:", data.length);

          resolve(data);
        },
        error: (error) => {
          console.error("Papa Parse error:", error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error fetching drug data:", error);
    throw error;
  }
}

function parseDate(dateString) {
  if (!dateString) {
    console.log("Empty date string, returning null");
    return null;
  }

  console.log(`Attempting to parse date: ${dateString}`);

  // Define an array of date formats to try
  const formats = [
    moment.ISO_8601,
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD",
    "MM/DD/YYYY",
    "DD/MM/YYYY",
    "MMMM D, YYYY",
    "D MMMM YYYY",
  ];

  // Try parsing with Moment.js using multiple formats
  for (let format of formats) {
    const momentDate = moment(dateString, format, true);
    if (momentDate.isValid()) {
      console.log(`Successfully parsed date with format: ${format}`);
      return momentDate.toDate();
    }
  }

  // If Moment.js fails, try native Date parsing
  const nativeDate = new Date(dateString);
  if (isValidDate(nativeDate)) {
    console.log("Successfully parsed date with native Date");
    return nativeDate;
  }

  // If all parsing attempts fail, log a warning and return null
  console.warn(`Failed to parse date: ${dateString}`);
  return null;
}

// Expose functions globally
window.fetchDrugData = fetchDrugData;
window.isValidDate = isValidDate;
