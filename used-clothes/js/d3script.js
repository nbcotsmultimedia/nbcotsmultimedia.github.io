(function() {
  let svg, breakpoint = 450, index = 0;

  let width = d3.select('#globe').node().getBoundingClientRect().width;

  let height = 650;

  let sensitivity = 50;

  let startPoint = [-87.6298, 41.8781]; //chicago

  //DATA
  let geofeatures = 'data/world.json',
    dataCSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_xT8yxgSYhRlpTyFof08SHyFvvAzESGZeRKifJFGYJV-9JbPFuIcyaEtoPONNEBwmhcChsIp5CRRm/pub?gid=1160922811&single=true&output=csv';

  Promise.all([
    d3.json(geofeatures),
    d3.csv(dataCSV, d => {
      return {
        country: d.country,
        lb: +d.pounds,
        value: +d.value,
        lat: +d.latitude,
        lon: +d.longitude,
        lbsWeighted: +d.lbsNormalized,
        valWeighted: +d.valNormalized
      };
    })
  ]).then(d => {
    geodata = d[0];
    data = d[1];

    setTimeout(draw(), 1000)
  })

  function draw(){
    let svg = d3.select('#globe')
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    let projection = d3.geoOrthographic()
      .scale(250)
      .center([0,0])
      .rotate([-startPoint[0], -startPoint[1], 0]) //start on chicago
      .translate([width / 2, height / 2])

    let initScale = projection.scale()

    let globe = svg.append('circle')
      .attr('fill', '#efefef')
      .attr('stroke', 'none')
      .attr('stroke-width', '0.2')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', initScale)

    let path = d3.geoPath().projection(projection)

    let map = svg.append('g')

    map.append('g')
      .attr('class', 'countries')
      .selectAll('path')
      .data(geodata.features)
      .enter().append('path')
      .attr('class', d => 'country_' + d.properties.name.replace(' ','_'))
      .attr('d', path)
      .attr('fill', '#FFF')
      .style('stroke', '#afafaf')
      .style('stroke-width', 0.3)
      .style('opacity', 0.8)
    
    //draw paths
    data.forEach(datum => {
      let target = [datum.lon, datum.lat],
          intPoint = d3.geoInterpolate(startPoint, target)(0.5),
          strokeWidth = datum.lbsWeighted

      svg.append('path')
        .datum({
        type: 'LineString',
        coordinates: [startPoint, intPoint, target]
      })
      .classed('bezier-curve', true)
      .classed('keyline', true)
      .attr('d', path)
      .style('stroke-width', strokeWidth)
    })

    //make the globe draggable
    svg
      .call(
        d3.drag().on('drag', () => {
          const rotate = projection.rotate()
          const k = sensitivity / projection.scale()

          projection.rotate([
            rotate[0] + d3.event.dx * k,
            rotate[1] - d3.event.dy * k
          ])

          path = d3.geoPath().projection(projection)

          svg.selectAll('path').attr('d', path)
        })
      )
      .call(
        d3.zoom().on('zoom', () => {
          if(d3.event.transform.k > 0.3) {
            projection.scale(initScale * d3.event.transform.k)

            path = d3.geoPath().projection(projection)

            svg.selectAll('path').attr('d', path)

            globe.attr('r', projection.scale())
          } else {
            d3.event.transform.k = 0.3
          }
        }) 
      )

    //optional rotate
    d3.timer(function(elapsed) {
      const rotate = projection.rotate()
      const k = sensitivity / projection.scale()

      projection.rotate([
        rotate[0] - 1 * k,
        rotate[1]
      ])

      path = d3.geoPath().projection(projection)

      svg.selectAll('path').attr('d', path)

    }, 200)


    //Tooltips
  //   svg.selectAll('ELEMENT-CLASS-NAME-HERE')
  //     .on('mouseover', mouseOver)
  //     .on('mouseout', mouseOut)

  //   function mouseOver(d){
  //     d3.select('#tooltip')
  //       .style('left', (d3.event.pageX - 55) + 'px')
  //       .style('top', (d3.event.pageY < height / 2) ? (d3.event.pageY + 20) + 'px' : (d3.event.pageY - 230) + 'px')
  //       .style('display', 'inline-block')
  //       // .html(`<p><strong class='tipColor'>Top Issue:</strong><br> ${d.Issues}</p>
  //       //   <p><strong class='tipColor'>Party Affiliation:</strong><br> ${d.Party}</p>
  //       //   <p><strong class='tipColor'>Age:</strong><br> ${d.Age}</p>`)
        
  //     d3.select(this)
  //       .transition('mouseover').duration(100)
  //       .attr('opacity', 1)
  //   }

  //     function mouseOut(d){
  //       d3.select('#tooltip')
  //         .style('display', 'none')

  //       d3.select(this)
  //         .transition('mouseout').duration(100)
  //         .attr('opacity', 0.8)
  //         .attr('stroke-width', 0)
  //     }

  } //END DRAW

  
})();
