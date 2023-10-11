var ds;
var totalEntries;
var allData;
var config;

// check if user is on mobile or desktop
const mobile = window.innerWidth <= 768;

// scrolling variable to prevent event handlers from firing while page is scrolling
let scrolling = false;

// variable to track which winery is selected when scrolling from map
let selectedMarker;

// variables to track slides in mobile
let currentSlide, currentIndex;

// list of markers on the map
const markerList = [];

// container for all text content
const textContainer = $('#text');

// find marker associated with given location
const findMarker = locationName => {
    const marker = markerList.find(marker => marker.options?.title === locationName);
    return marker;
};

// select marker that corresponds to location of current slide
const markerVisibility = (currentLocation, map) => {
    currentMarker = findMarker(currentLocation);

    // select whichever marker corresponds to current text section
    markerOpacity(currentMarker.options?.title, map);
}

// make current slide visible, hide all others
const slideVisibility = () => {
    const sections = textContainer.children('section');
    for(let i = 0; i < sections.length; i++) {
        const thisSection = sections[i];
        // scroll to text section that corresponds to clicked marker
        if (thisSection.id === currentSlide.name) {
            thisSection.style.display = "block";
            textContainer.scrollTop(0);
        } else {
            thisSection.style.display = "none";
        }
    };
};

// changes slide from current slide to next/prev slide based on increment
const updateSlide = (slideName, index, increment, buttonClick, map) => {
    // find next slide, either by name or index
    if (slideName) {
        currentSlide = allData.find(o => o.name === slideName);
        currentIndex = allData.indexOf(currentSlide);
    }
    else {
        currentSlide = allData[index + increment];
        currentIndex = index + increment;
    }

    // if mobile, center map around current point
    if (mobile) {
        currentMarker = findMarker(currentSlide.name);
        map.setView([currentMarker._latlng.lat, currentMarker._latlng.lng], 10);
    }
    // select current marker
    markerVisibility(currentSlide.name, map);

    // if changing slides, update slide
    if (buttonClick) {
        slideVisibility();
    }
};

// scroll to text section that corresponds to clicked marker
const scrollToSlide = (e, map) => {
    const sections = textContainer.children('section');

    for(let i = 0; i < sections.length; i++) {
        const thisSection = sections[i];
        // scroll to text section that corresponds to clicked marker
        if (thisSection.id === e.target?.options?.title) {
            thisSection.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start'});
            scrolling = true;
            selectedMarker = thisSection;
            markerOpacity(sections[i].id, map);
        }
    };
};

// event handler for marker click
const handleMarkerClick = (e, map) => {
    if (mobile) {
        updateSlide(e.target?.options?.title, 0, 0, true, map);
    } else {
        scrollToSlide(e, map);
    }
};

// create a marker and add to marker list
const marker = (markerData, map) => {
    const lat = markerData.latitude;
    const long = markerData.longitude;
    const name = markerData.name;
    // create custom marker
    var markerIcon = L.icon({
        iconUrl: 'images/map_marker.png',
        iconSize:     [26, 39.8], 
        iconAnchor:   [13, 39.8],
    });
    const marker = L.marker([lat, long], { title: name, icon : markerIcon });
    marker.on('click', e => handleMarkerClick(e, map));

    markerList.push(marker);

    return marker;
};

// create a layer group with all markers 
const markerGroup = (markerData, map) => {
    for(let i = 0; i < markerData.length; i++) {
        const thisMarker = marker(markerData[i], map);
        if (i == 0) {
            markerOpacity(thisMarker, map);
        }
    }

    const markerGroup = L.layerGroup(markerList);

    return markerGroup;
};

// set opacity of markers (selected marker = 1.0, unselected markers = 0.5)
const markerOpacity = (selectedMarkerTitle, map) => {
    let markers = map.getPanes().markerPane.childNodes;
    for(let i = 0; i < markers.length; i++) {
        const thisMarker = markers[i];
        thisMarker.style.opacity = thisMarker.title === selectedMarkerTitle ? 1.0 : 0.5;
        thisMarker.style.zIndex = thisMarker.title === selectedMarkerTitle ? 99999 : markerList[i]._zIndex;
    };
};

// add text to page
const addText = (data, map) => {

    const addImage = row => {
        let htmlBlock = ''
        if (row.ig_post) {
            htmlBlock = `<blockquote class="instagram-media"
            data-instgrm-permalink="https://www.instagram.com/p/${row.ig_post}/?utm_source=ig_embed&amp;utm_campaign=loading"
            data-instgrm-version="14"
            style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <div style="padding:16px;"> <a
                    href="https://www.instagram.com/p/${row.ig_post}/?utm_source=ig_embed&amp;utm_campaign=loading"
                    style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;"
                    target="_blank">
                    <div style=" display: flex; flex-direction: row; align-items: center;">
                        <div
                            style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;">
                        </div>
                        <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;">
                            <div
                                style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;">
                            </div>
                            <div
                                style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;">
                            </div>
                        </div>
                    </div>
                    <div style="padding: 19% 0;"></div>
                    <div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><svg width="50px" height="50px"
                            viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg"
                            xmlns:xlink="https://www.w3.org/1999/xlink">
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                                    <g>
                                        <path
                                            d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631">
                                        </path>
                                    </g>
                                </g>
                            </g>
                        </svg></div>
                    <div style="padding-top: 8px;">
                        <div
                            style=" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;">
                            View this post on Instagram</div>
                    </div>
                    <div style="padding: 12.5% 0;"></div>
                    <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;">
                        <div>
                            <div
                                style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);">
                            </div>
                            <div
                                style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;">
                            </div>
                            <div
                                style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);">
                            </div>
                        </div>
                        <div style="margin-left: 8px;">
                            <div
                                style=" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;">
                            </div>
                            <div
                                style=" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)">
                            </div>
                        </div>
                        <div style="margin-left: auto;">
                            <div
                                style=" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);">
                            </div>
                            <div
                                style=" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);">
                            </div>
                            <div
                                style=" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);">
                            </div>
                        </div>
                    </div>
                    <div
                        style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;">
                        <div
                            style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;">
                        </div>
                        <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;">
                        </div>
                    </div>
                </a>
                <p
                    style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">
                    <a href="https://www.instagram.com/p/${row.ig_post}/?utm_source=ig_embed&amp;utm_campaign=loading"
                        style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;"
                        target="_blank">A post shared by ${row.ig_name} (${row.ig_username})</a></p>
            </div>
        </blockquote>
        <script async src="//www.instagram.com/embed.js"></script>`;
        }
        else if (row.img) {
            htmlBlock = `<img src="./images/${row.img}" alt="${row.name}" class="img-fluid" ></img><p class="credits">Credit: ${row.image_credit}</p>`;
        }
        return htmlBlock;
    }

    // function to construct html for winery details 
    const addInfo = row => {
        requiredCols = ["ig_post", "img", "name", "url", "full_address", "city", "website", "latitude", "longitude", "description", "phone", "ig_name", "ig_username", "image_credit"];
        colHeaders = {
            "driving" : "Driving time from D.C.",
            "hours": "Hours",
            "food": "Can you bring your own food?",
            "family": "Family-friendly?",
            "pet": "Pet-friendly?",
            "standout": "Standout wine",
            "reservations": "Need reservations?",
            "offerings": "Special offerings",
            "amenities": "Amenities", 
            "events": "Special events"
        }
        cols = Object.keys(row);
        htmlBlock = "";
        // for each column
        for (let i = 0; i < cols.length; i++) {
            const thisCol = cols[i];
            if (!requiredCols.includes(thisCol) && row[thisCol]) {
                colHtml = `<h4>${colHeaders[thisCol]}</h4><p>${row[thisCol]}</p>`
                htmlBlock = htmlBlock.concat(colHtml);
            }
        }
        return htmlBlock;
    }
    
    // for each row, add winery info
    for(let i = 0; i < data.length; i++) {
        const row = data[i];
        const sectionHtml = `<section id="${row.name}" class=${mobile ? "mobile-text-section" : "text-section"}>`
        + `<div><h3>${row.name}</h3>` + addImage(row)
        + `<p class="address">${row.full_address}</p>`
        + `<p>Website: <a href="${row.website}">${row.website}</a></p>`
        + `<p>Phone number: <a href="tel:${row.phone.replace(/-/g, "")}">${row.phone}</a></p>`
        + `<p class="desc">${row.description}</p>` + addInfo(row);
        textContainer.append(sectionHtml);
    };

    // if mobile, add mobile controls
    if (mobile) {
        updateSlide('', 0, 0, false, map); 
        textContainer.append(`<div class="mobile-controls"><button id="prev-button" class="mobile-button"><i class="fa-solid fa-chevron-left"></i></button>`
        + `<button id="next-button" class="mobile-button"><i class="fa-solid fa-chevron-right"></i></button></div>`);
        slideVisibility();
    }
};

function init() {
	//console.log("ready");

	config = buildConfig();
	loadData();

}

function buildConfig() {
	return {
		delimiter: "",	// auto-detect
		newline: "",	// auto-detect
		quoteChar: '"',
		escapeChar: '"',
		header: false,
		transformHeader: undefined,
		dynamicTyping: false,
		preview: 0,
		encoding: "",
		worker: false,
		comments: false,
		step: undefined,
		complete: undefined,
		error: undefined,
		download: false,
		downloadRequestHeaders: undefined,
		downloadRequestBody: undefined,
		skipEmptyLines: false,
		chunk: undefined,
		chunkSize: undefined,
		fastMode: undefined,
		beforeFirstChunk: undefined,
		withCredentials: undefined,
		transform: undefined,
		delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
	};
}


function loadData() {

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vRmp-X7kZV3NHOVOLgk8REmQYJLwLhvht30B8hfM4J1cmB52RLUT7xQtBWRUyL2CY3CdJHjVVrqlE0V/pub?gid=0&single=true&output=csv', {
		download: true,
    header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			parseData();

		}
	});
}

function parseData() {
	var $len = allData.length;
	totalEntries = $len;

    // add map of DC using leaflet
    const map = L.map('map', {scrollWheelZoom: false}).setView([38.988837,-77.562305], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '©OpenStreetMap, ©CartoDB'
    }).addTo(map);
    // add markers to map
    markerGroup(allData, map).addTo(map);

    addText(allData, map);

    if (mobile) {
        const nextSlide = () => {
            const increment = currentIndex === allData.length - 1 ? 0 : 1;
            updateSlide('', currentIndex, increment, true, map);
        }
        const prevSlide = ()=> {
            const increment = currentIndex === 0 ? 0 : -1;
            updateSlide('', currentIndex, increment, true, map);
        }
        $('#next-button').on('click', nextSlide);
        $('#prev-button').on('click', prevSlide);

    } else {
        /** Scrollytelling code for desktop */

        // set up scrollama scroller
        const scroller = scrollama();
        scroller.setup({step: ".text-section",
            offset: 0.5
        });

        // event handler for scrolling through a step (text section)
        const handleStepEnter = (e, map) => {
            // if page is automatically scrolling because marker was clicked, ignore
            // scrollytelling behavior
            if (!scrolling) {
                const thisLocation = e.element?.id;
                markerVisibility(thisLocation, map);
            }
        };
        scroller.onStepEnter(e => handleStepEnter(e, map));
        
        // event handler for end of automated scrolling (from marker click)
        const handleScroll = e => {
            // function to check if specified element is visible on page
            function checkVisible(elm) {
                if (elm) {
                    var rect = elm.getBoundingClientRect();
                    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
                }
            }
            let markerVisible = checkVisible(selectedMarker);

            // if selected marker is visible, reinstate scrollytelling
            if (markerVisible) {
                scrolling = false;
                markerVisible = null;
            }
        };
        window.addEventListener("scroll", handleScroll);
    }

    window.instgrm.Embeds.process();
}



$(document).ready(function(){
	init();
});
