function aFunction() {

    function delay() {

        var DOMAINS = {
            "www.nbcbayarea.com": { market: 'CA' },
            "www.nbcboston.com": { market: 'MA' },
            "www.nbcchicago.com": { market: 'IL' },
            "www.nbcconnecticut.com": { market: 'CT' },
            "www.nbcdfw.com": { market: 'TX' },
            "www.nbclosangeles.com": { market: 'CA' },
            "www.nbcmiami.com": { market: 'FL' },
            "www.nbcnewyork.com": { market: 'NY' },
            "www.nbcphiladelphia.com": { market: 'PA' },
            "www.nbcsandiego.com": { market: 'CA' },
            "www.nbcwashington.com": { market: 'DC' },
            "www.necn.com": { market: 'NECN' }
            // "data.nbcstations.com": { market: 'NY'}
        }

        var stateCodes = {
            'NY': ['09', '34', '36'],
            'CT': ['09'],
            'CA': ['06'],
            'MA': ['25', '33'],
            'FL': ['12'],
            'DC': ['11', '24', '51'],
            'IL': ['17'],
            'TX': ['48'],
            'PA': ['42', '34', '10'],
            'NECN': ['09', '25', '23', '33', '44', '50'],
            'NM': ['35'],
            'AZ': ['04'],
            'NV': ['32'],
            'CO': ['08'],
            'UT': ['49']
        }

        var stateTitles = {
            'NY': 'New York, New Jersey, Connecticut',
            'CT': 'Connecticut',
            'CA': 'California',
            'MA': 'Massachusetts and New Hampshire',
            'FL': 'Florida',
            'DC': 'DC, Maryland, Virginia',
            'IL': 'Illinois',
            'TX': 'Texas',
            'PA': 'Pennsylvania, New Jersey, Delaware',
            'NECN': 'Connecticut, Massachusetts, Maine, New Hampshire, Rhode Island, Vermont',
            'NM': 'New Mexico',
            'AZ': 'Arizona',
            'NV': 'Nevada',
            'CO': 'Colorado',
            'UT': 'Utah'
        }


        // get market from url 
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        market = urlParams.get("market");

        // get url param for spanish or english
        esp = urlParams.get("esp") === "y" ? true : false;


        if (esp) {
            $('#president').html('Presidente');
            $('#senate').html('Senado');
            $('#house').html('Cámara de Representantes');
            $('#statewide').html('A nivel estatal (<span id="state-letters"></span>)')
            $('.lead').html('AVENTAJA')
            $('.win').html('GANADOR')
            $('.resetPres').html('REINICIAR')
            $('.reset').html('REINICIAR')
            $('.resetText').html('Desplace para ampliar imagen')
            $('.county-placeholder-title').html('Selecciona condado o distrito en el mapa')
        }

        console.log('market:', market)

        var width = 375,
            height = 350;

        var projection = d3.geoAlbersUsa()

        var path = d3.geoPath()
            .projection(projection);

        // Check if mobile (less than >500)
        var IS_MOBILE = window.innerWidth < 500;

        function zoomed() {
            gElem.attr("transform", d3.event.transform)
            d3.selectAll('path').style("vector-effect", 'non-scaling-stroke');
        }
        var zoom = d3.zoom().scaleExtent([1 / 2, 4]).on("zoom", zoomed);

        var svgPres = d3.select("#map").append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 375 350")

        function zoomedHouse() {
            gElemHouse.attr("transform", d3.event.transform)
            d3.selectAll('path').style("vector-effect", 'non-scaling-stroke');
        }

        var zoomHouse = d3.zoom().scaleExtent([1 / 2, 4]).on("zoom", zoomedHouse);

        var svgHouse = d3.select("#map-house").append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 375 350")

        function zoomedSenate() {
            gElemSenate.attr("transform", d3.event.transform)
            d3.selectAll('path').style("vector-effect", 'non-scaling-stroke');
        }

        var zoomSenate = d3.zoom().scaleExtent([1 / 2, 4]).on("zoom", zoomedSenate);

        var svgSenate = d3.select("#map-senate").append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 375 350")
            .classed("svg-content-responsive", true)


        if (IS_MOBILE == false) {
            var gElem = svgPres.append("g").call(zoom);
            var gElemSenate = svgSenate.append("g").call(zoomSenate);
            var gElemHouse = svgHouse.append("g").call(zoomHouse);
        } else {
            var gElem = svgPres.append("g");
            var gElemSenate = svgSenate.append("g");
            var gElemHouse = svgHouse.append("g");
        }

        // winner version
        function colorScale(d) {
            if (d.properties.isCalled === "TRUE") {
                if (d.properties.isTied == 'yes') {
                    return '#686868'
                } else {
                    if (d.properties.leaderParty == 'Dem') {
                        return '#0878ce'
                    } else if (d.properties.leaderParty == 'GOP') {
                        return '#dd231f'
                    } else if (d.properties.leaderParty == 'Grn') {
                        return '#349b31'
                    } else if (d.properties.leaderParty == 'Lib') {
                        return '#d49523'
                    } else {
                        // indepedent
                        return '#696295'
                    }
                }
            } else {
                if (d.properties.tie == 'yes') {
                    return '#8c8c8c'
                } else {
                    if (d.properties.leaderParty == 'Dem') {
                        return '#79C0F0'
                    } else if (d.properties.leaderParty == 'GOP') {
                        return '#ED7A7A'
                    } else if (d.properties.leaderParty == 'Grn') {
                        return '#73C66A'
                    } else if (d.properties.leaderParty == 'Lib') {
                        return '#EABE7F'
                    } else {
                        // indepedent
                        return '#948eb5'
                    }
                }
            }
        }

        // IL, NH, DC, 
        if ((market == 'IL') || (market == 'CO')) {
            d3.select("#senate").style('display', 'none')
        }

        // Update last time script ran
        d3.text("https://media.nbcnewyork.com/assets/editorial/national/optimized/decision2024/map-data/last-updated.txt" + '?' + Math.floor((Math.random() * 1000) + 1))
            .then(function (time) {
                const reportedText = esp ? "Resultados  del " + time : "Results as of " + time;
                d3.selectAll("#map-reporting").html(reportedText)
            }).catch(function (error) {
                // handle error   
            })

        function mouseover(p) {
            d3.select(this).classed("hover", true).raise()
        }

        function mouseout(p) {
            d3.select(this).classed("hover", false).lower()

        }


        d3.json("data/final-data.json")
            .then(function (us) {

                d3.selectAll('.nav-item').on('click', function (d) {
                    d3.selectAll(".county-placeholder").style('display', 'block')
                    d3.selectAll(".county-block").style('display', 'none')
                    d3.selectAll('.county').classed("hover", false)
                    d3.selectAll('.senateRace').classed("hover", false)

                })

                // *****************************
                // PRESIDENTIAL DATA 
                // *****************************

                // d3.json("data/" + market + "/pres.json" + '?' + Math.floor((Math.random() * 1000) + 1))
                d3.csv("https://media.nbcnewyork.com/assets/editorial/national/optimized/decision2024/map-data/" + market + "/pres.csv" + '?' + Math.floor((Math.random() * 1000) + 1))
                    .then(function (data) {
                        // create a copy of shape data so things stay neat
                        var usPres = JSON.parse(JSON.stringify(us))

                        var selected = d3.set(stateCodes[market]);

                        var counties = topojson.feature(usPres, usPres.objects.counties)

                        var state = topojson.merge(usPres, usPres.objects.states.geometries.filter(function (d) {
                            return selected.has(d.properties['STATEFP']);
                        }))

                        var county = counties.features.filter(function (d) {
                            return selected.has(d.properties['STATEFP']);
                        });

                        // DATA JOINING 

                        data.forEach(function (d, i) {

                            // if json needs to be parsed:
                            try {
                                d.candidates = d.candidates.replace(/O'/g, 'O');
                                d.candidates = d.candidates.replace(/'/g, '"');
                                d.candidates = d.candidates.replace('True', 'true');
                                d.candidates = JSON.parse(d.candidates)
                            }
                            catch (e) { }

                            var raceGroup = d.candidates

                            votes = []
                            raceGroup.forEach(function (r) {
                                votes.push(r.voteCount)
                            })

                            // how many votes have been cast in each race:
                            var totalVotes = votes.reduce((a, b) => a + b)

                            // who's winning?

                            var leader = ""
                            var leaderParty = ""
                            var leaderVotes = ""

                            max = d3.max(raceGroup, function (h) {
                                return h.voteCount
                            })

                            raceGroup.forEach(function (a) {

                                if (a.voteCount == max) {
                                    leader = a.last
                                    leaderParty = a.party
                                    leaderVotes = a.voteCount
                                }

                            })

                            raceGroup = raceGroup.sort(function (a, b) {
                                if (a.voteCount == b.voteCount) {
                                    return d3.ascending(a.last, b.last)
                                } else {
                                    return d3.descending(a.voteCount, b.voteCount);
                                }
                            });

                            var tie = "";
                            if (raceGroup[0].voteCount !== 0) {
                                if (raceGroup[0].voteCount == raceGroup[1].voteCount) {
                                    tie = "yes"
                                }
                            }

                            // only return top four candidates with highest vote counts 
                            // raceGroup = raceGroup.slice(0,4)

                            county.forEach(function (e, j) {
                                //const fips = e.properties["GEOID"][0] == "0" ? "0" + d.fipsCode.toString() : d.fipsCode.toString();
                                const fips = d.fipsCode.toString();

                                if (fips == e.properties['GEOID']) {

                                    e.properties['candidates'] = raceGroup
                                    e.properties['percentIn'] = d.percentIn
                                    e.properties['isCalled'] = d.isCalled
                                    e.properties['lastUpdated'] = d.lastUpdated
                                    e.properties['stateAbbr'] = d.stateAbbr;
                                    e.properties['totalVotes'] = totalVotes;
                                    e.properties['leader'] = leader;
                                    e.properties['leaderParty'] = leaderParty
                                    e.properties['leaderVotes'] = leaderVotes
                                    e.properties['tie'] = tie

                                }
                            })

                        })

                        projection.scale(1)
                            .translate([0, 0]);

                        var b = path.bounds(state),
                            s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

                        projection.scale(s)
                            .translate(t);

                        gElem
                            .selectAll(".paths")
                            .data(county)
                            .enter()
                            .append("path")
                            .attr("d", path)
                            .attr('class', 'county')
                            .attr('id', d => 'geo' + d.properties['GEOID'])
                            .attr('fill', function (d) {
                                if (d.properties.totalVotes == 0) {
                                    return '#ccc'
                                } else {
                                    return colorScale(d)
                                }
                            })
                            .attr('stroke-width', '.5px')
                            .attr('stroke-linecap', 'round')
                            .attr('stroke', '#fff')
                            .on("mouseover", mouseover)
                            .on("mouseout", mouseout)
                            .on('click', d => onMapClick(d))


                        d3.select("#state-title").html(stateTitles[market])

                        d3.select("#state-letters").html(market)

                        function onMapClick(d) {

                            d3.select('#county-cands').selectAll("div").remove()

                            d3.select(".county-placeholder").style('display', 'none')
                            d3.select(".county-block").style('display', 'block')

                            d3.select("#county-title").html(d.properties['NAME'] + ", " + d.properties.stateAbbr)
                            const countyPrecinctExpectedText = esp ? parseFloat(d.properties.percentIn).toFixed(1) + "% estimado del voto total" : parseFloat(d.properties.percentIn).toFixed(1) + "% of expected votes";
                            d3.select("#county-precinct-percent").html(countyPrecinctExpectedText)

                            var candidates = d.properties.candidates

                            if (market == 'NECN') {
                                candidates = candidates.slice(0, 6)
                            }

                            candidates.forEach(function (r) {
                                if (r.voteCount == 0) {
                                    var votePercent = "0"
                                } else {
                                    var votePercent = (r.voteCount / d.properties.totalVotes * 100).toFixed(1)
                                }
                                d3.select('#county-cands').append('div').html(
                                    "<div class=" + r.party + "><span id='candTitle'>" + r.first + " " + r.last + "</span></div>" +
                                    "<div class='cand-info'><div class='prog-wrapper'><span id='candTitle'>" + (votePercent) + "% " + "</span>"
                                    + "<div class='progress " + r.party + "Party'><div class='progress-bar' role='progressbar' style='width:" + (votePercent) + "%' aria-valuemin='0' aria-valuemax='100'></div></div></div>" +
                                    "<span id='voteCount'>" + r.voteCount.toLocaleString() + "</span></div>"
                                )
                            })

                            var currentState = d.properties.stateAbbr
                            updateState(currentState)

                            var id = d.properties['GEOID']
                            d3.selectAll('.county').classed("hover", false).on("mouseout", mouseout)
                            d3.select('#geo' + id).classed("hover", true).on("mouseout", null).raise()


                            xtalk.signalIframe()

                        }

                        function updateState(stateAbbr) {

                            d3.select('#state-cands').selectAll("div").remove()

                            data.forEach(function (d) {
                                if (d.level == 'state') {
                                    if (stateAbbr == d.stateAbbr) {

                                        d3.select("#state-letters").html(stateAbbr)

                                        // d3.select("#state-precinct-percent-president").html(d.percentIn + "% of precincts reporting")

                                        /*if (d.eevp !== "Unavailable") {
                                            d3.select("#state-precinct-percent-president").html(d.percentIn + "% of expected votes")
                                        } else {
                                            d3.select("#state-precinct-percent-president").html(d.percentIn + "% of precincts reporting")
                                        }*/
                                        const percExpectedText = esp ? parseFloat(d.percentIn).toFixed(1) + "% estimado del voto total" : parseFloat(d.percentIn).toFixed(1) + "% of expected votes";
                                        d3.select("#state-precinct-percent-president").html(percExpectedText)

                                        try {
                                            d.candidates = d.candidates.replace(/'/g, '"');
                                            d.candidates = d.candidates.replace('True', 'true');
                                            d.candidates = JSON.parse(d.candidates)

                                        } catch (e) { }

                                        var raceGroup = d.candidates

                                        if (market == 'NECN') {
                                            raceGroup = raceGroup.slice(0, 6)
                                        }

                                        obj = {}
                                        votes = []
                                        raceGroup.forEach(function (r) {
                                            Object.assign(obj, {
                                                [r.last]: r.voteCount

                                            })
                                            votes.push(r.voteCount)
                                        })

                                        var totalVotes = votes.reduce((a, b) => a + b)

                                        raceGroup = raceGroup.sort(function (a, b) {
                                            if (a.voteCount == b.voteCount) {
                                                return d3.ascending(a.last, b.last)
                                            } else {
                                                return d3.descending(a.voteCount, b.voteCount);
                                            }
                                        });

                                        // // only return top four candidates with highest vote counts 
                                        // candidates = raceGroup.slice(0,4)
                                        candidates = raceGroup

                                        candidates.forEach(function (r) {
                                            if (r.voteCount == 0) {
                                                var votePercent = "0"
                                            } else {
                                                var votePercent = (r.voteCount / totalVotes * 100).toFixed(1)
                                            }

                                            d3.select('#state-cands').append('div').html(
                                                "<div class=" + r.party + "><span id='candTitle'>" + r.first + " " + r.last + "</span></div>"
                                                + "<div class='cand-info'><div class='prog-wrapper'><span id='candTitle'>" + (votePercent) + "% " + "</span>"
                                                + "<div class='progress " + r.party + "Party'><div class='progress-bar' role='progressbar' style='width:" + (votePercent) + "%' aria-valuemin='0' aria-valuemax='100'></div></div></div>" +
                                                "<span id='voteCount'>" + r.voteCount.toLocaleString() + "</span></div>"
                                            )

                                        })
                                    }
                                }
                            })
                        }

                        if (market == 'NECN') {
                            updateState('MA')
                            if (IS_MOBILE == false) {
                                d3.select('.state-wrapper h4').style('min-height', '40px')
                            }
                        } else {
                            updateState(market)
                        }

                        d3.select("#resetPres").on('click', function (d) {
                            gElem.transition()
                                .duration(750)
                                .call(zoom.transform, d3.zoomIdentity);
                        })

                    })
                    .catch(function (error) {
                        // handle error   
                    })

                // *****************************
                // SENATE DATA 
                // *****************************

                // d3.json("data/" + market + "/senate.json" + '?' + Math.floor((Math.random() * 1000) + 1))
                d3.csv("https://media.nbcnewyork.com/assets/editorial/national/optimized/decision2024/map-data/" + market + "/senate.csv" + '?' + Math.floor((Math.random() * 1000) + 1))
                    .then(function (senateData) {

                        var selected = d3.set(stateCodes[market]);

                        var senateCounties = topojson.feature(us, us.objects.counties)

                        var state = topojson.merge(us, us.objects.states.geometries.filter(function (d) {
                            return selected.has(d.properties['STATEFP']);
                        }))

                        var senateCounty = senateCounties.features.filter(function (d) {
                            return selected.has(d.properties['STATEFP']);
                        });

                        // DATA JOINING

                        senateData.forEach(function (d, i) {

                            // if json needs to be parsed:
                            try {
                                d.candidates = d.candidates.replace(/O'/g, 'O');
                                d.candidates = d.candidates.replace(/'/g, '"');
                                d.candidates = d.candidates.replace('True', 'true');
                                d.candidates = JSON.parse(d.candidates)
                            }
                            catch (e) { }

                            var raceGroup = d.candidates

                            votes = []
                            raceGroup.forEach(function (r) {
                                votes.push(r.voteCount)
                            })

                            // how many votes have been cast in each race:
                            var totalVotes = votes.reduce((a, b) => a + b)

                            var leader = ""
                            var leaderParty = ""
                            var leaderVotes = ""

                            // who's leading?
                            max = d3.max(raceGroup, function (h) {
                                return h.voteCount
                            })

                            raceGroup.forEach(function (a) {

                                if (a.voteCount == max) {
                                    leader = a.last
                                    leaderParty = a.party
                                    leaderVotes = a.voteCount
                                }

                            })

                            raceGroup = raceGroup.sort(function (a, b) {
                                if (a.voteCount == b.voteCount) {
                                    return d3.ascending(a.last, b.last)
                                } else {
                                    return d3.descending(a.voteCount, b.voteCount);
                                }
                            });

                            var tie = "";
                            if (raceGroup[0].voteCount !== 0) {
                                if (raceGroup[0].voteCount == raceGroup[1].voteCount) {
                                    tie = "yes"
                                }
                            }

                            // only return top four candidates with highest vote counts 
                            // raceGroup = raceGroup.slice(0,4)

                            senateCounty.forEach(function (e, j) {
                                if (d.level !== 'state') {
                                    if (d.fipsCode == e.properties['GEOID']) {

                                        e.properties['candidates'] = raceGroup
                                        e.properties['percentIn'] = d.percentIn
                                        e.properties['lastUpdated'] = d.lastUpdated
                                        e.properties['stateAbbr'] = d.stateAbbr;
                                        e.properties['totalVotes'] = totalVotes;
                                        e.properties['senateRace'] = "senateRace";
                                        e.properties['leader'] = leader;
                                        e.properties['leaderParty'] = leaderParty
                                        e.properties['leaderVotes'] = leaderVotes
                                        e.properties['tie'] = tie

                                    }
                                }
                            })

                        })

                        projection.scale(1)
                            .translate([0, 0]);

                        var b = path.bounds(state),
                            s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

                        projection.scale(s)
                            .translate(t);


                        gElemSenate
                            .selectAll(".senate")
                            .data(senateCounty)
                            .enter()
                            .append("path")
                            .attr("d", path)
                            .attr('class', function (d) {
                                if (d.properties.senateRace == 'senateRace') {
                                    return d.properties.senateRace
                                } else {
                                    return "noSenateRace"
                                }
                            })
                            .attr('id', d => "sen" + d.properties['GEOID'])
                            // .attr('fill', '#ccc')
                            .attr('fill', function (d) {
                                if (d.properties.totalVotes == 0) {
                                    return '#ccc'
                                } else if (d.properties.senateRace == "senateRace") {
                                    return colorScale(d)
                                } else {
                                    return '#ccc'
                                }
                            })
                            .attr('stroke-width', '.5px')
                            .attr('stroke', '#fff')

                        d3.selectAll(".senateRace")
                            .on('mouseover', mouseover)
                            .on('mouseout', mouseout)
                            .on('click', d => senateClick(d))

                        d3.select("#state-title-senate").html(stateTitles[market])

                        d3.selectAll('.noSenateRace').attr('stroke', "#686868").attr('fill', "#fff")

                        function senateClick(d) {

                            d3.select("#state-letters-senate").html(d.properties.stateAbbr)

                            d3.select('#county-cands-senate').selectAll("div").remove()

                            d3.selectAll(".county-placeholder").style('display', 'none')
                            d3.selectAll(".county-block").style('display', 'block')

                            d3.select("#county-title-senate").html(d.properties['NAME'] + ", " + d.properties.stateAbbr)
                            const countyExpectedText = esp ? parseFloat(d.properties.percentIn).toFixed(1) + "% estimado del voto total" : parseFloat(d.properties.percentIn).toFixed(1) + "% of expected votes";
                            d3.select("#county-precinct-percent-senate").html(countyExpectedText);

                            var candidates = d.properties.candidates

                            candidates.forEach(function (r) {
                                if (r.voteCount == 0) {
                                    var votePercent = "0"
                                } else {
                                    var votePercent = (r.voteCount / d.properties.totalVotes * 100).toFixed(1)
                                }
                                d3.select('#county-cands-senate').append('div').html(
                                    "<div class=" + r.party + "><span id='candTitle'>" + r.first + " " + r.last + "</span></div>" +
                                    "<div class='cand-info'><div class='prog-wrapper'><span id='candTitle'>" + (votePercent) + "% " + "</span>"
                                    + "<div class='progress " + r.party + "Party'><div class='progress-bar' role='progressbar' style='width:" + (votePercent) + "%' aria-valuemin='0' aria-valuemax='100'></div></div></div>" +
                                    "<span id='voteCount'>" + r.voteCount.toLocaleString() + "</span></div>"
                                )
                            })

                            var currentState = d.properties.stateAbbr
                            updateStateSenate(currentState)

                            var id = d.properties['GEOID']
                            d3.selectAll('.senateRace').classed("hover", false).on("mouseout", mouseout)
                            d3.select('#sen' + id).classed("hover", true).on("mouseout", null).raise()

                            xtalk.signalIframe()


                        }

                        function updateStateSenate(stateAbbr) {

                            d3.select('#state-cands-senate').selectAll("div").remove()

                            senateData.forEach(function (d) {

                                if (d.level == 'state') {
                                    if (stateAbbr == d.stateAbbr) {

                                        d3.select("#state-letters-senate").html(stateAbbr)
                                        // d3.select("#state-precinct-percent-senate").html(d.percentIn + "% of precincts reporting")
                                        /*if (d.eevp !== "Unavailable") {
                                            d3.select("#state-precinct-percent-president").html(d.percentIn + "% of expected votes")
                                        } else {
                                            d3.select("#state-precinct-percent-president").html(d.percentIn + "% of precincts reporting")
                                        }*/
                                        const stateExpectedText = esp ? parseFloat(d.percentIn).toFixed(1) + "% estimado del voto total" : parseFloat(d.percentIn).toFixed(1) + "% of expected votes";
                                        d3.select("#state-precinct-percent-president").html(stateExpectedText)

                                        try {
                                            d.candidates = d.candidates.replace(/'/g, '"');
                                            d.candidates = d.candidates.replace('True', 'true');
                                            d.candidates = JSON.parse(d.candidates)

                                        } catch (e) { }

                                        var raceGroup = d.candidates

                                        obj = {}
                                        votes = []
                                        raceGroup.forEach(function (r) {
                                            Object.assign(obj, {
                                                [r.last]: r.voteCount

                                            })
                                            votes.push(r.voteCount)
                                        })

                                        var totalVotes = votes.reduce((a, b) => a + b)

                                        raceGroup = raceGroup.sort(function (a, b) {
                                            if (a.voteCount == b.voteCount) {
                                                return d3.ascending(a.last, b.last)
                                            } else {
                                                return d3.descending(a.voteCount, b.voteCount);
                                            }
                                        });

                                        // only return top four candidates with highest vote counts 
                                        // candidates = raceGroup.slice(0,4)
                                        candidates = raceGroup

                                        candidates.forEach(function (r) {

                                            if (r.voteCount == 0) {
                                                var votePercent = "0"
                                            } else {
                                                var votePercent = (r.voteCount / totalVotes * 100).toFixed(1)
                                            }

                                            d3.select('#state-cands-senate').append('div').html(
                                                "<div class=" + r.party + "><span id='candTitle'>" + r.first + " " + r.last + "</span></div>"
                                                + "<div class='cand-info'><div class='prog-wrapper'><span id='candTitle'>" + (votePercent) + "% " + "</span>"
                                                + "<div class='progress " + r.party + "Party'><div class='progress-bar' role='progressbar' style='width:" + (votePercent) + "%' aria-valuemin='0' aria-valuemax='100'></div></div></div>" +
                                                "<span id='voteCount'>" + r.voteCount.toLocaleString() + "</span></div>"

                                            )

                                        })
                                    }
                                }
                            })
                        }
                        updateStateSenate(senateData[0].stateAbbr)

                        d3.select("#resetSenate").on('click', function (d) {
                            gElemSenate.transition()
                                .duration(750)
                                .call(zoomSenate.transform, d3.zoomIdentity);
                        })

                    })
                    .catch(function (error) {
                        // handle error   
                    })


                // *****************************
                // HOUSE DATA 
                // *****************************

                // d3.json("data/" + market + "/house.json" + '?' + Math.floor((Math.random() * 1000) + 1))
                d3.csv("https://media.nbcnewyork.com/assets/editorial/national/optimized/decision2024/map-data/" + market + "/house.csv" + '?' + Math.floor((Math.random() * 1000) + 1))
                    .then(function (data) {

                        const changeRaceName = district => {
                            const districtCopy = { ...district };
                            districtCopy["raceName"] = district["raceName"].replace(district["stateAbbr"], esp ? "Distrito" : "District");

                            return districtCopy;
                        };

                        data = data.map(d => changeRaceName(d));

                        var selected = d3.set(stateCodes[market]);

                        var districts = topojson.feature(us, us.objects.districts)

                        var state = topojson.merge(us, us.objects.states.geometries.filter(function (d) {
                            return selected.has(d.properties['STATEFP']);
                        }))

                        var district = districts.features.filter(function (d) {
                            return selected.has(d.properties['STATEFP']);
                        });


                        // DATA JOINING

                        data.forEach(function (d, i) {

                            try {
                                d.candidates = d.candidates.replace(/O'/g, 'O');
                                d.candidates = d.candidates.replace(/'/g, '"');
                                d.candidates = d.candidates.replace('True', 'true');
                                d.candidates = JSON.parse(d.candidates)
                            }
                            catch (e) {
                                console.log(e)
                            }

                            var raceGroup = d.candidates

                            votes = []
                            raceGroup.forEach(function (r) {
                                votes.push(r.voteCount)
                            })

                            var totalVotes = votes.reduce((a, b) => a + b)

                            var leader = ""
                            var leaderParty = ""
                            var leaderVotes = ""

                            // who's leading?
                            max = d3.max(raceGroup, function (h) {
                                return h.voteCount
                            })

                            raceGroup.forEach(function (a) {

                                if (a.voteCount == max) {
                                    leader = a.last
                                    leaderParty = a.party
                                    leaderVotes = a.voteCount
                                }

                            })

                            raceGroup = raceGroup.sort(function (a, b) {
                                if (a.voteCount == b.voteCount) {
                                    return d3.ascending(a.last, b.last)
                                } else {
                                    return d3.descending(a.voteCount, b.voteCount);
                                }
                            });

                            var tie = "";
                            if (raceGroup[0].voteCount !== 0 && raceGroup.length > 1) {
                                if (raceGroup[0].voteCount == raceGroup[1].voteCount) {
                                    tie = "yes"
                                }
                            }

                            // only return top four candidates with highest vote counts 
                            // raceGroup = raceGroup.slice(0,4)
                            district.forEach(function (e, j) {
                                // fixing delaware error 
                                if (d.fipsCode == '1001') {
                                    d.fipsCode = '1000'
                                }
                                if (d.fipsCode == '5001') {
                                    d.fipsCode = '5000'
                                }
                                //console.log(String(d.fipsCode).replace(/^\s+|\s+$/g, ''))
                                //console.log(String(e.properties['GEOID']).replace(/^\s+|\s+$/g, ''))
                                if (String(d.fipsCode).replace(/^\s+|\s+$/g, '') == String(e.properties['GEOID']).replace(/^\s+|\s+$/g, '')) {
                                    e.properties['percentIn'] = d.percentIn
                                    e.properties['lastUpdated'] = d.lastUpdated
                                    e.properties['raceName'] = d.raceName
                                    e.properties['stateAbbr'] = d.stateAbbr;
                                    e.properties['totalVotes'] = totalVotes;
                                    e.properties['candidates'] = raceGroup
                                    e.properties['leader'] = leader;
                                    e.properties['leaderParty'] = leaderParty
                                    e.properties['leaderVotes'] = leaderVotes
                                    e.properties['tie'] = tie


                                }
                            })

                        })

                        district = district.filter(function (d) {
                            return d.properties['GEOID'] !== '1198';
                        })

                        projection.scale(1)
                            .translate([0, 0]);

                        var b = path.bounds(state),
                            s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

                        projection.scale(s)
                            .translate(t);

                        gElemHouse
                            .selectAll(".districts")
                            .data(district)
                            .enter()
                            .append("path")
                            .attr("d", path)
                            .attr('class', 'district')
                            .attr('id', d => "hs" + d.properties['GEOID'])
                            .attr('fill', function (d) {
                                if (d.properties.totalVotes == 0) {
                                    return '#ccc'
                                } else {
                                    return colorScale(d)
                                }
                            })
                            .attr('stroke-width', '.5px')
                            .attr('stroke', '#fff')
                            .on('mouseover', mouseover)
                            .on('mouseout', mouseout)
                            .on('click', d => onMapClick(d))

                        d3.select("#house-state-title").html(stateTitles[market])

                        function onMapClick(d) {

                            d3.select('#house-county-cands').selectAll("div").remove()

                            d3.selectAll(".county-placeholder").style('display', 'none')
                            d3.selectAll(".county-block").style('display', 'block')

                            d3.select("#house-county-title").html(d.properties['raceName'] + ", " + d.properties.stateAbbr)
                            const houseExpectedText = esp ? parseFloat(d.properties.percentIn).toFixed(1) + "% estimado del voto total" : parseFloat(d.properties.percentIn).toFixed(1) + "% of expected votes";
                            d3.select("#house-county-precinct-percent").html(houseExpectedText)

                            var candidates = d.properties.candidates

                            candidates.forEach(function (r) {

                                if (r.voteCount == 0) {
                                    var votePercent = "0"
                                } else {
                                    var votePercent = (r.voteCount / d.properties.totalVotes * 100).toFixed(1)
                                }


                                d3.select('#house-county-cands').append('div').html(
                                    "<div class=" + r.party + "><span id='candTitle'>" + r.first + " " + r.last + "</span></div>" +
                                    "<div class='cand-info'><div class='prog-wrapper'><span id='candTitle'>" + (votePercent) + "% " + "</span>"
                                    + "<div class='progress " + r.party + "Party'><div class='progress-bar' role='progressbar' style='width:" + (votePercent) + "%' aria-valuemin='0' aria-valuemax='100'></div></div></div>" +
                                    "<span id='voteCount'>" + r.voteCount.toLocaleString() + "</span></div>"
                                )
                            })

                            var id = d.properties['GEOID']
                            d3.selectAll('.district').classed("hover", false).on("mouseout", mouseout)
                            d3.select('#hs' + id).classed("hover", true).on("mouseout", null).raise()

                            xtalk.signalIframe()

                        }

                        d3.select("#resetHouse").on('click', function (d) {
                            gElemHouse.transition()
                                .duration(750)
                                .call(zoomHouse.transform, d3.zoomIdentity);
                        })

                    }).catch(function (error) {
                        // handle error   
                    })

            })
            .catch(function (error) {
                // handle error   
            })
        xtalk.signalIframe()

    }
    setTimeout(delay, 2000)
}

setInterval(function () {
    window.location.reload(1);
}, (5 * 60000));

