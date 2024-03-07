//TODO - Add drop-down validator for user input zip code
//FIXME - Error reading in h3, despite bundled script called in html

//NOTE - Will have to somehow combine data with geocode in processing

//#region - Global variables
let housingData; // Store housing data
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv';
const bufferRadius = 5; // Define buffer radius
//#endregion

// Check if the H3 library is accessible
if (typeof h3 !== 'undefined') {
    console.log('H3 library is accessible!');
} else {
    console.log('H3 library is not accessible!');
}

// Function to generate H3 hexagons covering the buffer zones around zip code centroids
function generateH3Hexagons(bufferZones) {
    const h3Hexagons = [];
    const k = 3; // Adjust to change size of hexagons

    bufferZones.forEach(bufferZone => {
        // Get centroid point of the buffer zone
        const centroid = calculateCentroid(bufferZone); // Implement this function to calculate centroid

        // Generate H3 hexagons covering the buffer zone around the centroid
        const hexagons = h3.kRing(centroid, k); // Adjust k value as needed

        // Log generated hexagons
        console.log('Generated H3 hexagons:', hexagons);

        // Store the generated H3 hexagons
        h3Hexagons.push(hexagons);
    });

    return h3Hexagons;
}

// Function to calculate centroid of a polygon (buffer zone)
function calculateCentroid(polygon) {
    const centroid = turf.centerOfMass(polygon);
    return [centroid.geometry.coordinates[0], centroid.geometry.coordinates[1]];
}

// Define function to generate buffer zones around zip code centroids
function generateBufferZones(zipCodesData, bufferRadius) {
    const bufferZones = [];

    zipCodesData.forEach(zipCodeData => {
        const latitude = parseFloat(zipCodeData.Latitude);
        const longitude = parseFloat(zipCodeData.Longitude);

        // Check if latitude and longitude are valid numbers
        if (!isNaN(latitude) && !isNaN(longitude)) {
            const centroid = [longitude, latitude]; // Make sure to swap the order
            const bufferZone = turf.buffer(turf.point(centroid), bufferRadius, { units: 'miles' });
            bufferZones.push(bufferZone);
        } else {
            console.error('Invalid latitude or longitude:', zipCodeData);
        }
    });

    return bufferZones;
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
        console.log("Affordability details:");
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

        // Perform calculations
        const results = calculateHousingAffordability(zipCode, annualIncome, downPayment, monthlyExpenses, mortgageTerm);

        if (typeof h3 !== 'undefined') {
            console.log('H3 library is accessible!');
        } else {
            console.log('H3 library is not accessible!');
        };

        // Generate buffer zones
        const bufferZones = generateBufferZones(housingData, bufferRadius);
        console.log("buffer zones:", bufferZones);

        // Generate H3 hexagons covering the buffer zones
        const h3Hexagons = generateH3Hexagons(bufferZones);
        console.log(h3Hexagons);

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