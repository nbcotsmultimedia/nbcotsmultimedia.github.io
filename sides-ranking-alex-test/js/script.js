let sortable;
let shuffledData; // Declare shuffledData globally
let sortableList; // Declare sortableList globally

// Move the refreshList function outside the event listener
function refreshList() {
    console.log("refreshList called");

    sortableList.innerHTML = ''; // Clear the content of sortableList

    const listItems = shuffledData.map((item) => {
        const listItem = document.createElement("li");
        listItem.classList.add("sortable-item");

        const itemName = document.createElement("div");
        itemName.classList.add("item-name");
        itemName.textContent = item.dish;

        const moveIcon = document.createElement("div");
        moveIcon.classList.add("move-icon");
        moveIcon.textContent = "☰";

        listItem.appendChild(itemName);
        listItem.appendChild(moveIcon);

        return listItem;
    });

    sortableList.append(...listItems);

    sortable.destroy(); // Destroy the old sortable instance
    sortable = new Sortable(sortableList, {
        animation: 150,
        onStart(evt) {
            evt.from.classList.add("no-animation");
            evt.from.classList.add("dragging");
        },
        onEnd(evt) {
            evt.from.classList.remove("no-animation");
            evt.from.classList.remove("dragging");
        },
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const data = [
        { dish: "Turkey", win: 83 },
        { dish: "Mashed potatoes", win: 78 },
        { dish: "Stuffing or dressing", win: 77 },
        { dish: "Bread or rolls", win: 74 },
        { dish: "Ham", win: 67 },
        { dish: "Scalloped potatoes", win: 66 },
        { dish: "Sweet potatoes or yams", win: 65 },
        { dish: "Gravy", win: 64 },
        { dish: "Green beans", win: 64 },
        { dish: "Macaroni and cheese", win: 62 },
    ];

    shuffledData = data.sort(() => Math.random() - 0.5);

    sortableList = document.getElementById("sortable-list");
    const listItems = shuffledData.map((item) => {
        const listItem = document.createElement("li");
        listItem.classList.add("sortable-item");

        const itemName = document.createElement("div");
        itemName.classList.add("item-name");
        itemName.textContent = item.dish;

        const moveIcon = document.createElement("div");
        moveIcon.classList.add("move-icon");
        moveIcon.textContent = "☰";

        listItem.appendChild(itemName);
        listItem.appendChild(moveIcon);

        return listItem;
    });

    sortableList.append(...listItems);

    sortable = new Sortable(sortableList, {
        animation: 150,
        onStart(evt) {
            evt.from.classList.add("no-animation");
            evt.from.classList.add("dragging");
        },
        onEnd(evt) {
            evt.from.classList.remove("no-animation");
            evt.from.classList.remove("dragging");
        },
    });

    window.checkRanking = function () {
        const userOrder = [...sortableList.children].map((item) => item.querySelector(".item-name").textContent);
        const correctOrder = data
            .sort((a, b) => b.win - a.win)
            .map((item) => item.dish);

        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
        const resultElement = document.getElementById("result");

        if (isCorrect) {
            resultElement.textContent = "Correct! You nailed it!";
        } else {
            resultElement.textContent = "Oops! Looks like you need to adjust your ranking.";

            correctOrder.forEach((dish, index) => {
                const listItem = sortableList.children[index];

                if (userOrder[index] !== dish) {
                    if (correctOrder.indexOf(userOrder[index]) > index) {
                        listItem.classList.add("wrong-order-higher");
                    } else {
                        listItem.classList.add("wrong-order-lower");
                    }
                } else {
                    listItem.classList.remove("wrong-order-higher", "wrong-order-lower");
                }
            });

            // Automatically sort the cards and add an animation
            setTimeout(() => {
                correctOrder.forEach((dish, index) => {
                    const listItem = sortableList.children[index];
                    listItem.classList.remove("wrong-order-higher", "wrong-order-lower");
                });

                sortableList.classList.add("animate-sort");

                refreshList();

                setTimeout(() => {
                    sortableList.classList.remove("animate-sort");
                }, 1500); // Adjust the delay as needed (1500 milliseconds = 1.5 seconds)
            }, 3000); // Adjust the delay as needed (3000 milliseconds = 3 seconds)
        }
    };
});
