// api.js
// Handles API interactions

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1lizLkkm9qv8OD95as6-aHPyf-pkpBx6JqhfLRRzQU7A/pub?gid=0&single=true&output=csv";

async function fetchDrugData() {
  try {
    // console.log("Fetching drug data from:", SHEET_URL);
    const response = await fetch(SHEET_URL);
    const csvData = await response.text();
    // console.log("CSV data received:", csvData.substring(0, 200) + "...");
    // Log first 200 characters of CSV

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          // console.log("Papa Parse complete. Rows parsed:", results.data.length);
          // console.log("First row of parsed data:", results.data[0]);

          const data = results.data.map((row) => ({
            id: row.id,
            genericName: row.genericName,
            brandName: row.brandName,
            manufacturer: row.manufacturer,
            route: row.route,
            dosage: row.dosage,
            category: row.category,
            status: row.status,
            shortageReason: row.shortageReason,
            relatedInfo: row.relatedInfo,
            reportedDate: row.reportedDate,
            resolvedDate: row.resolvedDate,
          }));

          // console.log(
          //   "Data processing complete. First processed item:",
          //   JSON.stringify(data[0], null, 2)
          // );
          // console.log("Total processed items:", data.length);

          resolve(data);
        },
        error: (error) => {
          // console.error("Papa Parse error:", error);
          reject(error);
        },
      });
    });
  } catch (error) {
    // console.error("Error fetching drug data:", error);
    throw error;
  }
}
