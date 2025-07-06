
      // A function that gets the unit from the label with regex
      export function getUnitFromLabel(label) {
        if (!label) {
          console.warn("Label is undefined or null");
          return "";
        }
        let unit = label.match(/\((.*)\)/);
        if (unit) {
          return unit[1].replace(/\*\*/g, "^");//The replace in here replaces ** with ^, to replace python style "raise to the power of" with the conventional symbol.
        }
        return "";
      }

      //This is a helper function to create superscript tags for plotly right before plotting.
      export function replaceSuperscripts(inputString) {
        // Step 1: Wrap superscript expressions in <sup> tags
        let outputString = inputString.replace(/\^\((.*?)\)|\*\*\((.*?)\)/g, 
          (match, p1, p2) => `<sup>${p1 || p2}</sup>`);

        // Step 2: Remove parentheses if the content is only digits
        outputString = outputString.replace(/<sup>\((\d+)\)<\/sup>/g, '<sup>$1</sup>');

        // Step 3: Remove parentheses if the content is a negative number (- followed by digits)
        outputString = outputString.replace(/<sup>\(-(\d+)\)<\/sup>/g, '<sup>-$1</sup>');

        // Step 4: Remove parentheses if the superscript is a single letter
        outputString = outputString.replace(/<sup>\((\w)\)<\/sup>/g, '<sup>$1</sup>');

        return outputString;
      }

      // A function that removes the unit from the label
      export function removeUnitFromLabel(label) {
        const unit = getUnitFromLabel(label);
        return label.replace(/\*\*/g, "^").replace(unit, "").replace("()", ""); //need to first replace ** with ^ to be prepared for that part of getUnitFromLabel's processing.
      }


//START OF BLOCK OF CODE REQUIRED FOR UNITSCALING FOR JSON_EQUATIONER

/**
 * This is a replacement for `add_custom_unit_to_unitpy`.
 *
 * @param {string} unitString - The custom unit string to add.
 */
function addCustomUnitToMathJS(unitString) {
    try { math.unit(unitString); } catch { math.createUnit(unitString); }
}

/**
 * Converts a string by removing tags surrounded by '<' and '>' characters.
 * @param {string} text - The input string.
 * @returns {string} The string with tags removed.
 */
function removeTaggedStrings(text) {
    // This is the inverse of `extract_tagged_strings` used internally for processing.
    // It replaces <TAG> with TAG, effectively removing the delimiters.
    return text.replace(/<([^>]*)>/g, '$1');
}

/**
 * Extracts tags surrounded by `<` and `>` from a given string. Used for custom units.
 * Returns them as a list sorted from longest to shortest.
 *
 * @param {string} text - The input string.
 * @returns {string[]} A list of extracted tags, sorted by length in descending order.
 */
function extractTaggedStrings(text) {
    const matches = text.match(/<([^>]*)>/g); // Find all occurrences of <...>
    if (!matches) {
        return [];
    }
    const list_of_tags = matches.map(match => match.slice(1, -1)); // Remove < and >
    const set_of_tags = new Set(list_of_tags); // Remove duplicates
    const sorted_tags = Array.from(set_of_tags).sort((a, b) => b.length - a.length); // Sort longest to shortest
    return sorted_tags;
}

/**
 * Puts markup around custom units with '<' and '>'.
 *
 * @param {string} unitsString - The units string.
 * @param {string[]} customUnitsList - A list of custom unit strings.
 * @returns {string} The units string with custom units marked up.
 */
function returnCustomUnitsMarkup(unitsString, customUnitsList) {
    // Sort custom units from longest to shortest to prevent partial matches.
    const sortedCustomUnitsList = [...customUnitsList].sort((a, b) => b.length - a.length);

    for (const customUnit of sortedCustomUnitsList) {
        // Use a regular expression to replace only whole word matches to avoid issues
        // with partial names (e.g., "m" in "mm").
        // This regex ensures we're replacing the whole custom unit string.
        // It might need refinement if custom units can contain special regex characters.
        const regex = new RegExp(`\\b${customUnit}\\b`, 'g');
        unitsString = unitsString.replace(regex, `<${customUnit}>`);
    }
    return unitsString;
}

/**
 * Tags micro-units by replacing "µX" with "<microfrogX>" due to potential
 * incompatibilities with specific unit libraries (the problem also occurs with `unitpy` in Python).
 *
 * @param {string} unitsString - The unit string to process.
 * @returns {string} The unit string with micro-units "frogified".
 */
function tagMicroUnits(unitsString) {
    // Unicode representations of micro symbols:
    // U+00B5 --> µ (Micro Sign)
    // U+03BC --> μ (Greek Small Letter Mu)
    // U+1D6C2 --> 𝜇 (Mathematical Greek Small Letter Mu)
    // U+1D6C1 --> 𝝁 (Mathematical Bold Greek Small Letter Mu)
    const microSymbols = ["µ", "μ", "𝜇", "𝝁"];

    // Check if any micro symbol is in the string
    if (!microSymbols.some(symbol => unitsString.includes(symbol))) {
        return unitsString; // If none are found, return the original string unchanged
    }

    // Construct a regex pattern to detect any micro symbol followed by letters
    const pattern = new RegExp(`[${microSymbols.join('')}]([a-zA-Z]+)`, 'g');

    // Extract matches and sort them by length (longest first) for safe replacement
    // This part is a bit trickier in JS regex replace directly as re.findall in Python.
    // We'll use a replacer function to capture and modify.
    let tempMatches = [];
    let match;
    const findPattern = new RegExp(pattern.source, 'g'); // Ensure global flag for finding all matches
    while ((match = findPattern.exec(unitsString)) !== null) {
        tempMatches.push(match[0]); // Push the full matched string (e.g., "µm")
    }
    // Sort matches by length (longest first)
    const sortedMatches = [...new Set(tempMatches)].sort((a, b) => b.length - a.length);

    // Replace matches with custom unit notation <X>
    for (const matchStr of sortedMatches) {
        // Create the frogified version (e.g., "µm" becomes "<microfrogm>")
        // Note: matchStr[0] is the micro symbol, matchStr.slice(1) is the unit part.
        const frogifiedMatch = `<microfrog${matchStr.slice(1)}>`;
        // Replace all occurrences of this specific matchStr
        unitsString = unitsString.split(matchStr).join(frogifiedMatch);
    }

    return unitsString;
}

/**
 * Untags micro-units, converting them back from "<microfrogX>" to "µX".
 *
 * @param {string} unitsString - The unit string to process.
 * @returns {string} The unit string with micro-units untagged.
 */
function untagMicroUnits(unitsString) {
    if (!unitsString.includes("<microfrog")) { // Check if any frogified unit exists
        return unitsString;
    }
    // Pattern to detect the frogified micro-units: <microfrog([a-zA-Z]+)>
    const pattern = /<microfrog([a-zA-Z]+)>/g;
    // Replace frogified units with µ + the original unit suffix
    return unitsString.replace(pattern, 'µ$1');
}

/**
 * Converts inverse unit notations (e.g., `1/bar`) to exponential form (e.g., `(bar)**(-1)`).
 * This function is designed to work iteratively.
 *
 * @param {string} expression - The unit expression string.
 * @param {number} [depth=100] - The maximum number of iterations to prevent infinite loops.
 * @returns {string} The converted unit expression.
 */
function convertInverseUnits(expression, depth = 100) {
    // Patterns to match valid reciprocals while ignoring multiplied units
    // e.g., (1/bar)*bar should be handled correctly.
    // Pattern 1: 1/((1/.*?)) -> handles nested inverses like 1/(1/m)
    // Pattern 2: 1/([a-zA-Z]+) -> handles simple inverses like 1/bar
    const patterns = [
        /1\/\((1\/.*?)\)/g, // Group 1 captures the inner (1/...)
        /1\/([a-zA-Z]+)/g    // Group 1 captures the unit name
    ];

    let currentExpression = expression;
    for (let i = 0; i < depth; i++) {
        let newExpression = currentExpression;
        for (const pattern of patterns) {
            // Need to reset lastIndex for global regex in a loop
            pattern.lastIndex = 0;
            newExpression = newExpression.replace(pattern, `($1)^(-1)`);
        }

        // Stop early if no more changes are made
        if (newExpression === currentExpression) {
            break;
        }
        currentExpression = newExpression;
    }
    return currentExpression;
}

/**
 * Takes two units strings and returns the scaling ratio of `unitsString1 / unitsString2`.
 * E.g., `("kg/m/s", "g/m/s")` would return `1000`.
  *
 * @param {string} unitsString1 - The first units string.
 * @param {string} unitsString2 - The second units string.
 * @returns {number} The scaling ratio.
 * @throws {Error} If unit conversion fails or unit definitions are invalid.
 */
export function getUnitsScalingRatio(unitsString1, unitsString2) {
    if (unitsString1 === unitsString2) {
        return 1;
    }

    let processedUnitsString1 = unitsString1.replace(/\*\*/g, "^");
    let processedUnitsString2 = unitsString2.replace(/\*\*/g, "^");
    processedUnitsString1 = tagMicroUnits(processedUnitsString1);
    processedUnitsString2 = tagMicroUnits(processedUnitsString2);

    const customUnits1 = extractTaggedStrings(processedUnitsString1);
    const customUnits2 = extractTaggedStrings(processedUnitsString2);

    for (const customUnit of customUnits1) {
        addCustomUnitToMathJS(customUnit);
    }
    for (const customUnit of customUnits2) {
        addCustomUnitToMathJS(customUnit);
    }
    

    processedUnitsString1 = removeTaggedStrings(processedUnitsString1);
    processedUnitsString2 = removeTaggedStrings(processedUnitsString2);

    //Testing showed that MathJS required removal of () around powers for next lines.
    // so adding a regular expression line with help of copilot.
    //  mol^(-1)        	to      mol^-1
    // J*(mol^(-1))	        to      J*(mol^-1)
    // ((J)*(mol^(-1)))	    to      ((J)*(mol^-1))
    function removeParenthesesAfterCaret(str) {
        return str.replace(/\^\((-?\d+)\)/g, '^$1');
    }

    processedUnitsString1 = removeParenthesesAfterCaret(processedUnitsString1);
    processedUnitsString2 = removeParenthesesAfterCaret(processedUnitsString2);

    let ratioOnly;
    try {
        const unitsObjectConverted1 = math.unit(1, processedUnitsString1);
        const unitsObjectConverted2 = math.unit(1, processedUnitsString2);
        ratioOnly = math.divide(unitsObjectConverted1, unitsObjectConverted2);
    } 
    catch (e) { // **Correctly aligned**
        if (e.name === 'Error') {
            if (e.message.includes("Cannot convert") || e.message.includes("Missing key")) {
                throw new Error(`Error during unit conversion in getUnitsScalingRatio: ${e.message}. Ensure all unit definitions are correctly set. Unit 1: ${unitsString1}, Unit 2: ${unitsString2}`);
            } else if (e.message.includes("invalid") || e.message.includes("formatted")) {
                throw new Error(`Error during unit conversion in getUnitsScalingRatio: ${e.message}. Make sure unit values are valid and properly formatted. Unit 1: ${unitsString1}, Unit 2: ${unitsString2}`);
            }
        }
        throw new Error(`An unexpected error occurred in getUnitsScalingRatio when trying to convert units: ${e.message}. Double-check that your records have the same units. Original Unit 1: ${unitsString1}, Original Unit 2: ${unitsString2}. Processed Unit 1: ${processedUnitsString1}, Processed Unit 2: ${processedUnitsString2}`);
    } // **Closing brace correctly placed**
    return ratioOnly;
}
    

/**
 * Scales the x, y, and z values within a single data series dictionary.
 *
 * @param {object} dataseriesDict - The data series dictionary to scale.
 * @param {number} [numToScaleXValuesBy=1] - The factor to scale x values by.
 * @param {number} [numToScaleYValuesBy=1] - The factor to scale y values by.
 * @param {number} [numToScaleZValuesBy=1] - The factor to scale z values by.
 * @returns {object} The scaled data series dictionary (modified in place).
 */
export function scaleDataseriesDict(dataseriesDict, numToScaleXValuesBy = 1, numToScaleYValuesBy = 1, numToScaleZValuesBy = 1) {
    // In JavaScript, array multiplication can be done directly with `map`.
    // No `numpy` equivalent needed.
    // Ensure float conversion is done for each element.

    if (dataseriesDict.x && numToScaleXValuesBy !== 1) {
        dataseriesDict.x = datasereriesDict.x.map(val => parseFloat(val) * numToScaleXValuesBy);
    }
    if (dataseriesDict.y && numToScaleYValuesBy !== 1) {
        dataseriesDict.y = dataseriesDict.y.map(val => parseFloat(val) * numToScaleYValuesBy);
    }
    if (dataseriesDict.z && numToScaleZValuesBy !== 1) {
        dataseriesDict.z = dataseriesDict.z.map(val => parseFloat(val) * numToScaleZValuesBy);
    }
    return dataseriesDict;
}

/**
 * Scales the values in the data of a figure dictionary (figDict) and returns the scaled figDict.
 *
 * @param {object} figDict - The figure dictionary.
 * @param {number} [numToScaleXValuesBy=1] - The factor to scale x values by.
 * @param {number} [numToScaleYValuesBy=1] - The factor to scale y values by.
 * @returns {object} A new figure dictionary with scaled data values.
 */
export function scaleFigDictValues(figDict, numToScaleXValuesBy = 1, numToScaleYValuesBy = 1) {
    // Deep copy the figDict to avoid modifying the original.
    const scaledFigDict = JSON.parse(JSON.stringify(figDict));

    // Iterate across the data objects inside and change them.
    for (let i = 0; i < scaledFigDict.data.length; i++) {
        // Assuming z scaling is not directly controlled here, so pass 1.
        scaledFigDict.data[i] = scaleDataseriesDict(scaledFigDict.data[i], numToScaleXValuesBy, numToScaleYValuesBy, 1);
    }
    return scaledFigDict;
}

//END OF BLOCK OF CODE REQUIRED FOR UNITSCALING FOR JSON_EQUATIONER