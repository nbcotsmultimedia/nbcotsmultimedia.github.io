let winners = [];
let sidePairs = [];
let userChoices = [];
let currentRound = 0;
let results = {};

const sidesData = {
    "Mac and Cheese": "mac-and-cheese.png",
    "Stuffing / Dressing": "stuffing.png",
    "Mashed Potatoes": "mashed-potatoes.png",
    "Scalloped Potatoes": "potatoes-au-gratin.png",
    "Sweet Potato Casserole": "sweet-potato-casserole.png",
    "Green Salad": "salad.png",
    "Rolls": "roll.png",
    "Corn Bread": "cornbread.png",
    "Canned Cranberry Sauce": "cranberry-sauce-canned.png",
    "Homemade Cranberry Sauce": "cranberry-sauce-homemade.png",
    "Corn Casserole": "corn-casserole.png",
    "Green Bean Casserole": "green-bean-casserole.png",
    "Brussels Sprouts": "brussels-sprouts.png",
    "Yellow Squash": "yellow-squash.png",
    "Collard Greens": "collard-greens.png",
    "Roasted Veggies": "roasted-veggies.png",
};

document.addEventListener("DOMContentLoaded", function () {
    startQuiz();
});

function startQuiz() {
    preloadImages();
    generateInitialPairings();
    showRound();
}

function generateInitialPairings() {
    sidePairs = [
        ["Mac and Cheese", "Stuffing / Dressing"],
        ["Mashed Potatoes", "Scalloped Potatoes"],
        ["Sweet Potato Casserole", "Green Salad"],
        ["Rolls", "Corn Bread"],
        ["Canned Cranberry Sauce", "Homemade Cranberry Sauce"],
        ["Corn Casserole", "Green Bean Casserole"],
        ["Brussels Sprouts", "Yellow Squash"],
        ["Collard Greens", "Roasted Veggies"],
    ];
}

function preloadImages() {
    Object.values(sidesData).forEach(imageUrl => {
        const img = new Image();
        img.src = `Images/${imageUrl}`;
    });
}

function showRound() {
    const roundContainer = document.getElementById('round-container');
    roundContainer.innerHTML = '';

    console.log('Showing Round:', currentRound + 1);

    if (currentRound < sidePairs.length) {
        const [side1, side2] = sidePairs[currentRound];

        console.log('Choice for Round ' + (userChoices.length + 1) + ': ' + side1);
        console.log('Choice for Round ' + (userChoices.length + 2) + ': ' + side2);

        const image1 = sidesData[side1] ? `<img src="Images/${sidesData[side1]}" alt="${side1}" class="img-fluid mb-3" style="max-width: 150px;">` : '';
        const image2 = sidesData[side2] ? `<img src="Images/${sidesData[side2]}" alt="${side2}" class="img-fluid mb-3" style="max-width: 150px;">` : '';

        const roundHtml = `
            <div class="question">
                <p>Choose your favorite side dish:</p>
                <div class="row">
                    <div class="col-md-6 text-center">
                        ${image1}
                        <div>${side1}</div>
                        <button onclick="selectSide('${side1}')">Select ${side1}</button>
                    </div>
                    <div class="col-md-6 text-center">
                        ${image2}
                        <div>${side2}</div>
                        <button onclick="selectSide('${side2}')">Select ${side2}</button>
                    </div>
                </div>
            </div>
        `;

        roundContainer.innerHTML = roundHtml;
    } else {
        generateNextRound();
        showRound();
    }
}


function selectSide(side) {
    userChoices.push(side);
    console.log('Choice for Round ' + (userChoices.length + 1) + ': ' + side);

    // Check if all choices are made for the current round
    if (userChoices.length % 2 === 0) {
        console.log('All choices made for Round ' + (userChoices.length / 2));
        // If so, generate the next round
        generateNextRound();
    } else {
        // Otherwise, show the next round
        console.log('Show the next round');
        showRound();
    }
}

function generateNextRound() {
    console.log('Entering generateNextRound');
    console.log('Current Round:', currentRound);
    console.log('Results:', results);
    console.log('Winners:', winners);

    // Check if we have a winner
    if (winners.length === 1) {
        console.log('Ultimate Winner:', winners[0]);
        return;
    }

    // Increment the current round
    currentRound++;

    // Get the choices for the current round
    const choices = userChoices.slice(-2);

    // Determine the winner for the current round
    const winner = getRandomWinner(choices);
    console.log('Round Winners:', winner);

    // Add the winner to the results
    results['Round ' + currentRound] = winner;

    // Add the winner to the list of winners
    winners.push(winner);

    // Update the side pairs for the next round
    sidePairs = createPairs(winners);
    console.log('Updated sidePairs:', sidePairs);

    // Show the next round after a brief delay
    setTimeout(() => {
        showRound();
    }, 0);
}





function showResults() {
    const resultElement = document.getElementById('result');
    const resultImageElement = document.getElementById('result-image');
    const roundContainer = document.getElementById('round-container');
    const resultsContainer = document.getElementById('results');

    const finalResult = winners[0];
    resultElement.textContent = `Your favorite Thanksgiving side dish is: ${finalResult}`;

    const imagePath = sidesData[finalResult];
    resultImageElement.src = `Images/${imagePath}`;
    resultImageElement.style.maxWidth = "150px";

    roundContainer.innerHTML = '';
    resultsContainer.style.display = 'block';

    // Log the ultimate winner in the console
    console.log(`Your favorite Thanksgiving side dish is: ${finalResult}`);
}

// Function to get a random winner from choices
function getRandomWinner(choices) {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

function createPairs(choices) {
    const pairs = [];
    for (let i = 0; i < choices.length; i += 2) {
        const pair = [choices[i], choices[i + 1]];
        pairs.push(pair);
    }
    return pairs;
}
