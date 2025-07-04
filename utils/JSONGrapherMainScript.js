      import { jsonifyData, findFileType, createCSV, getBaseFileName, readFileAsText } from './fileUtils.js'; 
      import {initializeUniversalSchemas, getSchemaType, mergeFigDictWithTemplate, getSchemaLocation, validateData} from './schemaUtils.js'
      import { loadJsonFromUrl, isValidUrl, parseUrl } from './linkUtils.js'; 
      import {mergeAndplotData, prepareForPlotting} from './plottingUtils.js'

      function copyJson(obj) { //for debugging.
        return JSON.parse(JSON.stringify(obj));
      }
      //JSONGrapher has the following steps, which will be commented in the MAIN BLOCK OF CODE of JSONGrapher:
      // STEP 0: Prepare the 'universal' schemas
      // STEP 1: User selects a file from computer or drops a file on the browser
      // STEP 2: If the file is a .csv or .tsv file it is converted to a .json file
      // STEP 3: Check if the jsonified object is a valid JSON file against the schema
      // STEP 4: Check if the object has a dataSet that has a simulate key in it, and runs the simulate function
      // STEP 5: Check if the units in the dataset are the same as the units in the previous object and convert them
      // STEP 6: Provide file with converted units for download as JSON and CSV by buttons
      // STEP 7: The plotly template is rendered on the browser


      // Global Variables
      let globalFigDict = null;
      let url = window.location.href; // Get the current page URL         
      let params = new URLSearchParams(new URL(url).search);
      let urlParamsString = params.get("fromUrl"); //default ends up as null.

      const errorDiv = document.getElementById("errorDiv");
      const messagesToUserDiv = document.getElementById("messagesToUserDiv");
      // Initiating the UUC converter
      const convert = new Convert();
      window.convert = convert //This is so simulateUtils can access convert. TODO: Find a better solution to provide access to convert for simulateUtils.

      // A function that clears the data from global variables and removes the error text and plotly chart
      export function clearData() {
        globalFigDict = null;
        urlParamsString = null; //empty this global variable.
        document.getElementById("errorDiv").innerHTML = "";
        document.getElementById("messagesToUserDiv").innerHTML = "";
        document.getElementById("downloadButtonsContainer").innerHTML = "";
        document.getElementById("file-selector").value = "";
        document.getElementById("load-from-url").value = "";
        document.getElementById("download").style.display = "none";
        const toggleSection1 = document.getElementById("toggleSection1"); //Now will reveal again.
        const toggleSection2 = document.getElementById("toggleSection2"); //Now will reveal again.
        const toRevealSection = document.getElementById("toReveal");   // Now will hide.
        toggleSection1.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
        toggleSection2.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
        toRevealSection.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
        Plotly.purge("plotlyDiv");
      }



      function createCopyURLButton(jsonURL) {
          // Generate the URL
          const urlString = createCopyUrlLink(jsonURL);
          
          // Create the button
          const copyButton = document.createElement("button");
          copyButton.innerText = "Copy URL";
          
          // Function to copy text using a fallback method if navigator way doesn't work.
          function fallbackCopyText(text) {
              const textArea = document.createElement("textarea");
              textArea.value = text;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              document.body.removeChild(textArea);
          }

          // Add click event listener to copy to clipboard
          copyButton.addEventListener("click", () => {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(urlString).then(() => {
                      alert("URL copied to clipboard!\nNow you can paste it elsewhere!\n\n" + urlString);
                  }).catch(err => {
                      console.error("Error copying to clipboard:", err);
                  });
              } else {
                  fallbackCopyText(urlString);
                  alert("URL copied to clipboard!\nNow you can paste it elsewhere!\n\n" + urlString);
              }
          });
          return copyButton;
      }

      // A function that will create a download button for the csv file
      function createDownloadCSVButton(csv, filename) {
        // Creating a download link for the csv file
        const downloadLink = createDownloadCSVLink(csv.csv, filename);
        // Creating the button
        let downloadButton = document.createElement("button");
        // Adding text to the button
        downloadButton.innerText = "CSV";
        downloadButton = addOpeningURLonButtonClick(downloadButton, downloadLink);
        return downloadButton;
      }

      //A function that will create a download button for the JSON file
      // For the first argument, this takes in a json object (a "javascript object", not a string)
      // For the second argument, the filename field is a string.
      function createDownloadJSONButton(json, filename) {
        // Creating a download link for the JSON file
        const downloadLink = createDownloadJSONLink(json, filename);
        // Creating the button
        let downloadButton = document.createElement("button");
        // Adding text to the button
        downloadButton.innerText = "JSON";
        // Adding an event listener to the button
        downloadButton = addOpeningURLonButtonClick(downloadButton, downloadLink);
        return downloadButton;
      }

      // A function that will append a download button to the page
      // The button will be appended after the element with the id beforeElId
      function appendDownloadButtons(jsonified, filename, urlReceived) {
        // Parse csv from jsonified
        const csvContent = createCSV(jsonified);
        // Create download csv button
        const downloadCSVButton = createDownloadCSVButton(csvContent, filename);
        // Create Download JSON button
        const downloadJSONButton = createDownloadJSONButton(jsonified, filename);
        // Create Download URL button (technically a copy button)
        // Only show this button if someone has loaded from url.
        let downloadURLButton = null // initializing.
        if (urlReceived){  //use "if urlReceived" because it can be null or "" and this will catch both cases.
          downloadURLButton = createCopyURLButton(urlReceived);
          // Below was when I tried to put the whole JSON record into the URL, but that was quickly too long for webservers and browsers.
          //const downloadURLButton = createCopyURLButton(jsonified);
        };
        
        const buttonsContainer = document.getElementById(
          "downloadButtonsContainer"
        );
        // insert a download button with downloadLink after downloadJSON
        // Clear the container
        buttonsContainer.innerHTML =
          "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Download Graph Record As:"; //&nbsp; is HTML code to add a space.
        // Add download JSON button
        buttonsContainer.appendChild(downloadJSONButton);
        // Add download CSV button
        buttonsContainer.appendChild(downloadCSVButton);
        // Add download URL button, but only if load from url was used.
        if (urlReceived){  //use "if urlReceived" because it can be null or "" and this will catch both cases.Could also be undefined.
          buttonsContainer.appendChild(downloadURLButton);
        }
      }


      async function loadFromUrlParams(urlInput, errorDiv){
        if (isValidUrl(urlInput)){ 
          const url = parseUrl(urlInput);
          let urlReceived
          [globalFigDict, urlReceived] = await loadMergeAndPlotData(globalFigDict, url, "url", errorDiv);
          // STEP 6: Provide file with converted units for download as JSON and CSV by buttons
          //should  make an if statement here to give newestFigDict with filename if only one record has been uploaded
          // and to otherwise give the full data with name like "mergedGraphRecord.json" for the filename.
          // urlReceived will be a blank string, "", or a null object, if the record is not from url.
          if (globalFigDict){appendDownloadButtons(globalFigDict, "mergedJSONGrapherRecord.json", urlReceived);}
        } else {
          console.error("No URL entered.");
          errorDiv.innerText += "Error: Please enter a valid URL.\n";
        }
      };
      ///############################ BELOW IS THE MAIN BLOCK OF CODE FOR JSON GRAPHER ##################################
      if (urlParamsString) {
        //This waiting of the DOM to be loaded line is because the "isValidURL" and other functions need to load from the modules.
        //After the main block of code is also moved to a module, perhaps this could be changed.
        //More likely, those functions should stay in this file, while the main function should be moved into a module.
        //That way, an external json can be called and downloaded even before the DOM is finished loading.
        document.addEventListener('DOMContentLoaded', () => {
          loadFromUrlParams(urlParamsString, errorDiv);
          //This function needs to toggle the reveal/hide blocks directly, since it is like an independent event listener.
          const toggleSection1 = document.getElementById("toggleSection2");
          const toggleSection2 = document.getElementById("toggleSection2");
          const toRevealSection = document.getElementById("toReveal"); //get toReveal section so actions can reveal
          toggleSection1.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
          toggleSection2.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
          toRevealSection.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
        });
      };
      
      //callbackForPlotting is a function that gets passed in.
      // When a new figDict is passed, in, the callBack does things like the merging and plotting, and returns the revised globalFigDict.
      async function startJSONGrapherWebGUIListenersWithCallBack(callbackForMergingAndPlotting, errorDiv) {
        try {
          const toggleSection1 = document.getElementById("toggleSection1"); //get toggle section so actions can hide it.
          const toggleSection2 = document.getElementById("toggleSection2"); //get toggle section so actions can hide it.         
          const toRevealSection = document.getElementById("toReveal"); //get toReveal section so actions can reveal

          // STEP 1: User selects a file from computer or drops a file on the browser
          // Checks if the browser supports the File API
          // User selects a file or drags/drops one
          if (window.FileList && window.File) {
            // Event that fires when the user selects a file from the computer from the choose file button
            const fileSelector = document.getElementById("file-selector");
            if (fileSelector) {
              fileSelector.addEventListener("change", async (event) => {
                const file = event.target.files[0]; //this is a local temporary variable.
                const fileName = file.name; //this is a local temporary variable
                if (
                  fileName !== "Example1_JSONGrapher.json" &&
                  fileName !== "Example2_JSONGrapher.json" &&
                  fileName !== "Example3_JSONGrapher.json"
                ){
                    toggleSection1.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                    toggleSection2.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                    toRevealSection.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
                };
                let urlReceived
                [globalFigDict, urlReceived] = await callbackForMergingAndPlotting(globalFigDict, event, "change", errorDiv);
                // STEP 6: Provide file with converted units for download as JSON and CSV by buttons
                //should  make an if statement here to give newestFigDict with filename if only one record has been uploaded
                // and to otherwise give the full data with name like "mergedGraphRecord.json" for the filename.
                // urlReceived will be a blank string, "", or a null object, if the record is not from url.
                if (globalFigDict){appendDownloadButtons(globalFigDict, "mergedJSONGrapherRecord.json", urlReceived);}                
              });
            }

            // Event listener for drag and drop
            const dropArea = document.getElementById("file-drop-area");
            if (dropArea) {
              dropArea.addEventListener("dragover", async (event) => {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              });

              dropArea.addEventListener("drop", async (event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0]; //this is a local temporary variable
                const fileName = file.name; //this is a local temporary variable
                if (
                  fileName !== "Example1_JSONGrapher.json" &&
                  fileName !== "Example2_JSONGrapher.json" &&
                  fileName !== "Example3_JSONGrapher.json"
                ){
                  toggleSection1.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                  toggleSection2.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                  toRevealSection.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
                };
                let urlReceived
                [globalFigDict, urlReceived] = await callbackForMergingAndPlotting(globalFigDict, event, "drop", errorDiv);
                // STEP 6: Provide file with converted units for download as JSON and CSV by buttons
                //should  make an if statement here to give newestFigDict with filename if only one record has been uploaded
                // and to otherwise give the full data with name like "mergedGraphRecord.json" for the filename.
                // urlReceived will be a blank string, "", or a null object, if the record is not from url.
                if (globalFigDict){appendDownloadButtons(globalFigDict, "mergedJSONGrapherRecord.json", urlReceived);}
              });
            }
          }

          // User inputs URL via a prompt instead of selecting/dropping a file
          const loadFromUrlButton = document.getElementById("load-from-url");
          if (loadFromUrlButton) {
            loadFromUrlButton.addEventListener("click", async () => {
              const urlInput = window.prompt("Enter the URL with a desired .json File:");
              if (isValidUrl(urlInput)){ 
                const url = parseUrl(urlInput);
                toggleSection1.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                toggleSection2.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                toRevealSection.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
                let urlReceived
                [globalFigDict, urlReceived] = await callbackForMergingAndPlotting(globalFigDict, url, "url", errorDiv);
                // STEP 6: Provide file with converted units for download as JSON and CSV by buttons
                //should  make an if statement here to give newestFigDict with filename if only one record has been uploaded
                // and to otherwise give the full data with name like "mergedGraphRecord.json" for the filename.
                // urlReceived will be a blank string, "", or a null object, if the record is not from url.
                if (globalFigDict){appendDownloadButtons(globalFigDict, "mergedJSONGrapherRecord.json", urlReceived);}
              } else {
                console.error("No URL entered.");
                errorDiv.innerText += "Error: Please enter a valid URL.\n";
              }
            });
          }
        } catch (e) {
          console.log("Error from setupJsonGrapher: ", e);
          errorDiv.innerText += "Error fetching json-schema files...\n";
        }
      }

      // Start the JSONGrapherWebGUI listeners and give them the loadAndPlotData function to use when they receive something.
      await startJSONGrapherWebGUIListenersWithCallBack(loadMergeAndPlotData, errorDiv);

      // This function is called when the user drops a file or uploads it via the input button or drag and drop
      // This function is also called when a url is provided, in which case the event is the url string and the eventType is "url".
      async function loadMergeAndPlotData(existingFigDict, event, eventType, errorDiv) {
        let loadingMessage = "Loading and plotting data, including evaluating any equations and running any simulations.";
        errorDiv.innerText += loadingMessage; //We want to use a variable so we can remove the loading message, later.
        //loadData Block
        let urlReceived = null; //initialize.
        //the "event" variable holds the url when a url is received.
        if (eventType==="url"){urlReceived=event};
        let { jsonified, recentFileName, fileType } = await loadData(event, eventType, errorDiv); // STEP 0, STEP 1, STEP 2
        //validateData Block
        let newFigDict = jsonified
        newFigDict = await validateData(newFigDict, errorDiv); // STEP 3
        //plotData Block, also merges the newFigDict into the existingFigDict
        const updatedFigDict = await mergeAndplotData(existingFigDict, newFigDict, recentFileName, messagesToUserDiv, errorDiv); // STEP 4-7
        errorDiv.innerText = errorDiv.innerText.replace(loadingMessage, "");
        return [updatedFigDict, urlReceived]
      }

      async function loadData(event, eventType, errorDiv) {
        let fileType; //Initializing filetype.
        let jsonified; // initializing
        let dataLoaded // initializing
        let recentFileName = null; 
        // STEP 0: Prepare the 'universal' schemas occurs inside initializeUniversalSchemas
        const [schema1json, schema2json] = await initializeUniversalSchemas();
        const schema = schema1json; //unused
        const plotlyTemplate = schema2json;

        // STEP 1 (Variation A): User selects a file from computer or drops a file on the browser
        //TODO: Variation A should probably be functionalized to take event, eventType and return jsonified
        if (eventType === "change" || eventType === "drop") {
          let file;
          if (eventType === "change") {
            file = event.target.files[0];
          } else if (eventType === "drop") {
            file = event.dataTransfer.files[0];
          }

          // Initialize the reader
          const reader = new FileReader();
          reader.fileName = file.name;

          // Read file contents asynchronously
          try {
            dataLoaded = await readFileAsText(file);
          } catch (error) {
            errorDiv.innerText += `Error: Failed to read file. ${error.message} \n`;
            return {};
          }
          document.getElementById("file-selector").value = ""; // resetting to blank.
          fileType = findFileType(file.name); //initialized near beginning of loadAndPlotData
          recentFileName = getBaseFileName(file.name);//This is a global variable.
        }

        // STEP 1 (Variation B): User Providees a URL.
        if (eventType === "url") {
          fileType = "json"; //Should update to support csv in future.
          jsonified = await loadJsonFromUrl(event); //the event will have the url in it.
        }

        // STEP 2 (If needed): If the file is a .csv or .tsv file it is converted to a .json file
        if (eventType === "change" || eventType === "drop") {
          try {
            // try to parse the file as json
            jsonified = jsonifyData(fileType, dataLoaded, plotlyTemplate);
          } catch (e) {
            errorDiv.innerText += `Error: Data record could not be converted to JSON. If it is in a zipfile, unzip before uploading. Error Details: ${e.message} \n`;
          }
        }

        return { jsonified, recentFileName, fileType };
      }


window.clearData = clearData;