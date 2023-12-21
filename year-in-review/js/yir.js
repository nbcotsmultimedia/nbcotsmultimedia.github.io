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
	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vQTyhGl_WM_nTFOjDdCrPvmPggXeEWY9Q3WiE_5CJoHtmFS8BPQPayRW-ae-SntRJsqVT96qZobEIV4/pub?gid=459203480&single=true&output=csv', {
		download: true,
		header: true,
		config,
		complete: function (results) {
			allData = results.data;
			parseData();
		}
	});
};

function parseData() {
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
		const htmlString = `
		<button class="gallery-card ${row.category}"  onclick="selectSlide(event, '${row.id}')" data-toggle="modal" data-target="#modal">
			<img src="${row.image}?w=600" class="card-image"/>
			<p class="date">${row.date}</p>
			<h2 class="caption">${row.caption}</h2>
		</button>`;
		col.append(htmlString);
		colNum = colNum < numCols - 1 ? colNum + 1 : 0;
	}
	setTimeout(function(){ xtalk.signalIframe(); }, 2000);
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