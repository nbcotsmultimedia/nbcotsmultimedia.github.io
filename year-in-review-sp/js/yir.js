let allData = [];
let cardsToAdd = [];
let config,
	totalEntries,
	numCols,
	myParent;
const mobile = window.innerWidth <= 768;
let imageGallery = $('#image-gallery');
let dataFilter = "all";


function init() {
	getParentDomain();
	buildColumns();
	config = buildConfig();
	loadData();
	console.log(mobile)
};

const getParentDomain = ()=> {
	myParent = xtalk.parentDomain;
	if (myParent == undefined || myParent == null || myParent == "" || myParent == "https://ots.nbcwpshield.com/" || myParent == "http" ) {
		myParent = "https://www.nbcdfw.com/";
	}
}

const buildColumns = () => {
	numCols = mobile ? 2 : 3;
	let colHtml = '';
	for (let i = 0; i < numCols; i++) {
		colHtml += `<div id="col-${i}" class="column"></div>`;
	}
	imageGallery.append(colHtml);
};

function buildConfig() {
	return {
		delimiter: "",
		newline: "",
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
};

function loadData() {
	Papa.parse('https://docs.google.com/spreadsheets/d/1Iye4yPg8ib6DeT5NHxxnZmfFYw9S1EwQmN7o7DpJqnQ/edit#gid=584104934&single=true&output=csv', {
		download: true,
		header: true,
		config,
		complete: function (results) {
			console.log("Data loaded successfully:", results);
			allData = results.data;
			parseData();
		},
		error: function (error) {
			console.error("Error loading data:", error);
		}
	});
};

function parseData() {
	console.log("Parsing data:", allData);
	var $len = allData.length;
	totalEntries = $len;
	addTabs();
	addCards(allData);
	addCarousel();
};

const addTabs = () => {
	const tabs = $('#tabs');
	tabs.append(`<button class="tab-button selected-tab" onclick="handleTabClick(event, 'all')">ALL <span class="button-total">(${totalEntries})</span></button>`);
	const categories = [...new Set(allData.map(row => row.category))];
	let buttonsHtml = '';
	for (let i = 0; i < categories.length; i++) {
		const category = categories[i];
		const buttonLabel = allData.filter(row => row.category === category)[0].button;
		const categoryCount = filterData(category).length;
		buttonsHtml += `<button class="tab-button" onclick="handleTabClick(event, '${category}')">${buttonLabel} <span class="button-total">(${categoryCount})</span></button>`;
	}
	tabs.append(buttonsHtml);
};

const handleTabClick = (e, filterBy) => {
	if (dataFilter !== filterBy) {
		const selectedTab = e.currentTarget;
		const allTabs = $('.tab-button');
		for (let i = 0; i < allTabs.length; i++) {
			if (allTabs[i] === selectedTab) {
				allTabs[i].classList.add("selected-tab");
			} else {
				allTabs[i].classList.remove("selected-tab");
			}
		}
		filterImages(filterBy);
		dataFilter = filterBy;
	}
}

const filterImages = filterBy => {
	dataCopy = filterData(filterBy);
	hideGallery();
	setTimeout(() => {
		removeCards();
		addCards(dataCopy);
	}, 666);
	setTimeout(() => {
		showGallery();
	}, 666);
};

const filterData = filterBy => {
	let dataCopy = [...allData];
	if (filterBy !== "all") {
		dataCopy = dataCopy.filter(row => row.category === filterBy);
	}
	return dataCopy;
};

const addCards = data => {
	let colNum = 0;
	for (let i = 0; i < data.length; i++) {
		const col = $('#col-' + colNum);
		const row = data[i];

		// Check if required properties are defined
		const id = row.id !== undefined ? row.id : '';
        const category = row.category !== undefined ? row.category : '';
        const date = row.date !== undefined ? row.date : '';
        const caption = row.caption !== undefined ? row.caption : '';
        const image = row.image !== undefined ? row.image : '';
        const link = row.link !== undefined ? row.link : '';

		// Create a temporary div to parse and sanitize HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = caption;

        // Extract the sanitized HTML content
        const sanitizedCaption = tempDiv.textContent || tempDiv.innerText || '';

		const htmlString = `
        <button class="gallery-card ${category}" onclick="selectSlide(event, '${id}')" data-toggle="modal" data-target="#modal">
            <img src="${image ? image + '?w=600' : ''}" class="card-image"/>
            <p class="date">${date}</p>
            <h2 class="caption">${sanitizedCaption}</h2>
            <a href="${link}" target="_blank">Read more</a>
        </button>`;

        col.append(htmlString);
        colNum = colNum < numCols - 1 ? colNum + 1 : 0;
    }
    setTimeout(function () { xtalk.signalIframe(); }, 2000);
};

const removeCards = () => {
	const cards = $('.gallery-card');
	for (let i = cards.length - 1; i >= 0; i--) {
		const thisCard = cards[i];
		thisCard.remove();
	};
};

const showGallery = () => {
	imageGallery.removeClass('hide-content');
	imageGallery.addClass('show-content');
};

const hideGallery = () => {
	imageGallery.removeClass('show-content');
	imageGallery.addClass('hide-content');
};

const addCarousel = () => {
	let carouselHtml = '';
	const carouselInner = $('.carousel-inner');
	let carousel = $('#carousel-controls');

	if (!mobile) {
		carousel.append('<div class="controls-container"></div>');
		carousel = $('.controls-container');
	}
	const carouselControls = `<a class="carousel-control-prev" href="#carousel-controls" role="button" data-slide="prev">
		<i class="fa-solid fa-chevron-left fa-xl"></i>
		<span aria-hidden="true"></span>
		<span class="sr-only">Previous</span>
	</a>
	<a class="carousel-control-next" href="#carousel-controls" role="button" data-slide="next">
		<i class="fa-solid fa-chevron-right fa-xl"></i>
		<span aria-hidden="true"></span>
		<span class="sr-only">Next</span>
	</a>`;
	carousel.append(carouselControls);
	
	for (let i = 0; i < totalEntries; i++) {
		const row = allData[i];
		let slideHtml = `
		<div class="carousel-item" id="${row.id}">
			<div class="slide-container">
				<img class="d-block w-100" src="${row.image}?w=1000" id="${row.id}-img">
				<div class="slide-banner">
					<p class="date">${row.date}</p>
					<h1>${row.caption}</h1>
					<p class="desc">${row.desc}</p>
					<p class="read-more"><em><a href="${myParent}${row.link}" target=”_blank”>Read more</a></em></p>
				</div>
			</div>
		</div>`;
		carouselHtml += slideHtml;
	}
	carouselInner.append(carouselHtml);
};

const selectSlide = (e, selectedImage) => {
	for (let i = 0; i < totalEntries; i++) {
		const thisID = allData[i].id;
		if (thisID === selectedImage) {
			$(`#${thisID}`).addClass('active');
		} else {
			$(`#${thisID}`).removeClass('active');
		}
	}
	let cardYPos = e.currentTarget.getBoundingClientRect().y;
	if (cardYPos > 390) {
		cardYPos -= 300;
	}
	$('.modal').css("top", cardYPos.toString() + "px");
};

$(document).ready(function () {
	init();
});