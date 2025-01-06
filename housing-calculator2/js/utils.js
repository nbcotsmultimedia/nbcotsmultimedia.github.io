// utils.js

import { ErrorHandler, ErrorTypes } from "./errors.js";

// Form utilities
export const getFormData = async () => {
  try {
    const annualIncome = parseFloat(document.getElementById("income").value);
    if (isNaN(annualIncome)) throw new Error("Invalid income");

    const monthlyExpenses = parseFloat(
      document.getElementById("monthlyExpenses").value
    );
    if (isNaN(monthlyExpenses)) throw new Error("Invalid expenses");

    const monthlyIncome = annualIncome / 12;

    return {
      zipCode: document.getElementById("zipCode").value,
      annualIncome,
      downPayment: parseFloat(document.getElementById("downPayment").value),
      monthlyExpenses,
      mortgageTerm: parseInt(document.getElementById("mortgageTerm").value),
      thresholds: {
        affordable: monthlyIncome * 0.28 - monthlyExpenses,
        stretch: monthlyIncome * 0.36 - monthlyExpenses,
        aggressive: monthlyIncome * 0.43 - monthlyExpenses,
      },
    };
  } catch (error) {
    ErrorHandler.throw(ErrorTypes.VALIDATION, error.message);
  }
};

// Display utilities
export const displayAffordabilityResults = (results) => {
  if (!results) {
    ErrorHandler.throw(ErrorTypes.CALCULATION, "No results to display");
    return;
  }
  let resultsHtml = `<h3>Housing Affordability</h3>`;
  resultsHtml += `<p>Median home price in area: $${results.medianHomePrice.toLocaleString()}</p>`;
  resultsHtml += `<p>Monthly mortgage payment in area: $${results.monthlyMortgagePayment.toFixed(
    0
  )}</p>`;
  resultsHtml += `<p>Debt-to-income ratio: ${results.backEndDTIRatio.toFixed(
    0
  )}%</p>`;
  resultsHtml += `<p>Affordability category for user in area: ${results.affordabilityCategory}</p>`;

  document.getElementById("resultsMessage").innerHTML += resultsHtml;
};
