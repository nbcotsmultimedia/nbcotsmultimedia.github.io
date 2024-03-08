//TODO - Add drop-down validator for user input zip code
//NOTE - Will have to somehow combine data with geocode in processing

//#region - Global variables
let housingData; // Store housing data
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv';
const defaultResolution = 6; // Set a default H3 resolution
const bufferRadius = 5; // Define buffer radius
//#endregion

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

// Function to create hexagonal grids for a list of areas
function generateH3Hexagons(bufferZones, resolution = defaultResolution) {

    // Initialize an empty array to store H3 hexagons
    const h3Hexagons = [];

    // Define the number of rings of hexagons to generate around each area's center
    const k = 3;

    console.log(`Generating H3 hexagons with resolution ${resolution} and k value ${k}`);

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

    console.log('All H3 hexagons generated');

    return h3Hexagons; // When function complete, output the array h3Hexagons
}

// Function to create circular buffer zones around a list of geographic coordinates
function generateBufferZone(zipCodeData, bufferRadius) {
    const latitude = parseFloat(zipCodeData.Latitude);
    const longitude = parseFloat(zipCodeData.Longitude);

    if (!isNaN(latitude) && !isNaN(longitude)) {
        const centroid = [longitude, latitude]; // Make sure to swap the order
        const bufferZone = turf.buffer(turf.point(centroid), bufferRadius, { units: 'miles' });
        return bufferZone;
    } else {
        console.error('Invalid latitude or longitude for zip code:', zipCodeData.zip);
    }
}

// When DOM is ready...
$(document).ready(function() {
    
    // Function to calculate housing affordability
    function calculateHousingAffordability(zipCode, annualIncome, downPayment, monthlyExpenses, mortgageTerm) {
            
        console.log("Calculating housing affordability...");
        console.log("Housing data:", housingData);

        // Placeholder for calculations
        const results = {};

        // Find housing data for the given zip code
        const zipCodeData = housingData.find(row => row.zip === zipCode);

        if (!zipCodeData) {
            console.error("Housing data not found for zip code:", zipCode);
            return null;
        }

        // Retrieve median sales price and interest rates from the housing data
        const medianHomePrice = parseFloat(zipCodeData.median_sale_price);
        const interestRate30Year = parseFloat(zipCodeData.mortgage_30_rate);
        const interestRate15Year = parseFloat(zipCodeData.mortgage_15_rate);

        // Determine loan amount by subtracting down payment from home price
        const loanAmount = medianHomePrice - downPayment;

        // Determine interest rate based on mortgage term
        let interestRate;
        if (mortgageTerm === 15) {
            interestRate = interestRate15Year;
        } else {
            interestRate = interestRate30Year;
        }

        // Calculate monthly mortgage payment for median home using loan amortization formula
        const monthlyInterestRate = (interestRate / 100) / 12; // Convert annual interest rate percentage to monthly decimal rate
        const totalNumberOfPayments = mortgageTerm * 12; // Convert loan term from years to months
        const monthlyZipMortgagePayment = (loanAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -totalNumberOfPayments));

        // Calculate user's monthly gross income
        const monthlyGrossIncome = annualIncome / 12;

        // Calculate maximum allowable housing costs based on DTI
        const affordableHousingCosts = monthlyGrossIncome * 0.28;
        const stretchedHousingCosts = (monthlyGrossIncome * 0.36) - monthlyExpenses;
        const maxAllowableDebtForMortgages = (monthlyGrossIncome * 0.43) - monthlyExpenses;

        // Compare user's affordability to monthly housing costs in target zip
        if (monthlyZipMortgagePayment <= affordableHousingCosts) {
            results.affordability = "Affordable";
        } else if (monthlyZipMortgagePayment <= stretchedHousingCosts) {
            results.affordability = "Stretched";
        } else if (monthlyZipMortgagePayment <= maxAllowableDebtForMortgages) {
            results.affordability = "Aggressive";
        } else {
            results.affordability = "Out of reach";
        }

        // Log affordability details
        console.log("Median home price ($):", medianHomePrice);
        console.log("User input for down payment ($):", downPayment);
        console.log("Loan amount (median sale price less down payment) ($):", loanAmount);
        console.log("Interest rate (%):", interestRate);
        console.log("Zip monthly payment ($):", monthlyZipMortgagePayment);
        console.log("Monthly gross income ($):", monthlyGrossIncome);
        console.log("Maximum affordable housing costs based on DTI ($):", affordableHousingCosts);
        console.log("Stretched housing costs based on DTI ($):", stretchedHousingCosts);
        console.log("Maximum allowable debt for mortgages based on DTI ($):", maxAllowableDebtForMortgages);
        console.log("Affordability category:", results.affordability);

        // Add calculated values to the results object
        results.medianHomePrice = medianHomePrice;
        results.maxAffordableHousingCosts = affordableHousingCosts;
        results.monthlyZipMortgagePayment = monthlyZipMortgagePayment;

        // Return results
        return results;
    }

    // Function to display results
    function displayResults(results) {
        // Construct the message
        let message = "The median sale price of homes in this area is $" + results.medianHomePrice.toLocaleString() + "<br />";

        // Include how much these homes in this area cost per month given sales price, down payment, mortgage term, and interest rates
        message += "The monthly mortgage payment for these homes in this area is $" + results.monthlyZipMortgagePayment.toLocaleString() + " based on the sales price, your down payment, mortgage term, and interest rates.<br/>";

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
        message += "You should spend no more than $" + results.maxAffordableHousingCosts.toLocaleString() + " on housing per month.<br />";

        // Display the message in a specific HTML element
        $('#resultsMessage').html(message);
    }

    // Function to handle form submission
    function handleFormSubmission() {
        
        // Get form inputs
        const zipCode = $('#zipCode').val();
        const annualIncome = parseFloat($('#income').val());
        const downPayment = parseFloat($('#downPayment').val());
        const monthlyExpenses = parseFloat($('#monthlyExpenses').val());
        const mortgageTerm = parseInt($('#mortgageTerm').val());

        // Perform calculations only for the selected zip code
        const results = calculateHousingAffordability(zipCode, annualIncome, downPayment, monthlyExpenses, mortgageTerm);

        // Find the housing data for the selected zip code
        const selectedZipCodeData = housingData.find(data => data.zip === zipCode);

        if (!selectedZipCodeData) {
            console.error("Zip code data not found for:", zipCode);
            return;
        }

        // Generate buffer zone for the selected zip code
        const selectedBufferZone = generateBufferZone(selectedZipCodeData, 100); // Using 100 miles as the buffer radius

        // Generate H3 hexagons covering the buffer zone for the selected zip code
        const h3HexagonsForSelectedZip = generateH3Hexagons([selectedBufferZone]);
        console.log('hexagons for this zips buffer zone:', h3HexagonsForSelectedZip);

        // Display results
        displayResults(results);

    }

    // Function to load data from Google Sheet
    function loadDataFromGoogleSheet(url) {
        // Parse data from the Google sheet
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // console.log('Parsed housing data:', results.data);
                // Store parsed data in the global variable
                housingData = results.data;
                // Once data is loaded, call the function to handle form submission
                $('#calculateButton').prop('disabled', false);
            },
            error: function(error) {
                console.error('Error while fetching and parsing CSV:', error);
            }
        });
    }

    // Call the function to load data from the Google Sheet
    loadDataFromGoogleSheet(url);

    // Handle form submission
    $('#affordabilityForm').submit(function(event) {
        // Prevent the default form submission behavior
        event.preventDefault();
        // Handle the form submission
        handleFormSubmission();
    });

    // Auto-populate form fields with debug values
    $('#zipCode').val('78745');
    $('#income').val('75000');
    $('#downPayment').val('10000');
    $('#monthlyExpenses').val('600');
    $('#mortgageTerm').val('30');

});