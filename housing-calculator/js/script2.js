//#region - Set global variables
const affordable_threshold = 0.36;
const stretch_threshold = 0.42
let medianSalePricesData = []; // Global variable to store data from sheet

const defaultPropertyTaxRate = 1.10; // Average property tax rate as a percentage
const defaultInsuranceAmount = 1000; // Default annual home insurance amount in dollars
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv'
//#endregion

// Function to trigger data loading and calculations
function startProcess() {
    // Call the function to load data from the sheet URL
    loadDataFromGoogleSheet(url);
}

// Function to get and parse housing data
function loadDataFromGoogleSheet(url) {
    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('Parsed data:', results.data);
            medianSalePricesData = results.data;
            // Now that data is loaded, proceed with getting user input
            getUserInput();
        },
        error: function(error) {
            console.error('Error while fetching and parsing CSV:', error);
        }
    });
}

// Function to get user input
function getUserInput() {
    const zipCode = $('#zipCode').val().trim();
    const income = parseFloat($('#income').val()) || 0;
    const downPayment = parseFloat($('#downPayment').val()) || 0;
    const monthlyExpenses = parseFloat($('#monthlyExpenses').val()) || 0;
    const propertyTaxRate = parseFloat($('#propertyTax').val()) || defaultPropertyTaxRate / 100;
    const insuranceCost = parseFloat($('#insuranceCost').val()) || defaultInsuranceAmount;
    const mortgageTerm = parseFloat($('#mortgageTerm').val()) || 30;

    // Proceed with processing user input and data
    processInputAndData(zipCode, income, downPayment, monthlyExpenses, propertyTaxRate, insuranceCost, mortgageTerm);
}

// Function to process user input and housing data
function processInputAndData(zipCode, income, downPayment, monthlyExpenses, propertyTaxRate, insuranceCost, mortgageTerm) {
    const zipCodeData = medianSalePricesData.find(data => data.zip === zipCode);
    if (!zipCodeData) {
        displayErrorMessage('zipCode', 'Data for this zip code is not available.');
        return;
    }

    const mortgageRate = parseFloat(zipCodeData.mortgage_30_rate);
    const medianHomePrice = parseFloat(zipCodeData.median_sale_price);

    const monthlyIncome = income / 12;

    const estimatedMonthlyMortgage = calculateMonthlyMortgage(
        medianHomePrice - downPayment,
        mortgageRate,
        mortgageTerm
    );

    const totalMonthlyExpenses = monthlyExpenses + estimatedMonthlyMortgage + (medianHomePrice * propertyTaxRate / 12) + (insuranceCost / 12);

    const dti = (totalMonthlyExpenses / monthlyIncome) * 100;

    const availableForMortgageMonthly = monthlyIncome * affordable_threshold - totalMonthlyExpenses + estimatedMonthlyMortgage;
    const maxLoanAmount = calculateMaximumMortgage(availableForMortgageMonthly, mortgageRate, mortgageTerm);
    const affordableHomePrice = maxLoanAmount + downPayment;

    const availableForStretchMonthly = monthlyIncome * stretch_threshold - totalMonthlyExpenses + estimatedMonthlyMortgage;
    const maxLoanAmountStretch = calculateMaximumMortgage(availableForStretchMonthly, mortgageRate, mortgageTerm);
    const stretchHomePrice = maxLoanAmountStretch + downPayment;

    let homePriceCategory;

    if (affordableHomePrice >= medianHomePrice) {
        homePriceCategory = 'Affordable';
    } else if (stretchHomePrice >= medianHomePrice) {
        homePriceCategory = 'Stretch';
    } else {
        homePriceCategory = 'Out of reach';
    }

    const resultMessage = generateResultMessage(affordableHomePrice, medianHomePrice, dti, homePriceCategory, stretchHomePrice);
    updateUI(resultMessage);
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
    $(`.error-message`).remove();
    const errorMessage = `<div class="error-message">${message}</div>`;
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
    $('#affordabilityForm').on('submit', function(event) {
        event.preventDefault();
        $('.error-message').remove();
        startProcess();
    });
});
