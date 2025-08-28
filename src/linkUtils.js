// Function to retrieve JSON record from URL
/**
 * Fetches and parses JSON data from a given URL.
 *
 * The URL is first normalized using `parseUrl`. If the fetch fails or returns a non-OK status,
 * the function logs a warning or error and returns `null`.
 *
 * @param {string} url - The URL to fetch JSON from.
 * @returns {Promise<Object|null>} - The parsed JSON object, or `null` if fetch fails.
 */
/**
 * Fetches and parses a JSON file from a given URL.
 * Uses `parseUrl` to normalize the input and handles HTTP errors gracefully.
 *
 * @param {String} url - The URL to fetch JSON from.
 * @returns {Promise<Object|null>} A promise that resolves with the parsed JSON object or null on failure.
 */
export async function loadJsonFromUrl(url) {
  url = parseUrl(url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Non-OK HTTP status ${response.status} from ${url}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error);
    return null;
  }
}


// Function to validate a URL string
/**
 * Validates whether a given string is a well-formed URL.
 * Supports HTTP/HTTPS protocols, domain names, IPv4 addresses, ports, paths, queries, and fragments.
 *
 * @param {String} urlString - The URL string to validate.
 * @returns {Boolean} True if the string is a valid URL, false otherwise.
 */
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


/**
 * Enforces a specific file extension on a given filename.
 *
 * @param {string} fileName - The name of the file. Can include or exclude an existing extension.
 * @param {string} desiredExtension - The target extension to enforce (e.g. ".csv", ".json", with a leading dot).
 * @returns {string} - The filename with the enforced extension.
 */
/**
 * Ensures a file name ends with the specified extension.
 * Strips any existing extension and appends the desired one.
 *
 * @param {String} fileName - The original file name (e.g., "report.txt").
 * @param {String} desiredExtension - The extension to enforce (e.g., "csv" or ".csv").
 * @returns {String} The updated file name with the enforced extension.
 */
export function enforceSpecificExtension(fileName, desiredExtension) {
  // Normalize the desired extension by removing leading dot if present
  if (desiredExtension.charAt(0) === ".") {
    desiredExtension = desiredExtension.slice(1);
  }

  // Remove the existing extension from the filename if present
  let baseFileName;
  if (fileName.includes(".")) {
    baseFileName = fileName.substring(0, fileName.lastIndexOf("."));
  } else {
    baseFileName = fileName;
  }

  // Return the filename with the enforced extension
  return baseFileName + "." + desiredExtension;
}




// A function that will create a download link for the csv file
/**
 * Creates a hidden HTML anchor element for downloading a CSV file.
 * Ensures the filename ends with ".csv" and embeds the file content as a Blob.
 *
 * @param {String} csv - The CSV content to be downloaded.
 * @param {String|null} filename - Desired filename; defaults to "JSONGrapherRecord.csv" if null.
 * @returns {HTMLAnchorElement} A hidden anchor element configured for CSV download.
 */
export function createDownloadCSVLink(csv, filename) {
  if (filename === null) {
    filename = "JSONGrapherRecord.csv";
  }

  filename = enforceSpecificExtension(filename, "csv");

  // CSV file
  const csvFile = new Blob([csv], { type: "text/csv" });

  // Download link
  const downloadLink = document.createElement("a");
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
/**
 * Creates a hidden HTML anchor element for downloading a JSON file.
 * Ensures the filename ends with ".json" and embeds the content as a formatted JSON Blob.
 *
 * @param {Object} json - The JSON object to be downloaded.
 * @param {String|null} filename - Desired filename; defaults to "JSONGrapherRecord.json" if null.
 * @returns {HTMLAnchorElement} A hidden anchor element configured for JSON download.
 */
export function createDownloadJSONLink(json, filename) {
  if (filename === null) {
    filename = "JSONGrapherRecord.json";
  }

  filename = enforceSpecificExtension(filename, "json");

  // JSON file
  const jsonFile = new Blob([JSON.stringify(json, null, 4)], {
    type: "application/json",
  });

  // Download link
  const downloadLink = document.createElement("a");
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
/**
 * Converts a JSON object into a URL-encoded string for embedding in a query parameter.
 * Currently uses a hardcoded base URL and applies `encodeURIComponent` to the JSON string.
 * Compression (e.g., Bzip2) is noted but not implemented due to import limitations.
 *
 * @param {Object} json - The JSON object to encode.
 * @returns {String} A URL string with the encoded JSON embedded as a query parameter.
 */
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
/**
 * Creates a URL string for copying or sharing, embedding a JSON payload as a query parameter.
 * Uses a hardcoded base URL and applies `encodeURIComponent` to the input string.
 * Note: Assumes the input is already a JSON string, not a raw object.
 *
 * @param {String} jsonURL - A JSON string to embed in the URL.
 * @returns {String} A complete URL with the encoded JSON string.
 */
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

// Changes the Github link to a raw link to avoid CORB issues
// TODO: currently we only support javascript from github. In the future, cross-domain / cross-origin simulate functions will be supported by SRI hash. https://www.w3schools.com/Tags/att_script_crossorigin.asp https://www.w3schools.com/Tags/att_script_integrity.asp with the SRI hash provided within the simulate object by a field in the JSON record named "SRI" or 'integrity"
/**
 * Normalizes URLs from known platforms to ensure direct access to raw content.
 * Specifically handles GitHub and Dropbox links by rewriting them to raw-access formats.
 *
 * @param {String} url - The original URL to parse and normalize.
 * @returns {String} The normalized URL suitable for direct content access.
 */
export function parseUrl(url) {
  const urlArr = url.split("/");

  // GitHub substitution
  if (urlArr[2] === "github.com") {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/")
      .replace("/tree/", "/")
      .replace("www.", "");
  }

  // Dropbox substitution — ensure dl=1 for direct download
  if (urlArr[2].includes("dropbox.com")) {
    return url.replace("www.dropbox.com", "dl.dropboxusercontent.com")
              .replace("dl=0", "dl=1")
              .replace("dl=1", "dl=1")  // keeps it unchanged if already correct
              .replace("raw=1", "dl=1");
  }

  return url;
}



//This is a helper function that takes in a button and a link
// and makes it so that the link is opened when a person clicks a button
// this can also be used to initiate downloads if the link is to a file.
/**
 * Attaches a click event to a button that triggers a hidden link element.
 * The link is temporarily added to the DOM, clicked, and then removed.
 *
 * @param {HTMLButtonElement} button - The button element to bind the click event to.
 * @param {HTMLAnchorElement} link - The anchor element to trigger on click.
 * @returns {HTMLButtonElement} The original button element with the event listener attached.
 */
export function addOpeningURLonButtonClick(button, link) {
  // Adding an event listener to the button for when clicking occurs
  button.addEventListener("click", () => {
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  return button;
}

// Helper function that opens a prepared <a> element in a new window via button click
/**
 * Attaches a click event to a button that opens a link in a new browser tab.
 * Applies best practices for security via `rel="noopener noreferrer"`.
 *
 * @param {String} buttonId - The ID of the button element to bind the event to.
 * @param {HTMLAnchorElement} downloadLink - The anchor element to open in a new tab.
 */
export function addNewWindowLinkToButton(buttonId, downloadLink) {
  const button = document.getElementById(buttonId);
  // Ensure it opens in a new tab and applies best practices
  downloadLink.target = "_blank";
  downloadLink.rel = "noopener noreferrer";
  addOpeningURLonButtonClick(button, downloadLink);
}

/**
 * Attaches a click event to a button that triggers a file download.
 * The downloadLink must be an anchor element with a valid href and optional filename.
 *
 * @param {String} buttonId - The ID of the button element to bind the event to.
 * @param {HTMLAnchorElement} downloadLink - The anchor element configured for download.
 * @param {String} [filename] - Optional filename to override the link's default.
 */
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