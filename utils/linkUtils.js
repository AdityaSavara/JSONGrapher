// Function to retrieve JSON record from URL
export async function loadJsonFromUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not OK");
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error("Error fetching JSON:", error);
        return null;
    }
}

// Function to validate a URL string
export function isValidUrl(urlString) {
    var urlPattern = new RegExp(
        "^(https?:\\/\\/)?" +                     // validate protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+" + // validate domain name
        "[a-z]{2,}|" +                            // OR
        "((\\d{1,3}\\.){3}\\d{1,3}))" +           // validate IP (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +       // validate port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" +              // validate query string
        "(\\#[-a-z\\d_]*)?$",                     // validate fragment locator
        "i"
    );
    return !!urlPattern.test(urlString);
}


// A function that will create a download link for the csv file
export function createDownloadCSVLink(csv, filename) {
  if (filename===null){filename="JSONGrapherRecord.csv";};
  let csvFile;
  let downloadLink;
  // CSV file
  csvFile = new Blob([csv], { type: "text/csv" });
  // Download link
  downloadLink = document.createElement("a");
  downloadLink.id = "DownloadCSVLink";
  // File name
  downloadLink.download = filename;
  // Create a link to the file
  downloadLink.href = window.URL.createObjectURL(csvFile);
  // Hide download link
  downloadLink.style.display = "none";
  return downloadLink;
}


// A function that will create a download link for the JSON file
// This takes in a json object (a "javascript object", not a string)
export function createDownloadJSONLink(json, filename) {
    if (filename === null) {
        filename = "JSONGrapherRecord.json";
    }
    let jsonFile;
    let downloadLink;
    // JSON file
    jsonFile = new Blob([JSON.stringify(json, null, 4)], {
        type: "application/json",
    });
    // Download link
    downloadLink = document.createElement("a");
    downloadLink.id = "DownloadJSONLink";
    // File name
    downloadLink.download = filename;
    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(jsonFile);
    // Hide download link
    downloadLink.style.display = "none";
    return downloadLink;
}

// A function that will create a BZ2 and encoded URL for the final graph.
// This approach was abandoned because the URL strings were too long for both some browsers and some web server limits.
export function jsonToUrl(json) {
    // For now, hardcoding the base URL for clarity
    const prefix = `http://www.jsongrapher.com?fromUrl=`;
    // const url = window.location.href.split('?')[0]; // gets url from browser and removes query parameters
    // const prefix = `${url}?fromUrl=`;
    // Convert JSON to a string
    let jsonString = JSON.stringify(json);
    // Concatenate with prefix and apply URL encoding
    let urlString = prefix + encodeURIComponent(jsonString);
    // Intended to compress using Bzip2, but importing a JS version posed issues
    // urlString = compressjs.Bzip2.compressFile(new TextEncoder().encode(urlString));
    return urlString;
}

// A function that will create a URL string that allows graphing from a remote JSON
export function createCopyUrlLink(jsonURL) {
    // For now, hardcoding the base URL for clarity
    const prefix = `http://www.jsongrapher.com?fromUrl=`;
    // const url = window.location.href.split('?')[0]; // gets url from browser and removes query parameters
    // const prefix = `${url}?fromUrl=`;
    // Concatenate with prefix and apply URL encoding
    let urlString = prefix + encodeURIComponent(jsonURL);
    // Intended to compress using Bzip2, but importing a JS version posed issues
    // urlString = compressjs.Bzip2.compressFile(new TextEncoder().encode(urlString));
    return urlString;
}

// Changes the Github link to a CDN link to avoid CORB issues
// TODO: currently we only support javascript from github. In the future, cross-domain / cross-origin simulate functions will be supported by SRI hash. https://www.w3schools.com/Tags/att_script_crossorigin.asp https://www.w3schools.com/Tags/att_script_integrity.asp with the SRI hash provided within the simulate object by a field in the JSON record named "SRI" or 'integrity"
export function parseUrl(url) {
  const urlArr = url.split("/");
  if (urlArr[2] === "github.com") {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/")
      .replace("/tree/", "/")
      .replace("www.", "");
  } else {
    return url;
  }
}

//This is a helper function that takes in a button and a link
// and makes it so that the link is opened when a person clicks a button
// this can also be used to initiate downloads if the link is to a file.
export function addOpeningURLonButtonClick (button, link) {
  // Adding an event listener to the button for when clicking occurs
  button.addEventListener("click", () => {
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  return button;
}

// Helper function that opens a prepared <a> element in a new window via button click
export function addNewWindowLinkToButton(buttonId, downloadLink) {
  const button = document.getElementById(buttonId);
  // Ensure it opens in a new tab and applies best practices
  downloadLink.target = "_blank";
  downloadLink.rel = "noopener noreferrer";
  addOpeningURLonButtonClick(button, downloadLink);
}

// Helper function that triggers a file download via button click
// The downloadLink is an <a> element, not a URL string
export function addDownloadingLinkToButton(buttonId, downloadLink, filename) {
  const button = document.getElementById(buttonId);
  // Use filename if provided, otherwise keep what's already on the link
  if (filename) {
    downloadLink.setAttribute("download", filename);
  }
  addOpeningURLonButtonClick(button, downloadLink);
}

window.loadJsonFromUrl = loadJsonFromUrl; //line needed for index.html to see the function after importing.
window.isValidUrl = isValidUrl; //line needed for index.html to see the function after importing.
window.createDownloadJSONLink = createDownloadJSONLink; //line needed for index.html to see the function after importing.
window.createDownloadCSVLink = createDownloadCSVLink; //line needed for index.html to see the function after importing.
window.jsonToUrl = jsonToUrl; //line needed for index.html to see the function after importing.
window.createCopyUrlLink = createCopyUrlLink; //line needed for index.html to see the function after importing.
window.addOpeningURLonButtonClick = addOpeningURLonButtonClick; //line needed for index.html to see the function after importing.
window.addDownloadingLinkToButton = addDownloadingLinkToButton; //line needed for index.html to see the function after importing.
window.parseUrl = parseUrl; //line needed for index.html to see the function after importing.