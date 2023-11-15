document.addEventListener('DOMContentLoaded', function () {
  let sortable
  let shuffledData
  let sortableList
  let rankingSubmitted = false // Track if ranking is submitted

  // Show loading animation initially
  const loadingAnimation = document.getElementById('loading-animation')
  loadingAnimation.style.display = 'flex' // Assuming you want to use flex layout for centering

  // Wait for the content to be fully loaded
  window.addEventListener('load', function () {
    // Hide the loading animation when the content is loaded
    loadingAnimation.style.display = 'none'
  })

  // Wait for the content to be fully loaded
  window.addEventListener('load', function () {
    // Find the element with the hide-until-loaded class
    const hideUntilLoaded = document.querySelector('.hide-until-loaded')

    // Add the "loaded" class to make the content visible
    hideUntilLoaded.classList.add('loaded')
  })

  // Data set
  const data = [
    { dish: 'Turkey', win: 83, img: 'Images/turkey.png' },
    { dish: 'Mashed potatoes', win: 78, img: 'Images/mashed-potatoes.png' },
    { dish: 'Stuffing or dressing', win: 77, img: 'Images/stuffing.png' },
    { dish: 'Bread or rolls', win: 74, img: 'Images/roll.png' },
    { dish: 'Ham', win: 67, img: 'Images/ham.png' },
    {
      dish: 'Scalloped potatoes',
      win: 66,
      img: 'Images/scalloped-potatoes.png'
    },
    {
      dish: 'Sweet potatoes',
      win: 65,
      img: 'Images/sweet-potato-casserole.png'
    },
    { dish: 'Gravy', win: 64, img: 'Images/gravy.png' },
    { dish: 'Green beans', win: 64, img: 'Images/green-bean-casserole.png' },
    { dish: 'Mac and cheese', win: 62, img: 'Images/mac-and-cheese.png' }
  ]

  function refreshList() {
    sortableList.innerHTML = ''

    const listItems = shuffledData.map((item, index) => {
      const listItem = document.createElement('li')
      const sortableItem = document.createElement('div')
      sortableItem.classList.add('sortable-item')

      const itemImage = document.createElement('img')
      itemImage.src = item.img
      itemImage.style.height = '45px'
      itemImage.style.width = '45px'
      sortableItem.classList.add('sortable-img')

      const counter = document.createElement('span')
      counter.classList.add('counter')
      counter.textContent = index + 1

      const itemName = document.createElement('div')
      itemName.classList.add('item-name')
      itemName.textContent = item.dish

      const moveIcon = document.createElement('div')
      moveIcon.classList.add('move-icon')
      moveIcon.textContent = '☰'

      sortableItem.appendChild(counter)
      sortableItem.appendChild(itemImage)
      sortableItem.appendChild(itemName)
      sortableItem.appendChild(moveIcon)

      listItem.appendChild(sortableItem)
      return listItem
    })

    sortableList.append(...listItems)

    if (sortable) {
      sortable.destroy()
    }

    // Initialize sortable only if ranking is not submitted
    if (!rankingSubmitted) {
      sortable = new Sortable(sortableList, {
        animation: 150,
        forceFallback: true,
        easing: 'cubic-bezier(1, 0, 0, 1)',
        onStart(evt) {
          evt.from.classList.add('no-animation')
          evt.from.classList.add('dragging')
        },
        onEnd(evt) {
          evt.from.classList.remove('no-animation')
          evt.from.classList.remove('dragging')

          const items = sortableList.querySelectorAll('.sortable-item')
          items.forEach((item, index) => {
            item.querySelector('.counter').textContent = index + 1
          })
        }
      })
    }

    // Hide move icons if ranking is submitted
    if (rankingSubmitted) {
      const moveIcons = sortableList.querySelectorAll('.move-icon')
      moveIcons.forEach((icon) => {
        icon.style.display = 'none'
      })
    }
  }

  shuffledData = data.sort(() => Math.random() - 0.5)

  sortableList = document.getElementById('sortable-list')

  refreshList()

  // Create a new list for the actual order
  const actualList = document.getElementById('actual-list')

  // Initially hide the actual list
  actualList.style.display = 'none'

  // Populate the actual list
  data
    .sort((a, b) => b.win - a.win)
    .forEach((item, index) => {
      const listItem = document.createElement('li')
      listItem.classList.add('sortable-item') // Add the sortable-item class for styling

      const counter = document.createElement('span')
      counter.classList.add('counter')
      counter.textContent = index + 1

      const itemImage = document.createElement('img')
      itemImage.src = item.img
      itemImage.style.height = '45px'
      itemImage.style.width = '45px'
      itemImage.classList.add('sortable-img') // Add the sortable-img class for styling

      const itemName = document.createElement('div')
      itemName.classList.add('item-name')
      itemName.textContent = item.dish

      listItem.appendChild(counter)
      listItem.appendChild(itemImage)
      listItem.appendChild(itemName)

      actualList.appendChild(listItem)
    })

  // Initialize the sortable for the actual order list
  const actualSortable = new Sortable(actualList, {
    animation: 150,
    disabled: true // Disable sorting for the actual order list
  })

  // Function to handle button click
  // Function to handle button click
  window.checkRanking = function () {
    rankingSubmitted = true

    const userOrder = [...sortableList.children].map(
      (item) => item.querySelector('.item-name').textContent
    )

    const resultElement = document.getElementById('result')
    const submitButton = document.querySelector(
      'button[onclick="checkRanking()"]'
    )

    if (rankingSubmitted) {
      // Show the actual list
      actualList.style.display = 'block'

      // Add the show-content class to reveal the actual order
      actualList.classList.add('show-content')

      // Disable sorting after ranking is submitted
      if (sortable) {
        sortable.destroy()
      }

      // Hide move icons
      const moveIcons = sortableList.querySelectorAll('.move-icon')
      moveIcons.forEach((icon) => {
        icon.style.display = 'none'
      })

      // Change button text and color
      if (submitButton) {
        //submitButton.textContent = 'Try again'
        submitButton.style.backgroundColor = '#ccc'
        submitButton.style.cursor = 'auto' // Allow cursor on the button
        /*
        submitButton.onclick = function () {
          // Reset the page (you can add the logic for resetting here)
          location.reload()
        }
        */
      }
    }
  }
})
