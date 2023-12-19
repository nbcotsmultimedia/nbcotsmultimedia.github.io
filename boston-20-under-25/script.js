// Function to fetch JSON data
async function fetchData() {
  try {
    const response = await fetch('data.json')
    const data = await response.json()

    // Log the data to the console
    console.log(data)

    // Get the container element
    const container = document.getElementById('card-container')

    // Append the cards to the container
    appendCardsToContainer(container, data)
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

// Call the fetchData function to initiate the process
fetchData()

// Function to create a card element
function createCard(player) {
  const card = document.createElement('div')
  card.classList.add('card')

  // Use the player data to create the card's content
  card.innerHTML = `
      <img src="${player['player-img']}" alt="${player['name-first']} ${player['name-last']}">
      <div class="content">
          <div class="top-section">
              <div class="rank">${player['rank']}</div>
              <div class="details">
                  <div class="name-first">${player['name-first']}</div>
                  <div class="name-last">${player['name-last']}</div>
                  <div class="team-position">${player['team']} - ${player['position']}</div>
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
  `

  return card
}

// Function to append cards to the container
function appendCardsToContainer(container, players) {
  players.forEach((player, index) => {
    const card = createCard(player)
    container.appendChild(card)
  })
}

// Event listener for sorting dropdown
document.getElementById('sort').addEventListener('change', function () {
  const selectedSortOption = this.value
  // Call a function to sort the data based on the selected option
  // Implement your sorting logic here
})

// Event listener for filtering dropdown
document.getElementById('filter').addEventListener('change', function () {
  const selectedFilterOption = this.value
  // Call a function to filter the data based on the selected option
  // Implement your filtering logic here
})
