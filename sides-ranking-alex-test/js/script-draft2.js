
let userChoices = [];
let sidePairs = [];
let roundCounter = 0;


// Sides to choose from
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
        // Add more pairs as needed
    ];
}

function preloadImages() {
    // Preload images as before
}

function createCardHtml(side1, side2) {
    return `
        <div class="question">
            <p>Choose your favorite side dish:</p>
            <div class="row">
                <div class="col-md-6 text-center">
                    <div class="sub-card" onclick="selectSide('${side1}')">
                        <img src="Images/${sidesData[side1]}" alt="${side1}" class="img-fluid mb-3" style="max-width: 150px;">
                        <div>${side1}</div>
                    </div>
                </div>
                <div class="col-md-6 text-center">
                    <div class="sub-card" onclick="selectSide('${side2}')">
                        <img src="Images/${sidesData[side2]}" alt="${side2}" class="img-fluid mb-3" style="max-width: 150px;">
                        <div>${side2}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showRound() {
    const roundContainer = document.getElementById('round-container');
    roundContainer.innerHTML = '';

    if (currentRound < sidePairs.length) {
        const [side1, side2] = sidePairs[currentRound];
        const roundHtml = createCardHtml(side1, side2);
        roundContainer.innerHTML = roundHtml;
        console.log('Showing Round:', currentRound + 1);
    } else {
        generateNextRound();
        currentRound = 0;
        showRound();
    }
}