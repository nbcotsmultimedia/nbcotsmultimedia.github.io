//ANCHOR - Set global variables
const affordable_threshold = 0.36;
const stretch_threshold = 0.42
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv'


//ANCHOR - Get data

// Function to load data from Google Sheet URL using Papa Parse
function loadDataFromGoogleSheet(url) {
    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // Call a function to process the parsed data
            processData(results.data);
        },
        error: function(error) {
            console.error('Error while fetching and parsing CSV:', error);
        }
    });
}

// Function to process the parsed data
function processData(data) {
    // Assuming data is an array of objects where each object represents a row in the CSV
    // You can access and manipulate the data as needed
    
    // For example, log the first row of data
    console.log('First row of data:', data[0]);
}

// Call the function to load data from the Google Sheet URL
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv';
loadDataFromGoogleSheet(googleSheetURL);


//ANCHOR - Capture user input via form and perform calculations

$(document).ready(function() {
    // Attach an event handler for the submit event to the HTML element "affordabilityForm"
    $('#affordabilityForm').on('submit', function(event) {

        // Prevent the default form behavior
        event.preventDefault();

        // Perform input validation
        validateInputs();

    });
});

function performCalculations() {
    // Capture and convert form values
    const income = parseFloat($('#income').val());
    const downPayment = parseFloat($('#downPayment').val());
    const monthlyExpenses = parseFloat($('#monthlyExpenses').val());
    const propertyTaxRate = parseFloat($('#propertyTax').val());
    const insuranceRate = parseFloat($('#insuranceRate').val());

    // Perform calculations
    const affordableHomePrice = calculateAffordableHomePrice(monthlyExpenses, income, downPayment, propertyTaxRate, insuranceRate);
    const dti = calculateDTI(monthlyExpenses, income);
    const affordabilityCategory = categorizeAffordability(dti);

    // Display results
    $('#resultsContainer').text(`Based on your input, an affordable home price for you would be up to $${affordableHomePrice.toFixed(2)}. Category: ${affordabilityCategory}`).show();
}

//ANCHOR - Validation check functions

function validateInputs() {
    let isValid = true;

    // Check each input field
    $('.form-control').each(function() {
        const value = $(this).val().trim(); // Get the trimmed value of the input field
        const fieldName = $(this).attr('name'); // Get the name attribute of the input field

        // Check for empty value
        if (value === '') {
            isValid = false;
            displayErrorMessage(fieldName, 'This field is required.');
        } else {
            // Additional validation based on field type or range
            switch (fieldName) {
                case 'income':
                case 'downPayment':
                case 'monthlyExpenses':
                    // Check if the value is a valid positive number
                    if (!$.isNumeric(value) || parseFloat(value) <= 0) {
                        isValid = false;
                        displayErrorMessage(fieldName, 'Please enter a valid positive number.');
                    }
                    break;
                case 'propertyTax':
                case 'insuranceRate':
                    // Check if the value is a valid percentage (between 0 and 100)
                    if (!$.isNumeric(value) || parseFloat(value) < 0 || parseFloat(value) > 100) {
                        isValid = false;
                        displayErrorMessage(fieldName, 'Please enter a valid percentage between 0 and 100.');
                    }
                    break;
            }
        }
    });

    // If all inputs are valid, proceed with form submission
    if (isValid) {
        $('#resultsContainer').empty(); // Clear any previous error messages
        // Perform calculations and display results
        performCalculations();
    }
}

function displayErrorMessage(fieldName, message) {
    // Construct the error message HTML
    const errorMessage = `<div class="error-message">${message}</div>`;

    // Display the error message below the corresponding input field
    $(`input[name='${fieldName}']`).after(errorMessage);
}

//ANCHOR - Calculation functions

//#region - Debt-to-income ratio
function calculateDTI(monthlyExpenses, income) {
    const monthlyIncome = income / 12;
    return monthlyExpenses / monthlyIncome;
}
//#endregion

//#region - Max affordable home price
function calculateAffordableHomePrice(monthlyExpenses, income, downPayment, propertyTaxRate, insuranceRate) {
    const dti = calculateDTI(monthlyExpenses, income);
    const monthlyIncome = income / 12;

    // Calculate maximum mortgage amount based on DTI
    const maximumMortgageAmount = (monthlyIncome - monthlyExpenses) * dti;

    // Include property tax and insurance in the total home price calculation
    propertyTaxRate = propertyTaxRate / 100;
    insuranceRate = insuranceRate / 100;
    const totalHomePrice = (maximumMortgageAmount + downPayment) * (1 + propertyTaxRate + insuranceRate);

    return totalHomePrice;
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