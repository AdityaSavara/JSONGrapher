import {getUnitFromLabel, removeUnitFromLabel, replaceSuperscripts} from './unitUtils.js'
import {convertUnits} from './figDictUtils.js'
import {executeImplicitDataSeriesOperations} from './json_equationer/implicitUtils.js'
import { parsePlotStyle, applyPlotStyleToPlotlyDict } from './styleUtils.js';
import { cleanJsonFigDict } from './figDictUtils.js'; 

      function copyJson(obj) { //for deepcopy
        return JSON.parse(JSON.stringify(obj));
      }

      // If the data is valid against the schema, then we can proceed to the next step
      // if necessary create download button with json
      export async function plotData(globalFigDict, _jsonified, recentFileName, messagesToUserDiv, errorDiv) {
        // STEP 4 and STEP 5 is done in the prepareForPlotting function
        const { mergedFigDict, fileName, newestFigDict } = await prepareForPlotting(globalFigDict, _jsonified, recentFileName, errorDiv); // recentFileName is a global variable.
        if (mergedFigDict) {
          // STEP 7: Then create a plotly JSON, clean it, and render it on the browser
          plot_with_plotly(mergedFigDict);
          //Replace existing "Data Plotted" message if it is already there, to avoid duplicating it.
          if (!messagesToUserDiv.innerText) { //Currently, we assume the below message is present or not present. If we later put additional messagesToUser, we may need to add more logic.
            const dataPlottedMessage = "\u2003\u2003\u2003\u2003\u2003\u2003 Data plotted! Add more data or click 'Clear Data' to start a new graph! \u2003\u2003\u2003\u2003\u2003\u2003"
            messagesToUserDiv.innerText += dataPlottedMessage;
          }
          return mergedFigDict //This returns the mergedFigDict to use as globalFigDict.
        } else {
          console.log("Plotting skipped: incompatible data or merge failure.");
          return;
        }
      }

      // This a function that plots the data on the graph
      // the input, jsonified, is the new figDict. globalFigDict is the 'global' figDict.
      // if globalFigDict is null or otherwise false-like, and jsonified is not false-like,
      // then jsonified is treated as the first figDict and globalFigDict is made from it.
      export async function prepareForPlotting(globalFigDict, jsonified, recentFileName, errorDiv) {
        try {
          // Make a local copy of the incoming data to avoid mutating the original object
          let _jsonified = JSON.parse(JSON.stringify(jsonified));

          // STEP 4: Check if the object has a dataSet that has a simulate or equation key in it,
          // and runs the simulate function or does the equation evaluation based on the dictionary within.
          _jsonified = await executeImplicitDataSeriesOperations(_jsonified);

          // Checks if the Jsonified is the first file uploaded
          if (!globalFigDict) {
            // Get the unit from the label
            const xUnit = getUnitFromLabel(_jsonified.layout.xaxis.title.text);
            const yUnit = getUnitFromLabel(_jsonified.layout.yaxis.title.text);
            // Adding the extracted units to _jsonified
            _jsonified.unit = { x: xUnit, y: yUnit };
            // No STEP 5 for first record; it defines the units of globalFigDict.
            globalFigDict = _jsonified;

          } 
          else {
            let fieldsMatch = true; //initilize as true, will set false if the fields don't match.
            // Check compatibility of datatype
            if (globalFigDict.datatype !== jsonified.datatype) {
              fieldsMatch = false;
              errorDiv.innerText += "The added record's datatype is different. Stopping merging. The two values are: " +
                String(globalFigDict.datatype) + " " + String(jsonified.datatype) + "\n";
            }

            // Check compatibility of x-axis label (excluding units)
            if (removeUnitFromLabel(globalFigDict.layout.xaxis.title.text) !==
                removeUnitFromLabel(jsonified.layout.xaxis.title.text)) {
              fieldsMatch = false;
              errorDiv.innerText += "The added record's xaxis label text is different. Stopping merging. The two values are: " +
                removeUnitFromLabel(globalFigDict.layout.xaxis.title.text) + " " +
                removeUnitFromLabel(jsonified.layout.xaxis.title.text) + "\n";
            }

            // Check compatibility of y-axis label (excluding units)
            if (removeUnitFromLabel(globalFigDict.layout.yaxis.title.text) !==
                removeUnitFromLabel(jsonified.layout.yaxis.title.text)) {
              fieldsMatch = false;
              errorDiv.innerText += "The added record's yaxis label text is different. Stopping merging. The two values are: " +
                removeUnitFromLabel(globalFigDict.layout.yaxis.title.text) + " " +
                removeUnitFromLabel(jsonified.layout.yaxis.title.text) + "\n";
            }

            // If fields don't match, show error and exit
            if (!fieldsMatch) {
              errorDiv.innerText += `Added data not plotted. The records were not compatible for merging. You may continue trying to add data sets, or may click "Clear Data" to start a new graph. These error messages will be automatically cleared after 10 seconds.\n`;
              setTimeout(() => { errorDiv.innerText = ''; }, 10000);
              return null;
            }

            // STEP 5: Perform unit conversion if the fields match
            _jsonified = await convertUnits(_jsonified, globalFigDict);

            // Merge new data into global dictionary
            globalFigDict.data = [...globalFigDict.data, ..._jsonified.data];
          }

          // Return the objects that have been prepared for plotting and downloading.
          return {
            mergedFigDict: globalFigDict,
            newestFigDict: _jsonified,
            fileName: recentFileName,
          };

        } catch (err) {
          // Logging error for debugging
          console.log("Error from prepareForPlotting: ", err);
          throw err;
        }
      }


      // A function that visualizes the data with plotly
      async function plot_with_plotly(figDict) {
        let plotStyle = { layout_style: "", trace_styles_collection: "" };
          if (JSON.stringify(plotStyle) === JSON.stringify({ layout_style: "", trace_styles_collection: "" })) {
              plotStyle = figDict.plot_style ?? { layout_style: "", trace_styles_collection: "" };
          }

          let copyForPlotly = JSON.parse(JSON.stringify(figDict)); // Plotly mutates the input, and we also do when applying plot style.      
          //offset2D and arrange2dTo3d must be executed after making the copy, if requested. The other implicit functions have already been called.
          copyForPlotly = await executeImplicitDataSeriesOperations(copyForPlotly, false, false, false, true, true);
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
              await Plotly.newPlot("plotlyDiv", copyForPlotly.data, copyForPlotly.layout);
          } else {
              console.error("Plotly is not loaded.");
          }
      }      