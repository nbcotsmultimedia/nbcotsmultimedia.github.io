//#region - Global variables
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJdqWTqaUeXFahjvUBRnKpK9ABl9fI7PHwjMxWNzT7gmd0Krg9uida9V21u90TjT2zoNVFggF038RX/pub?gid=0&single=true&output=csv'
let userInput = {}; // Object to store user inputs
//#endregion

//#region - Load and parse data
// Load data using Papa.Parse

// Function to load data from Google Sheet using Papa Parse
function loadDataFromGoogleSheet(url) {
    Papa.parse(url, {
        download: true, // Set to true to download the data
        header: true, // Treats the first row as header
        skipEmptyLines: true, // Skip empty lines in the data
        complete: function(results) {
            parsedData = results.data; // Store the parsed data in the global variable "results"
            console.log('Parsed data:', parsedData); // Log the parsed data
        },
        error: function(error) {
            console.error('Error while fetching and parsing CSV:', error); // Log any errors
        }
    });
}

// Function to handle form submission and save user inputs
function handleFormSubmission(event) {
    event.preventDefault(); // Prevent the default form submission behavior
    // Store user inputs in the userInput object
    userInput.zipCode = $('#zipCode').val().trim();
    userInput.income = parseFloat($('#income').val()) || 0;
    userInput.downPayment = parseFloat($('#downPayment').val()) || 0;
    userInput.monthlyExpenses = parseFloat($('#monthlyExpenses').val()) || 0;
    userInput.propertyTaxRate = parseFloat($('#propertyTax').val()) || defaultPropertyTaxRate / 100;
    userInput.insuranceCost = parseFloat($('#insuranceCost').val()) || defaultInsuranceAmount;
    userInput.mortgageTerm = parseFloat($('#mortgageTerm').val()) || 30;

    console.log('User inputs:', userInput);

    // Now you can perform further actions with the user inputs, such as processing data or calculations
}




// Call functions

loadDataFromGoogleSheet(url); // Call the function with the URL

// Event listeners
// Event listener for form submission
$('#affordabilityForm').on('submit', handleFormSubmission);