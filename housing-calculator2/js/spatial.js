// spatial.js

// Imports
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

// Create circular buffer zones around a list of geographic coordinates
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

// Validate coordinates
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

// Calculate distance between two coordinates in miles
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  var R = 3959;
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;
};

// Obtain the geographic center points of a list of H3 hexagons
export const getHexagonCentroids = (hexagons) => {
  return hexagons.map((hexId) => h3.cellToLatLng(hexId));
};

// Map zip codes to the closest hexagonal cell based on geographic proximity
export const mapZipCodesToHexagons = (zipCodes, hexagons) => {
  let hexagonCentroids = getHexagonCentroids(hexagons.flat());
  let zipToHexMap = {};

  zipCodes.forEach((zip) => {
    let zipLat = parseFloat(zip.Latitude);
    let zipLng = parseFloat(zip.Longitude);
    let closestHex = null;
    let minDistance = Infinity;

    hexagonCentroids.forEach((centroid, index) => {
      let distance = calculateDistance(
        zipLat,
        zipLng,
        centroid[0],
        centroid[1]
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestHex = hexagons.flat()[index];
      }
    });

    zipToHexMap[zip.zip] = closestHex;
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

// Add new main analysis function
export const performGeospatialAnalysis = (
  housingData,
  zipCode,
  interestRate,
  downPayment,
  mortgageTerm,
  thresholds
) => {
  // Find spatial data for target zip
  const selectedZipCodeData = housingData.find((data) => data.zip === zipCode);
  if (
    !selectedZipCodeData ||
    !isValidCoordinates(
      selectedZipCodeData.Latitude,
      selectedZipCodeData.Longitude
    )
  ) {
    console.error(
      "Valid latitude or longitude not found for ZIP code:",
      zipCode
    );
    return null;
  }

  const targetLat = parseFloat(selectedZipCodeData.Latitude);
  const targetLng = parseFloat(selectedZipCodeData.Longitude);

  // Generate buffer zone and hexagons
  const bufferZone = generateBufferZone(
    selectedZipCodeData,
    CONFIG.spatial.buffer.radius
  );
  const h3Hexagons = generateH3Hexagons(
    [bufferZone],
    CONFIG.spatial.h3.defaultResolution
  );
  const zipToHexMap = mapZipCodesToHexagons(housingData, h3Hexagons);

  // Analyze data for each hexagon
  const hexagonAggregatedData = {};

  h3Hexagons.flat().forEach((hexagon) => {
    const hexZipCodes = Object.keys(zipToHexMap).filter(
      (zip) => zipToHexMap[zip] === hexagon
    );

    let totalMedianPrice = 0;
    let count = 0;
    const centroid = h3.cellToLatLng(hexagon);
    const distanceToTargetZip = calculateDistance(
      targetLat,
      targetLng,
      centroid[0],
      centroid[1]
    );

    hexZipCodes.forEach((zip) => {
      const zipData = housingData.find((data) => data.zip === zip);
      if (zipData?.median_sale_price) {
        totalMedianPrice += parseFloat(zipData.median_sale_price);
        count++;
      }
    });

    if (count > 0) {
      const averageMedianPrice = totalMedianPrice / count;
      const loanAmount = averageMedianPrice - downPayment;
      const monthlyMortgagePayment = calculateMonthlyMortgagePayment(
        loanAmount,
        interestRate,
        mortgageTerm
      );

      // Determine affordability classification
      let affordability;
      if (monthlyMortgagePayment <= thresholds.affordable) {
        affordability = "Affordable";
      } else if (monthlyMortgagePayment <= thresholds.stretch) {
        affordability = "Stretch";
      } else if (monthlyMortgagePayment <= thresholds.aggressive) {
        affordability = "Aggressive";
      } else {
        affordability = "Out of reach";
      }

      hexagonAggregatedData[hexagon] = {
        averageMedianPrice,
        zipCodes: hexZipCodes,
        monthlyMortgagePayment,
        distanceToTargetZip,
        affordability,
        centroid,
      };
    }
  });

  return {
    targetLocation: { lat: targetLat, lng: targetLng },
    hexagonData: hexagonAggregatedData,
  };
};

// Add new display function
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
