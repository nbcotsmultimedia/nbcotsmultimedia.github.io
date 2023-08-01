(function() {
  let svg, allData, simulation, nodes, breakpoint = 400, index, tipContent = [], attribute, rawAttribute;

  let windowWidth = document.querySelector('body').getBoundingClientRect().width;

  let duration = 10000;

  //DATA
  let csvData = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv9hOU8jwuXQceVsUDjoocMB0WOoyT9rk7esv7M1JgNNR8FsAliZ7XX_r8Z58jt9HancX-gNutk55r/pub?gid=250000641&single=true&output=csv',
    gridData = 'data/us-carto-grid.csv';

  Promise.all([
    d3.csv(csvData, d => {
      return {
       Key: d.Key,
       Year: d.Year,
       Name: d.Name,
       abbr: d.State,
       allIntake: +d['Intake by Pop'],
       liveOutcomes: +d['Live Outcome by Pop'],
       catIntake: +d['Feline Intake'],
       dogIntake: +d['Canine Intake'],
       catAbandoned: +d['Feline (Given Up)'],
       dogAbandoned: +d['Canine (Given Up)'],
       catEuthanized: +d['Feline (Euthanized)'],
       dogEuthanized: +d['Canine (Euthanized)'],
       catAdopted: +d['Feline Adopted'],
       dogAdopted: +d['Canine Adopted'],
       intakeRaw: +d['Total Intakes Raw'],
       outcomesRaw: +d['Total Live Outcomes Raw'],
       catIntakeRaw: +d['Feline Intake Raw'],
       dogIntakeRaw: +d['Canine Intake Raw'],
       catAbandonedRaw: +d['Feline Given Up Raw'],
       dogAbandonedRaw: +d['Canine Given Up Raw'],
       catEuthanizedRaw: +d['Feline Euthanized Raw'],
       dogEuthanizedRaw: +d['Canine Euthanized Raw'],
       catAdoptedRaw: +d['Feline Adopted Raw'],
       dogAdoptedRaw: +d['Canine Adopted Raw'],
      };
    }),
    d3.csv(gridData)
  ]).then(dataset => {
    data = dataset[0];
    grid = dataset[1];

    document.getElementById('data-level-1').checked = true;

    draw();

    document.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', draw);
    });

    window.addEventListener('resize', () => {
      windowWidth = document.querySelector('body').getBoundingClientRect().width;

      draw();
    });
    
  })

  function chooseData(dataAttribute) {
    let rawFormatted, name = (d => d.Name), year = (d => d.Year);

    switch (dataAttribute) {
      default:
        attribute = (d => d.allIntake); 
        rawAttribute = (d => d.intakeRaw);

        attrFormat = (d => d.intakeRaw).toLocaleString();

        tipContent[index] = `In ${name}, there were ${attrFormat}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '2':
        attribute = (d => d.liveOutcomes); 
        rawAttribute = (d => d.outcomesRaw);

        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`

        console.log('eh')

        break;

      case '3':
        attribute = (d => d.catAdopted); 
        rawAttribute = (d => d.catAdoptedRaw);
        
        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;
        
      case '4':
        attribute = (d => d.dogAdopted); 
        rawAttribute = (d => d.dogAdoptedRaw);
        
        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '5':
        attribute = (d => d.catAbandoned); 
        rawAttribute = (d => d.catAbandonedRaw);
        
        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '6':
        attribute = (d => d.dogAbandoned); 
        rawAttribute = (d => d.dogAbandonedRaw);
        
        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '7':
        attribute = (d => d.catEuthanized); 
        rawAttribute = (d => d.catEuthanizedRaw);
        
        rawFormatted = (d => d.catEuthanizedRaw.toLocaleString())

        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '8':
        attribute = (d => d.dogEuthanized); 
        rawAttribute = (d => d.dogEuthanizedRaw);
        
        tipContent[index] = (name, year, d) => `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '9':
        attribute = (d => d.catIntake); 
        rawAttribute = (d => d.catIntakeRaw);
        
        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;

      case '10':
        attribute = (d => d.dogIntake); 
        rawAttribute = (d => d.dogIntakeRaw);
        
        tipContent[index] = `In ${name}, there were ${rawAttribute}  animals that passed through a shelter in ${year}. <br><br> That's approximately <span class="tipStrong">${attribute}</span> animal for every 100,000 people there.`
        
        break;
    }

  }

  function draw(){
    let states = [...new Set(grid.map(d => d.abbr))],
        years = [...new Set(data.map(d => d.Year))];

    //CONTROLS
    let inputs = document.querySelectorAll('input'),
        dataAttribute;

    inputs.forEach(input => {
      input.addEventListener('change', function(){
        inputs.forEach(input => input.checked = false)
        this.checked = true

        dataAttribute = input.value;

        chooseData(dataAttribute)

        windowWidth < breakpoint
          ? drawforMobile()
          : drawforDesktop();
      }) 
    })
    
    //draw which map? 
    windowWidth < breakpoint
      ? drawforMobile()
      : drawforDesktop();

    function drawforMobile(){
      document.getElementById('viz').innerHTML = '';

      index = 0;

      //set dimensions 
      let margin = {left: 30, top: 15, bottom: 50, right: 0},
          width = windowWidth - margin.left - margin.right;
          height = 550 + margin.bottom;

      let tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => tipContent[index])

      let chart = d3.select('#viz')
        .attr('width', width)
        .attr('height', height)
        .classed('mobileChart', true)

      svg = d3.select('svg')

      if (svg.empty()) {
        svg = chart.append('svg')
          .attr('width', width + margin.left + margin.right )
          .attr('height', height + margin.top + margin.bottom)
      }

      let g = svg.select('g')

      if (g.empty()) {
        g = svg.append('g')
          .attr(
            'transform',
            'translate(' + margin.left + ',' + margin.top + ')'
          );
      }

      //create scale
      let x = d3.scaleBand()
        .rangeRound([-40, width + margin.left + margin.right])
        .domain(years.map(year => year.toString()))
        .paddingInner(0.1)
        .paddingOuter(0.1);

      let y = d3.scaleLinear()
        .range([height - margin.bottom, 0])
        .domain([0, d3.max(data, attribute)]);

      //draw axis
      g.append('g')
          .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
          .call(d3.axisBottom(x))
          .selectAll('text') 
            .style('text-anchor', 'end')
            .attr('dx', '1em')
            .attr('dy', '1em')
        
      g.append('g')
        .call(d3.axisLeft(y).ticks(5))

      // Generate line
      let line = d3.line()
        .x(d => x(d.Year.toString()) + x.bandwidth() / 2)
        .y(d => y(attribute(d)))
        .curve(d3.curveNatural);

      // Remove existing lines and datapoints
      g.selectAll('.line').remove();
      g.selectAll('.datapoint').remove();

      states.forEach(state => {
        let thisState = data.filter(d => d.abbr === state);
         
        //generate lines  
        g.append('path')
            .datum(thisState)
          .classed('chartline', true)
          .attr('d', line)
          .attr('stroke', '#757575')
          //mouseover and mouseout events
          .on('mouseover', function(event, d) {
            d3.select(this)
              .classed('chartline', false)
              .classed('activeLine', true)

            g.selectAll('.datapoint')
              .filter(dPoint => dPoint.abbr === state)
              .attr('opacity', 1)
              .attr('r', 5)
              .attr('stroke', 'steelblue')

            let lineLabel = thisState[thisState.length - 1]

            rawFormatted = lineLabel.intakeRaw.toLocaleString();

            tipContent[index] = 
              `In ${lineLabel.Name}, there were ${rawFormatted} animals that passed through a shelter in ${lineLabel.Year}. <br><br> That's approximately <span class="tipStrong">${lineLabel.allIntake}</span> animal for every 100,000 people there.`;

            tip.show(lineLabel, this);

            g.append('text')
              .attr('x', x(lineLabel.Year.toString()) + x.bandwidth() / 2)
              .attr('y', y(lineLabel.allIntake) - 15) 
              .attr('text-anchor', 'middle')
              .text(lineLabel.abbr)
              .classed('gText', true)
              .attr('fill', '#c8c8c8');
          })
          .on('mouseout', function() {
            d3.select(this)
              .classed('chartline', true)
              .classed('activeLine', false)

            // Hide all datapoints
            g.selectAll('.datapoint')
              .attr('opacity', 0);

            g.selectAll('.gText').remove();

            tip.hide();
          })
          .transition()
          .duration(duration)
          .attr('d', line)

        // Generate datapoints
        g.selectAll('.circle')
          .data(thisState)
            .enter()
          .append('circle')
          .classed('datapoint', true)
          .attr('cx', d => x(d.Year.toString()) + x.bandwidth() / 2)
          .attr('cy', d => y(attribute(d)))
          .attr('r', 3)
          .attr('opacity', 0)
          .transition()
          .duration(duration)
          .attr('cy', d => y(attribute(d)))

        g.call(tip)

        index++;
      })

    } //MOBILE

    function drawforDesktop(){
      document.getElementById('viz').innerHTML = '';

      index = 0;

      //set dimensions
      let gridCols = d3.max(grid, d => +d.x) + 1,
        margin = {left: 5, top: 15, bottom: 20, right: 0},
        cellPadding = 10,  
        cellWidth = (windowWidth - (gridCols - 1) * cellPadding) / gridCols,
        cellHeight = cellWidth,
        svgWidth = cellWidth - margin.left - margin.right,
        svgHeight = cellHeight - margin.top,
        exampleSVGHeight = cellHeight - margin.top - margin.bottom;
        

      //calculate cell placement
      function getCellPositions(x, y) {
        let xPosition = x * (cellWidth + cellPadding),
            yPosition = y * (cellHeight + cellPadding);

        return { xPosition, yPosition };
      }

      let tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .html(d => tipContent[index])

      //create small multiples
      states.forEach(state => {
        let thisState = data.filter(d => d.abbr === state);

        let { xPosition, yPosition } = 
          getCellPositions(
            grid.find(d => d.abbr === state).x,
            grid.find(d => d.abbr === state).y
          )

        let chartcell =  d3.select('#viz')
          .append('div')
          .classed(state + '-cell', true)
          .classed('minisvg', true)
          .style('position', 'absolute')
          .style('left', xPosition)
          .style('top', yPosition)
          .style('width', cellWidth)
          .style('height', cellHeight)

        let svg = chartcell.append('svg')
          .attr('width', cellWidth + 'px')
          .attr('height', cellHeight + 'px');

        //set margins for cells
        let g = svg.append('g')
          .attr(
            'transform', 
            'translate(' + margin.left + ',' + margin.top + ')'
          );

        //create scale
        let x = d3.scaleBand()
          .rangeRound([0, svgWidth])
          .domain(years.map(year => year.toString()))
          .paddingInner(0.1) 
          .paddingOuter(0.1); 

        let y = d3.scaleLinear()
          .domain([0, d3.max(data, attribute)])

        //draw axis
        if (state === 'AK') {
          y.range([exampleSVGHeight, 0])
          
          g.append('g')
            .attr('transform', 'translate(0, ' + exampleSVGHeight + ')')
            .call(d3.axisBottom(x)
              .tickValues([
                years[0], 
                years[years.length - 1]
              ])
            )
            .selectAll('text') 
              .style('text-anchor', 'end')
              .attr('dx', '1em')
              .attr('dy', '1em')
          
          g.append('g')
            .call(d3.axisLeft(y).ticks(2))
              .selectAll('.tick text')
              .attr('x', 10)
            
          g.append('text')
            .classed('gText', true)
              .attr('text-anchor', 'start')
              .attr('font-size', '.75em')
              .text(state);

        } else {

          y.range([svgHeight, 0])

          g.append('g')
            .call(d3.axisLeft(y).ticks(0))
            .append('text')
              .classed('gText', true)
              .attr('y', 0.7)
              .attr('dx', '.2em')
              // .attr('dy', '1.2em')
              .attr('text-anchor', 'start')
              .text(state);
        }
        
        //generate line
        let lines = d3.line()
          .x(d => x(d.Year.toString()) + x.bandwidth() / 2)
          .y(d => y(attribute(d)))
          .curve(d3.curveBasis);

        g.append('path')
          .datum(thisState)
            .attr('class', 'line')
            .attr('d', lines)
            .classed('chartline', 'true')

        //generate datapoints
        g.selectAll('.circle')
            .data(thisState)
          .enter()
          .append('circle')
            .attr('cx', d => x(d.Year.toString()) + x.bandwidth() / 2)
            .attr('cy', d => y(attribute(d)))
            .attr('r', 3)
            .classed('datapoint', true)
          .transition()
          .duration(duration)
          .attr('cy', d => y(attribute(d)))
            
        //expand mouseover trigger area  
        g.selectAll('.tt-target')
          .data(thisState)
          .enter()
          .append('rect')
          .attr('x', (d) => x(d.Year.toString()))
          .attr('y', 0)
          .attr('width', x.bandwidth())
          .attr('height', cellHeight)
          .attr('fill', 'transparent')
          // .attr('opacity', .2)
          .on('mouseover', function(event, d){
            
            tip.show(tipContent, this)
            
            //highlight associated datapoint
            g.selectAll('.datapoint')
             .filter(dPoint => dPoint === d)
             .attr('stroke', '#c8c8c8')
             .attr('stroke-width', 2)
          })
          .on('mouseout', function(){
            tip.hide();

            g.selectAll('.datapoint').attr('stroke', 'none')
          })

        g.call(tip)

        index++;
      }) //END STATES ITERATION

    } //DESKTOP

  } //END DRAW

  chooseData('1')

})();