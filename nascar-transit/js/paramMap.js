(function() {
  let mobileMap = document.getElementById('map').getBoundingClientRect().width < 400;

  //settings per device
  let mapView = {
    initZoom: mobileMap ? 15 : 15,
    setView: mobileMap ? [41.8735, -87.6235] : [41.875, -87.625],
    pointsRadius: mobileMap ? 6 : 7
  }

  //INIT MAP
  let map = L.map('map')
    .setView(mapView.setView, mapView.initZoom);

  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      maxZoom: mapView.initZoom + 5,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);

  //create information panel
  let InfoPane = L.Control.extend({
    options: {
      position: 'bottomleft',
      content: ''
    },
    onAdd: function(map){
      this._container = L.DomUtil.create('div', 'infoPane')
      this._container.innerHTML = this.options.content;

      this._container.addEventListener('wheel', function(event) {
        event.stopPropagation();
      });

      return this._container
    },
    updateContent: function(newContent) {
      this._container.innerHTML = newContent
    }
  })

  let infoPane = new InfoPane();
  map.addControl(infoPane)

  //DATA
  let closedRoads = 'data/pre-race-closures.json',
      busLines = 'data/cta-bus-routes.geojson',
      railLines = 'data/cta-rail-lines.geojson',
      railStations = 'data/cta-rail-stations.geojson',
      track = 'data/nascar-track.json';

  //LAYERS
  // parameter => ({}) //implicit return w/arrow function
  let badLines = ['1','2','3','4','X4','6','7','10','J14','26','28','126','143','147','148'],
      superBadLines = ['3','4','6','10','12','J14','18','20','22','36','56','60','62','126','130','146','147','151']; //July 1 & 2 disruptions

  let busLayer = new L.GeoJSON.AJAX(busLines, {
    style: feature => {
      let line = feature.properties.ROUTE
        
      switch (true) {
        case badLines.includes(line): 
        case superBadLines.includes(line): 
          return { className: 'busDisruptedColor busStyle',
                  weight: 4}
        
        default: 
          return { className: 'busColor busStyle',
                  weight: 4}
      }
    },
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

      let busTooltip = `<p class="tipHeader">${routeName} (${feature.properties.ROUTE})<p>
      <p>${busBlurb(feature)}</p>`

      layer
        .on('mouseover', e => { 
          //fade out unselected features
          busLayer.eachLayer(notTarget => {
            if (notTarget !== e.target) {
              notTarget.setStyle({ opacity: 0.2})
            }
          })

          e.target.setStyle({ weight: 8, opacity: 1 });
          e.target.bringToFront() 
        }) 
        .on('mouseout', e => { 
          busLayer.eachLayer(e => {
            e.setStyle({ weight: 4, opacity: 0.8 }) 
          })
        })
        .bindTooltip(busTooltip, { sticky: true })
    }
  })

  let railLayer = new L.GeoJSON.AJAX(railLines, {
    style: feature => ({className: 'railStyle railColor'})
  })

  let stationsLayer = new L.GeoJSON.AJAX(railStations, {
    pointToLayer: (feature, latlng) => {
      let bestExits = ['Washington/Wabash', 'Adams/Wabash', 'Jackson']
  
      let station = new L.circleMarker(latlng, {
        radius: mapView.pointsRadius,
        className: bestExits.includes(feature.properties.Name) 
          ? 'stationStyle stationColor bestStationExit'
          : 'stationStyle stationColor',
      })
  
      //increase mouseover trigger area for tooltips
      let markerRadius = L.circleMarker(latlng, {
        radius: mapView.pointsRadius * 3,
        stroke: 0,
        className: 'radiusMarkerColor',
        fillOpacity: 0, 
        title: feature.properties.Name
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
        <p class="tipHeader">` + feature.properties.Name + `<p>
        <p>` + feature.properties['Rail Line'] + `</p>
      `
      markerRadius.bindTooltip(stationsTooltip, {})

      return stationsGroup;
    }
  })

  //permanent layer
  let trackLayer = new L.GeoJSON.AJAX(track, {
    style: feature => ({className: 'trackStyle trackColor'})
  }).addTo(map)

  // let closedRoadsLayer = new L.GeoJSON.AJAX(closedRoads, {
  //   style: feature => ({className: 'roadStyle roadColor'}),
  // })

  //append layers to map
  let layers = [busLayer, railLayer, stationsLayer] //closedRoadsLayer

  //SWITCH CONTROLS
  let flyOptions = {
    duration: 1.5,
    easeLinearity: 0.2
  }

  let railSettings = {
    railZoom: mobileMap ? 15 : 15,
    railView: mobileMap ? [41.8735, -87.6235] : [41.8719, -87.625],
  }

  let busSettings = {
    busZoom: mobileMap ? 14 : 13,
    busView: mobileMap ? [41.865, -87.6235] : [41.867, -87.625],
  }

  let flyToRail = () =>  map.flyTo(railSettings.railView, railSettings.railZoom, flyOptions)

  let flyToBus = () => map.flyTo(busSettings.busView, busSettings.busZoom, flyOptions)

  drawRailLayerOnly = () => {
    map.setView(railSettings.railView, railSettings.railZoom)

    railLayer.addTo(map)
    stationsLayer.addTo(map)
    busLayer.remove()

    document.querySelectorAll('input:not(#railLayer)')
      .forEach(input => {input.checked = false})
    
    document.getElementById('railLayer').checked = true

    let railInfo = `
      <p>All "L" lines downtown will give race attendees access to the race area.</p>
      <p>Riders on the loop elevated trains should exit at <mark class="markHilite railColor">Washington/Wabash</mark> or <mark class="markHilite railColor">Adams/Wabash</mark>.</p>
      <p>Riders on the Red and Blue lines should exit at <mark class="markHilite railColor">Jackson</mark> and walk east.</p>
    `

    infoPane.updateContent(railInfo)
  }

  drawBusLayerOnly = () => {
    map.setView(busSettings.busView, busSettings.busZoom)

    busLayer.addTo(map)
    stationsLayer.remove()
    railLayer.remove()

    document.querySelectorAll('input:not(#busLayer)')
      .forEach(input => {input.checked = false})

    document.getElementById('busLayer').checked = true

    let busInfo = `<p>Expect buses around Grant Park to be rerouted around downtown.</p>

      <p>Buses serving north of the Loop, like the
      <mark class="markHilite busDisruptedColor">#22</mark>, 
      <mark class="markHilite busDisruptedColor">#36</mark>, 
      <mark class="markHilite busDisruptedColor">#146</mark> and 
      <mark class="markHilite busDisruptedColor">#147</mark> will take passengers near the Lake/State Red Line station.</p>

      <p>Buses from west of the Loop, like the
      <mark class="markHilite busDisruptedColor">#20</mark>, 
      <mark class="markHilite busDisruptedColor">#56</mark>, 
      <mark class="markHilite busDisruptedColor">#60</mark> and 
      <mark class="markHilite busDisruptedColor">#126</mark>, will take passegners near the LaSalle Blue Line and Loop Elevated stations.</p> 

      <p>Buses on the south end of the loop, like the
      <mark class="markHilite busDisruptedColor">#3</mark>, 
      <mark class="markHilite busDisruptedColor">#4</mark>, 
      <mark class="markHilite busDisruptedColor">#6</mark>,
      <mark class="markHilite busDisruptedColor">#10</mark>,
      <mark class="markHilite busDisruptedColor">#J14</mark>,
      <mark class="markHilite busDisruptedColor">#18</mark>,
      <mark class="markHilite busDisruptedColor">#62</mark>,
      <mark class="markHilite busDisruptedColor">#130</mark>,
      and <mark class="markHilite busDisruptedColor">#146</mark> will take passengers near the Roosevelt Red/Orange/Green Line station.</p>

      <p>Southbound <mark class="markHilite busDisruptedColor">#151</mark> buses will travel via Michigan Avenue to Wacker Drive, then travel via Clark to Adams to continue south/west over the regular route.</p>
       
      <p>Northbound <mark class="markHilite busDisruptedColor">#151</mark> buses will travel via Jackson to Dearborn then will take Wacker Drive to Michigan Avenue over the regular route.</p>
    `

    infoPane.updateContent(busInfo)
  }

  document.getElementById('railLayer').addEventListener('click', () => {
    document.getElementById('railLayer').checked 
    ? drawRailLayerOnly() 
    : drawBusLayerOnly()
  })

  document.getElementById('busLayer').addEventListener('click', () => {      
    document.getElementById('busLayer').checked 
    ? drawBusLayerOnly() 
    : drawRailLayerOnly()
  })

  let switches = document.querySelectorAll('input:not(#allLayers)'),
      switchAll = document.getElementById('allLayers')

  switchAll.addEventListener('click', () => {
  if (switchAll.checked) {
      switches.forEach(input => {input.checked = true})
      layers.forEach(layer => layer.addTo(map))

      trackLayer.bringToFront()
      stationsLayer.bringToFront()

      infoPane.updateContent('<p>Hover over a bus line or station for more information.</p>')

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

      switchStatus == true 
        ? switchAll.checked = false 
        : switchAll.checked = true;

      //reorder layers per change
      trackLayer.bringToFront()

      if (document.getElementById('railLayer').checked) {
        stationsLayer.bringToFront()
      }
      
    })
  })

  //SET LAYER VISIBILITY BY PARAM (e.g. mapurl.com?layer=rail)
  let urlParams = new URLSearchParams(window.location.search),
  layerURL = urlParams.get('layer');

  switch (layerURL) {
    case 'bus': 
      drawBusLayerOnly()
      break; 
    
    case 'rail': 
      drawRailLayerOnly()
      break;

    default: 
      layers.forEach(layer => {layer.addTo(map)})
      stationsLayer.bringToFront()
      break;
  }

  window.addEventListener('load', function(){
    railLayer.bringToBack()
    busLayer.bringToBack()
    trackLayer.bringToFront()
    stationsLayer.bringToFront()

    // xtalk.signalIframe();
  
  })

})();