      import { jsonifyData, findFileType, createCSV, getFileName, readFileAsText } from './fileUtils.js'; 
      import {initializeUniversalSchemas, getSchemaType, mergeFigDictWithTemplate, getSchemaLocation} from './schemaUtils.js'
      import {getUnitFromLabel, removeUnitFromLabel, replaceSuperscripts} from './unitUtils.js'

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
      let globalData = null;
      let plotlyTemplate = null;
      let schema = null;
      let recentFileName = null;
      let url = window.location.href; // Get the current page URL         
      let params = new URLSearchParams(new URL(url).search);
      let urlParamsString = params.get("fromUrl"); //default ends up as null.
      let urlReceived = "" //Start as an empty string. Will populate this later from the user's input or from the urlParamsString


      // Initializing the AJV validator
      const ajv = new Ajv();
      const errorDiv = document.getElementById("errorDiv");
      const messagesToUserDiv = document.getElementById("messagesToUserDiv");
      // Initiating the UUC converter
      const convert = new Convert();

      // A function that clears the data from global variables and removes the error text and plotly chart
      export function clearData() {
        globalData = null;
        urlParamsString = null; //empty this global variable.
        urlReceived = null; //empty this global variable.
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

      // Checking if the dataSet has simulation
      function checkSimulate(dataSet) {
        if (dataSet.simulate) {
          return true;
        }
        return false;
      }

      // Get raw content of github file from url
      async function getRawContent(url) {
        return new Promise(async (resolve, reject) => {
          try {
            const res = await fetch(url);
            const data = await res.text();
            resolve(data);
          } catch (err) {
            reject(err);
          }
        });
      }

      //  a function that gets the simulate script from an external file by url
      /**
       * A function that gets the simulate script from an external file by URL,
       * runs the simulate function, and resolves the output.
       */
      async function getAndRunSimulateScript(dataSet, jsonified, index) {
          return new Promise(async (resolve, reject) => {
        try {
            // Create a script element
            const loadScript = document.createElement("script");

            // Debug the URL being parsed and fetched
            const scriptUrl = parseUrl(dataSet.simulate.model);

            // Get the raw content from the specified URL
            const data = await getRawContent(scriptUrl);

            // Attach the content to the script element
            loadScript.textContent = data;

            // Add the script to the document head
            document.getElementsByTagName("head")[0].appendChild(loadScript);

            // Debug if simulate function is available globally
            if (typeof simulate !== "function") {
                console.error("Error: simulate function is not defined!");
                throw new Error("simulate function is not defined");
            }

            // Execute the simulate function with the dataset
            const simulatedData = await simulate(dataSet);

            // Check if simulatedData is an array
            if (Array.isArray(simulatedData)) {
                // Log an error message for arrays
                console.log("Simulate function failed, simulate function log:", JSON.stringify(simulatedData));
            } else {
                //Uncomment to Log the simulated data for non-array JSON types
                //console.log("Simulated Data:", JSON.stringify(simulatedData));
            }            

            // Resolve the Promise with the simulated data
            resolve(simulatedData);
        } catch (err) {
            // Log the error details
            console.error("Error occurred in getAndRunSimulateScript:", err);
            reject({ status: "error", error: "Error: " + err });
        }

        });
      }
     
      // Check the units of the simulated data compared to the json record layout field and convert them if needed
      function maybeConvertSimulatedDataUnits(jsonified, simulatedData, index) {
        return new Promise((resolve, reject) => {
          try {
            // Javascript doesn't have deep clones so we use the JSON solution
            // source: https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
            let _simulatedData = JSON.parse(JSON.stringify(simulatedData));
            const desiredXUnit = getUnitFromLabel(jsonified.layout.xaxis.title.text);
            const desiredYUnit = getUnitFromLabel(jsonified.layout.yaxis.title.text);
            const simulatedXUnit = getUnitFromLabel(simulatedData.data.x_label);
            const simulatedYUnit = getUnitFromLabel(simulatedData.data.y_label);

            if (desiredXUnit !== simulatedXUnit) {
              const xConvertFactor = convert.fullConversion(
                simulatedXUnit,
                desiredXUnit
              );
              const convertedXArray = _simulatedData.data.x.map((x) => {
                if (xConvertFactor.status == 0) {
                  return parseFloat(x) * xConvertFactor.output.num;
                } else {
                  xConvertFactor.messages.forEach((message) => {
                    errorDiv.innerText += message.message + "\n";
                  });
                }
              });
              _simulatedData.data.x = convertedXArray;
              _simulatedData.data.x_label =
                removeUnitFromLabel(_simulatedData.data.x_label) +
                "(" +
                desiredXUnit +
                ")";
            }

            if (desiredYUnit !== simulatedYUnit) {
              const yConvertFactor = convert.fullConversion(
                simulatedYUnit,
                desiredYUnit
              );
              const convertedYArray = _simulatedData.data.y.map((y) => {
                if (yConvertFactor.status == 0) {
                  return parseFloat(y) * yConvertFactor.output.num;
                } else {
                  yConvertFactor.messages.forEach((message) => {
                    errorDiv.innerText += message.message + "\n";
                  });
                }
              });
              _simulatedData.data.y = convertedYArray;
              _simulatedData.data.y_label =
                removeUnitFromLabel(_simulatedData.data.y_label) +
                "(" +
                desiredYUnit +
                ")";
            }

            resolve(_simulatedData);
          } catch (err) {
            reject({ status: "error", error: "Error: " + err });
          }
        });
      }

      // Gets the simulation data and adds it to the jsonified object
      function mergeSimulationData(simulationResult, jsonified, index) {
        return new Promise((resolve, reject) => {
          try {
            if(!jsonified.layout.xaxis.title.text){ //Take the label from the simulation if there isn't one already.
              jsonified.layout.xaxis.title.text = simulationResult.data.x_label;
            }
            if(!jsonified.layout.yaxis.title.text){ //Take the label from the simulation if there isn't one already.
              jsonified.layout.yaxis.title.text = simulationResult.data.y_label;
            }
            jsonified.data[index].x = simulationResult.data.x;
            jsonified.data[index].y = simulationResult.data.y;
            resolve(jsonified);
          } catch (err) {
            reject({ status: "error", error: "Error: " + err });
          }
        });
      }

      async function simulateByIndexAndPopulateFigDict(_jsonified, index) {
        const dataSet = _jsonified.data[index]; // Retrieve dataSet using the provided index
        if (!dataSet) {
          throw new Error(`No dataSet found at index ${index}`);
        }
        const simulatedData = await getAndRunSimulateScript(dataSet, _jsonified, index);         
        const convertSimulatedDataUnits = await maybeConvertSimulatedDataUnits(_jsonified, simulatedData, index);
        // This function call populates the correct data series in _jsonified.
        const simulatedJsonified = await mergeSimulationData(convertSimulatedDataUnits, _jsonified, index); 
        return {_jsonified, simulatedJsonified}

      }

      // A function that visualizes the data with plotly
      function plot_with_plotly(figDict) {
        let plotStyle = { layout_style: "", trace_styles_collection: "" };
          if (JSON.stringify(plotStyle) === JSON.stringify({ layout_style: "", trace_styles_collection: "" })) {
              plotStyle = figDict.plot_style ?? { layout_style: "", trace_styles_collection: "" };
          }

          let copyForPlotly = JSON.parse(JSON.stringify(figDict)); // Plotly mutates the input, and we also do when applying plot style.      
          //offset2D and arrange2dTo3d must be executed after making the copy, if requested. The other implicit functions have already been called.
          copyForPlotly = executeImplicitDataSeriesOperations(copyForPlotly, false, false, false, true, true);
          // Parse the plot style
          plotStyle = parsePlotStyle(plotStyle);
          // Apply the plot style
          copyForPlotly = applyPlotStyleToPlotlyDict(copyForPlotly, plotStyle);

          // Clean out the fields to make a Plotly figDict
          copyForPlotly = cleanJsonFigDict(copyForPlotly, ['simulate', 'custom_units_chevrons', 'equation', 'trace_style', '3d_axes', 'bubble', 'superscripts', 'nested_comments', 'extraInformation']);          

          // Replace superscripts in some fields for Plotly
          if (copyForPlotly.layout.scene) {
            copyForPlotly.layout.scene.yaxis.title.text = replaceSuperscripts(copyForPlotly.layout.scene.yaxis.title?.text ?? "");
            copyForPlotly.layout.scene.xaxis.title.text = replaceSuperscripts(copyForPlotly.layout.scene.xaxis.title?.text ?? "");
          } else {
            copyForPlotly.layout.yaxis.title.text = replaceSuperscripts(copyForPlotly.layout.yaxis.title?.text ?? "");
            copyForPlotly.layout.xaxis.title.text = replaceSuperscripts(copyForPlotly.layout.xaxis.title?.text ?? "");
          }
          // Ensure Plotly is available before calling newPlot
          if (typeof Plotly !== "undefined") {
              Plotly.newPlot("plotlyDiv", copyForPlotly.data, copyForPlotly.layout);
          } else {
              console.error("Plotly is not loaded.");
          }
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
      //As of 6/15/2025, this file only contains data from the most recently uploaded dataset.
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
      //As of 6/15/2025, this file only contains data from the most recently uploaded dataset.
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
      function appendDownloadButtons(jsonified, filename) {
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
          "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Download Last Data Set As:"; //&nbsp; is HTML code to add a space.
        // Add download JSON button
        buttonsContainer.appendChild(downloadJSONButton);
        // Add download CSV button
        buttonsContainer.appendChild(downloadCSVButton);
        // Add download URL button, but only if load from url was used.
        if (urlReceived){  //use "if urlReceived" because it can be null or "" and this will catch both cases.
          buttonsContainer.appendChild(downloadURLButton);
        }
      }

      // Convert the received dataset units to the first dataset units
      function convertUnits(jsonified, globalData) {
        return new Promise((resolve, reject) => {
          try {
            jsonified.data.forEach((dataSet) => {
              const newXUnit = getUnitFromLabel(jsonified.layout.xaxis.title.text);
              const newYUnit = getUnitFromLabel(jsonified.layout.yaxis.title.text);
              if (globalData.unit.x !== newXUnit) {
                const xConvertFactor = convert.fullConversion(
                  newXUnit,
                  globalData.unit.x
                );
                dataSet.x = dataSet.x.map((x) => {
                  if (xConvertFactor.status == 0) {
                    return parseFloat(x) * xConvertFactor.output.num;
                  } else {
                    xConvertFactor.messages.forEach((message) => {
                      errorDiv.innerText += message.message + "\n";
                    });
                  }
                });
              }

              if (globalData.unit.y !== newYUnit) {
                const yConvertFactor = convert.fullConversion(
                  newYUnit,
                  globalData.unit.y
                );
                dataSet.y = dataSet.y.map((y) => {
                  if (yConvertFactor.status == 0) {
                    return parseFloat(y) * yConvertFactor.output.num;
                  } else {
                    yConvertFactor.messages.forEach((message) => {
                      errorDiv.innerText += message.message + "\n";
                    });
                  }
                });
              }
            });
            resolve(jsonified);
          } catch (err) {
            reject(err);
          }
        });
      }

      async function loadFromUrlParams(urlInput){
        if (isValidUrl(urlInput)){ 
          const url = parseUrl(urlInput);
          urlReceived = url //This line is populating a global variable. 
          loadAndPlotData(url, "url");
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
          loadFromUrlParams(urlParamsString);
        });
      };
      // STEP 0: Prepare the 'universal' schemas occurs inside initializeJSONGrapher
      initializeUniversalSchemas()
        .then((resp) => {
          const toggleSection1 = document.getElementById("toggleSection1"); //get toggle section so actions can hide it.
          const toggleSection2 = document.getElementById("toggleSection2"); //get toggle section so actions can hide it.         
          const toRevealSection = document.getElementById("toReveal"); //get toReveal section so actions can reveal
          // Assign variables to the two universal schemas.
          schema = resp[0];
          plotlyTemplate = resp[1];
           // STEP 1: User selects a file from computer or drops a file on the browser
           // Checks if the browser supports the File API
           // User selects a file or drags/drops one
          if (window.FileList && window.File) {
            // Event that fires when the user selects a file from the computer from the choose file button
            const fileSelector = document.getElementById("file-selector");
            if (fileSelector) {
              fileSelector.addEventListener("change", (event) => {
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
                loadAndPlotData(event, "change");
              });
            }
            // Event listener for drag and drop
            const dropArea = document.getElementById("file-drop-area");
            if (dropArea) {
              dropArea.addEventListener("dragover", (event) => {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              });

              dropArea.addEventListener("drop", (event) => {
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
                loadAndPlotData(event, "drop");
              });
            }
          }

          // User inputs URL via a prompt instead of selecting/dropping a file
          const loadFromUrlButton = document.getElementById("load-from-url");
          if (loadFromUrlButton) {
            loadFromUrlButton.addEventListener("click", () => {
              const urlInput = window.prompt("Enter the URL with a desired .json File:");
              if (isValidUrl(urlInput)){ 
                const url = parseUrl(urlInput);
                urlReceived = url //This line is populating a global variable. 
                toggleSection1.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                toggleSection2.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
                toRevealSection.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
                loadAndPlotData(url, "url");
              } else {
                console.error("No URL entered.");
                errorDiv.innerText += "Error: Please enter a valid URL.\n";
              }
            });
          }
        })
        .catch((e) => {
          console.log(e);
          errorDiv.innerText += "Error fetching json-schema files...\n";
        });


      // This function is called when the user drops a file or uploads it via the input button or drag and drop
      async function loadAndPlotData(event, eventType) {
        let loadingMessage = "Loading and plotting data, including evaluating any equations and running any simulations.";
        errorDiv.innerText += loadingMessage; //We want to use a variable so we can remove the loading message, later.
        let fileType; //Initializing filetype.
        let jsonified; // initializing
        let dataLoaded // initializing
        // Checks if the file is dropped and if it is uploaded via the input button and gets the file
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
            return;
          }
          document.getElementById("file-selector").value = ""; // resetting to blank.
          fileType = findFileType(file.name); //initialized near beginning of loadAndPlotData
          recentFileName = getFileName(file.name);//This is a global variable.
        }
        // STEP 1 (Variation B): User Providees a URL.
        //Should actually also also csv, probably.
        if (eventType === "url"){
          jsonified = await loadJsonFromUrl(event);//the event will have the url in it.
          fileType = "json";
          const toggleSection1 = document.getElementById("toggleSection2");
          const toggleSection2 = document.getElementById("toggleSection2");
          const toRevealSection = document.getElementById("toReveal"); //get toReveal section so actions can reveal
          toggleSection1.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
          toggleSection2.style.display = "none"; // "none" to hide and "block" to show. Those are built in keywords.
          toRevealSection.style.display = "block"; // "none" to hide and "block" to show. Those are built in keywords.
        }  
        // STEP 2 (VARIATION A): If the file is a .csv or .tsv file it is converted to a .json file
        if (eventType === "change" || eventType === "drop") {
          try {
            // try to parse the file as json
            jsonified = jsonifyData(fileType, dataLoaded, plotlyTemplate);
          } catch (e) {
            errorDiv.innerText += `Error: Data record could not be converted to JSON. If it is in a zipfile, unzip before uploading. Error Details: ${e.message} \n`;
          }
        }
        // Checking if the uploaded data is valid against the schema
        // STEP 3: Check if the jsonified object is a valid JSON file against the schema
        let [schema_type, schema_template] = await getSchemaType(jsonified);

        if (Object.keys(schema_type).length === 0) {
          errorDiv.innerText +=
            "Schema check: There was no Schema specific to this DataType, or the schema was not compatible. The default scatter plot schema was used.\n";
          schema_type = schema;
        }

        // validate the json
        const validate = ajv.compile(schema_type);
        const valid = validate(jsonified);

        if (!valid) {
          // Console log an error if the data is not valid against the schema
          console.log("validate errors: ", JSON.stringify(validate.errors));
          // Display an error message if the data is not valid against the schema
          errorDiv.innerText += `Json file does not match the schema. ${JSON.stringify(
            validate.errors
          )}\n`;
          errorDiv.innerText += `Json file does not match the schema. ${JSON.stringify(
            validate.errors
          )}\n`;
        } else {
          let _jsonified = jsonified;
          if (Object.keys(schema_template).length !== 0) {
            _jsonified = mergeFigDictWithTemplate(jsonified, schema_template);
          }
          // If the data is valid against the schema, then we can proceed to the next step
          // if necessary create download button with json
          // STEP 4 and STEP 5 is done in the prepareForPlotting function
          const res = await prepareForPlotting(_jsonified, recentFileName); //recentFileName is a global variable. 
          // STEP 6: Provide file with converted units for download as JSON and CSV by buttons
          appendDownloadButtons(res.downloadData, res.fileName);
          // STEP 7: The create a plotly JSON, clean it, and render it on the browser
          plot_with_plotly(res.data);
          //Replace existing "Data Plotted" message if it is already there, to avoid duplicating it.
          if (!messagesToUserDiv.innerText){ //Currently, we assume the below message is present or not present. If we later put additional messagesToUser, we may need to add more logic.
            const dataPlottedMessage = "\u2003\u2003\u2003\u2003\u2003\u2003 Data plotted! Add more data or click 'Clear Data' to start a new graph! \u2003\u2003\u2003\u2003\u2003\u2003"
            messagesToUserDiv.innerText += dataPlottedMessage
          }
          }
        errorDiv.innerText = errorDiv.innerText.replace(loadingMessage,"");
      }

      // This a function that plots the data on the graph
      //the input, jsonified, is the new figDict. globalData is the 'global' figDict.
      async function prepareForPlotting(jsonified, filename) {
        return new Promise(async (resolve, reject) => {
          try {
            // Checks if the Jsonified is the first file uploaded
            if (!globalData) {
              let _jsonified = JSON.parse(JSON.stringify(jsonified)); //make a local copy
              globalData = copyJson(_jsonified); //populate global figDict since this is the first record received.            
              let simulatedJsonified; //just initializing
              // Get the unit from the label
              const xUnit = getUnitFromLabel(_jsonified.layout.xaxis.title.text);
              const yUnit = getUnitFromLabel(_jsonified.layout.yaxis.title.text);

              // Adding the extracted units to _jsonified
              _jsonified.unit = {
                x: xUnit,
                y: yUnit,
              };
              // STEP 4: Check if the object has a dataSet that has a simulate key in it, and runs the simulate function based on the value provided in the key model
              // Iterate through the dataset and check if there is a simulation to run for each dataset
              // On 6/4/25, a call to the function executeImplicitDataSeriesOperations was added here to evaluate equations.
              // In the longterm, the simulation logic should be moved into executeImplicitDataSeriesOperations
              _jsonified = executeImplicitDataSeriesOperations(_jsonified); //_jsonified is a figDict.
              //This loop iterates across data_series dictionary objects objects to see if any require simulation.
              //TODO: this loop's commands should be moved into executeImplicitDataSeriesOperations. There are two loops like this in index.html
              for (const dataSet of _jsonified.data) { 
                const index = _jsonified.data.indexOf(dataSet);
                const hasSimulate = checkSimulate(dataSet);
                if (hasSimulate) {
                  //Below, the "result" has named fields inside, which we will extract.
                  const result = await simulateByIndexAndPopulateFigDict(_jsonified, index);
                  simulatedJsonified = result.simulatedJsonified
                  _jsonified = result._jsonified;

                }
              }
              // There is  no STEP 5 for first record, because first record provided by the user is used to define the units of GlobalData.
              //After going through all datasets for implicit dataseries updates, we set globalData equal to the updated _jsonified, since this is the first record.
              globalData = _jsonified
              //Finally, return the objects that have been prepared for plotting and downloading.
              resolve({
                data: globalData,
                downloadData: _jsonified,
                fileName: recentFileName, //recentFileName is a global variable.
              });
            } else {
              // If the Jsonified is not the first file uploaded, then we can proceed to the next step
              let fieldsMatch=true; //initialize this variable as true, and set it to false if any fields that need to match do not.
              //Check if the datatype fields match. Should actually be doing the hierarchical check with the underscores.
              if (globalData.datatype !== jsonified.datatype){
                fieldsMatch=false;
                errorDiv.innerText += "The added record's datatype is different. Stopping merging. The two values are: " + String(globalData.datatype) + " " + +String(jsonified.datatype) +   "\n";
              }
              //Check if the xaxis titles are the same after removing the units area. Ideally, should check if the units are convertable.
              if (removeUnitFromLabel(globalData.layout.xaxis.title.text) !==
                  removeUnitFromLabel(jsonified.layout.xaxis.title.text)){
                fieldsMatch=false;
                errorDiv.innerText += "The added record's xaxis label text is different. Stopping merging. The two values are: " + removeUnitFromLabel(globalData.layout.xaxis.title.text) + " " +removeUnitFromLabel(jsonified.layout.xaxis.title.text) +   "\n";
              }
              //Check if the yaxis titles are the same after removing the units area. Ideally, should check if the units are convertable.
              if (removeUnitFromLabel(globalData.layout.yaxis.title.text) !==
                  removeUnitFromLabel(jsonified.layout.yaxis.title.text)){
                fieldsMatch=false;
                errorDiv.innerText += "The added record's yaxis label text is different. Stopping merging. The two values are: " + removeUnitFromLabel(globalData.layout.yaxis.title.text) + " " +removeUnitFromLabel(jsonified.layout.yaxis.title.text) +   "\n";
              }
              if(fieldsMatch)
              {
                // create a deep copy of jsonified to avoid mutating the original jsonified
                let _jsonified = JSON.parse(JSON.stringify(jsonified));
                let simulatedJsonified; //just initializing
                let convertedJsonified; //just initializing

                // STEP 4: Check if the object has a dataSet that has a simulate key in it, and runs the simulate function based on the value provided in the key model
                // Iterate through the dataset and check if there is a simulation to run for each dataset
                // On 6/4/25, a call to the function executeImplicitDataSeriesOperations was added here to evaluate equations.
                // In the longterm, the simulation logic should be moved into executeImplicitDataSeriesOperations
                _jsonified = executeImplicitDataSeriesOperations(_jsonified); //globalData is a figDict.
                //This loop iterates across data_series dictionary objects objects to see if any require simulation.
                //TODO: this loop's commands should be moved into executeImplicitDataSeriesOperations. There are two loops like this in index.html
                for (const dataSet of _jsonified.data) {
                  const index = _jsonified.data.indexOf(dataSet);
                  const hasSimulate = checkSimulate(dataSet);
                  if (hasSimulate) {
                    //Below, the "result" has named fields inside, which we will extract.
                    const result = await simulateByIndexAndPopulateFigDict(_jsonified, index);
                    simulatedJsonified = result.simulatedJsonified
                    _jsonified = result._jsonified;                
                    } 
                  }
                // STEP 5: Check if the units in the _jsonified are the same as the units in the overall record and convert them if needed.
                _jsonified = await convertUnits( _jsonified, globalData);

                // merge the new data with the globalData so everything can be plotted together.
                globalData.data = [
                  ...globalData.data,
                  ..._jsonified.data,
                ];
                //Finally, return the objects that have been prepared for plotting an downloading.
                resolve({
                  data: globalData,
                  downloadData: _jsonified,
                  fileName: recentFileName,
                });
              } else {
                //clearData(); //Should not clear data when chart or axis titles do not match, just should not plot the new data.
                errorDiv.innerText += `Added data not plotted. The records were not compatible for merging. You may continue trying to add data sets, or may click "Clear Data" to start a new graph. These error messages will be automatically cleared after 10 seconds. \n`;
                setTimeout(() => { errorDiv.innerText = '';  }, 10000); // Clears the text after 10 seconds
              }
            }
          } catch (err) {
            reject(err);
            console.log("Error from plotData: ", err);
          }
        });
      }

window.clearData = clearData;