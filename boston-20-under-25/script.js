// Create all data variable globally
var allData;

// Function to fetch Google Sheet data using Papa Parse
async function fetchData() {
  try {
    const response = await fetch(
      'https://docs.google.com/spreadsheets/d/1lVWFTJ0Tcqv9LYi3SXf-IUGr57OGJ9bryA_GSDlkpPQ/export?format=csv&id=1lVWFTJ0Tcqv9LYi3SXf-IUGr57OGJ9bryA_GSDlkpPQ'
    );
    const csvData = await response.text();

    // Use Papa Parse to parse the CSV data
    Papa.parse(csvData, {
      header: true,
      complete: function (results) {
        // Log the parsed data to the console
        console.log(results.data);

        // Store the parsed data in the global variable
        allData = results.data;

        // Get the container element
        const container = document.getElementById('card-container');

        // Append the cards to the container
        appendCardsToContainer(container, allData);
      },
      error: function (error) {
        console.error('Error parsing CSV data:', error);
      },
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Call the fetchData function to initiate the process
fetchData();

// Function to create a card element
function createCard(player) {
  const card = document.createElement('div');
  card.classList.add('card');

  // Use the player data to create the card's content
  card.innerHTML = `
      <img src="${player['player-img']}" alt="${player['name-first']} ${player['name-last']}">
      <div class="content">
          <div class="top-section">
              <div class="rank">${player['rank']}</div>
              <div class="details">
                  <div class="name-first">${player['name-first']}</div>
                  <div class="name-last">${player['name-last']}</div>
                  <div class="team-position">${player['team']} | ${player['position']}</div>
              </div>
          </div>
          <div class="info">
              <div class="additional-info">
                  <div class="fan-rating"><strong>Fan rating:</strong> ${player['rating']}</div>
                  <div class="turns-25"><strong>Turns 25:</strong> ${player['birth-date']}</div>
              </div>
              <p class="blurb">${player['blurb']}</p>
          </div>
          <div class="link">
              <a href="${player['link-to-more']}" target="_blank">More about ${player['name-first']} ${player['name-last']}</a>
          </div>
      </div>
  `;

  return card;
}

// Function to append cards to the container
function appendCardsToContainer(container, players) {
  // Clear existing cards
  container.innerHTML = '';

  // Apply sorting and filtering logic
  const selectedSortOption = document.getElementById('sort').value;
  const selectedFilterOption = document.getElementById('filter').value;

  players
    .filter(player => selectedFilterOption === 'all' || player['team'] === selectedFilterOption)
    .sort((a, b) => {
      switch (selectedSortOption) {
        case 'rank':
          return a['rank'] - b['rank'];
        case 'name-last':
          return a['name-last'].localeCompare(b['name-last']);
        case 'birthdate':
          return new Date(a['birth-date']) - new Date(b['birth-date']);
        default:
          return 0;
      }
    })
    .forEach(player => {
      const card = createCard(player);
      container.appendChild(card);
    });
}

// Event listener for sorting dropdown
document.getElementById('sort').addEventListener('change', function () {
  const selectedSortOption = this.value;

  if (selectedSortOption === 'name-last') {
    allData.sort((a, b) => a['name-last'].localeCompare(b['name-last']));
  } else if (selectedSortOption === 'rank') {
    allData.sort((a, b) => a['rank'] - b['rank']);
  } else if (selectedSortOption === 'birth-date') {
    allData.sort((a, b) => new Date(a['birth-date']) - new Date(b['birth-date']));
  }

  // Re-render the cards in the sorted order
  const container = document.getElementById('card-container');
  container.innerHTML = ''; // Clear the container
  appendCardsToContainer(container, allData);
});

// Event listener for filtering dropdown
document.getElementById('filter').addEventListener('change', function () {
  const selectedFilterOption = this.value;

  // By team
  const filteredData = selectedFilterOption === 'all'
    ? allData
    : allData.filter(player => player['team'] === selectedFilterOption);

  // Re-render the cards with the filtered data
  const container = document.getElementById('card-container');
  container.innerHTML = ''; // Clear the container
  appendCardsToContainer(container, filteredData);
});

// Initial load of cards
appendCardsToContainer(document.getElementById('card-container'));