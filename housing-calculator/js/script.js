//TODO - 
// make the property tax rate input and insurance rate optional, fill with default
// compare user DTI to the median home price, and rank the median price on a scale to show if its affordable, stretch, or out of reach

//ANCHOR - Set global variables
//#region - Set global variables
const affordable_threshold = 0.36;
const stretch_threshold = 0.42
let medianSalePricesData = []; // Global variable to store data from sheet

const defaultPropertyTaxRate = 1.10; // Average property tax rate as a percentage
const defaultInsuranceAmount = 2417; // Default annual home insurance amount in dollars
//#endregion

//ANCHOR - Get and process housing data

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
            processAndCalculate();
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
    const zipCodeData = medianSalePricesData.find(data => data.zip === zipCode);

    // Check if zip code is found in housing data
    if (!zipCodeData) {
        displayErrorMessage('zipCode', 'Data for this zip code is not available.');
        return;
    }

    // Retrieve and parse data specific to the zip code
    const mortgageRate = parseFloat(zipCodeData.mortgage_30_rate);
    const loanTerm = 30;

    // Capture and parse other form values
    const income = parseFloat($('#income').val());
    const downPayment = parseFloat($('#downPayment').val());
    const monthlyExpenses = parseFloat($('#monthlyExpenses').val());

    // Use default value if property tax rate is not provided
    const propertyTaxRate = $('#propertyTax').val() ? parseFloat($('#propertyTax').val()) : defaultPropertyTaxRate;

    // Use annual insurance cost in dollars
    const insuranceAmount = $('#insuranceRate').val() ? parseFloat($('#insuranceRate').val()) : defaultInsuranceAmount;

    // Calculate affordable home price
    const affordableHomePrice = calculateAffordableHomePrice(
        monthlyExpenses, 
        income, 
        downPayment, 
        propertyTaxRate, 
        insuranceAmount, // Use annual insurance cost
        mortgageRate, 
        loanTerm
    );

    // Retrieve the median home price for the provided zip code
    const medianHomePrice = parseFloat(zipCodeData.median_sale_price);

    // Calculate user's debt-to-income ratio (DTI)
    const dti = calculateDTI(monthlyExpenses, income);

    // Determine affordability category based on comparison of affordableHomePrice and medianHomePrice
    let affordabilityCategory;
    if (affordableHomePrice < medianHomePrice) {
        affordabilityCategory = 'Consider Adjusting Budget or Area';
    } else {
        affordabilityCategory = categorizeAffordability(dti);
    }

    // Display results
    $('#resultsContainer').html(`
        <p>Median Home Price in ${zipCode}: $${medianHomePrice.toLocaleString()}</p>
        <p>Your Maximum Affordable Home Price: $${affordableHomePrice.toFixed(2)}</p>
        <p>Your Debt-to-Income Ratio (DTI): ${dti.toFixed(2)}</p>
        <p>Affordability Category: ${affordabilityCategory}</p>
    `);
}

//#region Call the function to load data from the sheet URL
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv'
loadDataFromGoogleSheet(url);
//#endregion

//ANCHOR - Capture user input via form and perform calculations

$(document).ready(function() {

    //#region - Autofill form fields for debugging
    $('#zipCode').val('78749');
    $('#income').val('75000');
    $('#downPayment').val('10000');
    $('#monthlyExpenses').val('600');
    $('#propertyTax').val(''); // Optional field, leave empty for autofill
    $('#insuranceRate').val(''); // Optional field, leave empty for autofill
    //#endregion

    $('#affordabilityForm').on('submit', function(event) {
        event.preventDefault(); // Prevent the default form behavior
        $('.error-message').remove(); // Clear any existing error messages
    
        // Capture and parse user input
        const zipCode = $('#zipCode').val().trim();
        const income = parseFloat($('#income').val());
        const downPayment = parseFloat($('#downPayment').val());
        const monthlyExpenses = parseFloat($('#monthlyExpenses').val());

        // Retrieve the mortgage rate for the provided zip code
        const zipCodeData = medianSalePricesData.find(data => data.zip === zipCode);
        if (!zipCodeData) {
            displayErrorMessage('zipCode', 'Data for this zip code is not available.');
            return;
        }
        mortgageRate = parseFloat(zipCodeData.mortgage_30_rate); // Ensure this is declared in the same scope
        const loanTerm = 30; // Default loan term in years

        // Use default values if property tax rate or insurance rate are not provided
        const propertyTaxRate = $('#propertyTax').val() ? parseFloat($('#propertyTax').val()) : defaultPropertyTaxRate;
        const insuranceAmount = $('#insuranceRate').val() ? parseFloat($('#insuranceRate').val()) : defaultInsuranceAmount;

        // Call performCalculations here so that it has access to the latest form values
        performCalculations(
            income, downPayment, monthlyExpenses, propertyTaxRate, insuranceAmount
        );

    });
    
});

//ANCHOR - Validation check functions

//#region - Validate inputs
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
//#endregion

//#region - Display error messages
function displayErrorMessage(fieldName, message) {
    // First, clear any previous error messages
    $(`.error-message`).remove();

    // Construct the error message HTML
    const errorMessage = `<div class="error-message">${message}</div>`;

    // Display the error message below the corresponding input field
    $(`#${fieldName}`).after(errorMessage);
}
//#endregion

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
function calculateAffordableHomePrice(monthlyExpenses, income, downPayment, propertyTaxRate, defaultInsuranceAmount, mortgageRate, loanTerm) {
    const monthlyIncome = income / 12;
    console.log(`Calculated Monthly Income: ${monthlyIncome}`);

    // Calculate monthly insurance cost based on the default annual amount
    const monthlyInsuranceCost = defaultInsuranceAmount / 12;

    // Calculate monthly property tax based on the annual property tax rate and down payment
    const monthlyPropertyTax = (downPayment * (propertyTaxRate / 100)) / 12;

    // Adjust available monthly income for mortgage by subtracting monthly debts, property tax, and insurance
    const availableForMortgageMonthly = (monthlyIncome * affordable_threshold) - monthlyExpenses - monthlyPropertyTax - monthlyInsuranceCost;

    console.log(`Monthly Property Tax: ${monthlyPropertyTax}`);
    console.log(`Monthly Insurance Cost: ${monthlyInsuranceCost}`);
    console.log(`Available For Mortgage Monthly: ${availableForMortgageMonthly}`);

    // If the amount available for mortgage monthly is negative, the user cannot afford a home
    if (availableForMortgageMonthly <= 0) {
        console.log('The available monthly amount for mortgage is negative, indicating the user cannot afford a home.');
        return 0; // Handle this appropriately in your UI
    }

    // Calculate the maximum mortgage principal the user can afford
    const principal = calculateMaximumMortgage(availableForMortgageMonthly, mortgageRate, loanTerm);
    console.log(`Maximum Mortgage Principal: ${principal}`);

    // The affordable home price is the sum of the maximum mortgage principal and the down payment
    const affordableHomePrice = principal + downPayment;
    console.log(`Affordable Home Price: ${affordableHomePrice}`);

    return affordableHomePrice;
}

//#endregion

//#region - Calculate maximum affordable mortgage price
function calculateMaximumMortgage(monthlyPayment, annualInterestRate, loanTerm) {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    console.log(`Monthly Interest Rate: ${monthlyInterestRate}`);
    console.log(`Number of Payments: ${numberOfPayments}`);

    const principal = (monthlyPayment * (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)) / (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments));
    console.log(`Calculated Principal: ${principal}`);

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