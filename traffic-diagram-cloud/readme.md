# NBC Local AI2HTML Guide

AI2HTML is an open-source script for Adobe Illustrator that converts Illustrator documents into responsive HTML and CSS. Originally developed by The New York Times, it's an invaluable tool for creating precise and accessible web graphics. This guide outlines the steps and best practices for using AI2HTML in your projects.

## Step by Step Process

To get started with AI2HTML, follow these steps:

1. Download the `ai2html.js` script from the official [ai2html website](http://ai2html.org/).
2. Move the script to your Illustrator scripts directory, which is typically found in `Applications > Adobe Illustrator > Presets > [Language] > Scripts`.
3. To create a new AI2HTML graphic, copy the template folder from the repository into your working directory.
4. Open the Illustrator template file provided within the template folder.
5. Design your graphic within Illustrator, ensuring to remove any unused artboards.
6. Run the AI2HTML script by navigating to `File > Scripts > Other Script...` and selecting `ai2html.js`.
7. After running the script, check the generated `output` folder for PNGs and an HTML file. Open the HTML in your browser to preview the graphic.
8. Make sure the graphic is responsive and looks good on different screen sizes.
9. For any changes, rerun the script in Illustrator which will regenerate the necessary files.

## Adding Meta Tag and Crosstalk

To enable interactivity and responsiveness, add the following code to your HTML:

```html
<!-- Add to the head section -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://media.nbcnewyork.com/assets/editorial/national/common/js/crosstalk.js"></script>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function () {
    xtalk.responsive = false;
    xtalk.init();
  });
</script>

<!-- Add to the bottom of the body section -->
<script
  src="https://code.jquery.com/jquery-3.1.1.slim.min.js"
  integrity="sha384-A7FZj7v+d/sdmMqp/nOQwliLvUsJfDHW+k9Omg/a/EheAdgtzNs3hpfag6Ed950n"
  crossorigin="anonymous"
></script>
<script>
  $(document).ready(function () {
    console.log("ready");
    setTimeout(function () {
      xtalk.signalIframe();
    }, 2000);
    xtalk.signalIframe();
  });
</script>
```

## FAQ

**How does it work?**

AI2HTML converts text into HTML and uses background images to maintain the integrity of the Illustrator file's design.

**What viewport sizes are available in the template?**

The AI template offers four sizes: desktop (737px), tablet (665px), mobile (350px), and full-width/feature (1,100px).

**What fonts are included in the template?**

The template includes Arthouse Regular, Medium, and Bold. Fonts can be added or changed in the `ai2html-config.json` file located in the assets folder.

**I’m new to this. Where should I start?**

There are several approaches:

- Create a base graphic in another platform and refine it in Illustrator.
- Add spot illustrations or photos and annotate them for different viewports.
- Utilize tools like figma2html for a workflow centered around Figma.

## Ideas for Future Features

- Automatic addition of credit/source line.
- Incorporation of additional fonts.

For more details and examples, visit the official [ai2html project](http://ai2html.org/).
