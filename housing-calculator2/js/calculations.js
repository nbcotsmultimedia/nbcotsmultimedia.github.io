// calculations.js

// Imports
import CONFIG from "./config.js";
import { CacheManager } from "./cache.js";

// Calculate the monthly mortgage payment using standard mortgage rate formula
export const calculateMonthlyMortgagePayment = (
  principal,
  annualInterestRate,
  termYears
) => {
  // Convert annual interest rate to monthly
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  // Calculate total number of payments
  const totalPayments = termYears * 12;
  // Use standard mortgage payment formula: P * (r(1+r)^n)/((1+r)^n-1)
  // where P = principal, r = monthly rate, n = total number of payments
  return (
    (principal * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalPayments))
  );
};

// Set affordability thresholds based on income
export const calculateAffordabilityThresholds = (
  monthlyGrossIncome,
  monthlyExpenses
) => {
  return {
    affordable: monthlyGrossIncome * CONFIG.dti.affordable - monthlyExpenses,
    stretch: monthlyGrossIncome * CONFIG.dti.stretch - monthlyExpenses,
    aggressive: monthlyGrossIncome * CONFIG.dti.aggressive - monthlyExpenses,
  };
};

// Get interest rate based on mortgage term
export const getInterestRate = (zipData, mortgageTerm) => {
  // Return 15-year rate, otherwise 30-year rate
  return mortgageTerm === 15
    ? parseFloat(zipData.mortgage_15_rate)
    : parseFloat(zipData.mortgage_30_rate);
};

// Calculate back-end DTI ratio
export const calculateBackEndDTI = (totalMonthlyDebt, monthlyGrossIncome) => {
  // Convert to percentage and round to nearest integer
  return Math.round((totalMonthlyDebt / monthlyGrossIncome) * 100);
};

// Determine affordability category for payment
export const determineAffordabilityCategory = (monthlyPayment, thresholds) => {
  // Check payment against thresholds from most affordable to least
  if (monthlyPayment <= thresholds.affordable) return "Affordable";
  if (monthlyPayment <= thresholds.stretch) return "Stretch";
  if (monthlyPayment <= thresholds.aggressive) return "Aggressive";
  return "Out of reach";
};

// Calculate overall housing affordability
export const calculateHousingAffordability = (
  housingData,
  zipCode,
  annualIncome,
  downPayment,
  monthlyExpenses,
  mortgageTerm,
  thresholds
) => {
  // Check cache first for existing results
  const cacheKey = `${zipCode}-${annualIncome}-${downPayment}-${monthlyExpenses}-${mortgageTerm}`;
  const cachedResult = CacheManager.getZipResult(cacheKey);

  if (cachedResult) {
    console.log("Cache: HIT");
    console.log("Cache Key:", cacheKey);
    console.log("Cached Result:", cachedResult);
    return cachedResult;
  }

  console.log("Cache: MISS");
  console.log("Cache Key:", cacheKey);

  console.log("housingData:", housingData);
  console.log("Type:", typeof housingData);

  // Find zip code data
  const zipCodeData = housingData.find((data) => data.zip === zipCode);
  if (!zipCodeData) return null;

  // Calculate median home price
  const medianHomePrice = parseFloat(zipCodeData.median_sale_price);
  if (isNaN(medianHomePrice)) return null;

  // Determine monthly payments and DTI ratio
  const monthlyGrossIncome = annualIncome / 12;
  const interestRate = getInterestRate(zipCodeData, mortgageTerm);
  const loanAmount = medianHomePrice - downPayment;
  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
    loanAmount,
    interestRate,
    mortgageTerm
  );
  const totalMonthlyDebt = monthlyMortgagePayment + monthlyExpenses;
  const backEndDTIRatio = calculateBackEndDTI(
    totalMonthlyDebt,
    monthlyGrossIncome
  );

  // Categorize affordability
  const affordabilityCategory = determineAffordabilityCategory(
    monthlyMortgagePayment,
    thresholds
  );

  const result = {
    medianHomePrice,
    monthlyMortgagePayment,
    interestRate,
    affordabilityCategory,
    affordabilityThresholds: thresholds,
    backEndDTIRatio,
    analysis: {
      loanAmount,
      monthlyGrossIncome,
      totalMonthlyDebt,
      downPaymentPercentage: (downPayment / medianHomePrice) * 100,
    },
  };

  // Store in cache
  console.log("Storing in cache:", result);
  CacheManager.setZipResult(cacheKey, result);

  return result;
};
