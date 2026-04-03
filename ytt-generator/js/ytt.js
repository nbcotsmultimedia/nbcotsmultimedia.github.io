const imageUpload = document.getElementById('imageUpload');
    const headlineInput = document.getElementById('headline');
    const charCount = document.getElementById('charCount');
    const logoSelect = document.getElementById('logoSelect');
    const logoPreview = document.getElementById('logoPreview');
    const logoName = document.getElementById('logoName');
    const generateBtn = document.getElementById('generateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusEl = document.getElementById('status');
    const landscapeImage = document.getElementById('landscapeImage');
    const portraitImage = document.getElementById('portraitImage');
    const landscapePreviewFrame = document.getElementById('landscapePreviewFrame');
    const portraitPreviewFrame = document.getElementById('portraitPreviewFrame');
    const downloadLandscapeBtn = document.getElementById('downloadLandscape');
    const downloadPortraitBtn = document.getElementById('downloadPortrait');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const landscapePanel = document.getElementById('landscapePanel');
    const portraitPanel = document.getElementById('portraitPanel');

    const LOGOS = {
      nbc: 'images/nbc.png',
      tlmd: 'images/tlmd.png',
      nbcmiami: 'images/nbc-miami.png',
      tlmdmiami: 'images/tlmd-miami.png'
    };

    const OUTPUTS = {
      landscape: {
        width: 1920,
        height: 1080,
        aspectRatio: 16 / 9,
        fileName: 'thumbnail-16x9.jpg'
      },
      portrait: {
        width: 1080,
        height: 1920,
        aspectRatio: 9 / 16,
        fileName: 'thumbnail-9x16.jpg'
      }
    };

    let uploadedImageUrl = '';
    let landscapeCropper = null;
    let portraitCropper = null;
    let generatedLandscapeDataUrl = '';
    let generatedPortraitDataUrl = '';

    function setStatus(message) {
      statusEl.textContent = message;
    }

    function updateCharCount() {
      charCount.textContent = `${headlineInput.value.length} / 25`;
    }

    function updateLogoPreview() {
      const logoFile = LOGOS[logoSelect.value];
      logoPreview.src = logoFile;
      logoName.textContent = `Using ${logoFile}`;
    }

    function canGenerate() {
      return Boolean(
        uploadedImageUrl &&
        headlineInput.value.trim().length > 0 &&
        headlineInput.value.trim().length <= 30 &&
        landscapeCropper &&
        portraitCropper
      );
    }

    function updateGenerateState() {
      generateBtn.disabled = !canGenerate();
    }

    function destroyCroppers() {
      if (landscapeCropper) {
        landscapeCropper.destroy();
        landscapeCropper = null;
      }
      if (portraitCropper) {
        portraitCropper.destroy();
        portraitCropper = null;
      }
    }

    function clearPreviews() {
      generatedLandscapeDataUrl = '';
      generatedPortraitDataUrl = '';
      landscapePreviewFrame.innerHTML = '<div class="placeholder">Generate a thumbnail to preview the 16:9 output.</div>';
      portraitPreviewFrame.innerHTML = '<div class="placeholder">Generate a thumbnail to preview the 9:16 output.</div>';
      downloadLandscapeBtn.disabled = true;
      downloadPortraitBtn.disabled = true;
    }

    function resetApp() {
      imageUpload.value = '';
      headlineInput.value = '';
      updateCharCount();
      logoSelect.value = 'nbc';
      updateLogoPreview();
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
      uploadedImageUrl = '';
      landscapeImage.removeAttribute('src');
      portraitImage.removeAttribute('src');
      destroyCroppers();
      clearPreviews();
      setStatus('');
      updateGenerateState();
    }

    function activateTab(tab) {
      tabButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
      landscapePanel.classList.toggle('active', tab === 'landscape');
      portraitPanel.classList.toggle('active', tab === 'portrait');

      requestAnimationFrame(() => {
        if (tab === 'landscape' && landscapeCropper) {
          landscapeCropper.resize();
          landscapeCropper.reset();
        }
        if (tab === 'portrait' && portraitCropper) {
          portraitCropper.resize();
          portraitCropper.reset();
        }
      });
    }

    function waitForImageLoad(imgEl, src) {
      return new Promise((resolve, reject) => {
        imgEl.onload = () => resolve();
        imgEl.onerror = () => reject(new Error('Image failed to load.'));
        imgEl.src = src;
      });
    }

    async function setupCroppers(imageUrl) {
      destroyCroppers();
      clearPreviews();
      setStatus('Loading image...');

      await Promise.all([
        waitForImageLoad(landscapeImage, imageUrl),
        waitForImageLoad(portraitImage, imageUrl)
      ]);

      landscapeCropper = new Cropper(landscapeImage, {
        aspectRatio: OUTPUTS.landscape.aspectRatio,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        background: false,
        responsive: true,
        guides: true,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false
      });

      portraitCropper = new Cropper(portraitImage, {
        aspectRatio: OUTPUTS.portrait.aspectRatio,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        background: false,
        responsive: true,
        guides: true,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false,
        ready() {
          const cropper = this.cropper;
          cropper.zoomTo(1);
        }
      });

      setStatus('Image loaded. Adjust both crops, then generate previews.');
      updateGenerateState();
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Unable to load image asset.'));
        img.src = src;
      });
    }

    function wrapHeadline(ctx, text, maxWidth, maxLines) {
      const words = text.trim().split(/\s+/);
      if (!words.length) return [''];

      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i += 1) {
        const testLine = `${currentLine} ${words[i]}`;
        if (ctx.measureText(testLine).width <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }

      lines.push(currentLine);

      if (lines.length <= maxLines) {
        return lines;
      }

      const limited = lines.slice(0, maxLines);
      while (
        limited[maxLines - 1] &&
        ctx.measureText(limited[maxLines - 1] + '...').width > maxWidth &&
        limited[maxLines - 1].includes(' ')
      ) {
        limited[maxLines - 1] = limited[maxLines - 1].split(' ').slice(0, -1).join(' ');
      }
      limited[maxLines - 1] = `${limited[maxLines - 1]}...`;
      return limited;
    }

    async function composeThumbnail(cropper, config, headline, logoSrc) {
      const baseCanvas = cropper.getCroppedCanvas({
        width: config.width,
        height: config.height,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(baseCanvas, 0, 0, config.width, config.height);

      const overlayHeight = config.width > config.height
        ? config.height * 0.4   // 16:9
        : config.height * 0.33;  // 9:16
      const overlayY = config.height - overlayHeight;
      const sidePadding = Math.round(config.width * 0.04);
      const logoMaxWidth = Math.round(config.width * 0.14);
      const logoMaxHeight = Math.round(overlayHeight * 0.55);
      const gap = Math.round(config.width * 0.040);

      // Gradient overlay: 0% at top -> 66% at bottom
      const gradient = ctx.createLinearGradient(0, overlayY, 0, config.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, overlayY, config.width, overlayHeight);

      const logo = await loadImage(logoSrc);
      const logoScale = Math.min(logoMaxWidth / logo.width, logoMaxHeight / logo.height);
      const logoWidth = logo.width * logoScale;
      const logoHeight = logo.height * logoScale;
      const logoX = sidePadding;
      const logoY = overlayY + (overlayHeight - logoHeight) / 2;
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

      const textX = logoX + logoWidth + gap;
      const textBoxWidth = config.width - textX - sidePadding;
      const fontSize = 150;
      const lineHeight = Math.round(fontSize * 1);

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${fontSize}px Arthouse, Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;

      const maxLines = config.width > config.height ? 2 : 3;
      const lines = wrapHeadline(ctx, headline.toUpperCase(), textBoxWidth, maxLines);
      const totalTextHeight = lines.length * lineHeight;
      const textY = overlayY + (overlayHeight - totalTextHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, textX, textY + index * lineHeight);
      });

      return canvas.toDataURL('image/jpeg', 0.92);
    }

    function renderPreview(frameEl, dataUrl, altText) {
      frameEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = altText;
      frameEl.appendChild(img);
    }

    function triggerDownload(dataUrl, filename) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    imageUpload.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }

      uploadedImageUrl = URL.createObjectURL(file);

      try {
        await setupCroppers(uploadedImageUrl);
      } catch (error) {
        destroyCroppers();
        setStatus(error.message || 'There was a problem loading the image.');
      }
    });

    headlineInput.addEventListener('input', () => {
      if (headlineInput.value.length > 30) {
        headlineInput.value = headlineInput.value.slice(0, 30);
      }
      updateCharCount();
      updateGenerateState();
      clearPreviews();
    });

    logoSelect.addEventListener('change', () => {
      updateLogoPreview();
      clearPreviews();
    });

    generateBtn.addEventListener('click', async () => {
      if (!canGenerate()) {
        setStatus('Please upload an image, enter a headline, and make sure both crop tools are ready.');
        return;
      }

      generateBtn.disabled = true;
      setStatus('Generating preview images...');

      try {
        const headline = headlineInput.value.trim();
        const logoSrc = LOGOS[logoSelect.value];

        generatedLandscapeDataUrl = await composeThumbnail(landscapeCropper, OUTPUTS.landscape, headline, logoSrc);
        generatedPortraitDataUrl = await composeThumbnail(portraitCropper, OUTPUTS.portrait, headline, logoSrc);

        renderPreview(landscapePreviewFrame, generatedLandscapeDataUrl, '16:9 thumbnail preview');
        renderPreview(portraitPreviewFrame, generatedPortraitDataUrl, '9:16 thumbnail preview');

        downloadLandscapeBtn.disabled = false;
        downloadPortraitBtn.disabled = false;
        setStatus('Previews generated. You can now download either JPG.');
      } catch (error) {
        setStatus(error.message || 'There was a problem generating the thumbnails.');
      } finally {
        updateGenerateState();
      }
    });

    downloadLandscapeBtn.addEventListener('click', () => {
      if (generatedLandscapeDataUrl) {
        triggerDownload(generatedLandscapeDataUrl, OUTPUTS.landscape.fileName);
      }
    });

    downloadPortraitBtn.addEventListener('click', () => {
      if (generatedPortraitDataUrl) {
        triggerDownload(generatedPortraitDataUrl, OUTPUTS.portrait.fileName);
      }
    });

    resetBtn.addEventListener('click', resetApp);

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activateTab(button.dataset.tab);
      });
    });

    updateCharCount();
    updateLogoPreview();
    updateGenerateState();