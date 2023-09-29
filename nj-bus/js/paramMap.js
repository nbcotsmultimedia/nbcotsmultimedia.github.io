(function() {
  let csv = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQkdRFBRSG-6wWq9YnGBdYn8dthwlqPV-1Fn84XwqfSVEXEKLItB8BmILvOUE-twd9C7tsFoQam7Sd3/pub?gid=1145052216&single=true&output=csv'

  const kFormat = d3.format(',.2r'),
        sFormat = d3.format(',.2s'),
        pctFormat = d3.format('%')

  d3.csv(csv, d => {
    return {
      district: d.District,
      cost: +d['Avg. Cost per Student (21-22)'],
      spEd: +d['Special ed students with transport services'],
      genFund: +d['General Fund (21-22)'],
      genFundPct: +d['Pct. of General Budget (%)'],
      bussed: +d['Transported Students'],
      busSpend: +d['Undistributed Expenditures-Student Transportation Services (21-22)'],
      lat: +d.Latitude,
      lon: +d.Longitude 
    }
  }).then(data => {
    draw(data)
  })

  function draw(data) {

    //DRAW MAP
    let mobileMap = document.getElementById('map').getBoundingClientRect().width < 400;
  
    // mobile / desktop
    let mapView = {
      initZoom: mobileMap ? 8 : 8,
      setView: mobileMap ? [40.1, -74.71] : [40.1, -74.71],
      pointsRadius: mobileMap ? 2 : 6
    }

    let baseR = mapView.pointsRadius

    //INIT MAP
    let map = L.map('map', {zoomControl: false})
      .setView(mapView.setView, mapView.initZoom);

    new L.Control.Zoom({position: 'topright'}).addTo(map)

    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        maxZoom: mapView.initZoom + 5,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contrib. &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    //scales
    let colorScale = d3.scaleQuantile()
      .domain(data.map(d => d.cost))
      .range(['#fcde9c', '#f58670', '#e34f6f', '#d72d7c', '#7c1d6f'])

    // check scale values
    // colorScale.range().forEach((color, i) => {
    //   let domain = colorScale.quantiles()[i]
    //   console.log(`Color: ${color}, Domain: ${domain}`)
    // })

    let minScaleRadius = 4, 
        maxScaleRadius = 8, 
        sizeValueSet = data.map(d => d.genFundPct)

    let sizeScale = d3.scaleQuantile()
      .domain(sizeValueSet)
      .range(
        d3.range( 0, sizeValueSet.length + 1)
          .map(i => d3.interpolate(minScaleRadius, maxScaleRadius)( i / sizeValueSet.length)))

    //create markers
    data.forEach(d => {

      d.markerID = d.district

      L.geoJSON({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [d.lon, d.lat]
        },
        properties: d
      }, {
        pointToLayer: drawMarkers
      }).addTo(map)
    })

    function drawMarkers(feature, latlng) {
      let color = colorScale(feature.properties.cost)

      let marker = L.circleMarker(latlng, {
        radius: sizeScale(feature.properties.genFundPct),
        className: `markers`,
        fillColor: color
      })

      let extendedMarker = L.circleMarker(latlng, {
        radius: sizeScale(feature.properties.genFundPct) * 2,
        className: 'extendedMarker',
        fillOpacity: 0,
        stroke: 0
      })

      let markerGroup = L.layerGroup([marker, extendedMarker])

      //pointer events
      marker
        .on('mouseover', e => { e.target.openTooltip(); })
        .on('mouseout', e => { e.target.closeTooltip(); })

      extendedMarker
        .on('mouseover', e => { e.target.setStyle({fillOpacity: 0.85}) }) 
        .on('mouseout', e => { e.target.setStyle({fillOpacity: 0}) })

      //access & bind data to tooltip
      let markerTooltip = `
        <p>The ${feature.properties.district} School District spent, on average, <strong>$${kFormat(feature.properties.cost)}</strong> per student to transport them to school. </p> 
        
        <p>The district spent <strong>${feature.properties.genFundPct}%</strong> of its budget on transportation for the '21 – '22 academic year.</p>
      `
      extendedMarker.bindTooltip(markerTooltip, {className: 'leaflet-tooltip'})

      return markerGroup;  
    }

    //legend
    let legend = d3.select('.leaflet-top.leaflet-left')

    legend
      .append('div')
      .classed('legend-title', true)
      .text('NJ School District Transport Spend')

    let colorLegend = legend.append('div').classed('color-legend', true)

    colorLegend
      .append('div')
      .classed('sub-legend-title', true)
      .text('Avg. Cost per Bussed Student')

    let minValue = d3.min(colorScale.domain()),
    maxValue = d3.max(colorScale.domain()),
    avgValue = d3.mean(data.map(d => d.cost))

    let avgPositionPct = ( avgValue - minValue ) / (maxValue - minValue) * 100 + 6

    let colorGradient = colorLegend.append('div').classed('legend-gradient', true)

    colorGradient
        .style('background', `linear-gradient(to right, ${colorScale.range().join(", ")})`)

    colorGradient.append('div')
        .classed('color-legend-value legend-min-value', true)
        .text(`$${sFormat(minValue)}`)

    colorGradient.append('div')
        .classed('color-legend-value legend-max-value', true)
        .text(`$${sFormat(maxValue)}`)
    
    colorGradient 
      .append('div').classed('legend-color-marker', true)
      .style('left', `${avgPositionPct}%`)

    colorGradient.append('div')
      .classed('color-legend-value legend-avg-value', true)
      .text(`$${sFormat(avgValue)} Per Student`)
      .style('left', `${avgPositionPct - 5}%`)


    // let colorLegendItems = colorLegend
    //   .selectAll('.legend-color-item')
    //   .data(colorDomain).enter()
    //   .append('div')
    //   .classed('legend-color-item', true)

    // colorLegendItems.append('div').classed('legend-color', true)
    //   .style('background-color', d => colorScale(d))

    // colorLegendItems.append('span').text(d => `${d}`)

    //END TABLE


    //DRAW TABLE
    let sortCol,
      sortAsc = false,
      pageSize = 10,
      currentPage = 1;

    let row = document.querySelector('tbody'),
        backButton = document.getElementById('backButton'),
        nextButton = document.getElementById('nextButton')

    backButton.addEventListener('click', prevPage, false)
    nextButton.addEventListener('click', nextPage, false)

    function renderTable(data){
      let tableContent = '';

      data.filter((row, i) => {
        let start = (currentPage - 1) * pageSize,
            end = currentPage * pageSize;

        if (i >= start && i < end) return true;
      })
      .forEach(d => {
        tableContent += `<tr>
            <td>${d.district}</td>
            <td>$${kFormat(d.cost)}</td>
            <td>$${sFormat(d.genFund)}</td>
            <td>$${sFormat(d.busSpend)}</td>
            <td>${kFormat(d.bussed)}</td>
          </tr>
        `
      })

      row.innerHTML = tableContent
    }

    renderTable(data)

    //PAGINATE 
    let pageIndicator = document.getElementById('thisPage'),
        lastPage = document.getElementById('allPage')

    //init navigator
    let tableLength = data.map(d => d.district).length,
        pageLength = Math.round(tableLength / pageSize)

    lastPage.innerHTML = pageLength

    function prevPage(){
      if (currentPage > 1) currentPage --;
      renderTable(data)
      pageIndicator.innerHTML = currentPage
    }

    function nextPage(){
      if ((currentPage * pageSize) < data.length) currentPage++
      renderTable(data)
      pageIndicator.innerHTML = currentPage
    }

    //FILTER
    const searchField = document.getElementById('searchField'),
          tableBody = document.getElementById('tableBody')

    let filteredData;

    searchField.addEventListener('input', () => {
      let searchText = searchField.value.toLowerCase()
      
      filteredData = data.filter(d => d.district.toLowerCase().includes(searchText))

      let filteredTableLength = filteredData.length,
          filteredPageLength = Math.ceil(filteredTableLength / pageSize)

      lastPage.innerHTML = filteredPageLength

      renderTable(filteredData)
    })

    //SORT
    document.querySelector('#t0').querySelector('path.caret-down').style.display = 'block'

    let colHeader = document.querySelectorAll('.colHeader'),
        sortedCol = 'district',
        currentSortOrder = 'desc'
    
    colHeader.forEach(elem => {
      elem.addEventListener('click', () => {
        let sortAsc = elem.querySelector('.caret-up'),
            sortDesc = elem.querySelector('.caret-down'),
            column = elem.parentElement.dataset.sort;

        if (column === sortedCol) {
          currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc'
        } else {
          //reset indicators for other cols
          colHeader.forEach(otherElem => {
            otherElem.querySelector('.caret-up').style.display = 'none';
            otherElem.querySelector('.caret-down').style.display = 'none';
          })

          sortedCol = column;
          currentSortOrder = 'desc'
        }

        //update indicators based on current sort order
        if (currentSortOrder === 'asc') {
          sortAsc.style.display = 'block';
          sortDesc.style.display = 'none';
        } else {
          sortAsc.style.display = 'none';
          sortDesc.style.display = 'block'
        }

        //sort the data
        let sortedData = data.slice()

        sortedData.sort((a, b) => {
          let xValue = a[sortedCol],
              yValue = b[sortedCol]

            if (typeof xValue === 'string' && typeof yValue === 'string'){
              if (currentSortOrder === 'desc') {
                return xValue.localeCompare(yValue)
              } else {
                return yValue.localeCompare(xValue)
              }
            } else if (typeof xValue === 'number' && typeof yValue === 'number') {

              if (currentSortOrder === 'asc') {
                return xValue - yValue
              } else {
                return yValue - xValue
              }
            }
        })

        renderTable(sortedData)

      })
    })

    let highlightedMarker = null;
    
    //pop marker on table hover
    document.querySelectorAll('tbody tr').forEach(row => {
      let district = row.cells[0].textContent
      let markerID = `marker-${district}`
      let marker = null

      map.eachLayer(layer => {
        if (layer instanceof L.CircleMarker && layer.options.district === district) { marker = layer }
      })

      row.addEventListener('mouseover', () => {
        map.eachLayer(layer => {
          if (layer !== marker && layer instanceof L.CircleMarker) {
            layer.setStyle({ opacity: 0.05 });
          }
        })
      })
      
      row.addEventListener('mouseout', () => {
        map.eachLayer(layer => {
          if (layer instanceof L.CircleMarker) {
            layer.setStyle({ opacity: 0.2 });
          }
        });
      })


    })

  //END TABLE

  }

})();