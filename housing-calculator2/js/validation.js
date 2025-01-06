// validation.js

import { ErrorHandler, ErrorTypes } from "./errors.js";
import CONFIG from "./config.js";

export const validateZipCode = (zipCode, housingData) => {
  if (!zipCode) {
    return { isValid: false, message: "ZIP code is required" };
  }

  if (!/^\d+$/.test(zipCode)) {
    return { isValid: false, message: "ZIP code must contain only numbers" };
  }

  if (zipCode.length !== 5) {
    return { isValid: false, message: "ZIP code must be exactly 5 digits" };
  }

  if (!housingData) {
    return { isValid: false, message: "Please wait for housing data to load" };
  }

  const zipData = housingData.find((data) => data.zip === zipCode);
  if (!zipData) {
    return { isValid: false, message: "ZIP code not found in database" };
  }

  if (!zipData.Latitude || !zipData.Longitude) {
    return { isValid: false, message: "Invalid location data for ZIP code" };
  }

  return { isValid: true, message: "Valid ZIP code" };
};

export const validateIncome = (income) => {
  const minIncome = 10000;
  const maxIncome = 1000000;

  if (!income) {
    return { isValid: false, message: "Income is required" };
  }

  const incomeNum = parseFloat(income);
  if (isNaN(incomeNum)) {
    return { isValid: false, message: "Income must be a number" };
  }

  if (incomeNum < minIncome) {
    return {
      isValid: false,
      message: `Income must be at least $${minIncome.toLocaleString()}`,
    };
  }

  if (incomeNum > maxIncome) {
    return {
      isValid: false,
      message: `Income cannot exceed $${maxIncome.toLocaleString()}`,
    };
  }

  return { isValid: true, message: "Valid income" };
};

export const validateDownPayment = (downPayment, homePrice) => {
  if (!downPayment) {
    return { isValid: false, message: "Down payment is required" };
  }

  const downPaymentNum = parseFloat(downPayment);
  if (isNaN(downPaymentNum)) {
    return { isValid: false, message: "Down payment must be a number" };
  }

  if (downPaymentNum < 0) {
    return { isValid: false, message: "Down payment cannot be negative" };
  }

  if (homePrice && downPaymentNum > homePrice) {
    return { isValid: false, message: "Down payment cannot exceed home price" };
  }

  return { isValid: true, message: "Valid down payment" };
};

export const validateMonthlyExpenses = (expenses) => {
  if (!expenses) {
    return { isValid: false, message: "Monthly expenses are required" };
  }

  const expensesNum = parseFloat(expenses);
  if (isNaN(expensesNum)) {
    return { isValid: false, message: "Monthly expenses must be a number" };
  }

  if (expensesNum < 0) {
    return { isValid: false, message: "Monthly expenses cannot be negative" };
  }

  return { isValid: true, message: "Valid monthly expenses" };
};

export const validateMortgageTerm = (term) => {
  const validTerms = [15, 20, 30];

  if (!term) {
    return { isValid: false, message: "Mortgage term is required" };
  }

  const termNum = parseInt(term);
  if (!validTerms.includes(termNum)) {
    return {
      isValid: false,
      message: "Please select a valid mortgage term (15, 20, or 30 years)",
    };
  }

  return { isValid: true, message: "Valid mortgage term" };
};

export const validateForm = (formData, housingData) => {
  const validations = [
    validateZipCode(formData.zipCode, housingData),
    validateIncome(formData.annualIncome),
    validateDownPayment(formData.downPayment),
    validateMonthlyExpenses(formData.monthlyExpenses),
    validateMortgageTerm(formData.mortgageTerm),
  ];

  const errors = validations
    .filter((validation) => !validation.isValid)
    .map((validation) => validation.message);

  if (errors.length > 0) {
    ErrorHandler.throw(ErrorTypes.VALIDATION, errors.join(". "));
  }

  return true;
};
