import {getUnitFromLabel, removeUnitFromLabel, replaceSuperscripts} from './unitUtils.js'

      // Checking if the dataSet has simulation
/**
 * Checks whether a dataset contains a `simulate` key.
 *
 * @param {Object} dataSet - The dataset to inspect.
 * @returns {Boolean} True if `simulate` is present, false otherwise.
 */
export function checkSimulate(dataSet) {
  if (dataSet.simulate) {
    return true;
  }
  return false;
}


      // Get raw content of github file from url
/**
 * Get raw content of GitHub file from URL.
 *
 * @param {String} url - The URL to fetch content from.
 * @returns {Promise<String>} A promise that resolves with the raw text content.
 */
export async function getRawContent(url) {
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
/**
 * Loads and executes a remote simulation script specified in the dataset.
 * Injects the script into the document head, verifies the global `simulate` function,
 * and runs it with the provided dataset. Returns the result or logs errors.
 *
 * @param {Object} dataSet - The dataset containing the simulation model URL.
 * @param {Object} jsonified - The full figure dictionary (not used directly here).
 * @param {Number} index - The index of the dataset (not used directly here).
 * @returns {Promise<Object>} A promise that resolves with the simulated data or rejects with error info.
 */
export async function getAndRunSimulateScript(dataSet, jsonified, index) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a script element
      const loadSimulateScript = document.createElement("script");

      // Debug the URL being parsed and fetched
      const scriptUrl = parseUrl(dataSet.simulate.model);

      // Get the raw content from the specified URL
      const data = await getRawContent(scriptUrl);

      // Attach the content to the script element
      loadSimulateScript.textContent = data;

      // Add the script to the document head
      document.getElementsByTagName("head")[0].appendChild(loadSimulateScript);

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
        // Uncomment to Log the simulated data for non-array JSON types
        // console.log("Simulated Data:", JSON.stringify(simulatedData));
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
/**
 * Converts simulated data units to match the desired units from the figure layout.
 * Performs deep cloning to avoid mutation, applies conversion factors, and updates labels.
 *
 * @param {Object} jsonified - The figure dictionary containing desired axis units.
 * @param {Object} simulatedData - The simulated data object to convert.
 * @param {Number} index - The index of the dataset (not used directly here).
 * @returns {Promise<Object>} A promise that resolves with the unit-converted simulated data.
 */
export function maybeConvertSimulatedDataUnits(jsonified, simulatedData, index) {
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
              errorDiv.innerText += message.message + " (error message from UUC fullConversion, returned by maybeConvertSimulatedDataUnits)\n";
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
              errorDiv.innerText += message.message + " (error message from UUC fullConversion, returned by in maybeConvertSimulatedDataUnits)\n";
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
/**
 * Merges simulation results into a figure dictionary at the specified index.
 * Uses simulation labels if axis titles are missing, and replaces x/y data arrays.
 *
 * @param {Object} simulationResult - The result object containing simulated data.
 * @param {Object} jsonified - The figure dictionary to update.
 * @param {Number} index - The index of the dataset to merge into.
 * @returns {Promise<Object>} A promise that resolves with the updated figure dictionary.
 */
export function mergeSimulationData(simulationResult, jsonified, index) {
  return new Promise((resolve, reject) => {
    try {
      if (!jsonified.layout.xaxis.title.text) { //Take the label from the simulation if there isn't one already.
        jsonified.layout.xaxis.title.text = simulationResult.data.x_label;
      }
      if (!jsonified.layout.yaxis.title.text) { //Take the label from the simulation if there isn't one already.
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


/**
 * Runs simulation for a specific dataset index and updates the figure dictionary.
 * Executes the simulation script, converts units if needed, and merges results into the original structure.
 *
 * @param {Object} _jsonified - The figure dictionary containing datasets.
 * @param {Number} index - The index of the dataset to simulate and update.
 * @returns {Promise<Object>} A promise that resolves with both the original and updated figure dictionaries.
 */
export async function simulateByIndexAndPopulateFigDict(_jsonified, index) {
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
