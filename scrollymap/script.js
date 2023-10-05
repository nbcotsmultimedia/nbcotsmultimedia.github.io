// dummy data for map
const data = [
    {
        lat: 38.8977,
        long: -77.0365,
        name: "The White House"
    },
    {
        lat: 38.8887,
        long: -77.0047,
        name: "Library of Congress"
    },
    {
        lat: 38.8893,
        long: -77.0502,
        name: "Lincoln Memorial"
    }
];

// dummy data for text section
const textData = [
    {
        name: "The White House"
    },
    {
        name: "Library of Congress"
    },
    {
        name: "Lincoln Memorial"
    }
];

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

// select marker that corresponds to location of current slide
const markerVisibility = currentLocation => {
    let currentMarker;
    for(let i = 0; i < markerList.length; i++) {
        const thisMarker = markerList[i];
        if (thisMarker.options?.title === currentLocation) {
            currentMarker = thisMarker;
        }
    };

    // select whichever marker corresponds to current text section
    markerOpacity(currentMarker.options?.title);
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
const updateSlide = (slideName, index, increment, buttonClick) => {
    if (slideName) {
        currentSlide = textData.find(o => o.name === slideName);
        currentIndex = textData.indexOf(currentSlide);
    }
    else {
        currentSlide = textData[index + increment];
        currentIndex = index + increment;
    }
    markerVisibility(currentSlide.name);

    if (buttonClick) {
        slideVisibility();
    }
};

// scroll to text section that corresponds to clicked marker
const scrollToSlide = e => {
    const sections = textContainer.children('section');

    for(let i = 0; i < sections.length; i++) {
        // scroll to text section that corresponds to clicked marker
        if (sections[i].id === e.target?.options?.title) {
            sections[i].scrollIntoView({ behavior: 'smooth' });
            scrolling = true;
            markerOpacity(sections[i].id);
        }
    };
};

// event handler for marker click
const handleMarkerClick = e => {
    if (mobile) {
        updateSlide(e.target?.options?.title, 0, 0, true);
    } else {
        scrollToSlide(e);
    }
};

// create a marker and add to marker list
const marker = ({lat, long, name}) => {
    const marker = L.marker([lat, long], {title: name});
    marker.on('click', handleMarkerClick);

    markerList.push(marker);

    return marker;
};

// create a layer group with all markers 
const markerGroup = markerData => {
    for(let i = 0; i < markerData.length; i++) {
        marker(markerData[i]);
    }

    const markerGroup = L.layerGroup(markerList);

    return markerGroup;
};

// set opacity of markers (selected marker = 1.0, unselected markers = 0.5)
const markerOpacity = selectedMarkerTitle => {
    for(let i = 0; i < markerList.length; i++) {
        const thisMarker = markerList[i];
        const opacity = thisMarker.options?.title === selectedMarkerTitle ? 1.0 : 0.5;
        thisMarker.setOpacity(opacity);
    };
};

// add text to page
const addText = data => {
    const sectionHtml = text => {return mobile ? `<section id="${text.name}" class="mobile-text-section"><div` 
    + ` class="mobile-text"><p>${text.name}</p></div></section>` : `<section id="${text.name}" class="text-section"><p>${text.name}</p></section>`};
    for(let i = 0; i < data.length; i++) {
        const thisText = data[i];
        textContainer.append(sectionHtml(thisText));
    };

    if (mobile) {
        updateSlide('', 0, 0, false); 
        textContainer.append(`<div class="mobile-controls"><button id="prev-button" class="mobile-button"><i class="fa-solid fa-chevron-left"></i></button>`
        + `<button id="next-button" class="mobile-button"><i class="fa-solid fa-chevron-right"></i></button></div>`);
        slideVisibility();
    }
};

// function to run when page loads
const init = () => {
    // add map of DC using leaflet
    const map = L.map('map', {scrollWheelZoom: false}).setView([38.8937545,-77.014576], 13.2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    // add markers
    markerGroup(data).addTo(map);

    // add text
    addText(textData);

    if (mobile) {
        const nextSlide = () => {
            const increment = currentIndex === textData.length - 1 ? 0 : 1;
            updateSlide('', currentIndex, increment, true);
        }
        const prevSlide = ()=> {
            const increment = currentIndex === 0 ? 0 : -1;
            updateSlide('', currentIndex, increment, true);
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
        const handleStepEnter = e => {
            // if page is automatically scrolling because marker was clicked, ignore
            // scrollytelling behavior
            if (!scrolling) {
                const thisLocation = e.element?.id;
                markerVisibility(thisLocation);
            }
        };
        scroller.onStepEnter(handleStepEnter);
        
        // event handler for end of automated scrolling (from marker click)
        const handleScrollEnd = e => {
            scrolling = false;
        };
        addEventListener("scrollend", handleScrollEnd);
    }
};

init();