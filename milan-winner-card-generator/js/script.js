
document.addEventListener('DOMContentLoaded', () => {
  let athleteNames = ["Team USA"],
    eventNames = [],
    eventSlugs = {};
  d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vSAwEVBPF6Uey54eQayvydVF4SjRjt9EXGaet5N1BgZDDvMnxVIjR8gYJRe4_eHsJmF_RQ9I40dgXhn/pub?gid=474628024&single=true&output=csv").then(data => {
    const filteredData = data.filter(athlete => (athlete["QUALIFIED"] == "X") & (athlete["UPDATED"] == "X"));
    athleteNames = athleteNames.concat(filteredData.map(athlete => athlete["NAME"]).sort());
    const athleteSelect = d3.select("#athlete-select");
    for (let i = 0; i < athleteNames.length; i++) {
      const athleteName = athleteNames[i];
      let options = athleteSelect.html();
      options += `<option>${athleteName}</option>`;
      athleteSelect.html(options);
    }
  });

  d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vSAwEVBPF6Uey54eQayvydVF4SjRjt9EXGaet5N1BgZDDvMnxVIjR8gYJRe4_eHsJmF_RQ9I40dgXhn/pub?gid=0&single=true&output=csv").then(data => {
    eventNames = data.map(event => event["Full Event Name"].trim()).sort();
    data.forEach(event => eventSlugs[event["Full Event Name"].trim()] = event["Social Card Event Name"]);
    const eventSelect = d3.select("#event-select");
    for (let i = 0; i < eventNames.length; i++) {
      const eventName = eventNames[i].trim();
      let options = eventSelect.html();
      options += `<option>${eventName}</option>`;
      eventSelect.html(options);
    }
  });

  const SIZES = [
    { id: '4-5', width: 1080, height: 1350, label: 'Portrait', ratio: 1080 / 1350, swirlPath: 'images/portrait-swirls.png' },
    { id: '1-1', width: 1080, height: 1080, label: 'Square', ratio: 1, swirlPath: 'images/square-swirls.png' },
    { id: '16-9', width: 1920, height: 1080, label: 'Horizontal', ratio: 1920 / 1080, swirlPath: 'images/horizontal-swirls.png' },
    { id: '9-16', width: 1080, height: 1920, label: 'Vertical', ratio: 1080 / 1920, swirlPath: 'images/vertical-swirls.png' },
  ];

  let cropData = {},
    currentSize = SIZES[0].id,
    cropper,
    headlineSoFar = {
      "medal": "GOLD"
    };
  const image = document.getElementById('image'),
    fileInput = document.getElementById('fileInput'),
    sizeButtons = document.getElementById('size-buttons'),
    zoomSlider = document.getElementById('zoomSlider'),
    athleteInput = document.getElementById('athlete-input'),
    eventInput = document.getElementById('event-input'),
    medalInputs = [...document.getElementsByClassName('medal-input')],
    previewButton = document.getElementById('preview-button'),
    previewsContainer = document.getElementById('previews'),
    customEventInput = document.getElementById("event-custom-input"),
    customEventButton = document.getElementById("event-custom-btn"),
    headlinePreview = document.getElementById("headline-preview"),
    headlineSegments = document.getElementsByClassName("headline-segment"),
    sizesCropped = [];

  customEventButton.addEventListener("click", () => {
    const inputShown  = customEventInput.style.display === "block";
    let newStyle;
    if (inputShown) {
      newStyle = "none";
      headlineSoFar["event"] = eventSlugs[eventInput.value];
    } else {
      newStyle = "block";
      if (customEventInput.value !== "") {
        headlineSoFar["event"] = customEventInput.value;
      }
    }
    customEventInput.style.display = newStyle;
    generateHeadlinePreview();
  });

  const generateFilePath = sizeID => {
    return `${headlineSoFar.athlete.toLowerCase().replace(/ /g,"_")}_${headlineSoFar.event.toLowerCase().replace(/ /g,"_")}_${headlineSoFar.medal.toLowerCase().replace(/ /g,"_")}_${sizeID}.jpg`;
  }

  const generateHeadline = () => {
    let connector = "WINS",
      athleteName = headlineSoFar.athlete;
    if (athleteName.includes(" and ")) {
      athleteName = athleteName.split(" and ").map(name => name.split(" ").slice(1).join(" ")).join(" and ");
      connector = "WIN";
    }
    return `${athleteName ? athleteName.toUpperCase() : "[ATHLETE]"}|${connector} ${headlineSoFar.medal.toUpperCase()}|${headlineSoFar.event ? headlineSoFar.event : "[EVENT]"}`;
  }

  const generateHeadlinePreview = () => {
    let headline = generateHeadline().replaceAll("|", "<br/>");
    headlinePreview.innerHTML = `<p>${headline}</p>`
  }

  for (let i = 0; i < headlineSegments.length; i++) {
    let el = headlineSegments[i];
    el.addEventListener("change", e => {
      const headlineSegment = e.currentTarget.id.split("-")[0];
      let segmentValue = e.currentTarget.value;
      if (headlineSegment === "event" && (customEventInput.style.display === "none" || customEventInput.value === "")) {
        headlineSoFar[headlineSegment] = eventSlugs[eventInput.value];
      } else {
        headlineSoFar[headlineSegment] = segmentValue;
      }
      generateHeadlinePreview();
    })
  }

  const multipleLinesOfText = (text, maxWidth, ctx) => {
    let allLines = [];
    const words = text.trim().split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        allLines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      allLines.push(line.trim());
    }
    return allLines;
  };

  function resizeText(ctx, text, x, y, maxWidth) {
    // Split into athlete name, medal and event (each will appear on separate line)
    const paragraphs = text.split('|');

    // set default font settings for athlete name/ medal
    let italic = "italic ",
      fontSize = 138,
      linesSoFar = 0,
      titleFontSize = fontSize;
    ctx.font = `${italic}${fontSize}px ArtHouseMedCon, sans-serif`;
    // add text for each line
    for (let i = 0; i < paragraphs.length; i++) {
      let allLines = [paragraphs[i]];
      // change font settings for event line
      if (i == 2) {
        fontSize = fontSize - 40;
        italic = "";
        ctx.font = `${italic}${fontSize}px ArtHouseMedCon, sans-serif`;
      }
      // if this line will take up more than one line, reduce font size
      if (multipleLinesOfText(paragraphs[i], maxWidth, ctx).length > 1) {
        while (multipleLinesOfText(paragraphs[i], maxWidth, ctx).length > 1) {
          fontSize = fontSize - 5;
          ctx.font = `${italic}${fontSize}px ArtHouseMedCon, sans-serif`;
        }
        // save font size for line spacing
        if (i < 2) {
          titleFontSize = fontSize;
        }
      }
      
      // default line height for y positioning
      lineHeight = titleFontSize * 1.2;
      const totalHeight = paragraphs.length * lineHeight;
      let startY = y - totalHeight / 2 + lineHeight / 2;
      // add text
      allLines.forEach(line => {
        ctx.strokeText(line, x, startY + (i * lineHeight));
        ctx.fillText(line, x, startY + (i * lineHeight));
        linesSoFar++;
      })
    }
  }

  const drawLineOfText = (line, x, startY, lineHeight, ctx, linesSoFar) => {
    ctx.strokeText(line, x, startY + linesSoFar);
    ctx.fillText(line, x, startY + linesSoFar);
    return linesSoFar += lineHeight;
  }

  function wrapText(ctx, text, x, y, maxWidth) {
    // set default font settings for athlete name/ medal
    let italic = "italic ",
      fontSize = 138,
      linesSoFar = 0;
    ctx.font = `${italic}${fontSize}px ArtHouseMedCon, sans-serif`;

    // Split into athlete name, medal and event (each will appear on separate line)
    const paragraphs = text.split('|');
    let paragraphsAllLines = paragraphs.map(paragraph => multipleLinesOfText(paragraph, maxWidth, ctx)),
      allLines = {
        "athlete": paragraphsAllLines[0],
        "medal": paragraphsAllLines[1],
        "event": paragraphsAllLines[2]
      },
      shortLineHeight = 98 * 1.2,
      tallLineHeight = 138 * 1.2,
      lineHeight;
      
      const keys = Object.keys(allLines);
      const totalHeight = keys.map((key, idx) => {
        const paragraphs = allLines[key].length;
          heightToReturn = 0;
        if (key == "event") {
          heightToReturn = tallLineHeight + (shortLineHeight * (paragraphs - 1));
        } else {
          heightToReturn = (tallLineHeight * paragraphs);
        }
        return heightToReturn;
        
      }).reduce((partialSum, a) => partialSum + a, 0);

    // add text for each line
    for (let i = 0; i < keys.length; i++) {
      let lines = allLines[keys[i]];
      // default line height for y positioning
      let startY = y - totalHeight / 2 + tallLineHeight / 2;
      // change font settings for event line
      if (keys[i] == "event") {
        fontSize = fontSize - 40;
        ctx.font = `${fontSize}px ArtHouseMedCon, sans-serif`;
        lineHeight = shortLineHeight;
      } else {
        lineHeight = tallLineHeight;
      }
      lines.forEach((line, idx) => {
        linesSoFar = drawLineOfText(line, x, startY, lineHeight, ctx, linesSoFar);
      })
    }
  }

  //Apply styles
  function applyStyles(ctx, size, logo, swirls) {
    //Draw swirls
    const swirlsWidth = size.width;
    const swirlsHeight = size.height;
    const drawSwirlsX = 0;
    const drawSwirlsY = 0;
    ctx.drawImage(swirls, drawSwirlsX, drawSwirlsY, swirlsWidth, swirlsHeight);

    return { textAreaTop: size.height - 75, textAreaHeight: size.height / 3 };
  }

  //Simple Fade style
  function applySimpleFadeStyle(ctx, size, logo) {
    if (size.label !== "Horizontal") {
      // Calculate bottom third area
      const fadeHeight = size.height / 2;
      const fadeTop = size.height - fadeHeight;

      //Create gradient only for bottom third
      const gradient = ctx.createLinearGradient(0, fadeTop, 0, size.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');     // Transparent at top of fade area
      gradient.addColorStop(0.3, 'rgba(0,0,0,0.25)');  // Slight fade
      gradient.addColorStop(1, 'rgba(0,0,0,0.9)');    // Opaque black at bottom

      //Apply gradient overlay only to bottom third
      ctx.fillStyle = gradient;
      ctx.fillRect(0, fadeTop, size.width, fadeHeight);

      //Apply gradient overlay
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size.width, size.height);
    }

    //Draw logo in top right
    const logoW = logo.width;
    const logoH = logo.height;
    const drawLX = size.width - 170;
    const drawLY = 70;
    ctx.drawImage(logo, drawLX, drawLY, logoW, logoH);

    //Return text area (bottom third of image)
    const textAreaHeight = size.height / 3;
    const textAreaTop = size.height - textAreaHeight - 50; // 50px from bottom

    return { textAreaTop: textAreaTop, textAreaHeight: textAreaHeight };
  }

  //Initialize size buttons
  SIZES.forEach(size => {
    const btn = document.createElement('button');
    btn.textContent = size.label;
    btn.id = `btn-${size.id}`;
    btn.addEventListener('click', () => switchSize(size.id));
    sizeButtons.appendChild(btn);
  });

  function updateSizeButtons() {
    SIZES.forEach(s => {
      const btn = document.getElementById(`btn-${s.id}`);
      if (s.id === currentSize) { btn.style.background = '#007bff'; btn.style.color = '#fff'; }
      else { btn.style.background = ''; btn.style.color = ''; }
    });
  }

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    image.src = url;
    image.style.display = 'block';
    image.onload = () => initCropper();
    sizesCropped = [];
  });

  function initCropper() {
    if (cropper) { cropData[currentSize] = cropper.getData(true); cropper.destroy(); }
    const size = SIZES.find(s => s.id === currentSize);
    if (!sizesCropped.includes(size)) {
      sizesCropped.push(size);
    }
    updateSizeButtons();
    cropper = new window.Cropper(image, {
      aspectRatio: size.ratio,
      viewMode: 1,
      autoCropArea: 1,
      movable: true,
      zoomable: true,
      scalable: false,
      ready: () => { if (cropData[currentSize]) cropper.setData(cropData[currentSize]); }
    });
    zoomSlider.value = 1;
    zoomSlider.oninput = () => cropper.zoomTo(parseFloat(zoomSlider.value));
  }

  function switchSize(sizeId) {
    if (!image.src) return;
    if (cropper) cropData[currentSize] = cropper.getData(true);
    currentSize = sizeId;
    initCropper();
  }

  async function generatePreviews() {
    if (!athleteNames.includes(athleteInput.value) || !Object.keys(eventSlugs).includes(eventInput.value)) { alert('Please select an athlete and event from the provided list.'); return; }
    const headline = generateHeadline();

    const logopath = "images/bug.png";

    if (!headline) { alert('Please select athlete, event and medal type before previewing.'); return; }
    previewsContainer.innerHTML = '';

    await document.fonts.load(`1em 'ArtHouseMedCon'`);
    console.log('Fonts ready:', document.fonts.status);

    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`Loaded: ${src}`);
          resolve(img);
        };
        img.onerror = () => {
          console.error(`Failed to load: ${src}`);
          reject(new Error(`Failed to load: ${src}`));
        };
        img.src = src;
      });
    };

    try {
      const cards = {

      };
    
      const pushData = () => {
    
      };
    
      const downloadCard = (orientation) => {
        const link = document.createElement('a');
        link.download = cards[orientation]["path"];
        link.href = cards[orientation]["img"].src;
        link.click();
        pushData();
      };
    
      const downloadAllCards = () => {
        for (let i = 0; i < Object.keys(cards).length; i++) {
          let orientation = Object.keys(cards)[i];
          downloadCard(orientation);
        }
      }
      
      if (!document.getElementById("download-all-btn").hasChildNodes()) {
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.textContent = "Download All";
        document.getElementById("download-all-btn").appendChild(downloadAllBtn);
        downloadAllBtn.addEventListener('click', downloadAllCards);
      }


      const logo = await loadImage(logopath);
      const swirls = {};
      for (let i = 0; i < SIZES.length; i++) {
        const size = SIZES[i];
        const sizeSwirl = await loadImage(size["swirlPath"]);
        swirls[size.label] = sizeSwirl;
      }

      console.log('All assets loaded successfully');

      //Process each size
      sizesCropped.forEach(size => {
        const data = cropData[size.id];
        if (!data) return;

        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = image.src;

        img.onload = () => {
          // Draw the cropped image first
          if (cropper && currentSize === size.id) {
            // If this is the currently active crop, get canvas directly from cropper
            const croppedCanvas = cropper.getCroppedCanvas({
              width: size.width,
              height: size.height,
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high'
            });

            // Draw the cropped image to our canvas
            ctx.drawImage(croppedCanvas, 0, 0);
          } else {
            // For other sizes, use the manual method but keep it simple
            ctx.drawImage(
              img,
              data.x, data.y,
              data.width, data.height,
              0, 0,
              size.width, size.height
            );
          }

          // Create faded background and text overlay
          let textArea = applySimpleFadeStyle(ctx, size, logo);

          // Add swirled border around photo
          const sizeSwirls = swirls[size.label];
          applyStyles(ctx, size, logo, sizeSwirls);

          // Draw athlete/ medal text

          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'rgba(0,0,0,0.75)';
          ctx.lineWidth = 10;  
          const maxWidth = size.width - 100;
          const startX = 50;
          const hedCenterY = textArea.textAreaTop + textArea.textAreaHeight / 3;
          if (size.label == "Horizontal") {
            wrapText(ctx, headline, startX, size.height / 2, (size.width / 2.5) - 50);
          } else {
            resizeText(ctx, headline, startX, hedCenterY, maxWidth);
          }

          // Build preview element
          const div = document.createElement('div');
          div.className = 'preview';
          const imgEl = document.createElement('img');
          imgEl.src = canvas.toDataURL('image/jpeg');
          imgEl.alt = size.label;
          const btn = document.createElement('button');
          btn.textContent = `Download ${size.label}`;

          cards[size.label] = {
            "path": generateFilePath(size.id),
            "img": imgEl
          };
          btn.addEventListener('click', () => downloadCard(size.label));
          div.appendChild(imgEl);
          div.appendChild(btn);
          previewsContainer.appendChild(div);
        };
      });

    } catch (error) {
      console.error('Error loading assets:', error);
      alert('Some brand assets failed to load. Please check that all files in the /images/ folder are available.');
    }
  }

  previewButton.addEventListener('click', generatePreviews);
});
