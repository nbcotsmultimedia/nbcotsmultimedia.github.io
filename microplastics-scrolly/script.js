class ScrollamaStory {
  constructor() {
    this.scroller = scrollama();
    this.scrollText = document.querySelector(".scroll__text");
    this.graphicImg = document.querySelector(".scroll__graphic img");
    this.scrollIndicator = null;
    this.isFirstLoad = true;
  }

  init() {
    this.generateSteps();
    this.setupScrollama();
    this.setupEventListeners();
    this.preloadImages();
    this.createScrollIndicator();
  }

  createScrollIndicator() {
    this.scrollIndicator = document.createElement("div");
    this.scrollIndicator.className = "scroll-indicator visible";
    this.scrollIndicator.innerHTML = `
      <div class="scroll-indicator__icon">
        <div class="scroll-indicator__wheel"></div>
      </div>
    `;
    document.body.appendChild(this.scrollIndicator);
  }

  generateSteps() {
    CONFIG.sections.forEach((section, index) => {
      const step = document.createElement("div");
      step.className = "step";
      step.innerHTML = `
        <h3>${section.title}</h3>
        <p>${section.content}</p>
      `;
      this.scrollText.appendChild(step);
    });
  }

  setupScrollama() {
    this.scroller
      .setup({
        step: ".step",
        offset: 0.5,
        debug: false,
      })
      .onStepEnter((response) => {
        this.updateActiveStep(response);
        this.updateImage(response);

        // Hide scroll indicator after first scroll
        if (this.scrollIndicator && response.index > 0) {
          this.scrollIndicator.style.opacity = "0";
          setTimeout(() => {
            this.scrollIndicator.remove();
            this.scrollIndicator = null;
          }, 500);
        }
      });
  }

  updateActiveStep(response) {
    const steps = document.querySelectorAll(".step");
    steps.forEach((step) => step.classList.remove("is-active"));
    response.element.classList.add("is-active");
  }

  updateImage(response) {
    this.graphicImg.src = CONFIG.illustrations[response.index];
  }

  preloadImages() {
    CONFIG.illustrations.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.scroller.resize());
    window.addEventListener("load", () => {
      this.preloadImages();
      if (window.scrollY === 0 && this.isFirstLoad) {
        this.scrollIndicator.classList.add("visible");
        this.isFirstLoad = false;
      }
    });

    // Hide scroll indicator when user starts scrolling
    window.addEventListener(
      "scroll",
      () => {
        if (this.scrollIndicator && window.scrollY > 100) {
          this.scrollIndicator.style.opacity = "0";
          setTimeout(() => {
            this.scrollIndicator.remove();
            this.scrollIndicator = null;
          }, 500);
        }
      },
      { passive: true }
    );
  }
}

// Initialize the story
const story = new ScrollamaStory();
story.init();
