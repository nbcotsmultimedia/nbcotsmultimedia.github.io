
document.addEventListener('DOMContentLoaded', () => {
  let athleteNames = ["Team USA"],
    eventNames = [],
    eventSlugs = {};
  d3.csv("data/athletes.csv").then(data => {
    const filteredData = data.filter(athlete => (athlete["QUALIFIED"] == "X") & (athlete["UPDATED"] == "X"));
    athleteNames = athleteNames.concat(filteredData.map(athlete => athlete["NAME"]).sort());
    const athleteSelect = d3.select("#athlete-select");
    for(let i = 0; i < athleteNames.length; i++) {
      const athleteName = athleteNames[i];
      let options = athleteSelect.html();
      options += `<option>${athleteName}</option>`;
      athleteSelect.html(options);
    }
  });

  d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vSAwEVBPF6Uey54eQayvydVF4SjRjt9EXGaet5N1BgZDDvMnxVIjR8gYJRe4_eHsJmF_RQ9I40dgXhn/pub?gid=0&single=true&output=csv").then(data => {
    eventNames = data.map(event => event["Full Event Name"]).sort();
    data.forEach(event => eventSlugs[event["Full Event Name"]] = event["Social Card Event Name"]);
    const eventSelect = d3.select("#event-select");
    for(let i = 0; i < eventNames.length; i++) {
      const eventName = eventNames[i];
      let options = eventSelect.html();
      options += `<option>${eventName}</option>`;
      eventSelect.html(options);
    }
  });

const SIZES = [
    { id: '4-5', width: 1080, height: 1350, label: 'Portrait', ratio: 1080/1350, swirlPath: 'images/portrait-swirls.png' },
    { id: '1-1', width: 1080, height: 1080, label: 'Square', ratio: 1, swirlPath: 'images/square-swirls.png' },
    { id: '16-9', width: 1920, height: 1080, label: 'Horizontal', ratio: 1920/1080, swirlPath: 'images/horizontal-swirls.png' },
    { id: '9-16', width: 1080, height: 1920, label: 'Vertical', ratio: 1080/1920, swirlPath: 'images/vertical-swirls.png' },
  ];

  let cropData = {};
  let currentSize = SIZES[0].id;
  let cropper;
  const image = document.getElementById('image');
  const fileInput = document.getElementById('fileInput');
  const sizeButtons = document.getElementById('size-buttons');
  //const languageInputs = document.getElementsByName('language');
  const logoDrop = document.getElementById('station-logo');
  const styleInputs = document.getElementsByName('thestyle');
  const zoomSlider = document.getElementById('zoomSlider');
  const athleteInput = document.getElementById('athlete-input');
  const eventInput = document.getElementById('event-input');
  const medalInputs = [...document.getElementsByClassName('medal-input')];
  const previewButton = document.getElementById('preview-button');
  const previewsContainer = document.getElementById('previews');
  const offscreen = document.getElementById('offscreen');

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    //Split by manual line breaks (using | as delimiter)
    const paragraphs = text.split('|');
    const allLines = [];
    
    paragraphs.forEach(paragraph => {
      const words = paragraph.trim().split(' ');
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
    });
    
    //Calculate vertical start to center text within block
    const totalHeight = allLines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;
    
    allLines.forEach((l, i) => {
      ctx.fillText(l, x, startY + i * lineHeight);
    });
  }

  //Apply styles
  function applyStyles(ctx, size, logo, swirls) {
    //Draw swirls
    const swirlsWidth = size.width;
    const swirlsHeight = size.height;
    const drawSwirlsX = 0;
    const drawSwirlsY = 0;
    ctx.drawImage(swirls, drawSwirlsX, drawSwirlsY, swirlsWidth, swirlsHeight);

    //Draw logo
    const logoW = logo.width;
    const logoH = logo.height;
    const drawLX = size.width - 170;
    const drawLY = 70;
    ctx.drawImage(logo, drawLX, drawLY, logoW, logoH);

    return { textAreaTop: size.height - 75, textAreaHeight: size.height / 3 };
  }

  //Simple Fade style
  function applySimpleFadeStyle(ctx, size, logo) {
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
  });

  function initCropper() {
    if (cropper) { cropData[currentSize] = cropper.getData(true); cropper.destroy(); }
    const size = SIZES.find(s => s.id === currentSize);
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
    const athleteName = athleteInput.value;
    if (!athleteNames.includes(athleteName)) { alert('Please select an athlete from the provided list of names.'); return; }
    const selectedMedal = medalInputs.filter(btn => btn.checked)[0];
    const headline = `${athleteName} wins ${selectedMedal.value} in ${eventSlugs[eventInput.value]}`.toUpperCase();
    console.log(headline)
    //const lang = Array.from(languageInputs).find(r => r.checked).value;
    const stationlogo = "nbc";

    //console.log(stationlogo)
    const logopath = "images/logo-" + stationlogo + ".png";
    
    if (!headline) { alert('Please enter a headline before previewing.'); return; }
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
      //Load logo
      //const logo = await loadImage(lang === "en" ? 'images/logo-nbc.png' : 'images/logo-tlmd.png');
      const logo = await loadImage(logopath);
      const swirls = {};
      for(let i = 0; i < SIZES.length; i ++) {
        const size = SIZES[i];
        const sizeSwirl = await loadImage(size["swirlPath"]);
        swirls[size.label] = sizeSwirl;
      }

      console.log('All assets loaded successfully');

      //Process each size
      SIZES.forEach(size => {
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

          // Apply the selected style
          /*let textArea;
          if (style === 'arthouse-blue') {
            textArea = applyArthouseBlueStyle(ctx, size, logo, stripes, brule);
          } else if (style === 'arthouse-red') {
            textArea = applyArthouseRedStyle(ctx, size, logo, stripes, brule);
          } else { // simple fade
            textArea = applySimpleFadeStyle(ctx, size, logo);
          }*/

          const sizeSwirls = swirls[size.label];
          applyStyles(ctx, size, logo, sizeSwirls);

          // Draw wrapped text with line break support
          /*const fontSize = 85;
          ctx.font = `${fontSize}px ArtHouseMedCon, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          const maxWidth = size.width - 40;
          const centerX = size.width / 2;
          const centerY = textArea.textAreaTop + textArea.textAreaHeight / 2;
          wrapText(ctx, headline, centerX, centerY, maxWidth, fontSize * 1.2);*/

          // Build preview element
          const div = document.createElement('div');
          div.className = 'preview';
          const imgEl = document.createElement('img');
          imgEl.src = canvas.toDataURL('image/jpeg');
          imgEl.alt = size.label;
          const btn = document.createElement('button');
          btn.textContent = `Download ${size.label}`;
          const pushData = () => {
            
          };

          btn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `social_${size.id}_${style}.jpg`;
            link.href = imgEl.src;
            link.click();
            pushData();
          });
          div.appendChild(imgEl); 
          div.appendChild(btn);
          previewsContainer.appendChild(div);
        };
      });

    } catch (error) {
      console.error('Error loading assets:', error);
      if (style === 'arthouse-blue' || style === 'arthouse-red') {
        alert('Some brand assets failed to load. Please check that all files in the /images/ folder are available:\n\n' +
              '• stripes.png / stripes-red.png\n' +
              '• nbclogo.png / logo-tlmd.png\n' +
              '• bluerule.png / redrule.png');
      } else {
        alert('Logo assets failed to load. Please check that logo files are available:\n\n' +
              '• nbclogo.png / logo-tlmd.png');
      }
    }
  }

  previewButton.addEventListener('click', generatePreviews);
});
