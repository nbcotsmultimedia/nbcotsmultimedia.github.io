let mobileMap = document.getElementById('map').getBoundingClientRect().width < 400;

//settings per device
let mapView = {
  initZoom: mobileMap ? 14 : 15,
  setView: mobileMap ? [41.871, -87.625] : [41.872, -87.629],
  pointsRadius: mobileMap ? 6 : 7
}

let map = L.map('map')
  .setView(mapView.setView, mapView.initZoom);

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: mapView.initZoom + 5,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

//data
let closedRoads = 'data/pre-race-closures.json',
    busLines = 'data/cta-bus-routes.geojson',
    railLines = 'data/cta-rail-lines.geojson',
    railStations = 'data/cta-rail-stations.geojson',
    track = 'data/nascar-track.json';

//map layers
// parameter => ({}) //implicit return w/arrow function
let badLines = ['1','2','3','4','X4','6','7','10','J14','26','28','126','143','147','148'],
    superBadLines = ['3','4','6','10','12','J14','18','20','22','36','56','60','62','126','130','146','147','151']; //July 1 & 2 disruptions

let busLayer = new L.GeoJSON.AJAX(busLines, {
  style: styleBusLayer,
  onEachFeature: (feature, layer) => {
    let routeName = feature.properties.NAME2
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    let busBlurb = (feature) => {

      switch (true) {
        case badLines.includes(feature.properties.ROUTE): 
          return 'Expect disruptions and reroutes on the ' + routeName + ' bus line <strong>before and after</strong> the race.'
          break; 

        case superBadLines.includes(feature.properties.ROUTE): 
          return 'Expect disruptions and reroutes on the ' + routeName + ' bus line on <strong>July 1st</strong> and <strong>July 2nd</strong>.'
          break;

        case badLines.includes(feature.properties.ROUTE) &&
             superBadLines.includes(feature.properties.ROUTE):
          return 'Expect disruptions and reroutes on the ' + routeName + ' bus line <strong>before, during and after</strong> the race.'

        default: 
          return 'This line is expected to run as normal.'
          break;
      }
    }

    let busTooltip = `<h5>${routeName} (${feature.properties.ROUTE})</h5>
    <p>${busBlurb(feature)}</p>`

    layer
      .on('mouseover', e => { 
        e.target.setStyle({ weight: 6, opacity: 1 });
        e.target.bringToFront()          
      }) 
      .on('mouseout', e => { e.target.setStyle({ weight: 3, opacity: 0.7 }) })
      .bindTooltip(busTooltip, { sticky: true })
  }
})

function styleBusLayer(feature) {
  let line = feature.properties.ROUTE
      
  switch (true) {
    case badLines.includes(line): 
    case superBadLines.includes(line): 
      return { className: 'busDisruptedColor busStyle',
               weight: 3}
    
    default: 
      return { className: 'busColor busStyle',
               weight: 3}
  }
}

let railLayer = new L.GeoJSON.AJAX(railLines, {
  style: feature => ({className: 'railStyle railColor'})
})

let stationsLayer = new L.GeoJSON.AJAX(railStations, {
  pointToLayer: stationsToLayer,
})

function stationsToLayer (feature, latlng) {
  let bestExits = ['Washington/Wabash', 'Adams/Wabash', 'Jackson']

  let station = new L.circleMarker(latlng, {
    radius: mapView.pointsRadius,
    className: 'stationStyle stationColor', 
    stroke: bestExits.includes(feature.properties.Name) ? true : false,
    color: '#0f0f0f'
  })

  //increase mouseover trigger area for tooltips
  let markerRadius = L.circleMarker(latlng, {
    radius: mapView.pointsRadius * 3,
    stroke: 0,
    className: 'radiusMarkerColor',
    fillOpacity: 0 
  })
  
  let stationsGroup = L.layerGroup([station, markerRadius])

  stationsGroup
    .on('mouseover', e => { e.target.openTooltip(); })
    .on('mouseout', e => { e.target.closeTooltip(); })

  markerRadius
    .on('mouseover', e => { e.target.setStyle({fillOpacity: 0.5}) }) 
    .on('mouseout', e => { e.target.setStyle({fillOpacity: 0}) })

  //access & bind data to tooltip
  let stationsTooltip = `
    <h5>` + feature.properties.Name + `</h5>
    <p>` + feature.properties['Rail Line'] + `</p>
  `
  markerRadius.bindTooltip(stationsTooltip, {})

  return stationsGroup;
}



let closedRoadsLayer = new L.GeoJSON.AJAX(closedRoads, {
  style: feature => ({className: 'roadStyle roadColor'}),
})

let layers = [closedRoadsLayer, busLayer, railLayer, stationsLayer]

//testing
//let layers = [busLayer]

layers.forEach(layer => {layer.addTo(map)})

busLayer.bringToBack()

//permanent layers
let trackLayer = new L.GeoJSON.AJAX(track, {
  style: feature => ({className: 'trackStyle trackColor'})
}).addTo(map)

  // let trackMarker = L.layerGroup().addTo(map);

  // L.imageOverlay('images/start-end.svg', [[-87.620748, 41.875753], [-87.620481, 41875901]])
  //   .addTo(trackMarker)

  // trackLayer.addLayer(trackMarker)

//LAYER TOGGLE
//modify behavior of independent switches

  // document.getElementById('trackLayer').addEventListener('click', () => {
  //   document.getElementById('trackLayer').checked ? 
  //   trackLayer.addTo(map) : trackLayer.remove()
  // })

document.getElementById('railLayer').addEventListener('click', () => {
  document.getElementById('railLayer').checked ? 
  railLayer.addTo(map) & stationsLayer.addTo(map) : 
  railLayer.remove() & stationsLayer.remove() 
})

document.getElementById('busLayer').addEventListener('click', () => {
  document.getElementById('busLayer').checked ?
  busLayer.addTo(map) : busLayer.remove() 
})

document.getElementById('roadLayer').addEventListener('click', () => {
  document.getElementById('roadLayer').checked ? 
  closedRoadsLayer.addTo(map) : closedRoadsLayer.remove() 
})

let switches = document.querySelectorAll('input:not(#allLayers)'),
    switchAll = document.getElementById('allLayers')

switchAll.addEventListener('click', () => {
 if (switchAll.checked) {
    switches.forEach(input => {input.checked = true})
    layers.forEach(layer => layer.addTo(map))
    trackLayer.bringToFront()
  } else {
    switches.forEach(input => {input.checked = false})
    layers.forEach(layer => layer.remove())
    trackLayer.bringToFront()
  }
})

switches.forEach(input => {
  input.addEventListener('change', () => {
    //modify dependent behavior on "All" toggle w/event handler
    let switchStatus = Array.from(switches).some(
      input => !input.checked
    )

    switchStatus == true ? 
      switchAll.checked = false :
      switchAll.checked = true;

    //reorder layers per change
    trackLayer.bringToFront()

    if (document.getElementById('railLayer').checked) {
      stationsLayer.bringToFront()
    }
    
  })
})



window.addEventListener('load', function(){
  railLayer.bringToBack()
  busLayer.bringToBack()
  trackLayer.bringToFront()
  stationsLayer.bringToFront()

  // xtalk.signalIframe();
 
})

