// Create all data variable globally
var allData;
var sortedAndFilteredData;
var namesWithObjectPosition = [];

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
        // console.log(results.data);

        // Store the parsed data in the global variable
        allData = results.data;
        sortedAndFilteredData = [...allData];

        // Get the container element
        const container = document.getElementById('card-container');

        // Append the cards to the container
        appendCardsToContainer(container, sortedAndFilteredData);

        // Add handleSort to set default sort
        handleSort('rank');

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

  // Calculate the width for the fan rating bar based on the rating
  const fanRatingWidth = `${player['rating']}%`;

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
                  <div class="fan-rating-bar">
                      <div class="progress" style="width: ${fanRatingWidth}"></div>
                  </div>
                  <div class="turns-25"><strong>Turns 25:</strong> ${player['birth-date']}</div>
              </div>
              <div class="blurb-section">
                  <p class="blurb">${player['blurb']}</p>
              </div>
          </div>
          <div class="link">
              <a href="${player['link-to-more']}" target="_blank">More about ${player['name-first']} ${player['name-last']}</a>
          </div>
      </div>
  `;

  // Use a condition to determine if object-position should be applied
  const shouldApplyObjectPosition = namesWithObjectPosition.includes(player['Beecher']); // Updated variable name

  if (shouldApplyObjectPosition) {
    const playerImage = card.querySelector('img');

    // Set the object-position style based on your criteria
    playerImage.style.objectPosition = '50% 30%'; // Adjust these values accordingly
  }

  return card;
}


// Function to append cards to the container
function appendCardsToContainer(container, players) {
  // Clear existing cards
  container.innerHTML = '';

  players.forEach(player => {
    const card = createCard(player);
    container.appendChild(card);
  });
}

// Event listener for sorting dropdown (both desktop and mobile)
document.getElementById('sort').addEventListener('change', function () {
  const selectedSortOption = this.value;

  if (selectedSortOption === 'name-last') {
    sortedAndFilteredData.sort((a, b) => a['name-last'].localeCompare(b['name-last']));
  } else if (selectedSortOption === 'rank') {
    sortedAndFilteredData.sort((a, b) => a['rank'] - b['rank']);
  } else if (selectedSortOption === 'birthdate') {
    sortedAndFilteredData.sort((a, b) => new Date(a['birth-date']) - new Date(b['birth-date']));
  }

  // Re-render the cards in the sorted order
  const container = document.getElementById('card-container');
  container.innerHTML = ''; // Clear the container
  appendCardsToContainer(container, sortedAndFilteredData);
});

// Event listener for filtering dropdown (desktop)
document.getElementById('filter').addEventListener('change', function () {
  handleFilterChange(this.value);
});

// Event listeners for filter buttons (mobile)
document.querySelectorAll('.team-filter').forEach(button => {
  button.addEventListener('click', function () {
    // Remove the "selected" class from all buttons
    document.querySelectorAll('.team-filter').forEach(btn => btn.classList.remove('selected'));

    // Add the "selected" class to the clicked button
    this.classList.add('selected');

    // Call the filter function with the selected value
    handleFilterChange(this.dataset.value);
    // Trigger sorting based on the selected sort option
    const selectedSortOption = document.getElementById('sort-mobile').value;
    handleSort(selectedSortOption);
  });
});

// Event listener for sorting dropdown on mobile
document.getElementById('sort-mobile').addEventListener('change', function () {
  const selectedSortOption = this.value;
  handleSort(selectedSortOption);
});

// Function to handle filter changes
function handleFilterChange(selectedFilterOption) {
  // By team
  sortedAndFilteredData = selectedFilterOption === 'all'
    ? [...allData]
    : allData.filter(player => player['team'] === selectedFilterOption);

  // Re-render the cards with the sorted and filtered data
  const container = document.getElementById('card-container');
  appendCardsToContainer(container, sortedAndFilteredData);
}

// Function to handle sorting changes
function handleSort(selectedSortOption) {
  if (selectedSortOption === 'name-last') {
    sortedAndFilteredData.sort((a, b) => a['name-last'].localeCompare(b['name-last']));
  } else if (selectedSortOption === 'rank') {
    sortedAndFilteredData.sort((a, b) => a['rank'] - b['rank']);
  } else if (selectedSortOption === 'birthdate') {
    sortedAndFilteredData.sort((a, b) => new Date(a['birth-date']) - new Date(b['birth-date']));
  }

  // Re-render the cards in the sorted order
  const container = document.getElementById('card-container');
  container.innerHTML = ''; // Clear the container
  appendCardsToContainer(container, sortedAndFilteredData);
}
