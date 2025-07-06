// Import equation class from equation_creator.js
import { Equation } from './equation_creator.js'; // Adjust the path as needed
import {getUnitsScalingRatio} from '../unitUtils.js'; 
import {scaleDataseriesDict} from '../unitUtils.js'; 
import {checkSimulate, simulateByIndexAndPopulateFigDict} from '../simulateUtils.js';

//Utility function for during debugging.
function copyJson(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Updates the `x_range_default` values for all simulate and equation data series
 * in a given figure dictionary using the provided range dictionary.
 *
 * @param {object} figDict - The original figure dictionary containing various data series.
 * @param {object} rangeDict - A dictionary with keys "min_x" and "max_x" providing the
 * global minimum and maximum x values for updates.
 * @returns {object} A new figure dictionary with updated `x_range_default` values for
 * equation and simulate series, while keeping other data unchanged.
 *
 * @notes
 * - If `min_x` or `max_x` in `rangeDict` is null, the function preserves the
 * existing `x_range_default` values instead of overwriting them.
 * - Uses deepcopy to ensure modifications do not affect the original `figDict`.
 */
export function updateImplicitDataSeriesXRanges(figDict, rangeDict) {
  // Deep copy avoids modifying original data
  const updatedFigDict = JSON.parse(JSON.stringify(figDict));

  const min_x = rangeDict.min_x;
  const max_x = rangeDict.max_x;

  for (const dataSeries of updatedFigDict.data || []) {
    if (dataSeries.equation) {
      const equationInfo = dataSeries.equation;

      // Determine valid values before assignment
      const min_x_value = (min_x !== null) ? min_x : (equationInfo.x_range_default ? equationInfo.x_range_default[0] : null);
      const max_x_value = (max_x !== null) ? max_x : (equationInfo.x_range_default ? equationInfo.x_range_default[1] : null);

      // Assign updated values
      equationInfo.x_range_default = [min_x_value, max_x_value];

    } else if (dataSeries.simulate) {
      const simulateInfo = dataSeries.simulate;

      // Determine valid values before assignment
      const min_x_value = (min_x !== null) ? min_x : (simulateInfo.x_range_default ? simulateInfo.x_range_default[0] : null);
      const max_x_value = (max_x !== null) ? max_x : (simulateInfo.x_range_default ? simulateInfo.x_range_default[1] : null);

      // Assign updated values
      simulateInfo.x_range_default = [min_x_value, max_x_value];
    }
  }
  return updatedFigDict;
}

/**
 * Extracts minimum and maximum x/y values from each `dataSeries` in a `figDict`,
 * as well as overall min and max for x and y.
 *
 * @param {object} figDict - The figure dictionary containing multiple data series.
 * @param {boolean} skipEquations - If true, equation-based data series are ignored.
 * @param {boolean} skipSimulations - If true, simulation-based data series are ignored.
 * @returns {Array<object>}
 * - `figDictRanges` (object): A dictionary containing overall min/max x/y values across all valid series.
 * - `dataSeriesRanges` (object): A dictionary with individual min/max values for each data series.
 *
 * @notes
 * - Equations and simulations have predefined `x_range_default` and limits.
 * - If their x-range is absent, individual data series values are used.
 * - Ensures empty arrays don't trigger errors when computing min/max values.
 */
export function getFigDictRanges(figDict, skipEquations = false, skipSimulations = false) {
  // Initialize final range values to null to ensure assignment
  const figDictRanges = {
    min_x: null,
    max_x: null,
    min_y: null,
    max_y: null,
  };

  const dataSeriesRanges = {
    min_x: [],
    max_x: [],
    min_y: [],
    max_y: [],
  };

  for (const dataSeries of figDict.data || []) {
    let min_x = null;
    let max_x = null;
    let min_y = null;
    let max_y = null; // Initialize extrema as null

    let implicitDataSeriesToExtractFrom = null;

    // Determine if the data series contains either "equation" or "simulate"
    if (dataSeries.equation) {
      if (!skipEquations) {
        implicitDataSeriesToExtractFrom = dataSeries.equation;
      }
    } else if (dataSeries.simulate) {
      if (!skipSimulations) {
        implicitDataSeriesToExtractFrom = dataSeries.simulate;
      }
    }

    if (implicitDataSeriesToExtractFrom) {
      const x_range_default = implicitDataSeriesToExtractFrom.x_range_default || [null, null];
      const x_range_limits = implicitDataSeriesToExtractFrom.x_range_limits || [null, null];

      // Assign values, but keep null if missing
      min_x = (x_range_default[0] !== null) ? x_range_default[0] : x_range_limits[0];
      max_x = (x_range_default[1] !== null) ? x_range_default[1] : x_range_limits[1];
    }

    // Ensure "x" key exists AND array is not empty before calling Math.min() or Math.max()
    if (min_x === null && dataSeries.x && dataSeries.x.length > 0) {
      const valid_x_values = dataSeries.x.filter(x => x !== null); // Filter out null values
      if (valid_x_values.length > 0) { // Ensure array isn't empty after filtering
        min_x = Math.min(...valid_x_values);
      }
    }

    if (max_x === null && dataSeries.x && dataSeries.x.length > 0) {
      const valid_x_values = dataSeries.x.filter(x => x !== null); // Filter out null values
      if (valid_x_values.length > 0) { // Ensure array isn't empty after filtering
        max_x = Math.max(...valid_x_values);
      }
    }

    // Ensure "y" key exists AND array is not empty before calling Math.min() or Math.max()
    if (min_y === null && dataSeries.y && dataSeries.y.length > 0) {
      const valid_y_values = dataSeries.y.filter(y => y !== null); // Filter out null values
      if (valid_y_values.length > 0) { // Ensure array isn't empty after filtering
        min_y = Math.min(...valid_y_values);
      }
    }

    if (max_y === null && dataSeries.y && dataSeries.y.length > 0) {
      const valid_y_values = dataSeries.y.filter(y => y !== null); // Filter out null values
      if (valid_y_values.length > 0) { // Ensure array isn't empty after filtering
        max_y = Math.max(...valid_y_values);
      }
    }

    // Always add values to the lists, including null if applicable
    dataSeriesRanges.min_x.push(min_x);
    dataSeriesRanges.max_x.push(max_x);
    dataSeriesRanges.min_y.push(min_y);
    dataSeriesRanges.max_y.push(max_y);
  }

  // Filter out null values for overall min/max calculations
  const validMin_x_values = dataSeriesRanges.min_x.filter(x => x !== null);
  const validMax_x_values = dataSeriesRanges.max_x.filter(x => x !== null);
  const validMin_y_values = dataSeriesRanges.min_y.filter(y => y !== null);
  const validMax_y_values = dataSeriesRanges.max_y.filter(y => y !== null);

  figDictRanges.min_x = validMin_x_values.length > 0 ? Math.min(...validMin_x_values) : null;
  figDictRanges.max_x = validMax_x_values.length > 0 ? Math.max(...validMax_x_values) : null;
  figDictRanges.min_y = validMin_y_values.length > 0 ? Math.min(...validMin_y_values) : null;
  figDictRanges.max_y = validMax_y_values.length > 0 ? Math.max(...validMax_y_values) : null;

  return [figDictRanges, dataSeriesRanges];
}


// --- Placeholder for JSONGrapher.units_list equivalents ---
// You need to replace these with your actual units data in JavaScript.
// For example, if your units data is loaded from a JSON file or defined elsewhere,
// integrate that here.
// For now, these are empty sets, which means the plural removal logic will
// mostly default to "no change" unless you fill them.
const units_list_ids_PYTHON = new Set();    // Example: new Set(["m", "s", "kg"]);
const units_list_names_PYTHON = new Set(); // Example: new Set(["meter", "second", "kilogram"]);


/**
* As of 6/4/2025, the below function has not yet been implemented. However, to implement it,
* we would get the units_list from the UUC javascript module.
* Parses a units string to remove "s" if the string is found as an exact match without an "s" in the units lists.
 * This function uses a placeholder for the `units_list` data (units_list_ids_PYTHON, units_list_names_PYTHON)
 * which you need to define with your actual unit data.
 *
 * @param {string} unitsToCheck - A string containing units to check.
 * @returns {Array<boolean|string>} A tuple-like array of two values:
 * - `changed` (boolean): True if the string was changed to remove an "s" at the end, otherwise False.
 * - `singularized` (string): The units parsed to be singular, if needed.
 */
export function unitsPluralRemoval(unitsToCheck) {
    // Check if the placeholder unit sets are empty. If so, log a warning and return unchanged.
    if (units_list_ids_PYTHON.size === 0 && units_list_names_PYTHON.size === 0) {
        console.warn("Warning: units_list_ids_PYTHON or units_list_names_PYTHON are empty. Unit plural removal might not function as expected.");
        return [false, unitsToCheck];
    }

    let unitsChangedFlag = false;
    let unitsSingularized = unitsToCheck;

    // First, check if units are blank or don't end with "s".
    if (unitsToCheck === "" || !unitsToCheck.endsWith("s")) {
        unitsChangedFlag = false;
        unitsSingularized = unitsToCheck; // Return if string is blank or does not end with 's'.
    } else if (unitsToCheck !== "" && unitsToCheck.endsWith("s")) { // Continue if not blank and ends with 's'.
        // Return unchanged if the unit (with 's') is recognized.
        if (units_list_ids_PYTHON.has(unitsToCheck) || units_list_names_PYTHON.has(unitsToCheck)) {
            unitsChangedFlag = false;
            unitsSingularized = unitsToCheck; // No change if was found.
        } else {
            const truncatedString = unitsToCheck.slice(0, -1); // Remove last letter.
            if (units_list_ids_PYTHON.has(truncatedString) || units_list_names_PYTHON.has(truncatedString)) {
                unitsChangedFlag = true;
                unitsSingularized = truncatedString; // Return without the 's'.
            } else { // No change if the truncated string isn't found.
                unitsChangedFlag = false;
                unitsSingularized = unitsToCheck;
            }
        }
    } else {
        // If it's outside of our known logic, we just return unchanged. (This branch is mostly for robustness).
        unitsChangedFlag = false;
        unitsSingularized = unitsToCheck;
    }
    return [unitsChangedFlag, unitsSingularized];
}


/**
 * Separates the main text from units within a label string enclosed in parentheses.
 *
 * @param {string} labelWithUnits - The input label string, e.g., "Temperature (C)".
 * @returns {object} An object with `text` (the label without units) and `units` (the content inside the last parentheses).
 * @throws {Error} If parentheses are mismatched in the input string.
 */
export function separateLabelTextFromUnits(labelWithUnits) {
    // Check for mismatched parentheses
    const openParentheses = (labelWithUnits.match(/\(/g) || []).length;
    const closeParentheses = (labelWithUnits.match(/\)/g) || []).length;

    if (openParentheses !== closeParentheses) {
        throw new Error(`Mismatched parentheses in input string: '${labelWithUnits}'`);
    }

    // Default parsed output
    const parsedOutput = { text: labelWithUnits, units: "" };

    // Extract tentative start and end indices, from first open and last close parentheses.
    const start = labelWithUnits.indexOf('(');
    const end = labelWithUnits.lastIndexOf(')');

    let secondCheckFailed = false;

    // Ensure removing both first '(' and last ')' doesn't cause misalignment.
    // This checks if there's an unmatched closing parenthesis after stripping the outer ones.
    if (start !== -1 && end !== -1) {
        const tempString = labelWithUnits.slice(0, start) + labelWithUnits.slice(start + 1, end) + labelWithUnits.slice(end + 1);
        const firstClosingParenAfterRemoval = tempString.indexOf(')');
        const firstOpeningParenAfterRemoval = tempString.indexOf('(');

        if (firstOpeningParenAfterRemoval !== -1 && firstClosingParenAfterRemoval < firstOpeningParenAfterRemoval) {
            secondCheckFailed = true; // Set flag if second check fails
        }
    }

    if (secondCheckFailed) {
        // If it's something like "Text (Units) (More Text)", it treats "(Units) (More Text)" as units.
        parsedOutput.text = labelWithUnits.slice(0, start).trim();
        parsedOutput.units = labelWithUnits.slice(start).trim();
    } else if (start !== -1 && end !== -1) {
        // Extract everything between first '(' and last ')' as units.
        parsedOutput.text = labelWithUnits.slice(0, start).trim();
        parsedOutput.units = labelWithUnits.slice(start + 1, end).trim();
    }
    // If no parentheses found (start === -1), parsedOutput remains default, which is correct.

    return parsedOutput;
}

/**
  * Placeholder for `simulate_as_needed_in_fig_dict`.
 * This function should perform simulations for applicable series.
  *
 * @param {object} _jsonified - The figure dictionary containing data series.
 * @returns {object} The figure dictionary with simulated data.
 */
    export async function simulateAsNeededInFigDict(_jsonified) {
        //This loop iterates across data_series dictionary objects objects to see if any require simulation.
                for (const dataSet of _jsonified.data) {
                  const index = _jsonified.data.indexOf(dataSet);
                  const hasSimulate = checkSimulate(dataSet);
                  if (hasSimulate) {
                    //Below, the "result" has named fields inside, which we will extract.
                    const result = await simulateByIndexAndPopulateFigDict(_jsonified, index);
                    const simulatedJsonified = result.simulatedJsonified
                    _jsonified = result._jsonified;                
                  } 
                }
        return _jsonified
      }


/**
 * Iterates through all data series in a fig_dict and evaluates any 'equation' fields.
 *
 * @param {object} figDict - The figure dictionary to process.
 * @returns {object} A new figure dictionary with equations evaluated.
 */
export function evaluateEquationsAsNeededInFigDict(figDict) {
    // Deep copy to ensure no modification of the original input
    let updatedFigDict = JSON.parse(JSON.stringify(figDict));
    const dataDictsList = updatedFigDict.data;

    if (!dataDictsList) {
        return updatedFigDict; // No data to process
    }

    for (let i = 0; i < dataDictsList.length; i++) {
        if ('equation' in dataDictsList[i]) {
            updatedFigDict = evaluateEquationForDataSeriesByIndex(updatedFigDict, i);
        }
    }
    return updatedFigDict;
}

/**
 * Evaluates an equation for a specific data series within a figure dictionary.
 *
 * @param {object} figDict - The figure dictionary.
 * @param {number} dataSeriesIndex - The index of the data series to evaluate.
 * @param {string} [verbose="auto"] - Verbosity setting for equation evaluation.
 * @returns {object} The modified figure dictionary with the evaluated equation data.
 * @throws {Error} If `Equation` class is not properly implemented.
 */
export function evaluateEquationForDataSeriesByIndex(figDict, dataSeriesIndex, verbose = "auto") {
    // Work with a deep copy to avoid direct modification of the original figDict
    let updatedFigDict = JSON.parse(JSON.stringify(figDict));
    const dataDictsList = updatedFigDict.data;

    if (!dataDictsList || dataSeriesIndex < 0 || dataSeriesIndex >= dataDictsList.length) {
        console.warn("Invalid dataSeriesIndex or no data in figDict.");
        return updatedFigDict;
    }

    const dataDict = dataDictsList[dataSeriesIndex];

    if ('equation' in dataDict) {
        try {
            // Instantiate your Equation class with the equation definition
            const equationObject = new Equation(dataDict.equation); // Calls your provided Equation

            // Call the evaluateEquation method
            const equationDictEvaluated = equationObject.evaluateEquation(verbose);

            let graphical_dimensionality = 2; // start with default, overwrite if provided in equationDict.
            if (equationDictEvaluated && "graphical_dimensionality" in equationDictEvaluated) {
                graphical_dimensionality = equationDictEvaluated.graphical_dimensionality;
            }

            const dataDictFilled = JSON.parse(JSON.stringify(dataDict)); // Deep copy to fill
            dataDictFilled.equation = equationDictEvaluated;
            dataDictFilled.x_label = dataDictFilled.equation.x_variable;
            dataDictFilled.y_label = dataDictFilled.equation.y_variable;
            dataDictFilled.x = equationDictEvaluated.x_points;
            dataDictFilled.y = equationDictEvaluated.y_points;

            if (graphical_dimensionality === 3) {
                dataDictFilled.z_label = dataDictFilled.equation.z_variable;
                dataDictFilled.z = equationDictEvaluated.z_points;
            }

            // Unit scaling logic
            if (dataDictFilled.x_label || dataDictFilled.y_label || dataDictFilled.z_label) {
                // First, get the units from the layout of fig_dict
                const existingRecordXLabel = updatedFigDict.layout?.xaxis?.title?.text || "";
                const existingRecordYLabel = updatedFigDict.layout?.yaxis?.title?.text || "";
                let existingRecordZLabel = "";
                // Check for zaxis title in both layout and layout.scene for 3D plots
                if (dataDictFilled.z_label && updatedFigDict.layout?.scene?.zaxis?.title?.text) {
                    existingRecordZLabel = updatedFigDict.layout.scene.zaxis.title.text;
                } else if (dataDictFilled.z_label && updatedFigDict.layout?.zaxis?.title?.text) {
                    // Fallback for non-scene 3D plots if applicable
                    existingRecordZLabel = updatedFigDict.layout.zaxis.title.text;
                }

                const existingRecordXUnits = separateLabelTextFromUnits(existingRecordXLabel).units; // Calls your separateLabelTextFromUnits
                const existingRecordYUnits = separateLabelTextFromUnits(existingRecordYLabel).units; // Calls your separateLabelTextFromUnits
                //const existingRecordZUnits = separateLabelTextFromUnits(existingRecordZLabel).units; // Calls your separateLabelTextFromUnits


                if (existingRecordXUnits !== '' || existingRecordYUnits !== '' || existingRecordZUnits !== '') {
                    // Now, get the units from the evaluated equation output.
                    const simulatedDataSeriesXUnits = separateLabelTextFromUnits(dataDictFilled.x_label).units; // Calls your separateLabelTextFromUnits
                    const simulatedDataSeriesYUnits = separateLabelTextFromUnits(dataDictFilled.y_label).units; // Calls your separateLabelTextFromUnits
                    //const simulatedDataSeriesZUnits = separateLabelTextFromUnits(dataDictFilled.z_label).units; // Calls your separateLabelTextFromUnits

                    const xUnitsRatio = getUnitsScalingRatio(simulatedDataSeriesXUnits, existingRecordXUnits); // Calls your getUnitsScalingRatio
                    const yUnitsRatio = getUnitsScalingRatio(simulatedDataSeriesYUnits, existingRecordYUnits); // Calls your getUnitsScalingRatio
                    //const zUnitsRatio = getUnitsScalingRatio(simulatedDataSeriesZUnits, existingRecordZUnits); // Calls your getUnitsScalingRatio

                    // Scale the dataseries
                    scaleDataseriesDict(dataDictFilled, xUnitsRatio, yUnitsRatio); // Calls your scaleDataseriesDict
                }

                // Remove the "x_label", "y_label", and "z_label" to be compatible with Plotly.
                delete dataDictFilled.x_label;
                delete dataDictFilled.y_label;
                //delete dataDictFilled.z_label; // Use delete operator for properties
            }

            if (!dataDictFilled.type) {
                if (graphical_dimensionality === 2) {
                    dataDictFilled.type = 'spline';
                } else if (graphical_dimensionality === 3) {
                    dataDictFilled.type = 'mesh3d';
                }
            }
            dataDictsList[dataSeriesIndex] = dataDictFilled;

        } catch (e) {
            console.error(`Error evaluating equation for data series at index ${dataSeriesIndex}:`, e);
            // Optionally, you might want to remove the 'equation' field or mark the series as invalid
        }
    }
    updatedFigDict.data = dataDictsList; // Reassign in case dataDictsList was modified directly
    return updatedFigDict;
}

/**
 * Updates the x, y, and z values of implicit data series (equation/simulate) in target_fig_dict
 * using values from the corresponding series in source_fig_dict.
 *
 * @param {object} target_fig_dict - The figure dictionary that needs updated data.
 * @param {object} source_fig_dict - The figure dictionary that provides x and y values.
 * @param {boolean} [parallel_structure=true] - If true, assumes both data lists are the same
 * length and updates using index. If false,
 * matches by name instead.
 * @param {boolean} [modify_target_directly=false] - If true, modifies target_fig_dict in place.
 * Otherwise, returns a deep copy.
 * @returns {object} A new (or modified) figure dictionary with updated x and y values for implicit data series.
 *
 * @notes
 * - If parallel_structure=true and both lists have the same length, updates use index.
 * - If parallel_structure=false, matching is done by the "name" field.
 * - Only updates data series that contain "simulate" or "equation".
 * - Ensures deep copying to avoid modifying the original structures unless modify_target_directly is true.
 */
export function updateImplicitDataSeriesData(target_fig_dict, source_fig_dict, parallel_structure = true, modify_target_directly = false) {
    let updated_fig_dict;
    if (modify_target_directly === false) {
        updated_fig_dict = JSON.parse(JSON.stringify(target_fig_dict)); // Deep copy
    } else {
        updated_fig_dict = target_fig_dict; // Work directly on the target
    }

    const target_data_series = updated_fig_dict.data || [];
    const source_data_series = source_fig_dict.data || [];

    if (parallel_structure && target_data_series.length === source_data_series.length) {
        // Use index when parallel_structure=true and lengths match
        for (let i = 0; i < target_data_series.length; i++) {
            const targetSeries = target_data_series[i];
            const sourceSeries = source_data_series[i];

            if (("equation" in targetSeries) || ("simulate" in targetSeries)) {
                targetSeries.x = sourceSeries.x || []; // Extract and apply "x" values
                targetSeries.y = sourceSeries.y || []; // Extract and apply "y" values
                if ("z" in sourceSeries) {
                    targetSeries.z = sourceSeries.z || []; // Extract and apply "z" values
                }
            }
        }
    } else {
        // Match by name when parallel_structure=false or lengths differ
        const sourceDataDict = {};
        for (const series of source_data_series) {
            if ("name" in series) {
                sourceDataDict[series.name] = series;
            }
        }

        for (const targetSeries of target_data_series) {
            if (("equation" in targetSeries) || ("simulate" in targetSeries)) {
                const targetName = targetSeries.name;

                if (targetName && sourceDataDict[targetName]) {
                    const sourceSeries = sourceDataDict[targetName];
                    targetSeries.x = sourceSeries.x || []; // Extract and apply "x" values
                    targetSeries.y = sourceSeries.y || []; // Extract and apply "y" values
                    if ("z" in sourceSeries) {
                        targetSeries.z = sourceSeries.z || []; // Extract and apply "z" values
                    }
                }
            }
        }
    }
    return updated_fig_dict;
}

/**
 * This function is designed to be called during creation of a plotly or matplotlib figure creation.
 * Processes implicit data series (equation/simulate), adjusting ranges, performing simulations,
 * and evaluating equations as needed.
 *
 * The important thing is that this function creates a "fresh" fig_dict, does some manipulation,
 * then then gets the data from that and adds it to the original fig_dict.
 * That way the original fig_dict is not changed other than getting the simulated/evaluated data.
 *
 * The reason the function works this way is that the x_range_default of the implicit data series
 * (equations and simulations) are adjusted to match the data in the fig_dict, but we don't want
 * to change the x_range_default of our main record.
 * That's why we make a copy for creating simulated/evaluated data from those adjusted ranges,
 * and then put the simulated/evaluated data back into the original dict.
 *
 * @param {object} figDict - The figure dictionary containing data series.
 * @param {boolean} [simulateAllSeries=true] - If true, performs simulations for applicable series.
 * @param {boolean} [evaluateAllEquations=true] - If true, evaluates all equation-based series.
 * @param {boolean} [adjustImplicitDataRanges=true] - If true, modifies ranges for implicit data series.
 * @returns {object} Updated figure dictionary with processed implicit data series.
 *
 * @notes
 * - If adjustImplicitDataRanges=true, retrieves min/max values from regular data series
 * (those that are not equations and not simulations) and applies them to implicit data.
 * - If simulateAllSeries=true, executes simulations for all series that require them
 * and transfers the computed data back to figDict without copying ranges.
 * - If evaluateAllEquations=true, solves equations as needed and transfers results
 * back to figDict without copying ranges.
 * - Uses deepcopy to avoid modifying the original input dictionary.
 */
export async function executeImplicitDataSeriesOperations(figDict, simulateAllSeries = true, evaluateAllEquations = true, adjustImplicitDataRanges = true, adjustOffset2d = false, adjustArrange2dTo3d = false) {
    // Create a deep copy for processing implicit series separately
    let figDictForImplicit = JSON.parse(JSON.stringify(figDict));

    // First check if any data_series have an equation or simulation field. If not, we'll skip.
    let implicitSeriesPresent = false;
    for (const dataSeries of figDict.data || []) {
        if ("equation" in dataSeries || "simulate" in dataSeries) {
            implicitSeriesPresent = true;
            break;
        }
    }

    if (implicitSeriesPresent) {
        if (adjustImplicitDataRanges) {
            // Retrieve ranges from data series that are not equation-based or simulation-based.
            const [figDictRanges] = getFigDictRanges(figDict, true, true); // No need for dataSeriesRanges here.

            // Apply the extracted ranges to implicit data series before simulation or equation evaluation.
            figDictForImplicit = updateImplicitDataSeriesXRanges(figDict, figDictRanges);
        }


        if (simulateAllSeries) {
            // Perform simulations for applicable series
            figDictForImplicit = await simulateAsNeededInFigDict(figDictForImplicit);
            // Copy data back to figDict, ensuring ranges remain unchanged
            figDict = updateImplicitDataSeriesData(figDict, figDictForImplicit, true, true);
        }

        if (evaluateAllEquations) {
            // Evaluate equations that require computation
            figDictForImplicit = evaluateEquationsAsNeededInFigDict(figDictForImplicit);
            // Copy results back without overwriting the ranges
            figDict = updateImplicitDataSeriesData(figDict, figDictForImplicit, true, true);
        }
    }

    if (adjustOffset2d) {
        // This should occur after simulations and evaluations because it could rely on them.
        const layoutStyle = figDict?.plot_style?.layout_style || "";
        if (layoutStyle.includes("offset2d")) {
            // This case is different from others -- we will not modify target directly because we are not doing a merge.
            figDict = extractAndImplementOffsets(figDictForImplicit, false);
        }
    }

    if (adjustArrange2dTo3d) {
        // This should occur after simulations and evaluations because it could rely on them.
        const layoutStyle = figDict?.plot_style?.layout_style || "";
        if (layoutStyle.includes("arrange2dTo3d")) {
            // This case is different from others -- we will not modify target directly because we are not doing a merge.
            figDict = implementArrange2dTo3d(figDictForImplicit, false);
        }
    }

    return figDict;
}



// Determines if a value can be interpreted as a float scalar
function isFloatScalar(value) {
    return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
}

// Applies vertical offsets if defined in figDict.layout, otherwise computes them
function extractAndImplementOffsets(figDict, modifyTargetDirectly = false, graphicalDimensionality = 2) {
    const figDictWithOffsets = modifyTargetDirectly ? figDict : structuredClone(figDict);
    let offsetVariableName = "";
    if ("offset" in figDict.layout) {
        let offset = figDict.layout.offset;
        if (isFloatScalar(offset)) {
            // scalar, nothing to parse
        } else if (typeof offset === 'string') {
            offsetVariableName = offset;
        } else {
            offset = offset.map(val => parseFloat(val));
        }
        if (graphicalDimensionality === 2) {
            let currentSeriesOffset = 0;
            for (let i = 0; i < figDict.data.length; i++) {
                const yVals = figDict.data[i].y.map(Number);

                if (i === 0) {
                    figDictWithOffsets.data[i].y = [...yVals];
                } else {
                    let incrementalOffset;
                    if (offsetVariableName) {
                        incrementalOffset = figDict.data[i][offsetVariableName].map(Number);
                    } else {
                        incrementalOffset = Array.isArray(offset) ? offset.map(Number) : new Array(yVals.length).fill(Number(offset));
                    }

                    currentSeriesOffset = currentSeriesOffset === 0
                        ? [...incrementalOffset]
                        : currentSeriesOffset.map((v, j) => v + incrementalOffset[j]);

                    figDictWithOffsets.data[i].y = yVals.map((y, j) => y + currentSeriesOffset[j]);
                }
            }
        }
    } else {
        if (graphicalDimensionality === 2) {
            return determineAndApplyOffset2dForFigDict(figDict, modifyTargetDirectly);
        }
    }

    return figDictWithOffsets;
}

// Handles the full logic for offsetting 2D plots when no offsets are specified
function determineAndApplyOffset2dForFigDict(figDict, modifyTargetDirectly = false) {
    const fig = modifyTargetDirectly ? figDict : structuredClone(figDict);
    const allSeriesArray = extractAllXYSeriesDataFromFigDict(fig);
    const offsetDataArray = applyVerticalOffset2dForArrayList(allSeriesArray);
    return injectXYSeriesDataIntoFigDict(fig, offsetDataArray);
}

// Extracts all x/y coordinates from a fig dict into a list of [[x,y],...]
function extractAllXYSeriesDataFromFigDict(figDict) {
    const seriesList = [];
    for (const dataSeries of figDict.data || []) {
        const xVals = dataSeries.x || [];
        const yVals = dataSeries.y || [];
        if (xVals.length === yVals.length) {
            const combined = xVals.map((x, i) => [Number(x), Number(yVals[i])]);
            seriesList.push(combined);
        }
    }
    return seriesList;
}

// Applies a vertical offset to each series in a list of 2D series [[x,y],...]
function applyVerticalOffset2dForArrayList(dataList, offsetMultiplier = 1.2) {
    const spans = dataList.map(series => {
        if (!series.length) return 0;
        const yVals = series.map(([_, y]) => y);
        return Math.max(...yVals) - Math.min(...yVals);
    });

    const baseOffset = spans.length ? Math.max(...spans) * offsetMultiplier : 0;

    return dataList.map((series, index) => {
        if (!series.length) return [];
        return series.map(([x, y]) => [x, y + index * baseOffset]);
    });
}

// Injects modified [x,y] lists back into figDict's data traces
function injectXYSeriesDataIntoFigDict(figDict, dataList) {
    const nTraces = figDict.data.length;
    if (dataList.length !== nTraces) {
        throw new Error("Mismatch between number of traces and number of data series.");
    }

    for (let i = 0; i < nTraces; i++) {
        const series = dataList[i];
        figDict.data[i].x = series.map(point => point[0]);
        figDict.data[i].y = series.map(point => point[1]);
    }

    return figDict;
}


function implementArrange2dTo3d(figDict, modifyTargetDirectly = false) {
    // Deep copy the input figure dictionary to avoid modifying the original
    const scratchFigDict = JSON.parse(JSON.stringify(figDict));
    const modifiedFigDict = JSON.parse(JSON.stringify(figDict));

    // Extract axis variables from layout or assign default fallbacks
    let verticalAxisVariable = figDict.layout.vertical_axis_variable || {};
    if (Object.keys(verticalAxisVariable).length === 0) {
        // Default to 'y' if vertical axis not provided
        verticalAxisVariable = 'y';
    }

    let leftAxisVariable = figDict.layout.left_axis_variable || {};
    if (Object.keys(leftAxisVariable).length === 0) {
        // Default to 'x' if left axis not provided
        leftAxisVariable = 'x';
    }

    let rightAxisVariable = figDict.layout.right_axis_variable || {};
    if (Object.keys(rightAxisVariable).length === 0) {
        // Default to ascending sequence for right axis
        rightAxisVariable = 'data_series_index_vector';

        for (let dataSeriesIndex = 0; dataSeriesIndex < figDict.data.length; dataSeriesIndex++) {
            const lengthNeeded = figDict.data[dataSeriesIndex].x.length;
            const dataSeriesIndexVector = Array(lengthNeeded).fill(dataSeriesIndex);
            scratchFigDict.data[dataSeriesIndex].data_series_index_vector = dataSeriesIndexVector;
        }
    }

    // Ensure xaxis, yaxis, and zaxis have proper nested structure for titles
    ['xaxis', 'yaxis', 'zaxis'].forEach(axis => {
        modifiedFigDict.layout[axis] = modifiedFigDict.layout[axis] || {};
        modifiedFigDict.layout[axis].title = modifiedFigDict.layout[axis].title || {};
        modifiedFigDict.layout[axis].title.text = "";
    });
    // Assign axis labels from the scratch copy
    modifiedFigDict.layout.yaxis.title.text =
        scratchFigDict.layout[`${leftAxisVariable}axis`].title.text;

    if (rightAxisVariable !== 'data_series_index_vector') {
        modifiedFigDict.layout.xaxis.title.text =
            scratchFigDict.layout[`${rightAxisVariable}axis`].title.text;
    } else {
        modifiedFigDict.layout.xaxis.title.text = "Data Set";
    }

    modifiedFigDict.layout.zaxis.title.text =
        scratchFigDict.layout[`${verticalAxisVariable}axis`].title.text;

    // Reassign axes for each data series and update trace style
    for (let dataSeriesIndex = 0; dataSeriesIndex < figDict.data.length; dataSeriesIndex++) {
        const modifiedSeries = modifiedFigDict.data[dataSeriesIndex];
        const scratchSeries = scratchFigDict.data[dataSeriesIndex];
        //trace_styles are scatter3d or curve3d. Choose curve3d for anything not scatter.
        //In future, could consider adding in bar/column chart.
        modifiedSeries.trace_style = modifiedSeries.trace_style.includes("scatter")
            ? "scatter3d"
            : "curve3d";

        modifiedSeries.y = scratchSeries[leftAxisVariable];
        modifiedSeries.x = scratchSeries[rightAxisVariable];
        modifiedSeries.z = scratchSeries[verticalAxisVariable];
    }
    return modifiedFigDict;
}


window.executeImplicitDataSeriesOperations = executeImplicitDataSeriesOperations; //line needed for index.html to see the function after importing.