var ds;
var totalEntries;
var allData = [];
let addedItems = {};
const mobile = window.innerWidth <= 729;
let firstView = true;


function init() {
	//console.log("ready");
	console.log(window.innerWidth);
	console.log(mobile);

	config = buildConfig();
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vSp1Olv9WSaA6tHp-50QG1DhnLUCCS6QDO_-LCG33x4jjLiqDaJtdvWGGS8cmf7F6nE_SlO69_Z-VA1/pub?gid=318411528&single=true&output=csv');


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
};


function loadData(url) {

	Papa.parse(url, {
		download: true,
		header: true,
		config,
		complete: function (results) {

			allData = results.data;
			parseData();
		}
	});

}

function parseData() {
	const buttonContainer2 = $('#button-container-2');
	if (!mobile) {
		buttonContainer2.append(`<div id="button-container"><ul class='button-list'></ul></div>`);
		const buttonList = buttonContainer2.children().children();
		let currentIndex = 0;
		for (let i = 0; i < Math.ceil(allData.length / 4); i++) {
			buttonList.append(`<ul id="button-row-${i}" class='button-row'></ul>`);
			const buttonRow = $(`#button-row-${i}`);
			for (let j = 0; j < 4; j++) {
				if (currentIndex < allData.length) {
					const thisFoodItem = allData[currentIndex];
					buttonRow.append(`<li class="food-item-4"><button class="food-button" onclick="addItem(event)" id="${thisFoodItem.id}"><img class="food-img" src="images/${thisFoodItem.id}.jpg" width="106px"></img></button></li>`);
					currentIndex++;
				}
			}
		}
	}
	else {
		buttonContainer2.append(
			`<div id="mobile-carousel" class="carousel slide" data-ride="carousel">
				<div class="carousel-inner">
				</div>
			</div>
			<div class="carousel-controls-container">
				<button onclick="$('#mobile-carousel').carousel('prev')" class="carousel-button" id="prev-button"><div class="icon-wrapper" id="prev-icon"><i class="fa-solid fa-circle-arrow-left fa-xl"></i></div></button>
				<button onclick="carouselNext()" class="carousel-button" id="next-button"><div class="icon-wrapper" id="next-icon"><i class="fa-solid fa-circle-arrow-right fa-xl"></i></i></div></button>
			</div>`);
		let currentIndex = 0;
		const carouselInner = $(".carousel-inner");
		for (let i = 0; i < Math.ceil(allData.length / 6); i++) {
			const itemText = i === 0 ? `<div class="carousel-item active"><div class="slide-container" id="slide-${i}"></div></div>` : `<div class="carousel-item"><div class="slide-container" id="slide-${i}"></div></div>`;
			carouselInner.append(itemText);
			const thisSlide = $(`#slide-${i}`);
			for (let j = 0; j < 2; j++) {
				thisSlide.append(`<div id="slide-${i}-row-${j}" class="carousel-row"></div>`);
				const thisRow = $(`#slide-${i}-row-${j}`);
				for (let k = 0; k < 3; k++) {
					if (currentIndex < allData.length) {
						const thisFoodItem = allData[currentIndex];
						if (firstView  && (thisFoodItem.id === "flour" || thisFoodItem.id === "roastBeef")) {
							thisRow.append(`<button class="d-block w-30 food-button" onclick="addItem(event)" id="${thisFoodItem.id}"><img class="food-img" id="${thisFoodItem.id}-img" src="images/${thisFoodItem.id}-fade.jpg"></img></button>`);
						} else {
							thisRow.append(`<button class="d-block w-30 food-button" onclick="addItem(event)" id="${thisFoodItem.id}"><img class="food-img" id="${thisFoodItem.id}-img" src="images/mobile_${thisFoodItem.id}.jpg"></img></button>`);
						}	
						currentIndex++;
					} else {
						thisRow.append(`<button class="d-block w-30 food-button"><img class="food-img" src="images/mobile_empty.jpg"></img></button>`);
						currentIndex++;
					}
				}
			}
		}
	}
}

const carouselNext = () => {
	if (firstView) {
		$('#flour-img').attr("src","images/mobile_flour.jpg");
		$('#roastBeef-img').attr("src","images/mobile_roastBeef.jpg");
	}
	firstView = false;
	$('#mobile-carousel').carousel('next');
}

const receiptVisibility = showReceipt => {
	if (showReceipt) {
		$('.init-msg').css("display", "none");
		$('.table-container').css("display", "block");
	} else {
		$('.init-msg').css("display", "block");
		$('.table-container').css("display", "none");
	}

}

const loadInitMenu = () => {
	receiptVisibility(true);
	const initMenu = {
		"potatoes": 2,
		"turkey": 5,
		"milk": 1,
		"butter": 4,
		"eggs": 1,
		"flour": 1,
		"sugar": 1,
		"bread": 1,
		"beans": 1,
		"apples": 2
	};

	const menuItems = Object.keys(initMenu);
	for (let i = 0; i < menuItems.length; i++) {
		const menuItem = menuItems[i];
		for (let i = 0; i < initMenu[menuItem]; i++) {
			addItem("", menuItem);
		}
	};

}

const addItem = (e, itemId) => {
	if ($('.table-container').css("display") === "none") {
		receiptVisibility(true);
	}
	const idToMatch = e ? e?.currentTarget?.id : itemId;
	const thisItem = allData.find(row => row.id === idToMatch);
	const thisItemName = thisItem.product;
	if (Object.keys(addedItems).includes(thisItemName)) {
		updateQuantity(thisItem, 1);
	} else {
		addedItems[thisItemName] = {
			"2022_price": thisItem["sept_2022"],
			"2023_price": thisItem["sept_2023"],
			"pct_change": thisItem["pct_change"],
			"desc": thisItem["desc"],
			"quantity": 1
		}
		addItemToReceipt(thisItem);
	}
	sumTotals();
};

const addItemToReceipt = ogItem => {
	const itemName = ogItem.product;
	const item = addedItems[itemName];
	const receiptItems = $("#items");
	const pctChange = parseFloat(item["pct_change"]).toFixed(2);
	const newRow = receiptItems[0].insertRow(1);
	newRow.className = 'receipt-item';
	newRow.id = ogItem.id + "-row";
	newRow.innerHTML = mobile ?
		`<td class="item-qty" width="15%"><p class="qty">${item.quantity}</p><div class="qty-buttons"><button class="button change-qty" onclick="addQuantity(event)" id="${ogItem.id}-add"><i class="fa-solid fa-angle-up"></i></button>`
		+ `<button class="button change-qty" onclick="subtractQuantity(event)" id="${ogItem.id}-sub"><i class="fa-solid fa-angle-down"></i></button></div></td><td class="item-name" width="20%">${itemName}</td>`
		+ `<td class="22-price" width="17%"><p>$${parseFloat(item["2022_price"]).toFixed(2)}</p></td><td class="23-price" width="17%"><p>$${parseFloat(item["2023_price"]).toFixed(2)}</p></td><td width="25%"><p class="${pctChange === 0 ? "change-indicator" : pctChange > 0 ? "change-indicator pos" : 'change-indicator neg'}">${pctChange}%  `
		+ `${pctChange > 0 ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>'}</p></td>`
		: `<td class="item-qty" width="20%"><button class="button change-qty" onclick="subtractQuantity(event)" id="${ogItem.id}-sub"><i class="fa-solid fa-minus"></i></button><p class="qty">${item.quantity}</p>`
		+ `<button class="button change-qty" onclick="addQuantity(event)" id="${ogItem.id}-add"><i class="fa-solid fa-plus"></i></button></td><td class="item-name" width="20%"><p>${itemName}</p></td>`
		+ `<td class="22-price" width="15%"><p>$${parseFloat(item["2022_price"]).toFixed(2)}</p></td><td class="23-price" width="15%"><p>$${parseFloat(item["2023_price"]).toFixed(2)}</p></td><td width="30%"><p class="${pctChange === 0 ? "change-indicator" : pctChange > 0 ? "change-indicator pos" : 'change-indicator neg'}">${pctChange}%  `
		+ `${pctChange > 0 ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>'}</p></td>`;
}

const addQuantity = e => {
	const buttonId = e?.currentTarget?.id;
	const thisItem = allData.find(row => row.id + "-add" === buttonId);
	updateQuantity(thisItem, 1);
}

const subtractQuantity = e => {
	const buttonId = e?.currentTarget?.id;
	const thisItem = allData.find(row => row.id + "-sub" === buttonId);
	updateQuantity(thisItem, -1);
}

const updateQuantity = (item, qty) => {
	if (addedItems[item.product]["quantity"] + qty !== 0) {
		addedItems[item.product]["quantity"] += qty;
		updateReceiptQuantity(item.product, qty);
	} else {
		delete addedItems[item.product];
		$(`#${item.id}-row`).remove();
		sumTotals();
	}
	if ($('.receipt-item').length === 0) {
		receiptVisibility(false);
	}

}

const updateReceiptQuantity = (itemName, qty) => {
	const thisReceiptItem = $(`.receipt-item:contains(${itemName})`);
	const thisItemQuantity = thisReceiptItem.children(`.item-qty`).children(`.qty`);
	const newQuantity = parseInt(thisItemQuantity.text()) + qty;
	const currentCost22 = thisReceiptItem.children(`.22-price`);
	const currentCost23 = thisReceiptItem.children(`.23-price`);
	const thisItemCost22 = addedItems[itemName]["2022_price"];
	const thisItemCost23 = addedItems[itemName]["2023_price"];
	const newCost22 = (thisItemCost22 * newQuantity).toFixed(2);
	const newCost23 = (thisItemCost23 * newQuantity).toFixed(2);
	thisItemQuantity.html(newQuantity);
	currentCost22.html("$" + newCost22);
	currentCost23.html("$" + newCost23);
	sumTotals();
}

const sumTotals = () => {
	const total22 = sumYearTotal(22);
	const total23 = sumYearTotal(23);
	const pctChange = calcPctChange(total22, total23);
	$("#total-22").html("$" + total22.toFixed(2));
	$("#total-23").html("$" + total23.toFixed(2));
	$("#total-change").html(`<p class="${pctChange === 0 ? "change-indicator" : pctChange > 0 ? "change-indicator pos" : 'change-indicator neg'}">${pctChange.toFixed(2)}%  ${pctChange === 0 ? "" : pctChange > 0 ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>'}</p>`);
};

const sumYearTotal = year => {
	allTotals = $(`.${year}-price`).children();
	total = 0;
	for (let i = 0; i < allTotals.length; i++) {
		total = total + parseFloat(allTotals[i].innerHTML.replace(/\$/g, ''));
	}
	return total;
};

const calcPctChange = (total1, total2) => {
	if (total2 - total1 !== 0) {
		return (total2 - total1) / total1 * 100;
	} else {
		return 0;
	}
};

const clearItems = () => {
	const receiptItems = $(`.receipt-item`);
	for (let i = 0; i < receiptItems.length; i++) {
		const thisItem = receiptItems[i];
		$(`#${thisItem.id}`).remove();
	}
	addedItems = {};
	sumTotals();
	receiptVisibility(false);
}

$(document).ready(function () {
	init();
});
