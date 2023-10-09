var ds;
var totalEntries;
var allData;
var config;

// check if user is on mobile or desktop
const mobile = window.innerWidth <= 768;

// scrolling variable to prevent event handlers from firing while page is scrolling
let scrolling = false;

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
        // scroll to text section that corresponds to clicked marker
        if (sections[i].id === e.target?.options?.title) {
            sections[i].scrollIntoView({ behavior: 'smooth' });
            scrolling = true;
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
    const icon = new L.Icon.Default();
    icon.options.shadowSize = [0,0];
    const marker = L.marker([lat, long], { title: name, icon : icon });
    marker.on('click', e => handleMarkerClick(e, map));

    markerList.push(marker);

    return marker;
};

// create a layer group with all markers 
const markerGroup = (markerData, map) => {
    for(let i = 0; i < markerData.length; i++) {
        marker(markerData[i], map);
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
    
    for(let i = 0; i < data.length; i++) {
        const row = data[i];
        const sectionHtml = `<section id="${row.name}" class=${mobile ? "mobile-text-section" : "text-section"}>`
        + `<div class="mobile-text"><h2>${row.name}</h2><p class="address">${row.full_address}</p>`
        + `<p class="desc">Description here</p><a href="${row.website}">Learn more</a></div></section>`;
        textContainer.append(sectionHtml);
    };

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
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
        const handleScrollEnd = e => {
            scrolling = false;
        };
        addEventListener("scrollend", handleScrollEnd);
    }
}



$(document).ready(function(){
	init();
});
