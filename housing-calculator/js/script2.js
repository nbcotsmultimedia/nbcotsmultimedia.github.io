//TODO - Add drop-down validator for user input zip code
//NOTE - Will have to somehow combine data with geocode in processing
//TODO - Add insurance costs
//TODO - Calculate distance of hexagon from target zip
//TODO - Compare monthly mortgage costs of hexagon to user affordability thresholds
//TODO - Check for redundant functions (calculate monthly mortgage costs)

//#region - Global variables
let housingData; // Store housing data
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv";
const defaultResolution = 6; // Set a default H3 grid resolution
const bufferRadius = 5; // Define buffer radius for buffer zones
let affordableHousingCosts;
let stretchedHousingCosts;
let maxAllowableDebtForMortgages;
//#endregion

//#region - Spatial functions
// Function to calculate the H3 index of the centroid of a given area
function calculateCentroidIndex(bufferZone, resolution) {
  // Use turf.js to calculate geographic center of the mass of bufferZone
  const centroid = turf.centerOfMass(bufferZone);

  // Extract lat and long from the calculated center
  const lat = centroid.geometry.coordinates[1];
  const lng = centroid.geometry.coordinates[0];

  // Convert the latitude and longitude to an H3 index at the provided resolution
  // H3 index represents the hexagonal cell on the H3 grid that contains the centroid
  const centroidIndex = h3.latLngToCell(lat, lng, resolution);

  return centroidIndex;
}

// Function to create hexagonal grids for a list of areas using the H3 system
function generateH3Hexagons(bufferZones, resolution = defaultResolution) {
  // Initialize an empty array to store H3 hexagons
  const h3Hexagons = [];

  // Define the number of rings of hexagons to generate around each area's center
  const k = 3;

  //   console.log(
  //     `Generating H3 hexagons with resolution ${resolution} and k value ${k}`
  //   );

  // Iterate over each entry in bufferZones
  bufferZones.forEach((bufferZone, index) => {
    // Calculate the H3 index of the centroid of the centroid
    const centroidIndex = calculateCentroidIndex(bufferZone, resolution);

    console.log(`Generating hexagons for centroids`);

    // Generate a cluster of hexagons around the center index
    const hexagons = h3.gridDisk(centroidIndex, k);

    // Store the generated H3 hexagons in the h3Hexagons array
    h3Hexagons.push(hexagons);
  });

  console.log("All H3 hexagons generated");

  return h3Hexagons; // When function complete, output the array h3Hexagons
}

// Function to create circular buffer zones around a list of geographic coordinates
function generateBufferZone(zipCodeData, bufferRadius) {
  const latitude = parseFloat(zipCodeData.Latitude);
  const longitude = parseFloat(zipCodeData.Longitude);

  if (!isNaN(latitude) && !isNaN(longitude)) {
    const centroid = [longitude, latitude]; // Make sure to swap the order
    const bufferZone = turf.buffer(turf.point(centroid), bufferRadius, {
      units: "miles",
    });
    return bufferZone;
  } else {
    console.error(
      "Invalid latitude or longitude for zip code:",
      zipCodeData.zip
    );
  }
}

// Function to calculate distance between two coordinates in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 3959; // Radius of the Earth in miles
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;
}

// Function to obtain the geographic center points of a list of H3 hexagons
function getHexagonCentroids(hexagons) {
  return hexagons.map((hexId) => h3.cellToLatLng(hexId));
}

// Function to map zip codes to the closest hexagonal cell based on geographic proximity
function mapZipCodesToHexagons(zipCodes, hexagons) {
  let hexagonCentroids = getHexagonCentroids(hexagons.flat());
  let zipToHexMap = {}; // To store mapping of zip codes to closest hexagon

  zipCodes.forEach((zip) => {
    let zipLat = parseFloat(zip.Latitude);
    let zipLng = parseFloat(zip.Longitude);
    let closestHex = null;
    let minDistance = Infinity;

    hexagonCentroids.forEach((centroid, index) => {
      let distance = calculateDistance(
        zipLat,
        zipLng,
        centroid[0],
        centroid[1]
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestHex = hexagons.flat()[index];
      }
    });

    // Assign zip code to the closest hexagon
    zipToHexMap[zip.zip] = closestHex;
  });

  return zipToHexMap;
}

// Function to identify affordable or stretched hexagons
function identifyAffordableOrStretchedHexagons(hexagonAggregatedData) {
  const affordableOrStretchedHexagons = [];

  Object.entries(hexagonAggregatedData).forEach(([hexagon, data]) => {
    if (
      data.affordability === "Affordable" ||
      data.affordability === "Stretched"
    ) {
      affordableOrStretchedHexagons.push({
        hexagon: hexagon,
        affordability: data.affordability,
      });
    }
  });

  return affordableOrStretchedHexagons;
}

//#endregion

//#region - Functions to retrieve data
// Function to fetch and parse data from Google Sheet
function loadDataFromGoogleSheet(url) {
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      console.log("Parsed housing data:", results.data); // This line logs the data
      console.log("Column names:", Object.keys(results.data[0])); // This line logs the column names
      housingData = results.data;
      $("#calculateButton").prop("disabled", false);
    },
    error: function (error) {
      console.error("Error while fetching and parsing CSV:", error);
      alert("Failed to load housing data. Please try again later.");
    },
  });
}

// Function to retrieve data from form
function getFormData() {
  return {
    zipCode: $("#zipCode").val(),
    annualIncome: parseFloat($("#income").val()),
    downPayment: parseFloat($("#downPayment").val()),
    monthlyExpenses: parseFloat($("#monthlyExpenses").val()),
    mortgageTerm: parseInt($("#mortgageTerm").val()),
  };
}
//#endregion

//#region - Affordability calculations
// Function to calculate housing affordability
function calculateHousingAffordability(
  zipCode,
  annualIncome,
  downPayment,
  monthlyExpenses,
  mortgageTerm
) {
  // Initialize results object to store various calculations
  const results = {
    affordability: "",
    medianHomePrice: 0,
    monthlyZipMortgagePayment: 0,
    interestRate: 0,
    mortgageTerm: mortgageTerm, // Directly assign since it's an input parameter
  };

  // Find housing data for the given zip code
  const zipCodeData = housingData.find((row) => row.zip === zipCode);
  if (!zipCodeData) {
    console.error("Housing data not found for zip code:", zipCode);
    return null;
  }

  //#region - Retrieve data points
  results.medianHomePrice = parseFloat(zipCodeData.median_sale_price);
  results.interestRate =
    mortgageTerm === 15
      ? parseFloat(zipCodeData.mortgage_15_rate)
      : parseFloat(zipCodeData.mortgage_30_rate);
  //#endregion

  //#region - Calculate monthly costs
  const loanAmount = results.medianHomePrice - downPayment; // Determine loan amount by subtracting down payment from home price
  const monthlyInterestRate = results.interestRate / 100 / 12; // Convert annual interest rate percentage to monthly decimal rate
  const totalNumberOfPayments = mortgageTerm * 12; // Convert loan term from years to months
  results.monthlyZipMortgagePayment =
    (loanAmount * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalNumberOfPayments));
  //#endregion

  //#region - Calculate maximum allowable housing costs based on DTI
  const monthlyGrossIncome = annualIncome / 12;
  affordableHousingCosts = monthlyGrossIncome * 0.28;
  stretchedHousingCosts = monthlyGrossIncome * 0.36 - monthlyExpenses;
  maxAllowableDebtForMortgages = monthlyGrossIncome * 0.43 - monthlyExpenses;
  //#endregion

  //#region - Compare user's affordability to monthly housing costs in target zip
  if (results.monthlyZipMortgagePayment <= affordableHousingCosts) {
    results.affordability = "Affordable";
  } else if (results.monthlyZipMortgagePayment <= stretchedHousingCosts) {
    results.affordability = "Stretched";
  } else if (
    results.monthlyZipMortgagePayment <= maxAllowableDebtForMortgages
  ) {
    results.affordability = "Aggressive";
  } else {
    results.affordability = "Out of reach";
  }
  //#endregion

  // Return an object that includes all necessary details
  return results;
}

// Function to calculate monthly mortgage payment
function calculateMonthlyMortgagePayment(
  loanAmount,
  annualInterestRate,
  mortgageTerm
) {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const totalNumberOfPayments = mortgageTerm * 12;
  return (
    (loanAmount * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalNumberOfPayments))
  );
}
//#endregion

// Initialize the application once the DOM is fully loaded
$(document).ready(function () {
  // Function to manage the form submission process
  function handleFormSubmission() {
    event.preventDefault(); // Prevent default form submission behavior

    // Step 1: Retrieve form data
    const formData = getFormData();

    // Step 2: Perform main affordability calculation for the selected zip
    const affordabilityData = calculateHousingAffordability(
      formData.zipCode,
      formData.annualIncome,
      formData.downPayment,
      formData.monthlyExpenses,
      formData.mortgageTerm
    );

    // Step 2a: Update UI with affordability data
    updateUIWithResults(affordabilityData);

    // Step 3: Geospatial analysis and additional affordability calculations
    const hexagonAggregatedData = performGeospatialAnalysis(
      formData.zipCode,
      affordabilityData.interestRate,
      formData.downPayment,
      formData.mortgageTerm
    );

    // Step 3a: Update UI with geospatial analysis results
    updateUIWithGeospatialAnalysis(hexagonAggregatedData);
  }

  // Placeholder function for updating UI with affordability results
  function updateUIWithResults(affordabilityData) {
    // Check if affordabilityData is not null or undefined
    if (affordabilityData) {
      console.log(
        `Affordability Analysis Results:\n` +
          `- Affordability Status: ${affordabilityData.affordability}\n` +
          `- Median Home Price in ZIP: $${affordabilityData.medianHomePrice.toLocaleString()}\n` +
          `- Estimated Monthly Mortgage Payment: $${affordabilityData.monthlyZipMortgagePayment}\n` +
          `- Affordable Monthly Payment: $${affordableHousingCosts}\n` + // Console log affordable monthly payment
          `- Stretched Monthly Payment: $${stretchedHousingCosts}\n` + // Console log stretched monthly payment
          `- Interest Rate: ${affordabilityData.interestRate}% for a ${affordabilityData.mortgageTerm}-year mortgage\n` +
          `- Mortgage Term: ${affordabilityData.mortgageTerm} years\n\n`
      );
    } else {
      console.log("No affordability data available.");
    }
  }

  // Function to generate buffer, create hexagons, and aggregate data
  function performGeospatialAnalysis(
    zipCode,
    interestRate,
    downPayment,
    mortgageTerm
  ) {
    const selectedZipCodeData = housingData.find(
      (data) => data.zip === zipCode
    );
    if (
      !selectedZipCodeData ||
      isNaN(selectedZipCodeData.Latitude) ||
      isNaN(selectedZipCodeData.Longitude)
    ) {
      console.error(
        "Valid latitude or longitude not found for ZIP code:",
        zipCode
      );
      return;
    }

    const targetLat = parseFloat(selectedZipCodeData.Latitude);
    const targetLng = parseFloat(selectedZipCodeData.Longitude);

    // Generate a buffer zone for the selected ZIP code
    const bufferZone = generateBufferZone(selectedZipCodeData, bufferRadius);

    // Generate H3 hexagons based on the buffer zone
    const h3Hexagons = generateH3Hexagons([bufferZone], defaultResolution);

    // Map housing data to the closest hexagon
    const zipToHexMap = mapZipCodesToHexagons(housingData, h3Hexagons.flat());

    // Aggregate and analyze data for each hexagon
    let hexagonAggregatedData = {}; // Initialize an empty object

    h3Hexagons.flat().forEach((hexagon) => {
      const hexZipCodes = Object.keys(zipToHexMap).filter(
        (zip) => zipToHexMap[zip] === hexagon
      );
      let totalMedianPrice = 0;
      let count = 0;
      const centroid = h3.cellToLatLng(hexagon); // Get the centroid of the hexagon
      const distanceToTargetZip = calculateDistance(
        targetLat,
        targetLng,
        centroid[0],
        centroid[1]
      );

      hexZipCodes.forEach((zip) => {
        const zipData = housingData.find((data) => data.zip === zip);
        if (zipData && zipData.median_sale_price) {
          totalMedianPrice += parseFloat(zipData.median_sale_price);
          count++;
        }
      });

      if (count > 0) {
        const averageMedianPrice = totalMedianPrice / count;
        const loanAmount = averageMedianPrice - downPayment;
        const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
          loanAmount,
          interestRate,
          mortgageTerm
        );

        // Determine affordability classification based on monthly mortgage payment
        let affordability;
        if (monthlyMortgagePayment <= affordableHousingCosts) {
          affordability = "Affordable";
        } else if (monthlyMortgagePayment <= stretchedHousingCosts) {
          affordability = "Stretched";
        } else if (monthlyMortgagePayment <= maxAllowableDebtForMortgages) {
          affordability = "Aggressive";
        } else {
          affordability = "Out of reach";
        }

        hexagonAggregatedData[hexagon] = {
          averageMedianPrice: averageMedianPrice,
          zipCodes: hexZipCodes,
          monthlyMortgagePayment: monthlyMortgagePayment,
          distanceToTargetZip: distanceToTargetZip,
          affordability: affordability,
        };
      }
    });

    return hexagonAggregatedData; // This could be used for additional processing or to update the UI
  }

  // Placeholder function for updating UI with spatial analysis results
  function updateUIWithGeospatialAnalysis(hexagonAggregatedData) {
    // Detailed console log for geospatial analysis results
    console.log("Geospatial Analysis Results:");

    // Flag variables to track if any hexagons classify as affordable, stretch, or aggressive
    let affordableFound = false;
    let stretchedFound = false;
    let aggressiveFound = false;

    // Iterate through hexagon aggregated data
    Object.entries(hexagonAggregatedData).forEach(([hexagon, data]) => {
      console.log(
        `Hexagon ID: ${hexagon}\n` +
          `Average Median Home Price: $${data.averageMedianPrice.toLocaleString()}\n` +
          `Calculated Monthly Mortgage Payment: $${data.monthlyMortgagePayment.toFixed(
            2
          )}\n` +
          `Distance to Target ZIP Code: ${data.distanceToTargetZip.toFixed(
            2
          )} miles\n`
      );

      // Check the affordability classification of the hexagon
      if (data.affordability === "Affordable") {
        affordableFound = true;
      } else if (data.affordability === "Stretched") {
        stretchedFound = true;
      } else if (data.affordability === "Aggressive") {
        aggressiveFound = true;
      }
    });

    // Log if any hexagons classify as affordable, stretch, or aggressive
    if (affordableFound) {
      console.log("Some hexagons are classified as affordable.");
    }
    if (stretchedFound) {
      console.log("Some hexagons are classified as stretched.");
    }
    if (aggressiveFound) {
      console.log("Some hexagons are classified as aggressive.");
    }
  }

  // Call the function to load data from the Google Sheet
  loadDataFromGoogleSheet(url);

  // Attach the form submission handler
  $("#affordabilityForm").submit(function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Handle the form submission
    handleFormSubmission();
  });

  //#region - Auto-populate form fields with debug values
  $("#zipCode").val("78745");
  $("#income").val("75000");
  $("#downPayment").val("10000");
  $("#monthlyExpenses").val("600");
  $("#mortgageTerm").val("30");
  //#endregion
});
