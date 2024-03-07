


// When DOM is ready...
$(document).ready(function() {
    // Function to calculate housing affordability
    function calculateHousingAffordability(zipCode, annualIncome, downPayment, monthlyExpenses, mortgageTerm) {
        // Your calculation logic here...
    }

    // Function to display results
    function displayResults(results) {
        // Your display logic here...
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
                // Store parsed data in the global variable
                housingData = results.data;
                // Enable form submission
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



