let config, 
	totalEntries,
	allData = [],
	colsToShow = [],
	colsToHide = [],
	mobile = window.innerWidth <= 768,
	table = $('#accusations-table');


function init() {
	config = buildConfig();
	loadData();

}

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

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vTSkiol1QTmtDnK_cMoRmi8HyCmR3wDdR3_lNo6yC10TVpSxuoZUdICj5eN4xuijmcpjFFyNKjvwBIK/pub?gid=604699857&single=true&output=csv', {
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
	var $len = allData.length;
	totalEntries = $len;
	addTableContent();
	setTimeout(function(){ xtalk.signalIframe(); }, 2000);
}

const addTableContent = () => {
	// which columns to show/hide (mobile vs. desktop)
	assignCols();
	fillTable();
};

const assignCols = () => {
	colsToShow = mobile ? ["Accused Name", "Number Of Accusations"] : ["Accused Name", "Years of Alleged Abuse", "Position With Diocese", "Number Of Accusations"];
	colsToHide = Object.keys(allData[0]).filter(col => !colsToShow.includes(col));
};

const fillTable = () => {
	fillHeader();
	fillBody();
	const options = {
		columnDefs: [{ 'orderable': false, 'targets': 0 }],
		order: [[4, 'desc']]
	};
	table = table.DataTable(options);
	makeExpandable();
};

const fillHeader = () => {
	const headerRow = $("#header-row");
	if (colsToHide.length > 0) {
		headerRow.append('<th class="non-sort-header" orderable="false"></th>');
	}
	for (let i = 0; i < colsToShow.length; i++) {
		headerRow.append(`<th>${colsToShow[i]}</th>`);
	}
};

const fillBody = () => {
	const tableBody = $('#table-body');
	const rows = allData.map(row => rowHtml(row));
	tableBody.append(rows);
};

const filterRowData = (rowData, hide) => {
	const list = hide ? colsToHide : colsToShow;
	const filteredData = Object.keys(rowData)
		.filter(key => list.includes(key))
		.reduce((obj, key) => {
			obj[key] = rowData[key];
			return obj;
			}, {});
	return filteredData;
};

const rowHtml = rowData => {
	const rowId = rowData["Accused Name"].split(' ').join('-')
	const hiddenCols = colsToHide.length > 0;
	const dataToShow = filterRowData(rowData, false);
	const dataToHide = filterRowData(rowData, true);
	const hiddenData = hiddenCols ? hiddenDataHtml(dataToHide) : '';
	const expandIcon = hiddenCols ? `<td class="dt-control"></td>` : '';
	let html = hiddenCols ? `<tr hidden-data="${hiddenData}" data-toggle="collapse" data-target="#${rowId}" class="accordian-toggle shown-row" aria-expanded="false" aria-controls="${rowId}">${expandIcon}` 
		: `<tr class="shown-row">`;
	const tds = Object.keys(dataToShow).map(col => `<td>${dataToShow[col]}</td>`).join('');
	html += tds + `</tr>`;
	return html;
};

const hiddenDataHtml = hiddenData => {
	html = `<div>`;
	const hiddenInfo = Object.keys(hiddenData).map(col => hiddenData[col] ? `<div class='extra-info'><strong>${col}</strong>: ${hiddenData[col]}</div>` : '').join('');
	html += hiddenInfo + `</div>`;
	return html;
};

const makeExpandable = () => {
	table.on('click', 'td.dt-control', e => {
		let tr = e.target.closest('tr');
    	let row = table.row(tr);

		if (row.child.isShown()) {
			// This row is already open - close it
			row.child.hide();
		}
		else {
			// Open this row
			row.child(tr.getAttribute("hidden-data")).show();

			xtalk.signalIframe();
		}


	});
};

const resizeWhenRowsChange = () => {
	const rowNumSelect = $("#dt-length-0");
	rowNumSelect.on('click', e => {
		xtalk.signalIframe();
	});
}
	

$(document).ready(function(){
	init();
});