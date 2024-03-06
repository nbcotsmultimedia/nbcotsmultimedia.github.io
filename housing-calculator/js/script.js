
//#region - Set global variables
const affordable_threshold = 0.36;
const stretch_threshold = 0.42
let medianSalePricesData = []; // Global variable to store data from sheet

const defaultPropertyTaxRate = 1.10; // Average property tax rate as a percentage
const defaultInsuranceAmount = 1000; // Default annual home insurance amount in dollars
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv'
//#endregion

//#region - Get and organize data

// Call the function to load data from the sheet URL
loadDataFromGoogleSheet(url);

// Function to get and parse housing data
function loadDataFromGoogleSheet(url) {

    // Parse data from the Google sheet
    Papa.parse(url, { // take url as input
        download: true, // download the data from the url
        header: true, // first row contains column headers
        skipEmptyLines: true, // skip empty lines in the data set

        // Callback function that executes when parsing is complete, receive parsed data as "results"
        complete: function(results) {
            console.log('Parsed data:', results.data);

            // Store parsed data in global variable "medianSalePricesData"
            medianSalePricesData = results.data;

            // Call function to process data and perform calculations
            calculateAffordability();

            // Initialize autofill functionality after data is loaded
            const uniqueZipCodes = parseUniqueZipCodes(results.data);
            initializeAutofill(uniqueZipCodes);
        },

        // If there is an error during parsing, log error to console
        error: function(error) {
            console.error('Error while fetching and parsing CSV:', error);
        }
    });
}

// Function to parse unique zip codes from data
function parseUniqueZipCodes(data) {
    const zipCodes = new Set(); // Create a new set to store unique zip codes
    data.forEach(entry => {
        zipCodes.add(entry.zip); // Add each zip code to the set
    });
    return Array.from(zipCodes); // Convert the set to an array and return
}

// Function to initialize autofill functionality
function initializeAutofill(zipCodes) {
    const zipCodeInput = document.getElementById('zipCode');
    zipCodeInput.addEventListener('input', function() {
        const input = this.value;
        const matchingZipCodes = zipCodes.filter(zip => zip.startsWith(input));
        if (matchingZipCodes.length > 0) {
            const suggestions = matchingZipCodes.map(zip => `<option value="${zip}"></option>`).join('');
            zipCodeInput.setAttribute('list', 'zipCodeSuggestions');
            const dataList = document.getElementById('zipCodeSuggestions');
            dataList.innerHTML = suggestions;
        } else {
            zipCodeInput.removeAttribute('list');
        }
    });
}

//#endregion

// Function to trigger perform calculations
function calculateAffordability() {
    // Perform calculations only if both user input and median sale prices data are available
    if ($('#affordabilityForm')[0].checkValidity() && medianSalePricesData.length > 0) {
        performCalculations();
    }
}

// Function to perform calculations based on user input and sheet data
function performCalculations() {
    
    //#region - Capture the zip code input by the user, match to housing data
    const zipCode = $('#zipCode').val().trim();
    const zipCodeData = medianSalePricesData.find(data => data.zip === zipCode);

    // Check if zip code data is available
    if (!zipCodeData) {
        displayErrorMessage('zipCode', 'Data for this zip code is not available.');
        return;
    }
    //#endregion

    //#region - Receive and parse user input values
    // Use parseFloat to convert values to floats so they can be calculated
    const income = parseFloat($('#income').val()) || 0;
    const downPayment = parseFloat($('#downPayment').val()) || 0;
    const monthlyExpenses = parseFloat($('#monthlyExpenses').val()) || 0;

    // Optional fields - if input values not provided, use OR (||) to provide default values
    const propertyTaxRate = parseFloat($('#propertyTax').val()) || defaultPropertyTaxRate / 100;
    const insuranceCost = parseFloat($('#insuranceCost').val()) || defaultInsuranceAmount;
    const insuranceCostMonthly = insuranceCost / 12; // Convert annual insurance cost to monthly

    console.log(`Zip code from input: ${zipCode}`);
    console.log(`Annual income from input: ${income}`);
    console.log(`Down payment from input: ${downPayment}`);
    console.log(`Monthly expenses from input: ${monthlyExpenses}`);
    console.log(`Property tax rate from input or default: ${propertyTaxRate}`);
    console.log(`Annual insurance cost from input or default: ${insuranceCost}`);
    //#endregion

    //#region - Retrieve and parse the mortgage rate and zip median home price
    const mortgageRate = parseFloat(zipCodeData.mortgage_30_rate);
    const loanTerm = 30; // Assuming a 30-year loan term

    const medianHomePrice = parseFloat(zipCodeData.median_sale_price);

    console.log(`Mortgage rate from data: ${mortgageRate}`);
    console.log(`Zip median home price from data: ${medianHomePrice}`);
    //#endregion
    
    //#region - Calculate monthly income
    const monthlyIncome = income / 12;
    console.log(`User monthly income calculated: ${monthlyIncome}`);
    //#endregion

    //#region - Calculate monthly expenses, including est. mortgage payment

    // Monthly mortgage expenses
    const estimatedMonthlyMortgage = calculateMonthlyMortgage(
        medianHomePrice - downPayment,
        mortgageRate,
        loanTerm
    );
    console.log(`Monthly mortgage costs calculated: ${estimatedMonthlyMortgage}`);

    // Monthly expenses
    const totalMonthlyExpenses = monthlyExpenses + estimatedMonthlyMortgage + (medianHomePrice * propertyTaxRate / 12) + insuranceCostMonthly;
    console.log(`Total monthly expenses incl. mortgage calculated: ${totalMonthlyExpenses}`);

    //#endregion

    //#region - Calculate DTI ratio
    const dti = (totalMonthlyExpenses / monthlyIncome) * 100;
    console.log(`DTI: ${dti}%`);
    //#endregion

    //#region - Calculate the price at the top of the user's "affordable" range

    // Calculate the price at the top of the user's "affordable" range
    const availableForMortgageMonthly = monthlyIncome * affordable_threshold - totalMonthlyExpenses + estimatedMonthlyMortgage;
    const maxLoanAmount = calculateMaximumMortgage(availableForMortgageMonthly, mortgageRate, loanTerm);
    const affordableHomePrice = maxLoanAmount + downPayment;

    console.log(`Available monthly for mortgage calculated: ${availableForMortgageMonthly}`);
    console.log(`Maximum loan amount calculated: ${maxLoanAmount}`);
    console.log(`Affordable home price calculated: ${affordableHomePrice}`);
    //#endregion

    //#region - Calculate the price at the top of the user's "stretch" range

    // Calculate funds available to pay monthly mortgage payments with a slightly higher DTI
    const availableForStretchMonthly = monthlyIncome * stretch_threshold - totalMonthlyExpenses + estimatedMonthlyMortgage;

    // Calculate max loan possible considering available funds, mortgage rate, and loan term for the stretch range
    const maxLoanAmountStretch = calculateMaximumMortgage(availableForStretchMonthly, mortgageRate, loanTerm);
    const stretchHomePrice = maxLoanAmountStretch + downPayment;

    console.log(`Available monthly for stretch mortgage calculated: ${availableForStretchMonthly}`);
    console.log(`Maximum loan amount for stretch calculated: ${maxLoanAmountStretch}`);
    console.log(`Stretch home price calculated: ${stretchHomePrice}`);
    //#endregion

    //#region - Determine where median home price sits in user's affordability categories
    let homePriceCategory;

    if (affordableHomePrice >= medianHomePrice) {
        homePriceCategory = 'Affordable';
    } else if (stretchHomePrice >= medianHomePrice) {
        homePriceCategory = 'Stretch';
    } else {
        homePriceCategory = 'Out of reach';
    }

    console.log(`Home price category in target zip: ${homePriceCategory}`);
    //#endregion

    // Prepare result message
    const resultMessage = generateResultMessage(affordableHomePrice, medianHomePrice, dti, homePriceCategory, stretchHomePrice);

    // Update the UI with the result message
    updateUI(resultMessage);

    // console.log(resultMessage);
}

// Function to update the UI with the result message
function updateUI(resultMessage) {
    $('#resultsContainer').html(resultMessage);
}

// Function to generate the result message
function generateResultMessage(affordableHomePrice, medianHomePrice, dti, homePriceCategory, stretchHomePrice) {
    let message = "";

    if (homePriceCategory === 'Affordable') {
        message = `You can comfortably afford a home up to $${Math.round(affordableHomePrice).toLocaleString()}.<br>`;
        message += `If you wanted to stretch your budget, you could go up to $${Math.round(stretchHomePrice).toLocaleString()}.<br>`;
        message += `The median sale price of homes in this area is $${Math.round(medianHomePrice).toLocaleString()}. Based on your inputs, the prices of homes in this area are within your budget.`;
    } else if (homePriceCategory === 'Stretch') {
        message = `You can comfortably afford a home up to $${Math.round(affordableHomePrice).toLocaleString()}.<br>`;
        message += `If you wanted to stretch your budget, you could go up to $${Math.round(stretchHomePrice).toLocaleString()}.<br>`;
        message += `The median sale price of homes in this area is $${Math.round(medianHomePrice).toLocaleString()}. Based on your inputs, the prices of homes in this area are a bit challenging, but still feasible.`;
    } else {
        message = `You can comfortably afford a home up to $${Math.round(affordableHomePrice).toLocaleString()}.<br>`;
        message += `If you wanted to stretch your budget, you could go up to $${Math.round(stretchHomePrice).toLocaleString()}.<br>`;
        message += `The median sale price of homes in this area is $${Math.round(medianHomePrice).toLocaleString()}. Based on your inputs, the prices of homes in this area are currently not affordable for you.`;
    }

    return `
    <p>${message}</p>
    <p>TK message</p>
    `;
}

// Function to display error messages
function displayErrorMessage(fieldName, message) {
    // First, clear any previous error messages
    $(`.error-message`).remove();

    // Construct the error message HTML
    const errorMessage = `<div class="error-message">${message}</div>`;

    // Display the error message below the corresponding input field
    $(`#${fieldName}`).after(errorMessage);
}

//#region - Calculation functions

// Calculate monthly mortgage payments
function calculateMonthlyMortgage(principal, annualInterestRate, loanTerm) {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment =
        principal *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    return monthlyPayment;
}

// Calculate maximum affordable mortgage price
function calculateMaximumMortgage(monthlyPayment, annualInterestRate, loanTerm) {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const presentValue = monthlyPayment * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);
    console.log(`Calculated principal: ${presentValue}`);

    return presentValue;
}


//#endregion



// Capture user input via form and perform calculations
$(document).ready(function() {

    //#region - Autofill form fields for debugging
    // $('#zipCode').val('78749');
    $('#income').val('75000');
    $('#downPayment').val('10000');
    $('#monthlyExpenses').val('600');
    //#endregion

    // Form submission event handler
    $('#affordabilityForm').on('submit', function(event) {

        event.preventDefault(); // Prevent the default form behavior
        $('.error-message').remove(); // Clear any existing error messages

        // Check if data is available
        if ($('#affordabilityForm')[0].checkValidity() && medianSalePricesData.length > 0) {
            performCalculations();
        }
    });

});