
    document.addEventListener('DOMContentLoaded', () => {
      let athleteNames = [];
      d3.csv("data/athletes.csv").then(data => {
        const filteredData = data.filter(athlete => (athlete["QUALIFIED"] == "X") & (athlete["UPDATED"] == "X"));
        athleteNames = filteredData.map(athlete => athlete["NAME"]).sort();
        const athleteSelect = d3.select("#athlete-select");
        for(let i = 0; i < athleteNames.length; i++) {
          const athleteName = athleteNames[i];
          let options = athleteSelect.html();
          options += `<option>${athleteName}</option>`;
          athleteSelect.html(options);
        }
      });






      const SIZES = [
        { id: '4-5', width: 1080, height: 1350, label: 'Portrait', ratio: 1080/1350 },
        { id: '1-1', width: 1080, height: 1080, label: 'Square', ratio: 1 },
        { id: '16-9', width: 1920, height: 1080, label: 'Horizontal', ratio: 1920/1080 },
        { id: '9-16', width: 1080, height: 1920, label: 'Vertical', ratio: 1080/1920 },
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
      const medalInput = [...document.getElementsByClassName('medal-input')].filter(btn => btn.checked)[0];
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

      //Apply Arthouse Blue style
      function applyArthouseBlueStyle(ctx, size, logo, stripes, brule) {
        //Draw blue color block
        const blockHeight = size.height / 3;
        const blockBottom = size.height - 75;
        const blockTop = blockBottom - blockHeight;
        ctx.fillStyle = 'rgba(2,20,72,0.8)';
        ctx.fillRect(0, blockTop, size.width, blockHeight);

        //Draw stripes
        const stripesW = stripes.width;
        const stripesH = stripes.height;
        const drawSW = size.width;
        const drawSH = (stripesH / stripesW) * drawSW;
        const drawSX = (size.width - drawSW) / 2;
        const drawSY = blockTop;
        ctx.drawImage(stripes, drawSX, drawSY, drawSW, drawSH);

        //Draw logo
        const logoW = logo.width;
        const logoH = logo.height;
        const drawLX = size.width - 170;
        const drawLY = 70;
        ctx.drawImage(logo, drawLX, drawLY, logoW, logoH);

        //Draw bottom rule
        const bruleW = brule.width;
        const bruleH = brule.height;
        const drawBX = (size.width - bruleW) / 2;
        const drawBY = blockBottom;
        ctx.drawImage(brule, drawBX, drawBY, bruleW, bruleH);

        return { textAreaTop: blockTop, textAreaHeight: blockHeight };
      }

      //Apply Arthouse Red style
      function applyArthouseRedStyle(ctx, size, logo, stripes, brule) {
        //Draw red color block
        const blockHeight = size.height / 3;
        const blockBottom = size.height - 75;
        const blockTop = blockBottom - blockHeight;
        ctx.fillStyle = 'rgba(128,2,1,0.8)';
        ctx.fillRect(0, blockTop, size.width, blockHeight);

        //Draw stripes
        const stripesW = stripes.width;
        const stripesH = stripes.height;
        const drawSW = size.width;
        const drawSH = (stripesH / stripesW) * drawSW;
        const drawSX = (size.width - drawSW) / 2;
        const drawSY = blockTop;
        ctx.drawImage(stripes, drawSX, drawSY, drawSW, drawSH);

        //Draw logo
        const logoW = logo.width;
        const logoH = logo.height;
        const drawLX = size.width - 170;
        const drawLY = 70;
        ctx.drawImage(logo, drawLX, drawLY, logoW, logoH);

        //Draw bottom rule
        const bruleW = brule.width;
        const bruleH = brule.height;
        const drawBX = (size.width - bruleW) / 2;
        const drawBY = blockBottom;
        ctx.drawImage(brule, drawBX, drawBY, bruleW, bruleH);

        return { textAreaTop: blockTop, textAreaHeight: blockHeight };
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
        const headline = `${athleteName} wins ${medalInput.value} in ${eventInput.value}`;
        //const lang = Array.from(languageInputs).find(r => r.checked).value;
        const stationlogo = logoDrop.value;
        const style = "Arthouse blue";//Array.from(styleInputs).find(r => r.checked).value;

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
          
          //Load additional assets only for Arthouse styles
          let stripes, brule;
          if (style === 'arthouse-blue' || style === 'arthouse-red') {
            // Load stripes based on style
            const stripePath = style === 'arthouse-blue' ? 'images/stripes.png' : 'images/stripes-red.png';
            stripes = await loadImage(stripePath);
            
            // Load rule based on style
            const brulePath = style === 'arthouse-blue' ? 'images/bluerule.png' : 'images/redrule.png';
            brule = await loadImage(brulePath);
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
              let textArea;
              if (style === 'arthouse-blue') {
                textArea = applyArthouseBlueStyle(ctx, size, logo, stripes, brule);
              } else if (style === 'arthouse-red') {
                textArea = applyArthouseRedStyle(ctx, size, logo, stripes, brule);
              } else { // simple fade
                textArea = applySimpleFadeStyle(ctx, size, logo);
              }

              // Draw wrapped text with line break support
              const fontSize = 85;
              ctx.font = `${fontSize}px ArtHouseMedCon, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'white';
              const maxWidth = size.width - 40;
              const centerX = size.width / 2;
              const centerY = textArea.textAreaTop + textArea.textAreaHeight / 2;
              wrapText(ctx, headline, centerX, centerY, maxWidth, fontSize * 1.2);

              // Build preview element
              const div = document.createElement('div');
              div.className = 'preview';
              const imgEl = document.createElement('img');
              imgEl.src = canvas.toDataURL('image/jpeg');
              imgEl.alt = size.label;
              const btn = document.createElement('button');
              btn.textContent = `Download ${size.label}`;
              btn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `social_${size.id}_${style}.jpg`;
                link.href = imgEl.src;
                link.click();
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
