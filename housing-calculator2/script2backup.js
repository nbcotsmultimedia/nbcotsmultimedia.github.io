// #region - Notes
//TODO - Add drop-down validator for user input zip code
//NOTE - Will have to somehow combine data with geocode in processing
//TODO - Add insurance costs
//TODO - Calculate distance of hexagon from target zip
//TODO - Compare monthly mortgage costs of hexagon to user affordability thresholds
//TODO - Check for redundant functions (calculate monthly mortgage costs)
//TODO - Expand hexagon classification to include aggressive and out of reach
//#endregion

// #region - Set global variables

let housingData; // Store housing data in empty variable
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv";

// Define debt-to-income ratio thresholds for different affordability levels
const AFFORDABILITY_DTI = {
  AFFORDABLE: 0.28, // 28% of monthly income
  STRETCH: 0.36, // 36% of monthly income
  AGGRESSIVE: 0.43, // 43% of monthly income
};

//#endregion

// #region - Spatial analysis

// Adjust these constants for better coverage
const defaultResolution = 7; // Keep at 7 for good granularity
const bufferRadius = 10; // Increase from 5 to 10 miles
const MAX_DISTANCE = 15; // Increase from 10 to 15 miles

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
  console.log(`Starting hexagon generation with resolution ${resolution}`);
  const h3Hexagons = [];
  const k = 3;

  bufferZones.forEach((bufferZone, index) => {
    console.log(`Processing buffer zone ${index}`);

    if (!bufferZone || !bufferZone.geometry) {
      console.error("Invalid buffer zone:", bufferZone);
      return;
    }

    console.log("Buffer zone geometry:", bufferZone.geometry);

    // Get the centroid
    const centroid = turf.centerOfMass(bufferZone);
    console.log("Centroid:", centroid);

    if (!centroid || !centroid.geometry || !centroid.geometry.coordinates) {
      console.error("Invalid centroid calculation");
      return;
    }

    const lat = centroid.geometry.coordinates[1];
    const lng = centroid.geometry.coordinates[0];
    console.log(`Centroid coordinates: lat=${lat}, lng=${lng}`);

    // Generate center index
    const centroidIndex = h3.latLngToCell(lat, lng, resolution);
    console.log("Center hexagon index:", centroidIndex);

    // Generate hexagon ring
    const hexagons = h3.gridDisk(centroidIndex, k);
    console.log(`Generated ${hexagons.length} hexagons in ring`);

    h3Hexagons.push(hexagons);
  });

  const flattenedHexagons = h3Hexagons.flat();
  console.log(`Total hexagons generated: ${flattenedHexagons.length}`);

  // Log some hexagon details for verification
  if (flattenedHexagons.length > 0) {
    const sampleHexagon = flattenedHexagons[0];
    const sampleCenter = h3.cellToLatLng(sampleHexagon);
    console.log("Sample hexagon details:", {
      index: sampleHexagon,
      center: sampleCenter,
    });
  }

  return h3Hexagons;
}

// Function to create circular buffer zones around a list of geographic coordinates
function generateBufferZone(zipCodeData, bufferRadius) {
  // Destructure coordinates with default values to prevent undefined
  const { Latitude: lat = null, Longitude: lng = null, zip } = zipCodeData;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Early return if coordinates are invalid
  if (!isValidCoordinates(latitude, longitude)) {
    console.error(`Invalid coordinates for zip code: ${zip}`);
    return null;
  }

  return turf.buffer(turf.point([longitude, latitude]), bufferRadius, {
    units: "miles",
  });
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

// Add data validation function
function validateHousingData(zipCode) {
  if (!housingData || housingData.length === 0) {
    throw new Error("Housing data not loaded properly");
  }

  const zipData = housingData.find((data) => data.zip === zipCode);
  if (!zipData) {
    throw new Error(`No data found for ZIP code ${zipCode}`);
  }

  if (
    !zipData.Latitude ||
    !zipData.Longitude ||
    isNaN(zipData.Latitude) ||
    isNaN(zipData.Longitude)
  ) {
    throw new Error(`Invalid location data for ZIP code ${zipCode}`);
  }

  if (!zipData.median_sale_price || isNaN(zipData.median_sale_price)) {
    throw new Error(`Invalid price data for ZIP code ${zipCode}`);
  }

  return zipData;
}

// Update the error handling
const ErrorMessages = {
  INVALID_ZIP: "Invalid ZIP code provided",
  DATA_LOADING: "Error loading housing data",
  CALCULATION: "Error in affordability calculation",
  GEOSPATIAL: "Error in geospatial analysis",
  NETWORK: "Network error occurred",
  VALIDATION: "Validation error",
};
function handleError(error, type) {
  const errorMessage =
    ErrorMessages[type] || error.message || "An unexpected error occurred";
  console.error(`${errorMessage}: `, error);

  document.getElementById("resultsMessage").innerHTML = `
        <div class="error" style="color: red; padding: 15px; background-color: #ffebee; border-radius: 5px;">
            ${errorMessage}
        </div>`;
}

function performGeospatialAnalysis(
  zipCode,
  interestRate,
  downPayment,
  mortgageTerm,
  { affordable, stretch, aggressive }
) {
  console.log("Starting geospatial analysis for ZIP:", zipCode);

  // Find spatial data for target zip
  const selectedZipCodeData = housingData.find((data) => data.zip === zipCode);

  console.log("Target ZIP data:", selectedZipCodeData);

  if (
    !selectedZipCodeData ||
    !isValidCoordinates(
      selectedZipCodeData.Latitude,
      selectedZipCodeData.Longitude
    )
  ) {
    console.error("Invalid coordinates for ZIP:", zipCode);
    return {};
  }

  const targetLat = parseFloat(selectedZipCodeData.Latitude);
  const targetLng = parseFloat(selectedZipCodeData.Longitude);

  console.log(`Target coordinates: ${targetLat}, ${targetLng}`);

  // Generate buffer zone
  const bufferZone = generateBufferZone(selectedZipCodeData, bufferRadius);
  if (!bufferZone) {
    console.error("Failed to generate buffer zone");
    return {};
  }

  // Generate H3 hexagons
  const h3Hexagons = generateH3Hexagons([bufferZone], defaultResolution);

  // Important: Pass the target coordinates to mapZipCodesToHexagons
  const zipToHexMap = mapZipCodesToHexagons(
    housingData,
    h3Hexagons,
    targetLat, // Make sure these are passed
    targetLng // Make sure these are passed
  );

  let hexagonAggregatedData = {};

  // Process each hexagon
  h3Hexagons.flat().forEach((hexagon) => {
    const hexZipCodes = Object.keys(zipToHexMap).filter(
      (zip) => zipToHexMap[zip] === hexagon
    );

    if (hexZipCodes.length > 0) {
      let totalMedianPrice = 0;
      let validPriceCount = 0;
      const centroid = h3.cellToLatLng(hexagon);
      const distanceToTargetZip = calculateDistance(
        targetLat,
        targetLng,
        centroid[0],
        centroid[1]
      );

      // Only process hexagons within our maximum distance
      if (distanceToTargetZip <= MAX_DISTANCE) {
        hexZipCodes.forEach((zip) => {
          const zipData = housingData.find((data) => data.zip === zip);
          if (zipData && zipData.median_sale_price) {
            const price = parseFloat(zipData.median_sale_price);
            if (!isNaN(price) && price > 0) {
              totalMedianPrice += price;
              validPriceCount++;
            }
          }
        });

        if (validPriceCount > 0) {
          const averageMedianPrice = totalMedianPrice / validPriceCount;
          const loanAmount = averageMedianPrice - downPayment;
          const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
            loanAmount,
            interestRate,
            mortgageTerm
          );

          let affordability;
          if (monthlyMortgagePayment <= affordable) {
            affordability = "Affordable";
          } else if (monthlyMortgagePayment <= stretch) {
            affordability = "Stretched";
          } else if (monthlyMortgagePayment <= aggressive) {
            affordability = "Aggressive";
          } else {
            affordability = "Out of reach";
          }

          hexagonAggregatedData[hexagon] = {
            averageMedianPrice,
            zipCodes: hexZipCodes,
            monthlyMortgagePayment,
            distanceToTargetZip,
            affordability,
            validPriceCount,
            totalZipCodes: hexZipCodes.length,
          };
        }
      }
    }
  });

  return hexagonAggregatedData;
}

// Update the mapZipCodesToHexagons function to better handle the coordinates
function mapZipCodesToHexagons(zipCodes, hexagons, targetLat, targetLng) {
  if (!isValidCoordinates(targetLat, targetLng)) {
    console.error("Invalid target coordinates:", targetLat, targetLng);
    return {};
  }

  console.log(
    `Starting ZIP code mapping. Target coordinates: ${targetLat}, ${targetLng}`
  );
  let hexagonCentroids = getHexagonCentroids(hexagons.flat());
  let zipToHexMap = {};
  let mappedCount = 0;
  let skippedCount = 0;

  zipCodes.forEach((zip) => {
    let zipLat = parseFloat(zip.Latitude);
    let zipLng = parseFloat(zip.Longitude);

    if (!isValidCoordinates(zipLat, zipLng)) {
      skippedCount++;
      return;
    }

    let distanceToTarget = calculateDistance(
      zipLat,
      zipLng,
      targetLat,
      targetLng
    );

    // Check if this ZIP is within our search radius
    if (distanceToTarget <= bufferRadius * 2) {
      let closestHex = null;
      let minDistance = Infinity;

      hexagonCentroids.forEach((centroid, idx) => {
        let distance = calculateDistance(
          zipLat,
          zipLng,
          centroid[0],
          centroid[1]
        );

        if (distance < minDistance && distance <= MAX_DISTANCE) {
          minDistance = distance;
          closestHex = hexagons.flat()[idx];
        }
      });

      if (closestHex) {
        zipToHexMap[zip.zip] = closestHex;
        mappedCount++;
      }
    }
  });

  console.log(`Mapping complete:
        - Total ZIPs mapped: ${mappedCount}
        - Total ZIPs skipped: ${skippedCount}
        - Unique hexagons used: ${new Set(Object.values(zipToHexMap)).size}
    `);

  return zipToHexMap;
}

// Helper function to check coordinate validity
function isValidCoordinates(lat, lng) {
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
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

// #region - Retrieve and parse Google Sheet and form data

// Function to fetch and parse data from Google Sheet
async function loadDataFromGoogleSheet(url) {
  const calculateButton = $("#calculateButton");

  try {
    calculateButton.prop("disabled", true).html("Calculate (Loading data...)");

    const results = await new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    });

    housingData = results.data;
    console.log(`Loaded ${housingData.length} entries of housing data`);

    return housingData;
  } catch (error) {
    console.error("Error loading housing data:", error);
    throw new Error("Failed to load housing data. Please try again later.");
  } finally {
    calculateButton.prop("disabled", false).html("Calculate");
  }
}

// Function to retrieve data from user form
function getFormData() {
  const annualIncome = parseFloat($("#income").val());
  const monthlyExpenses = parseFloat($("#monthlyExpenses").val());
  const monthlyIncome = annualIncome / 12;

  return {
    zipCode: $("#zipCode").val(),
    annualIncome,
    downPayment: parseFloat($("#downPayment").val()),
    monthlyExpenses,
    mortgageTerm: parseInt($("#mortgageTerm").val()),
    thresholds: {
      affordable: monthlyIncome * 0.28 - monthlyExpenses,
      stretch: monthlyIncome * 0.36 - monthlyExpenses,
      aggressive: monthlyIncome * 0.43 - monthlyExpenses,
    },
  };
}

//#endregion

// #region - Calculate housing affordability

// Function to calculate the monthly mortgage payment
function calculateMonthlyMortgagePayment(
  principal,
  annualInterestRate,
  termYears
) {
  // Convert annual interest rate to monthly (divide by 12 months and 100 for percentage)
  const monthlyInterestRate = annualInterestRate / 100 / 12;

  // Calculate total number of payments (years * 12 months)
  const totalPayments = termYears * 12;

  // Use standard mortgage payment formula: P * (r(1+r)^n)/((1+r)^n-1)
  // where P = principal, r = monthly rate, n = total number of payments
  const monthlyPayment =
    (principal * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));

  return monthlyPayment;
}

// Calculate monthly thresholds based on income and expenses
function calculateAffordabilityThresholds(monthlyGrossIncome, monthlyExpenses) {
  return {
    // Calculate maximum affordable payment for each DTI threshold
    affordable:
      monthlyGrossIncome * AFFORDABILITY_DTI.AFFORDABLE - monthlyExpenses,
    stretch: monthlyGrossIncome * AFFORDABILITY_DTI.STRETCH - monthlyExpenses,
    aggressive:
      monthlyGrossIncome * AFFORDABILITY_DTI.AGGRESSIVE - monthlyExpenses,
  };
}

// Determine which affordability category a payment falls into
function determineAffordabilityCategory(monthlyPayment, thresholds) {
  // Check payment against thresholds from most affordable to least
  if (monthlyPayment <= thresholds.affordable) return "Affordable";
  if (monthlyPayment <= thresholds.stretch) return "Stretch";
  if (monthlyPayment <= thresholds.aggressive) return "Aggressive";
  return "Out of reach";
}

// Get the appropriate interest rate based on mortgage term
function getInterestRate(zipData, mortgageTerm) {
  // Return 15-year rate for 15-year mortgages, otherwise 30-year rate
  return mortgageTerm === 15
    ? parseFloat(zipData.mortgage_15_rate)
    : parseFloat(zipData.mortgage_30_rate);
}

// Calculate the back-end DTI ratio
function calculateBackEndDTI(totalMonthlyDebt, monthlyGrossIncome) {
  // Convert to percentage and round to nearest integer
  return Math.round((totalMonthlyDebt / monthlyGrossIncome) * 100);
}

// Function to cache data
const DataCache = {
  // Cache for ZIP code calculations
  zipCache: new Map(),

  // Cache for hexagon calculations
  hexagonCache: new Map(),

  // Store ZIP code calculation result
  setZipResult(zipCode, result) {
    this.zipCache.set(zipCode, {
      result,
      timestamp: Date.now(),
    });
  },

  // Get cached ZIP code result if fresh (less than 1 hour old)
  getZipResult(zipCode) {
    const cached = this.zipCache.get(zipCode);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.result;
    }
    return null;
  },

  // Clear old cache entries
  cleanup() {
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, value] of this.zipCache.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.zipCache.delete(key);
      }
    }
  },
};

// Function to check if housing is affordable based on user input and housing data
function calculateHousingAffordability(
  zipCode,
  annualIncome,
  downPayment,
  monthlyExpenses,
  mortgageTerm,
  thresholds
) {
  // At the start of the function
  const cachedResult = DataCache.getZipResult(zipCode);
  if (cachedResult) return cachedResult;

  // #region - Input validation

  // Check if housing data is loaded
  if (!housingData) {
    console.error("Housing data not loaded");
    return null;
  }

  // Look up ZIP code data
  const zipCodeData = housingData.find((data) => data.zip === zipCode);
  if (!zipCodeData) {
    console.error("Housing data not found for zip code:", zipCode);
    return null;
  }

  //#endregion

  // #region - Extract and calculate basic values

  // Get home price and validate it
  const medianHomePrice = parseFloat(zipCodeData.median_sale_price);
  if (isNaN(medianHomePrice)) {
    console.error("Invalid median home price for zip code:", zipCode);
    return null;
  }

  // Calculate monthly income
  const monthlyGrossIncome = annualIncome / 12;

  // Get appropriate interest rate
  const interestRate = getInterestRate(zipCodeData, mortgageTerm);

  // Calculate loan amount (home price minus down payment)
  const loanAmount = medianHomePrice - downPayment;

  //#endregion

  // #region - Calculate mortgage and affordability

  // Calculate monthly mortgage payment
  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
    loanAmount,
    interestRate,
    mortgageTerm
  );

  // Calculate total monthly debt payments
  const totalMonthlyDebt = monthlyMortgagePayment + monthlyExpenses;

  // Calculate back-end DTI ratio
  const backEndDTIRatio = calculateBackEndDTI(
    totalMonthlyDebt,
    monthlyGrossIncome
  );

  // Determine affordability category
  const affordabilityCategory = determineAffordabilityCategory(
    monthlyMortgagePayment,
    thresholds
  );

  //#endregion

  // #region - Return results

  return {
    medianHomePrice,
    monthlyMortgagePayment,
    interestRate,
    affordabilityCategory,
    affordabilityThresholds: thresholds,
    backEndDTIRatio,
    analysis: {
      loanAmount,
      monthlyGrossIncome,
      totalMonthlyDebt,
      downPaymentPercentage: (downPayment / medianHomePrice) * 100,
    },
  };

  // At the end of the function
  DataCache.setZipResult(zipCode, results);
  //#endregion
}

// Function to update UI with results
function displayAffordabilityResults(results) {
  let resultsHtml = `<h3>Housing Affordability</h3>`;
  resultsHtml += `<p>Median home price in area: $${results.medianHomePrice.toLocaleString()}</p>`;
  resultsHtml += `<p>Monthly mortgage payment in area: $${results.monthlyMortgagePayment.toFixed(
    0
  )}</p>`;
  resultsHtml += `<p>Debt-to-income ratio: ${results.backEndDTIRatio.toFixed(
    0
  )}%</p>`; // Display the DTI ratio
  resultsHtml += `<p>Affordability category for user in area: ${results.affordabilityCategory}</p>`;

  // Update the inner HTML of the resultsMessage div
  document.getElementById("resultsMessage").innerHTML += resultsHtml;
}

function updateUIWithGeospatialAnalysis(hexagonAggregatedData) {
  let hexResultsHtml = "<h3>Geospatial Analysis Results</h3>";

  // Add summary statistics
  const totalHexagons = Object.keys(hexagonAggregatedData).length;
  const affordableCounts = {
    Affordable: 0,
    Stretched: 0,
    Aggressive: 0,
    "Out of reach": 0,
  };

  Object.values(hexagonAggregatedData).forEach((data) => {
    affordableCounts[data.affordability]++;
  });

  hexResultsHtml += `
        <div class="summary-stats">
            <p>Total areas analyzed: ${totalHexagons}</p>
            <p>Affordable areas: ${affordableCounts["Affordable"]}</p>
            <p>Stretch areas: ${affordableCounts["Stretched"]}</p>
            <p>Aggressive areas: ${affordableCounts["Aggressive"]}</p>
            <p>Out of reach areas: ${affordableCounts["Out of reach"]}</p>
        </div>
    `;

  // Sort hexagons by distance
  const sortedHexagons = Object.entries(hexagonAggregatedData).sort(
    (a, b) => a[1].distanceToTargetZip - b[1].distanceToTargetZip
  );

  // Display detailed results
  sortedHexagons.forEach(([hexagon, data]) => {
    const zipCount = data.zipCodes.length;
    hexResultsHtml += `
        <div class="hexagon-result ${data.affordability
          .toLowerCase()
          .replace(" ", "-")}">
            <h4>Area ${hexagon.slice(-6)}</h4>
            <p>Distance from target: ${data.distanceToTargetZip.toFixed(
              1
            )} miles</p>
            <p>Average Home Price: $${data.averageMedianPrice.toLocaleString()}</p>
            <p>Monthly Payment: $${data.monthlyMortgagePayment.toFixed(2)}</p>
            <p>Affordability: ${data.affordability}</p>
            <p>Number of ZIP codes in area: ${zipCount}</p>
            <details>
                <summary>Show ZIP codes (${zipCount})</summary>
                <p class="zip-list">${data.zipCodes.sort().join(", ")}</p>
            </details>
        </div>`;
  });

  // Add some styling
  const style = `
        <style>
            .hexagon-result { 
                border: 1px solid #ccc; 
                margin: 10px 0; 
                padding: 15px;
                border-radius: 5px;
            }
            .affordable { background-color: #e8f5e9; }
            .stretched { background-color: #fff3e0; }
            .aggressive { background-color: #ffebee; }
            .out-of-reach { background-color: #fafafa; }
            .summary-stats {
                background-color: #f5f5f5;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
            }
            .zip-list {
                max-height: 100px;
                overflow-y: auto;
                padding: 10px;
                background: #fff;
                border-radius: 3px;
            }
        </style>
    `;

  document.getElementById("resultsMessage").innerHTML = style + hexResultsHtml;
}

//#endregion

// #region - Initialize the application

// Initialize the application when document is ready
$(document).ready(function () {
  // Load housing data first
  loadDataFromGoogleSheet(url);

  // Attach the form submission handler
  $("#affordabilityForm").submit(function (event) {
    event.preventDefault();

    const resultsDiv = document.getElementById("resultsMessage");
    resultsDiv.innerHTML = "";

    try {
      // Get form data
      const formData = getFormData();
      console.log("Form data:", formData);

      // Look up ZIP code data first
      const zipData = housingData.find((data) => data.zip === formData.zipCode);
      if (!zipData) {
        throw new Error(`No data found for ZIP code ${formData.zipCode}`);
      }
      console.log("ZIP data found:", zipData);

      // Calculate affordability thresholds
      const thresholds = calculateAffordabilityThresholds(
        formData.annualIncome / 12,
        formData.monthlyExpenses
      );

      // Calculate initial affordability
      const affordabilityData = calculateHousingAffordability(
        formData.zipCode,
        formData.annualIncome,
        formData.downPayment,
        formData.monthlyExpenses,
        formData.mortgageTerm,
        thresholds
      );

      if (affordabilityData) {
        displayAffordabilityResults(affordabilityData);

        // Get coordinates for spatial analysis
        const targetLat = parseFloat(zipData.Latitude);
        const targetLng = parseFloat(zipData.Longitude);

        if (!isValidCoordinates(targetLat, targetLng)) {
          throw new Error(
            `Invalid coordinates for ZIP code ${formData.zipCode}`
          );
        }

        console.log(
          `Target coordinates for analysis: ${targetLat}, ${targetLng}`
        );

        // Perform geospatial analysis with coordinates
        const hexagonData = performGeospatialAnalysis(
          formData.zipCode,
          affordabilityData.interestRate,
          formData.downPayment,
          formData.mortgageTerm,
          thresholds,
          {
            targetLat: targetLat,
            targetLng: targetLng,
          }
        );

        if (hexagonData && Object.keys(hexagonData).length > 0) {
          console.log("Updating UI with hexagon data...");
          updateUIWithGeospatialAnalysis(hexagonData);
        } else {
          resultsDiv.innerHTML += `
                        <div class="warning" style="padding: 15px; background-color: #fff3e0; margin-top: 20px; border-radius: 5px;">
                            No nearby areas found in the analysis. Try adjusting the search parameters.
                        </div>`;
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      resultsDiv.innerHTML += `
                <div class="error" style="padding: 15px; background-color: #ffebee; margin-top: 20px; border-radius: 5px;">
                    Error performing analysis: ${error.message}
                </div>`;
    }
  });

  // Add input validation for ZIP code
  $("#zipCode").on("input", function () {
    const zipCode = $(this).val();
    const zipValidation = $("#zipValidation");
    const calculateButton = $("#calculateButton");

    const validationResult = validateZipCode(zipCode);

    zipValidation
      .text(validationResult.message)
      .removeClass("success error")
      .addClass(validationResult.isValid ? "success" : "error");

    calculateButton.prop("disabled", !validationResult.isValid);

    if (validationResult.isValid) {
      setTimeout(() => {
        zipValidation.text("").removeClass("success");
      }, 5000);
    }
  });

  // Optional: Pre-fill form with debug values
  if (window.location.hostname === "localhost") {
    $("#zipCode").val("78745");
    $("#income").val("75000");
    $("#downPayment").val("10000");
    $("#monthlyExpenses").val("600");
    $("#mortgageTerm").val("30");
  }
});

//#endregion
