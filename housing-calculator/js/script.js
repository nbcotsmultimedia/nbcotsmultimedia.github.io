
// jQuery ready event, waits until the DOM is fully loaded
$(document).ready(function() {

    // Attach an event handler for the submit event to the HTML element "affordabilityForm"
    $('#affordabilityForm').on('submit', function(event) {
        
        // Stop the default action, handle with JS instead
        event.preventDefault();
        console.log('Form submitted with jQuery');

        // Capture input values from the form using jQuery
        const zipCode = $('#zipCode').val();
        // Add more inputs as necessary
        // const income = $('#income').val();
        // const downPayment = $('#downPayment').val();
        // const monthlyExpenses = $('#monthlyExpenses').val();
        // Add logic for advanced options if they are implemented
        // const interestRate = $('#interestRate').val();
        // const loanTerm = $('#loanTerm').val();
        // const propertyTax = $('#propertyTax').val();

        // Log the captured values to ensure they're being retrieved correctly
        console.log('Zip Code:', zipCode);
        // console.log('Income:', income);
        // console.log('Down Payment:', downPayment);
        // console.log('Monthly Expenses:', monthlyExpenses);
        // console.log('Interest Rate:', interestRate);
        // console.log('Loan Term:', loanTerm);
        // console.log('Property Tax:', propertyTax);

        // Here, add your calculation logic
        // ...

        // Display results using jQuery

        // Select the HTML element 'resultsContainer' and set the content to the string provided
        $('#resultsContainer').text('You can afford a home up to $XXX,XXX').show();
    });

});


function calculateAffordableHomePrice(income, monthlyExpenses, downPayment, debtToIncomeRatio, propertyTaxRate, insuranceRate) {
    // Convert percentages to decimal
    propertyTaxRate = propertyTaxRate / 100;
    insuranceRate = insuranceRate / 100;

    const monthlyIncome = income / 12;

    // Calculate maximum mortgage amount
    const maximumMortgageAmount = (monthlyIncome - monthlyExpenses) * debtToIncomeRatio;

    // Calculate total home price including taxes and insurance
    const totalHomePrice = (maximumMortgageAmount + downPayment) * (1 + propertyTaxRate + insuranceRate);

    // Calculate maximum affordable home price
    const maximumAffordableHomePrice = totalHomePrice;

    return maximumAffordableHomePrice;
}
