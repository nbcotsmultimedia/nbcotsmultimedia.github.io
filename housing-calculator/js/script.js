//#region - Notes
//TODO - Add drop-down validator for user input zip code
//NOTE - Will have to somehow combine data with geocode in processing
//TODO - Add insurance costs
//TODO - Calculate distance of hexagon from target zip
//TODO - Compare monthly mortgage costs of hexagon to user affordability thresholds
//TODO - Check for redundant functions (calculate monthly mortgage costs)
//TODO - Expand hexagon classification to include aggressive and out of reach
//#endregion

//#region - Set global variables
let housingData; // Store housing data in empty variable
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv";
const defaultResolution = 6; // Set a default H3 grid resolution
const bufferRadius = 5; // Define buffer radius in miles
//#endregion

//#region - Spatial analysis

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

  console.log(
    `STATUS: Generating H3 hexagons with resolution ${resolution} and k value ${k}`
  );

  // Iterate over each entry in bufferZones
  bufferZones.forEach((bufferZone, index) => {
    // Calculate the H3 index of the centroid of the centroid
    const centroidIndex = calculateCentroidIndex(bufferZone, resolution);

    console.log(`STATUS: Generating hexagons for centroids`);

    // Generate a cluster of hexagons around the center index
    const hexagons = h3.gridDisk(centroidIndex, k);

    // Store the generated H3 hexagons in the h3Hexagons array
    h3Hexagons.push(hexagons);
  });

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

    console.log("~ GENERATE HEXAGONS ~");
    console.log("STATUS: Generated buffer zone for zip:", zipCodeData.zip);

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

//#region - Retrieve and parse data

// Function to fetch and parse data from Google Sheet
function loadDataFromGoogleSheet(url) {
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function (results) {
      housingData = results.data;
      console.log(
        "STATUS: Loaded " + housingData.length + " entries of housing data"
      );
      $("#calculateButton").prop("disabled", false);
    },

    error: function (error) {
      console.error("STATUS: Error while fetching and parsing CSV:", error);
      alert("STATUS: Failed to load housing data. Please try again later");
    },
  });
}

// Function to retrieve data from user form
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

//#region - Calculate housing affordability

// Function to calculate the monthly mortgage payment
function calculateMonthlyMortgagePayment(
  principal, // The principal amount of the loan
  annualInterestRate, // Annual interest rate
  termYears // The term of the loan in years
) {
  // Convert the annual interest rate to a monthly rate.
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  // Calculate the total number of monthly payments over the term of the loan.
  const totalPayments = termYears * 12;
  // Calculate and return the monthly mortgage payment using the formula for an amortized loan.
  return (
    (principal * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalPayments))
  );
}

// Function to check if housing is affordable based on user input and housing data
function calculateHousingAffordability(
  zipCode, // User's ZIP code
  annualIncome, // User's annual income
  downPayment, // User's down payment
  monthlyExpenses, // User's monthly expenses excluding mortgage
  mortgageTerm, // Desired term of the mortgage in years
  thresholds // Affordability thresholds
) {
  const { affordable, stretch, aggressive } = thresholds; // Destructure the thresholds object

  //#region - Look up and extract housing data for the given ZIP code
  const zipCodeData = housingData.find((data) => data.zip === zipCode);
  if (!zipCodeData) {
    console.error("Housing data not found for zip code:", zipCode);
    return null; // Exit if no data found for ZIP code
  }

  // Extract necessary data from the ZIP code data.
  const medianHomePrice = parseFloat(zipCodeData.median_sale_price);
  const interestRate =
    mortgageTerm === 15
      ? parseFloat(zipCodeData.mortgage_15_rate)
      : parseFloat(zipCodeData.mortgage_30_rate);
  //#endregion

  //#region - Calculate the monthly mortgage payment based on the inputs
  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
    medianHomePrice - downPayment, // Loan amount after down payment
    interestRate, // Interest rate
    mortgageTerm // Mortgage term
  );
  //#endregion

  //#region - Calculate the user's monthly gross income
  const monthlyGrossIncome = annualIncome / 12;
  //#endregion

  //#region - Calculate the back-end debt-to-income ratio for additional insight
  const totalMonthlyDebt = monthlyMortgagePayment + monthlyExpenses; // Including mortgage and other expenses
  const backEndDTIRatio = Math.round(
    (totalMonthlyDebt / monthlyGrossIncome) * 100
  );
  //#endregion

  //#region - Structure to hold the results of the affordability calculation
  const results = {
    medianHomePrice,
    monthlyMortgagePayment,
    interestRate,
    affordabilityCategory: "",
    affordabilityThresholds: {
      affordable,
      stretch,
      aggressive,
    },
    backEndDTIRatio, // Include the calculated DTI ratio in the results
  };
  //#endregion

  //#region - Determine the affordability category based on where the monthly payment falls within the thresholds
  if (monthlyMortgagePayment <= results.affordabilityThresholds.affordable) {
    results.affordabilityCategory = "Affordable";
  } else if (
    monthlyMortgagePayment <= results.affordabilityThresholds.stretch
  ) {
    results.affordabilityCategory = "Stretch";
  } else if (
    monthlyMortgagePayment <= results.affordabilityThresholds.aggressive
  ) {
    results.affordabilityCategory = "Aggressive";
  } else {
    results.affordabilityCategory = "Out of reach";
  }
  //#endregion

  //#region - Log the calculated results for review
  console.log(`~ AFFORDABILITY CALCULATION RESULTS ~
- User affordable payment threshold: ${results.affordabilityThresholds.affordable}
- User stretch payment threshold: ${results.affordabilityThresholds.stretch}
- User aggressive payment threshold: ${results.affordabilityThresholds.aggressive}`);
  //#endregion

  // Return the results object with all calculated values
  return results;
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

//#endregion

//#region - Initialize the application

$(document).ready(function () {
  // Function to manage the form submission process
  function handleFormSubmission() {
    // Prevent default form submission behavior
    event.preventDefault();

    //#region - Step 1: Retrieve form data
    const formData = getFormData();
    console.log("~ RETRIEVE FORM DATA ~", formData); // Log form data to ensure it's correctly retrieved
    //#endregion

    //#region - Step 2: Perform main affordability calculation for the selected zip
    const affordabilityData = calculateHousingAffordability(
      formData.zipCode,
      formData.annualIncome,
      formData.downPayment,
      formData.monthlyExpenses,
      formData.mortgageTerm,
      thresholds
    );
    //#endregion

    // Extract thresholds from affordability data
    const { affordable, stretch, aggressive } =
      affordabilityData.affordabilityThresholds;

    // Call geospatial analysis with thresholds
    const hexagonAggregatedData = performGeospatialAnalysis(
      formData.zipCode,
      affordabilityData.interestRate,
      formData.downPayment,
      formData.mortgageTerm,
      { affordable, stretch, aggressive }
    );

    // Step 4: Update UI with geospatial analysis results
    updateUIWithGeospatialAnalysis(hexagonAggregatedData);
  }

  // Function to generate buffer, create hexagons, and aggregate data
  function performGeospatialAnalysis(
    zipCode,
    interestRate,
    downPayment,
    mortgageTerm,
    { affordable, stretch, aggressive }
  ) {
    //#region - Find spatial data for zip
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
    //#endregion

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

        // Use the thresholds to determine affordability classification
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

        // Log the details for each hexagon as it's processed
        // console.log(
        //   "Hexagon " +
        //     hexagon +
        //     " details:\n" +
        //     "- Average median sale price: $" +
        //     averageMedianPrice.toFixed(2) +
        //     "\n" +
        //     "- Average monthly mortgage payment: $" +
        //     monthlyMortgagePayment.toFixed(2) +
        //     "\n" +
        //     "- Affordability classification for user: " +
        //     affordability +
        //     "\n" +
        //     "- Distance to target zip: " +
        //     distanceToTargetZip.toFixed(2) +
        //     " miles"
        // );

        // Store the calculated data in hexagonAggregatedData
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
    let hexResultsHtml = "<h3>Geospatial Analysis Results</h3>";

    Object.entries(hexagonAggregatedData).forEach(([hexagon, data]) => {
      hexResultsHtml += `
      <div class="hexagon-result">
        <h4>Hexagon: ${hexagon}</h4>
        <p>Average Median Home Price: $${data.averageMedianPrice.toLocaleString()}</p>
        <p>Monthly Mortgage Payment: $${data.monthlyMortgagePayment.toFixed(
          2
        )}</p>
        <p>Affordability: ${data.affordability}</p>
        <p>Distance to Target ZIP: ${data.distanceToTargetZip.toFixed(
          2
        )} miles</p>
      </div>`;
    });

    // Append the HTML to the resultsMessage div
    document.getElementById("resultsMessage").innerHTML += hexResultsHtml;

    // Optionally, make the div visible if it's initially hidden
    document.getElementById("resultsMessage").style.display = "block";

    // Detailed console log for geospatial analysis results
    console.log("~ GEOSPATIAL ANALYSIS RESULTS ~");

    // Arrays to store hexagons classified as affordable, stretched, aggressive, and out of reach
    const affordableHexagons = [];
    const stretchedHexagons = [];
    const aggressiveHexagons = [];
    const outOfReachHexagons = [];

    // Iterate through hexagon aggregated data
    Object.entries(hexagonAggregatedData).forEach(([hexagon, data]) => {
      // Classify the hexagon by affordability and push it to the corresponding array
      switch (data.affordability) {
        case "Affordable":
          affordableHexagons.push(hexagon);
          break;
        case "Stretched":
          stretchedHexagons.push(hexagon);
          break;
        case "Aggressive":
          aggressiveHexagons.push(hexagon);
          break;
        case "Out of reach": // Add this case
          outOfReachHexagons.push(hexagon); // Add this line
          break;
      }
    });

    // Log the hexagons classified, with details

    console.log("Hexagons classified as affordable:");
    affordableHexagons.forEach((hexagon) => {
      const data = hexagonAggregatedData[hexagon];
      if (data) {
        console.log(
          `- Hexagon ID: ${hexagon}\n` +
            `  Average Median Home Price: $${data.averageMedianPrice.toLocaleString()}\n` +
            `  Calculated Monthly Mortgage Payment: $${data.monthlyMortgagePayment.toFixed(
              2
            )}\n` +
            `  Distance to Target ZIP Code: ${data.distanceToTargetZip.toFixed(
              2
            )} miles\n`
        );
      } else {
        console.log(`- Hexagon ID: ${hexagon}\n  No data available`);
      }
    });

    console.log("Hexagons classified as stretch:");
    stretchedHexagons.forEach((hexagon) => {
      const data = hexagonAggregatedData[hexagon];
      if (data) {
        console.log(
          `- Hexagon ID: ${hexagon}\n` +
            `  Average Median Home Price: $${data.averageMedianPrice.toLocaleString()}\n` +
            `  Calculated Monthly Mortgage Payment: $${data.monthlyMortgagePayment.toFixed(
              2
            )}\n` +
            `  Distance to Target ZIP Code: ${data.distanceToTargetZip.toFixed(
              2
            )} miles\n`
        );
      } else {
        console.log(`- Hexagon ID: ${hexagon}\n  No data available`);
      }
    });

    console.log("Hexagons classified as aggressive:");
    aggressiveHexagons.forEach((hexagon) => {
      const data = hexagonAggregatedData[hexagon];
      if (data) {
        console.log(
          `- Hexagon ID: ${hexagon}\n` +
            `  Average Median Home Price: $${data.averageMedianPrice.toLocaleString()}\n` +
            `  Calculated Monthly Mortgage Payment: $${data.monthlyMortgagePayment.toFixed(
              2
            )}\n` +
            `  Distance to Target ZIP Code: ${data.distanceToTargetZip.toFixed(
              2
            )} miles\n`
        );
      } else {
        console.log(`- Hexagon ID: ${hexagon}\n  No data available`);
      }
    });

    console.log("Hexagons classified as Out of reach:");
    outOfReachHexagons.forEach((hexagon) => {
      const data = hexagonAggregatedData[hexagon];
      if (data && data.affordability === "Out of reach") {
        console.log(
          `- Hexagon ID: ${hexagon}\n` +
            `  Average Median Home Price: $${data.averageMedianPrice.toLocaleString()}\n` +
            `  Calculated Monthly Mortgage Payment: $${data.monthlyMortgagePayment.toFixed(
              2
            )}\n` +
            `  Affordability Classification: Out of reach\n` +
            `  Distance to Target ZIP Code: ${data.distanceToTargetZip.toFixed(
              2
            )} miles\n`
        );
      } else {
        console.log(`- Hexagon ID: ${hexagon}\n  No data available`);
      }
    });
  }

  // Call the function to load data from the Google Sheet
  loadDataFromGoogleSheet(url);

  // Attach the form submission handler
  $("#affordabilityForm").submit(function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Clear previous results from the resultsMessage div
    document.getElementById("resultsMessage").innerHTML = "";

    // Step 1: Retrieve form data
    const formData = getFormData();

    // Log form data to ensure it's correctly retrieved
    console.log("~ RETRIEVE FORM DATA ~", formData);

    // Define the affordability thresholds based on conventional guidelines
    const thresholds = {
      affordable:
        (formData.annualIncome / 12) * 0.28 - formData.monthlyExpenses,
      stretch: (formData.annualIncome / 12) * 0.36 - formData.monthlyExpenses,
      aggressive:
        (formData.annualIncome / 12) * 0.43 - formData.monthlyExpenses,
    };

    // Step 2: Perform main affordability calculation for the selected zip
    const affordabilityData = calculateHousingAffordability(
      formData.zipCode,
      formData.annualIncome,
      formData.downPayment,
      formData.monthlyExpenses,
      formData.mortgageTerm,
      thresholds
    );

    // Display affordability results
    displayAffordabilityResults(affordabilityData);

    // Extract thresholds from affordability data for geospatial analysis
    const { affordable, stretch, aggressive } =
      affordabilityData.affordabilityThresholds;

    // Step 3: Geospatial analysis and additional affordability calculations
    const hexagonAggregatedData = performGeospatialAnalysis(
      formData.zipCode,
      affordabilityData.interestRate,
      formData.downPayment,
      formData.mortgageTerm,
      thresholds
    );

    // Step 4: Update UI with geospatial analysis results
    updateUIWithGeospatialAnalysis(hexagonAggregatedData);
  });

  //#region - Auto-populate form fields with debug values
  $("#zipCode").val("78745");
  $("#income").val("75000");
  $("#downPayment").val("10000");
  $("#monthlyExpenses").val("600");
  $("#mortgageTerm").val("30");
  //#endregion
});

//#endregion
