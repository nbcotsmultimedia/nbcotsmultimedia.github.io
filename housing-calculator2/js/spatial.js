// spatial.js

// Import necessary modules
import CONFIG from "./config.js";
import { calculateMonthlyMortgagePayment } from "./calculations.js";

// Calculate the H3 index of the centroid of a given area
export const calculateCentroidIndex = (bufferZone, resolution) => {
  // Use turf.js to calculate geographic center of the mass of bufferZone
  const centroid = turf.centerOfMass(bufferZone);
  // Extract lat and long from the calculated center
  const lat = centroid.geometry.coordinates[1];
  const lng = centroid.geometry.coordinates[0];

  // Convert the latitude and longitude to an H3 index at the provided resolution
  // H3 index represents the hexagonal cell on the H3 grid that contains the centroid
  const centroidIndex = h3.latLngToCell(lat, lng, resolution);
  return centroidIndex;
};

// Create hexagonal grids for a list of areas using the H3 system
export const generateH3Hexagons = (bufferZones, resolution) => {
  const h3Hexagons = [];
  bufferZones.forEach((bufferZone) => {
    const centroidIndex = calculateCentroidIndex(bufferZone, resolution);
    const hexagons = h3.gridDisk(centroidIndex, CONFIG.spatial.h3.ringCount);
    h3Hexagons.push(hexagons);
  });
  return h3Hexagons;
};

// Create circular area around a list of geographic coordinates
export const generateBufferZone = (zipCodeData, bufferRadius) => {
  const { Latitude: lat = null, Longitude: lng = null, zip } = zipCodeData;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (!isValidCoordinates(latitude, longitude)) {
    console.error(`Invalid coordinates for zip code: ${zip}`);
    return null;
  }

  return turf.buffer(
    turf.point([longitude, latitude]),
    CONFIG.spatial.buffer.radius,
    {
      units: CONFIG.spatial.buffer.units,
    }
  );
};

// Validate latitude/longitude pairs
export const isValidCoordinates = (lat, lng) => {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// Calculate distance between two coordinates in miles using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Obtain the geographic center points of a list of H3 hexagons
export const getHexagonCentroids = (hexagons) => {
  return hexagons.map((hexId) => h3.cellToLatLng(hexId));
};

// Map zip codes to the closest hexagonal cell based on geographic proximity
export const mapZipCodesToHexagons = (
  zipCodes,
  hexagons,
  targetLat,
  targetLng,
  maxDistance
) => {
  let hexagonCentroids = getHexagonCentroids(hexagons.flat());
  let zipToHexMap = {};

  console.log(`Target coordinates: ${targetLat}, ${targetLng}`);
  console.log(`Maximum distance: ${maxDistance} miles`);

  zipCodes.forEach((zip) => {
    let zipLat = parseFloat(zip.Latitude);
    let zipLng = parseFloat(zip.Longitude);

    if (
      !isValidCoordinates(zipLat, zipLng) ||
      !isValidCoordinates(targetLat, targetLng)
    ) {
      console.log(`Skipping ZIP ${zip.zip}: Invalid coordinates`);
      return;
    }

    // Calculate and immediately check distance to target
    const distanceToTarget = calculateDistance(
      targetLat,
      targetLng,
      zipLat,
      zipLng
    );

    console.log(
      `ZIP ${zip.zip} (${zipLat}, ${zipLng}): ${distanceToTarget.toFixed(
        1
      )} miles from target`
    );

    // Only proceed if within maximum distance
    if (distanceToTarget <= maxDistance) {
      let closestHex = null;
      let minHexDistance = Infinity;

      // Find closest hexagon that's also within range
      hexagonCentroids.forEach((centroid, index) => {
        const hexDistance = calculateDistance(
          zipLat,
          zipLng,
          centroid[0],
          centroid[1]
        );

        if (hexDistance < minHexDistance && hexDistance <= maxDistance) {
          minHexDistance = hexDistance;
          closestHex = hexagons.flat()[index];
        }
      });

      // Only map if we found a valid hexagon within range
      if (closestHex && minHexDistance <= maxDistance) {
        zipToHexMap[zip.zip] = closestHex;
        console.log(
          `Mapped ZIP ${zip.zip} to hexagon at ${minHexDistance.toFixed(
            1
          )} miles`
        );
      } else {
        console.log(`ZIP ${zip.zip} had no valid hexagons within range`);
      }
    } else {
      console.log(
        `Skipping ZIP ${zip.zip}: ${distanceToTarget.toFixed(
          1
        )} miles exceeds maximum ${maxDistance} miles`
      );
    }
  });

  return zipToHexMap;
};

// Identify affordable or stretched hexagons
export const identifyAffordableOrStretchedHexagons = (
  hexagonAggregatedData
) => {
  const affordableOrStretchedHexagons = [];

  Object.entries(hexagonAggregatedData).forEach(([hexagon, data]) => {
    if (
      data.affordability === "Affordable" ||
      data.affordability === "Stretched"
    ) {
      affordableOrStretchedHexagons.push({
        hexagon: hexagon,
        affordability: data.affordability,
      });
    }
  });

  return affordableOrStretchedHexagons;
};

// Main analysis function
export const performGeospatialAnalysis = (
  housingData,
  zipCode,
  interestRate,
  downPayment,
  mortgageTerm,
  thresholds
) => {
  // Find target ZIP code data
  const selectedZipCodeData = housingData.find((data) => data.zip === zipCode);
  if (!selectedZipCodeData) {
    console.error("Target ZIP code not found:", zipCode);
    return null;
  }

  // Parse and validate target coordinates
  const targetLat = parseFloat(selectedZipCodeData.Latitude);
  const targetLng = parseFloat(selectedZipCodeData.Longitude);

  if (!isValidCoordinates(targetLat, targetLng)) {
    console.error(
      `Invalid target coordinates for ZIP ${zipCode}: ${targetLat}, ${targetLng}`
    );
    return null;
  }

  console.log(`Analyzing area around ${zipCode} (${targetLat}, ${targetLng})`);
  console.log(`Using buffer radius of ${CONFIG.spatial.buffer.radius} miles`);

  // First filter: Get nearby ZIP codes
  const nearbyZipCodes = housingData.filter((data) => {
    const dataLat = parseFloat(data.Latitude);
    const dataLng = parseFloat(data.Longitude);

    if (!isValidCoordinates(dataLat, dataLng)) {
      return false;
    }

    const distance = calculateDistance(targetLat, targetLng, dataLat, dataLng);

    if (distance <= CONFIG.spatial.buffer.radius) {
      console.log(`Including ZIP ${data.zip} at ${distance.toFixed(1)} miles`);
      return true;
    }
    return false;
  });

  console.log(
    `Found ${nearbyZipCodes.length} ZIPs within ${CONFIG.spatial.buffer.radius} miles`
  );

  // Generate buffer zone
  const bufferZone = generateBufferZone(
    selectedZipCodeData,
    CONFIG.spatial.buffer.radius
  );
  if (!bufferZone) {
    console.error("Failed to generate buffer zone");
    return null;
  }

  // Generate hexagons
  const h3Hexagons = generateH3Hexagons(
    [bufferZone],
    CONFIG.spatial.h3.defaultResolution
  );
  console.log(`Generated ${h3Hexagons.flat().length} hexagons`);

  // Map ZIPs to hexagons
  const zipToHexMap = mapZipCodesToHexagons(
    nearbyZipCodes,
    h3Hexagons,
    targetLat,
    targetLng,
    CONFIG.spatial.buffer.radius
  );

  // Process hexagons
  const hexagonAggregatedData = {};

  h3Hexagons.flat().forEach((hexagon) => {
    const hexZipCodes = Object.keys(zipToHexMap).filter(
      (zip) => zipToHexMap[zip] === hexagon
    );

    if (hexZipCodes.length > 0) {
      const [hexLat, hexLng] = h3.cellToLatLng(hexagon);
      const distanceToTargetZip = calculateDistance(
        targetLat,
        targetLng,
        hexLat,
        hexLng
      );

      // Final distance check
      if (distanceToTargetZip <= CONFIG.spatial.buffer.radius) {
        // Calculate hexagon statistics
        const stats = calculateHexagonStats(
          hexZipCodes,
          nearbyZipCodes,
          downPayment,
          interestRate,
          mortgageTerm,
          thresholds
        );

        if (stats) {
          hexagonAggregatedData[hexagon] = {
            ...stats,
            distanceToTargetZip,
            zipCodes: hexZipCodes,
          };

          console.log(
            `Processed hexagon at ${distanceToTargetZip.toFixed(
              1
            )} miles with ${hexZipCodes.length} ZIPs: ${hexZipCodes.join(", ")}`
          );
        }
      } else {
        console.log(
          `Skipping hexagon: ${distanceToTargetZip.toFixed(
            1
          )} miles exceeds maximum ${CONFIG.spatial.buffer.radius} miles`
        );
      }
    }
  });

  return {
    targetLocation: { lat: targetLat, lng: targetLng },
    hexagonData: hexagonAggregatedData,
  };
};

// Helper function for valid coordinate checking
const isValidCoordinates = (lat, lng) => {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// Helper function to find closest hexagon
const findClosestHexagon = (hexagons, lat, lng) => {
  let closestHexagon = null;
  let minDistance = Infinity;

  hexagons.forEach((hexagon) => {
    const centroid = h3.cellToLatLng(hexagon);
    const distance = calculateDistance(lat, lng, centroid[0], centroid[1]);

    if (distance < minDistance) {
      minDistance = distance;
      closestHexagon = hexagon;
    }
  });

  return closestHexagon;
};

// Helper function to calculate hexagon statistics
const calculateHexagonStats = (
  hexZipCodes,
  nearbyZipCodes,
  downPayment,
  interestRate,
  mortgageTerm,
  thresholds
) => {
  const prices = hexZipCodes
    .map((zip) => {
      const zipData = nearbyZipCodes.find((d) => d.zip === zip);
      return zipData ? parseFloat(zipData.median_sale_price) : null;
    })
    .filter((price) => !isNaN(price) && price > 0);

  if (prices.length === 0) return null;

  const averageMedianPrice = prices.reduce((a, b) => a + b) / prices.length;

  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
    averageMedianPrice - downPayment,
    interestRate,
    mortgageTerm
  );

  return {
    averageMedianPrice,
    monthlyMortgagePayment,
    affordability: determineAffordabilityCategory(
      monthlyMortgagePayment,
      thresholds
    ),
  };
};

export const processHexagonData = (
  zipToHexMap,
  housingData,
  downPayment,
  interestRate,
  mortgageTerm,
  thresholds
) => {
  const hexagonData = {};
  const processedZips = new Set();

  // Group ZIPs by hexagon
  Object.entries(zipToHexMap).forEach(([zip, { hexagon, distance }]) => {
    if (!hexagonData[hexagon]) {
      hexagonData[hexagon] = {
        zips: [],
        prices: [],
        distances: [],
        totalPrice: 0,
        count: 0,
      };
    }

    // Only process each ZIP once
    if (!processedZips.has(zip)) {
      const zipData = housingData.find((d) => d.zip === zip);
      if (zipData && !isNaN(parseFloat(zipData.median_sale_price))) {
        const price = parseFloat(zipData.median_sale_price);
        hexagonData[hexagon].zips.push(zip);
        hexagonData[hexagon].prices.push(price);
        hexagonData[hexagon].distances.push(distance);
        hexagonData[hexagon].totalPrice += price;
        hexagonData[hexagon].count++;
        processedZips.add(zip);
      }
    }
  });

  // Calculate aggregates for each hexagon
  const aggregatedData = {};
  Object.entries(hexagonData).forEach(([hexagon, data]) => {
    if (data.count > 0) {
      const averagePrice = data.totalPrice / data.count;
      const monthlyPayment = calculateMonthlyMortgagePayment(
        averagePrice - downPayment,
        interestRate,
        mortgageTerm
      );
      const avgDistance =
        data.distances.reduce((a, b) => a + b) / data.distances.length;

      aggregatedData[hexagon] = {
        averageMedianPrice: averagePrice,
        monthlyMortgagePayment: monthlyPayment,
        affordability: determineAffordabilityCategory(
          monthlyPayment,
          thresholds
        ),
        distanceToTarget: avgDistance,
        zipCodes: data.zips,
        sampleSize: data.count,
      };
    }
  });

  return aggregatedData;
};

// Helper function to calculate monthly mortgage payment
const calculateMonthlyMortgagePayment = (
  principal,
  annualInterestRate,
  termYears
) => {
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalPayments = termYears * 12;
  return (
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments))
  );
};

// Display function
export const displayGeospatialResults = (analysisResults) => {
  if (!analysisResults) return;

  const { hexagonData } = analysisResults;
  let hexResultsHtml = "<h3>Nearby Areas Analysis</h3>";

  // Group hexagons by affordability
  const groupedHexagons = {
    Affordable: [],
    Stretch: [],
    Aggressive: [],
    "Out of reach": [],
  };

  Object.entries(hexagonData).forEach(([hexagon, data]) => {
    groupedHexagons[data.affordability].push({
      hexagon,
      ...data,
    });
  });

  // Display results by affordability category
  Object.entries(groupedHexagons).forEach(([category, hexagons]) => {
    if (hexagons.length > 0) {
      hexResultsHtml += `
        <div class="affordability-category">
          <h4>${category} Areas (${hexagons.length} found)</h4>
          ${hexagons
            .sort((a, b) => a.distanceToTargetZip - b.distanceToTargetZip)
            .map(
              (data) => `
              <div class="hexagon-result ${data.affordability
                .toLowerCase()
                .replace(" ", "-")}">
                <p>Average Home Price: $${data.averageMedianPrice.toLocaleString()}</p>
                <p>Monthly Payment: $${data.monthlyMortgagePayment.toFixed(
                  0
                )}</p>
                <p>Distance: ${data.distanceToTargetZip.toFixed(1)} miles</p>
                <p>ZIP Codes: ${data.zipCodes.join(", ")}</p>
              </div>
            `
            )
            .join("")}
        </div>
      `;
    }
  });

  // Add the results to the page
  document.getElementById("resultsMessage").innerHTML += hexResultsHtml;
};
