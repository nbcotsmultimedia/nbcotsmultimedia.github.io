const LAMBDA_URL = "https://xteh4j7qt635lbcflpxh2fmfjm0qlptf.lambda-url.us-east-2.on.aws/";
const S3_BUCKET_URL = "https://nbcl-visuals.s3.amazonaws.com";

async function uploadToDocumentCloud() {
  const file = $("#fileInput")[0].files[0];
  const title = $("#titleInput").is(":checked") ? 0 : 1;

  if (!file) return alert("Please select a file.");
  console.log("Uploading to DocumentCloud...");
  showSpinner();

  try {
    // Step 1: Get presigned URL
    const presignRes = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "presign", filename: file.name, filetype: file.type }),
    });


    const presignData = await presignRes.json();
    const { url, key } = presignData;

    // Step 2: Upload to S3
    const s3Res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    // Step 3: Process and get embed URL
    const uploadRes = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upload", s3_key: key, title }),
    });

    const { embed_url } = await uploadRes.json();

    hideSpinner();
    console.log("DocumentCloud upload complete. Embed URL:", embed_url);
    $("#output").text(embed_url);
  } catch (err) {
    hideSpinner();
    alert("Something went wrong. Please try again.");
    console.error(err);
  }
}

function showSpinner() {
  $("#uploadBtn").prop("disabled", true);
  $("#spinner").show();
}

function hideSpinner() {
  $("#spinner").hide();
  $("#uploadBtn").prop("disabled", false);
}

function copyEmbedCode() {
  var text = $("#output").text();

  navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard:', text);
  }).catch(err => {
    return alert("Could not copy text. Please copy manually.");
  });
}


$("#uploadBtn").on("click", uploadToDocumentCloud);
$("#copyBtn").on("click", copyEmbedCode);
