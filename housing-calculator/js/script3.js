//TODO: Implement a drop-down validator for user input zip code
//NOTE: Combine data with geocode in processing
//TODO: Incorporate insurance costs calculations

//#region Global variables
let housingData; // Stores housing data from Google Sheets
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv";
const defaultResolution = 6; // Default H3 grid resolution
const bufferRadius = 5; // Buffer radius for creating buffer zones around points
//#endregion

//#region Spatial functions
function calculateCentroidIndex(bufferZone, resolution = defaultResolution) {
  const centroid = turf.centerOfMass(bufferZone);
  const [lng, lat] = centroid.geometry.coordinates; // Destructuring for clarity
  const centroidIndex = h3.latLngToCell(lat, lng, resolution);
  return centroidIndex;
}

function generateH3Hexagons(bufferZones, resolution = defaultResolution) {
  const h3Hexagons = [];
  const k = 3; // Number of hexagon rings around each centroid

  bufferZones.forEach((bufferZone) => {
    const centroidIndex = calculateCentroidIndex(bufferZone, resolution);
    const hexagons = h3.gridDisk(centroidIndex, k);
    h3Hexagons.push(hexagons);
  });

  return h3Hexagons;
}

function generateBufferZone({ Latitude, Longitude }, bufferRadius) {
  const lat = parseFloat(Latitude);
  const lng = parseFloat(Longitude);
  if (!isNaN(lat) && !isNaN(lng)) {
    const centroid = [lng, lat]; // GeoJSON uses [lng, lat] format
    return turf.buffer(turf.point(centroid), bufferRadius, { units: "miles" });
  } else {
    console.error("Invalid coordinates for zip code.");
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getHexagonCentroids(hexagons) {
  return hexagons.map((hexId) => h3.cellToLatLng(hexId));
}

function mapZipCodesToHexagons(zipCodes, hexagons) {
  const flatHexagons = hexagons.flat();
  const hexagonCentroids = getHexagonCentroids(flatHexagons);
  const zipToHexMap = {};

  zipCodes.forEach(({ zip, Latitude, Longitude }) => {
    const [zipLat, zipLng] = [parseFloat(Latitude), parseFloat(Longitude)];
    let closestHex = flatHexagons.reduce((closest, hexId, index) => {
      const [hexLat, hexLng] = hexagonCentroids[index];
      const distance = calculateDistance(zipLat, zipLng, hexLat, hexLng);
      return distance < (closest.distance || Infinity)
        ? { hexId, distance }
        : closest;
    }, {}).hexId;

    zipToHexMap[zip] = closestHex;
  });

  return zipToHexMap;
}
//#endregion

//#region Affordability Calculations
$(document).ready(function () {
  loadDataFromGoogleSheet(url); // Load housing data on document ready

  $("#affordabilityForm").submit(function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    handleFormSubmission(); // Process the form submission
  });

  function calculateHousingAffordability(
    zipCode,
    annualIncome,
    downPayment,
    monthlyExpenses,
    mortgageTerm
  ) {
    const zipCodeData = housingData.find(({ zip }) => zip === zipCode);
    if (!zipCodeData) {
      console.error("Housing data not found for zip code:", zipCode);
      return null;
    }

    // Extract relevant data from the zipCodeData object
    const { median_sale_price, mortgage_15_rate, mortgage_30_rate } =
      zipCodeData;
    const medianHomePrice = parseFloat(median_sale_price);
    const interestRate = parseFloat(
      mortgageTerm === 15 ? mortgage_15_rate : mortgage_30_rate
    );
    const loanAmount = medianHomePrice - downPayment;
    const monthlyInterestRate = interestRate / 100 / 12;
    const totalNumberOfPayments = mortgageTerm * 12;

    // Calculate monthly mortgage payment
    const monthlyZipMortgagePayment = calculateMonthlyMortgagePayment(
      loanAmount,
      monthlyInterestRate,
      totalNumberOfPayments
    );

    // Additional calculations for affordability
    const results = determineAffordability(
      annualIncome,
      downPayment,
      monthlyExpenses,
      monthlyZipMortgagePayment
    );
    logAffordabilityDetails(
      medianHomePrice,
      downPayment,
      loanAmount,
      interestRate,
      monthlyZipMortgagePayment,
      results
    );
    return results;
  }

  function determineAffordability(
    annualIncome,
    downPayment,
    monthlyExpenses,
    monthlyZipMortgagePayment
  ) {
    const monthlyGrossIncome = annualIncome / 12;
    const affordableHousingCosts = monthlyGrossIncome * 0.28;
    const stretchedHousingCosts = monthlyGrossIncome * 0.36 - monthlyExpenses;
    const maxAllowableDebtForMortgages =
      monthlyGrossIncome * 0.43 - monthlyExpenses;

    // Classify affordability based on calculated values
    let affordability;
    if (monthlyZipMortgagePayment <= affordableHousingCosts) {
      affordability = "Affordable";
    } else if (monthlyZipMortgagePayment <= stretchedHousingCosts) {
      affordability = "Stretched";
    } else if (monthlyZipMortgagePayment <= maxAllowableDebtForMortgages) {
      affordability = "Aggressive";
    } else {
      affordability = "Out of reach";
    }

    return {
      affordability,
      medianHomePrice: downPayment,
      monthlyZipMortgagePayment,
    };
  }

  function calculateMonthlyMortgagePayment(
    loanAmount,
    monthlyInterestRate,
    totalNumberOfPayments
  ) {
    return (
      (loanAmount * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -totalNumberOfPayments))
    );
  }

  function logAffordabilityDetails(
    medianHomePrice,
    downPayment,
    loanAmount,
    interestRate,
    monthlyZipMortgagePayment,
    results
  ) {
    console.log("Median home price ($):", medianHomePrice);
    console.log("User input for down payment ($):", downPayment);
    console.log(
      "Loan amount (median sale price less down payment) ($):",
      loanAmount
    );
    console.log("Interest rate (%):", interestRate);
    console.log("Zip monthly payment ($):", monthlyZipMortgagePayment);
    console.log("Affordability category:", results.affordability);
  }

  function displayResults(results) {
    // Function to display calculation results in the UI
  }

  function handleFormSubmission() {
    // Function to handle form submission
  }

  function loadDataFromGoogleSheet(url) {
    // Function to load and parse housing data from a Google Sheet
  }
});
// Function to construct and display a message detailing calculation results; automatically generates based on the 'results' object passed to it
function displayResults(results) {
  // Construct the message
  let message =
    "The median sale price of homes in this area is $" +
    results.medianHomePrice.toLocaleString() +
    "<br />";

  // Include how much these homes in this area cost per month given sales price, down payment, mortgage term, and interest rates
  message +=
    "The monthly mortgage payment for these homes in this area is $" +
    results.monthlyZipMortgagePayment.toLocaleString() +
    " based on the sales price, your down payment, mortgage term, and interest rates.<br/>";

  message += "Based on your inputs, the prices of homes in this area are ";

  // Determine affordability category and include it in the message
  if (results.affordability === "Affordable") {
    message += "within your budget.<br />";
  } else if (results.affordability === "Stretched") {
    message += "a bit challenging, but still feasible.<br />";
  } else if (results.affordability === "Aggressive") {
    message += "at the top of the limit for qualifying for a mortgage.<br />";
  } else {
    message += "out of reach for you.<br />";
  }

  // Calculate housing costs given selections and debt-to-income ratio
  message +=
    "You should spend no more than $" +
    results.maxAffordableHousingCosts.toLocaleString() +
    " on housing per month.<br />";

  // Display the message in a specific HTML element
  $("#resultsMessage").html(message);
}
