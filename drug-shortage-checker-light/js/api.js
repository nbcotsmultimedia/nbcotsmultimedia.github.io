// api.js
// Handles API interactions

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpua9CZmyyG8Uh7nbEK7ea7elaOPpgvIP2KgOg_7YJqIhjQpTQh85TCFJae6WSawtgVGbXsErJ7r7J/pub?gid=0&single=true&output=csv";

async function fetchDrugData() {
  try {
    console.log("Fetching drug data from:", SHEET_URL);
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    console.log("CSV data received:", csvData.substring(0, 200) + "...");
    // Log first 200 characters of CSV

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          console.log("Papa Parse complete. Rows parsed:", results.data.length);
          console.log("First row of parsed data:", results.data[0]);

          const data = results.data.map((row) => ({
            genericName: row.genericName,
            manufacturerName: row.manufacturerName,
            manufacturerContact: row.manufacturerContact,
            shortageUpdateDate: row.shortageUpdateDate,
            availability: row.availability,
            relatedShortageInfo: row.relatedShortageInfo,
            resolvedShortageInfo: row.resolvedShortageInfo,
            shortageReason: row.shortageReason,
            therapeuticCategory: row.therapeuticCategory,
            shortageStatus: row.shortageStatus,
            shortageReportedDate: row.shortageReportedDate,
            ndc10: row.ndc10,
            ndc11: row.ndc11,
            dosage: row.dosage,
            brandName: row.brandName,
            route: row.route,
          }));

          console.log(
            "Data processing complete. First processed item:",
            JSON.stringify(data[0], null, 2)
          );
          console.log("Total processed items:", data.length);

          resolve(data);
        },
        error: (error) => {
          // console.error("Papa Parse error:", error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error fetching drug data:", error);
    throw error;
  }
}
