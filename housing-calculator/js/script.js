//ANCHOR - Set global variables
const affordable_threshold = 0.36;
const stretch_threshold = 0.42
let medianSalePricesData = []; // Global variable to store data from sheet

//ANCHOR - Get data

// Function to load data using Papa Parse
function loadDataFromGoogleSheet(url) {
    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Log the parsed data
            console.log('Parsed data:', results.data);

            // Store parsed data in global variable
            medianSalePricesData = results.data;

            // Call function to process data and perform calculations
            processAndCalculate(results.data);
        },
        error: function(error) {
            console.error('Error while fetching and parsing CSV:', error);
        }
    });
}

// Function to process the parsed data and trigger perform calculations
function processAndCalculate(data) {
    // Perform calculations only if both user input and median sale prices data are available
    if ($('#affordabilityForm')[0].checkValidity() && medianSalePricesData.length > 0) {
        performCalculations();
    }
}

// Function to perform calculations based on user input and sheet data
function performCalculations() {
    // Capture the zip code input by the user
    const zipCode = $('#zipCode').val().trim();

    // Find the data for the provided zip code
    const zipCodeData = medianSalePricesData.find(data => data.zip === zipCode);

    if (!zipCodeData) {
        displayErrorMessage('zipCode', 'Data for this zip code is not available.');
        return;
    }

    // Capture and convert form values
    const income = parseFloat($('#income').val());
    const downPayment = parseFloat($('#downPayment').val());
    const monthlyExpenses = parseFloat($('#monthlyExpenses').val());
    const propertyTaxRate = parseFloat($('#propertyTax').val());
    const insuranceRate = parseFloat($('#insuranceRate').val());

    // Retrieve the mortgage rate from the data
    // Here, you need to find the relevant row in medianSalePricesData based on the user's zip code
    // You might need to loop through the data or use another method to find the correct row
    const mortgageRate = 4.5; // Example value, replace with the actual value from your data
    const loanTerm = 30; // default loan term in years

    // Perform calculations
    const affordableHomePrice = calculateAffordableHomePrice(monthlyExpenses, income, downPayment, propertyTaxRate, insuranceRate, mortgageRate, loanTerm);
    const dti = calculateDTI(monthlyExpenses, income);
    const affordabilityCategory = categorizeAffordability(dti);

    // Display results
    $('#resultsContainer').text(`Based on your input, an affordable home price for you would be up to $${affordableHomePrice.toFixed(2)}. Category: ${affordabilityCategory}`).show();
}

// Call the function to load data from the sheet URL
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv'
loadDataFromGoogleSheet(url);

//ANCHOR - Capture user input via form and perform calculations

$(document).ready(function() {
    $('#affordabilityForm').on('submit', function(event) {
        event.preventDefault(); // Prevent the default form behavior
        $('.error-message').remove(); // Clear any existing error messages
        validateInputs(); // Perform input validation
    });
});

//ANCHOR - Validation check functions

function validateInputs() {
    let isValid = true;
    // Check each input field
    $('input').each(function() {
        const value = $(this).val().trim(); // Get the trimmed value of the input field
        const fieldName = $(this).attr('id'); // Get the ID attribute of the input field

        // Check for empty value
        if (value === '') {
            isValid = false;
            displayErrorMessage(fieldName, 'This field is required.');
        } else {
            // Additional validation based on field type or range
            if (!$.isNumeric(value) || parseFloat(value) <= 0) {
                isValid = false;
                displayErrorMessage(fieldName, 'Please enter a valid positive number.');
            }
        }
    });

    // If all inputs are valid, perform calculations
    if (isValid) {
        performCalculations();
    }
}


function displayErrorMessage(fieldName, message) {
    // First, clear any previous error messages
    $(`.error-message`).remove();

    // Construct the error message HTML
    const errorMessage = `<div class="error-message">${message}</div>`;

    // Display the error message below the corresponding input field
    $(`#${fieldName}`).after(errorMessage);
}


//ANCHOR - Calculation functions

//#region - Calculate debt-to-income ratio
function calculateDTI(monthlyExpenses, income) {
    const monthlyIncome = income / 12;
    return monthlyExpenses / monthlyIncome;
}
//#endregion

//#region - Calculate monthly mortgage payments
function calculateMonthlyMortgage(principal, annualInterestRate, loanTerm) {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    return monthlyPayment;
}
//#endregion

//#region - Calculate affordable home price
function calculateAffordableHomePrice(monthlyExpenses, income, downPayment, propertyTaxRate, insuranceRate, mortgageRate, loanTerm) {
    const monthlyIncome = income / 12;
    const availableForMortgageMonthly = (monthlyIncome * affordable_threshold) - monthlyExpenses;

    // Calculate monthly property tax and insurance
    const monthlyPropertyTax = downPayment * (propertyTaxRate / 100) / 12;
    const monthlyInsurance = downPayment * (insuranceRate / 100) / 12;
    const totalMonthlyCosts = availableForMortgageMonthly - (monthlyPropertyTax + monthlyInsurance);

    // If the total monthly costs are negative, the user cannot afford a home in this zip code
    if (totalMonthlyCosts <= 0) {
        return 0; // This could alternatively return a string or handle it differently in your UI
    }

    // Use the totalMonthlyCosts to find out how much mortgage the user can afford
    const principal = calculateMaximumMortgage(totalMonthlyCosts, mortgageRate, loanTerm);

    // The affordable home price is the sum of the maximum mortgage and the down payment
    const affordableHomePrice = principal + downPayment;
    return affordableHomePrice;
}

function calculateMaximumMortgage(monthlyPayment, annualInterestRate, loanTerm) {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Calculate the principal of the loan based on the annuity formula
    const principal = (monthlyPayment * (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)) / (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments));

    return principal;
}

//#endregion

//#region - Affordability range based on DTI
function categorizeAffordability(dti) {
    // Assuming 0.36 is the cutoff for "affordable"
    if (dti <= affordable_threshold) {
        return 'Affordable';
    } else if (dti <= stretch_threshold) {
        return 'Stretch';
    } else {
        return 'Out of reach';
    }
}
//#endregion