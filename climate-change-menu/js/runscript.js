(function() {
  
  let urls = [
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCImOya1Tj9JVHI-Pn7xGxj63tsNGw7gtgPBczHxnl_Pl6eTgK1LqeR8upu3IkqaG11hRxQS5H1YcJ/pub?gid=0&single=true&output=csv', 
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCImOya1Tj9JVHI-Pn7xGxj63tsNGw7gtgPBczHxnl_Pl6eTgK1LqeR8upu3IkqaG11hRxQS5H1YcJ/pub?gid=1236691182&single=true&output=csv'
  ]

  let body = document.querySelector('body');
  let boxMeasure = body.getBoundingClientRect();
  let menuData, itemData, items;
  
  Promise.all(urls.map(url => 
    new Promise ((resolve, reject) => 
      Papa.parse(url, {
        download: true,
        header: true,
        error: reject,
        complete: resolve
      })
    )
  ))
  .then(
    //assign datasets to variables
    results => {
      menuData = results[0].data,
      itemData = results[1].data
    }
  )
  .then(
    buildWidget
  )
  .then(
    callTooltips
  )
  .then(
    //readjust height dynamically after widget loads
    // xtalk.signalIframe();

    // setTimeout(() => { xtalk.signalIframe(); }, 3500)

    // setTimeout(
    //   function() { 
    //     xtalk.signalIframe(); 
    //   }, 3500)
  )
  .catch(
    error => console.warn('Error', error)
  ) 

  function buildWidget(){
    for (let i = 0; i < menuData.length; i++){
      let menu = menuData[i]; 

      //populate sections by category
      switch(menu.course) {
        case "appetizers":
          items = '<div class="itemName" id="iName-'+ i +'">' + menu.dish + '</div><div class="itemBlurb"  id="iBlurb-'+ i +'">' + menu.ingredients + '</div></div>'

          document.getElementById('appetizers').insertAdjacentHTML('beforeend', items)
          break;

        case "entrees":
          items = '<div class="itemName" id="iName-'+ i +'">' + menu.dish + '</div><div class="itemBlurb" id="iBlurb-'+ i +'">' + menu.ingredients + '</div></div>'

          document.getElementById('entrees').insertAdjacentHTML('beforeend', items)
          break;

        case "salads":
          items = '<div class="itemName" id="iName-'+ i +'">' + menu.dish + '</div><div class="itemBlurb" id="iBlurb-'+ i +'">' + menu.ingredients + '</div></div>'

          document.getElementById('salads').insertAdjacentHTML('beforeend', items)
        break;

        case "desserts":
          items = '<div class="itemName" id="iName-'+ i +'">' + menu.dish + '</div><div class="itemBlurb" id="iBlurb-'+ i +'">' + menu.ingredients + '</div></div>'

          document.getElementById('desserts').insertAdjacentHTML('beforeend', items)
        break;
        
        case "drinks":
          items = '<div class="itemName" id="iName-'+ i +'">' + menu.dish + '</div><div class="itemBlurb" id="iBlurb-'+ i +'">' + menu.ingredients + '</div></div>'

          document.getElementById('drinks').insertAdjacentHTML('beforeend', items)
        break;
      }
    }

    //Highlight by risk type w/mark.js
    let bucketA = [], bucketB = [], bucketC = [];

    for (let i = 0; i < itemData.length; i++) {

      switch(itemData[i].type) {
        case "immediate":
          bucketA.push(itemData[i].item) 
        break;

        case "longterm":
          bucketB.push(itemData[i].item)
        break;

        case "restricted":
          bucketC.push(itemData[i].item)
        break;
      }      
    }

    let blurbs = document.querySelectorAll('.itemBlurb')

    for(let i = 0; i < blurbs.length; i++) {
      let blurb = document.getElementById('iBlurb-' + i);

      let instanceA = new Mark(blurb), optionsA = { 
        'className': 'tooltip item category-A',
        'separateWordSearch': false,
        "accuracy": {
          "value": "exactly",
          "limiters": [",", "."]
      }
          },
          instanceB = new Mark(blurb), optionsB = { 
            'className': 'tooltip item category-B',
            'separateWordSearch': false,
            "accuracy": {
              "value": "exactly",
              "limiters": [",", "."]
          }
          },
          instanceC = new Mark(blurb), optionsC = { 
            'className': 'tooltip item category-C',
            'separateWordSearch': false,
            "accuracy": {
              "value": "exactly",
              "limiters": [",", "."]
          }
          }

      instanceA.mark(bucketA, optionsA)
      instanceB.mark(bucketB, optionsB)
      instanceC.mark(bucketC, optionsC)
    }

  } //END BUILD

  function callTooltips() {
      //Create tooltips
      let tooltips = document.querySelectorAll('.tooltip')
      let tipBoxes, boxPosX, boxPosY;

      tooltips.forEach((tooltip, i) => { 
        Object.assign(tooltip, {
          id: 'item-' + i,
        })
  
        let tooltiptext = '<span class="tooltiptext" id="tip-' + i + '">'+ itemData[i].blurb +'</span>';

        tooltip.insertAdjacentHTML('beforeend', tooltiptext)

        let tipBoxes = document.querySelector('#tip-' + i);

        //Style tooltips
        switch(itemData[i].type) {
          case "immediate":
            tipBoxes.classList.add('category-A', 'whiteFill')
          break;
  
          case "longterm":
            tipBoxes.classList.add('category-B', 'blackFill')
          break;
  
          case "restricted":
            tipBoxes.classList.add('category-C', 'whiteFill')
          break;
        }     

        //Adjust placement by window position
        boxPosX = tooltip.getBoundingClientRect().left;
        boxPosY = tooltip.getBoundingClientRect().top;
        
        switch(true) {
          case boxPosX > boxMeasure.width * 2/3:
            tipBoxes.classList.add('tooltipLeft')
          break;

          case boxPosX < boxMeasure.width / 4 :
            tipBoxes.classList.add('tooltipRight')
          break;

          default: 
            tipBoxes.classList.add('tooltipTop')
          break;
        }      

        //Readjust Y-oriented tooltips top <> bottom on scroll
        let markedItem = document.querySelector('#item-' + i);
        let itemPosY = markedItem.getBoundingClientRect().top;

        if (!(document.querySelector('#tip-' + i).classList.contains('tooltipLeft') || 
            document.querySelector('#tip-' + i).classList.contains('tooltipRight'))) {

          window.addEventListener('scroll', () => {
            //console.log(document.getElementById('item-0').getBoundingClientRect().top, window.scrollY)
            
            if (itemPosY < window.scrollY * 4) {
              document.querySelector('#tip-' + i).classList.remove('tooltipTop')
              document.querySelector('#tip-' + i).classList.add('tooltipBottom')
            } else {
              document.querySelector('#tip-' + i).classList.remove('tooltipBottom')
              document.querySelector('#tip-' + i).classList.add('tooltipTop')
            }
          })
        } 


      }) //end tooltip iteration 

      // let testTip = document.getElementById('tip-0')
      // testTip.style.visibility = 'visible';
      // testTip.style.opacity = 1;

   }
  

})();