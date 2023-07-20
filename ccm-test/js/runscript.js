(function() {
  
  let urls = [
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCImOya1Tj9JVHI-Pn7xGxj63tsNGw7gtgPBczHxnl_Pl6eTgK1LqeR8upu3IkqaG11hRxQS5H1YcJ/pub?gid=0&single=true&output=csv', 
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCImOya1Tj9JVHI-Pn7xGxj63tsNGw7gtgPBczHxnl_Pl6eTgK1LqeR8upu3IkqaG11hRxQS5H1YcJ/pub?gid=1236691182&single=true&output=csv'
  ]

  let body = document.querySelector('body'),
      boxMeasure = body.getBoundingClientRect(),
      menuData, itemData;
  
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
    //xtalk.signalIframe();
    setTimeout(() => { xtalk.signalIframe(); }, 3500)

  )
  .catch(
    error => console.warn('Error', error)
  ) 

  function buildWidget(){
    //Get unique values from data and generate section headers
    let sections = menuData.map(x => x.course)
    sections = [...new Set(sections)]

    let courses = {};
    
    sections.forEach(section => {
      let sectionHeaders = `<div class="section" id="${section}">
                              <div class="sectionName">
                                <span class="separator"> ${section} </span>
                              </div>
                            </div>`

      document.getElementById('content').insertAdjacentHTML('beforeend', sectionHeaders)

      //map IDs to "course" object using section name as keys
      courses[section] = document.getElementById(section);
    });

    //generate section content
    let dishes = menuData.map(x => x.dish)    

    dishes.forEach(( _ , i) => {
      let sectionContent = '<div class="itemName" id="iName-' + i + '">' + menuData[i].dish + '</div><div class="itemBlurb"  id="iBlurb-' + i + '">' + menuData[i].ingredients + '</div>'

      let targetCourse = courses[menuData[i].course];

      if (targetCourse) { 
        targetCourse
          .insertAdjacentHTML('beforeend', sectionContent) 
      }
    })

    //HIGHLIGHT CATEGORIES
    let buckets = { immediate: [], longterm: [], restricted: []},
      bucketTypes = { immediate: 'A', longterm: 'B', restricted: 'C'}

    //extract obj properties and reassign to variables w/object destructuring 
    itemData.forEach(item => {
      let { type, item: targetItem } = item;
      buckets[type].push(targetItem)


    })

    let blurbs = document.querySelectorAll('.itemBlurb');

    blurbs.forEach(blurb => {
      let instance = new Mark(blurb);

      let options = {
        'separateWordSearch': false,
        'accuracy': {
          'value': 'exactly',
          'limiters': [',', '.']
        }
      }

      for (let bucket in buckets) {
        let classes = `tooltip item category-${bucketTypes[bucket]}`;

        instance.mark(buckets[bucket], { ...options, 'className': classes})
      }
    })

  } //END BUILD

  function callTooltips() {
      //Create item lookup table
      let itemKey = itemData.map(x => x.item.toLowerCase()),
          itemCategory = itemData.map(x => x.type),
          itemDesc = itemData.map(x => x.blurb), 
          dict = {};

      for (let i = 0; i < itemData.length; i++) {
        dict[itemKey[i]] = {
          type: itemCategory[i],
          desc: itemDesc[i]
        }
      }

      //Create tooltips
      let tooltips = document.querySelectorAll('.tooltip'),
          targetTip, boxPosX, boxPosY;

      tooltips.forEach((tooltip, i) => { 
        Object.assign(tooltip, {
          id: 'item-' + i,
        })

        let item = document.getElementById('item-' + i),
            itemKeyRef = item.innerHTML.toLowerCase();
  
        let tooltiptext = '<span class="tooltiptext" id="tip-' + i + '">'+ dict[itemKeyRef].desc +'</span>';

        tooltip.insertAdjacentHTML('beforeend', tooltiptext)

        //Style tooltips
        let targetTip = document.getElementById('tip-' + i);

        switch(dict[itemKeyRef].type) {
          case "immediate":
            targetTip.classList.add('category-A', 'whiteFill')
          break;
  
          case "longterm":
            targetTip.classList.add('category-B', 'blackFill')
          break;
  
          case "restricted":
            targetTip.classList.add('category-C', 'whiteFill')
          break;
        }     

        //Adjust placement by window position
        boxPosX = tooltip.getBoundingClientRect().left;
        boxPosY = tooltip.getBoundingClientRect().top;
        
        targetTip.classList.add(
          boxPosX > boxMeasure.width * 2/3 ? 'tooltipLeft' :
          boxPosX < boxMeasure.width / 4 ? 'tooltipRight' :
          'tooltipTop'
        )

        //Readjust Y-oriented tooltips top <> bottom on scroll
        let markedItem = document.getElementById('item-' + i),
            itemPosY = markedItem.getBoundingClientRect().top;

        let scrollHandler = () => {
          if (!(targetTip.classList.contains('tooltipLeft') || 
              targetTip.classList.contains('tooltipRight'))) {
            if (itemPosY < window.scrollY * 4) {
              targetTip.classList.remove('tooltipTop')
              targetTip.classList.add('tooltipBottom')
            } else {
              targetTip.classList.remove('tooltipBottom')
              targetTip.classList.add('tooltipTop')
            } 
          }
        }; 

        window.addEventListener('scroll', scrollHandler)

      }) //end iteration 

   } //END TOOLTIP CALL

})();