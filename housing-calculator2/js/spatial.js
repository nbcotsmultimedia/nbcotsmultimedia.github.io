// spatial.js

// Import config.js
import CONFIG from "./config.js";

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
