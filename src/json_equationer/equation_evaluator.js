import { loadLibrary } from './../loadingUtils.js';

//start of block to get mathJS ready.
const math = await loadLibrary('math', 'mathjs/11.11.1/math.min.js');
//end of block to get mathJS ready.

function parseVariable(variableString) {
    // Split numeric part and unit using a regular expression.
    const match = variableString.match(/([\d.]+)\s*(.*)/);
    if (!match) throw new Error("Invalid variable format.");

    const numericValue = parseFloat(match[1]);
    const unit = match[2].trim();

    // Combine the numeric value with the parsed unit via math.js
    return math.multiply(numericValue, math.unit(unit));
}

function detectAndFormatUnits(equationStr) {
    // Regular expression to detect standalone numbers followed by units
    // This is called by parseEquation
    const pattern = /(\d+(\.\d+)?)\s*([a-zA-Z]+)/g;

    // Explanation of regular expression parts:
    // (\d+(\.\d+)?)
    //     \d+ → Matches one or more digits (e.g., "10", "100", "3").
    //     (\.\d+)? → Matches optional decimal values (e.g., "10.5", "3.14").
    //     This entire part captures numerical values, whether integers or decimals.
    // \s*
    //     Matches zero or more spaces between the number and the unit.
    //     Ensures flexibility in formatting (e.g., "10m" vs. "10 m").
    // ([a-zA-Z]+)
    //     Matches one or more alphabetical characters, capturing the unit symbol.
    //     Ensures that only valid unit names (e.g., "m", "s", "kg") are recognized.
    // Example Matches:
    //     "10 m"   → ("10", "", "m")
    //     "3.5 kg" → ("3.5", ".5", "kg")
    //     "100s"   → ("100", "", "s")

    // Create a temporary variable to store the transformed equation
    let formattedEquation = equationStr.replace(pattern, (match, magnitude, _, unit) => {
        let result = match; // Default to original match in case of errors
        //console.log("Right before the match is used", match, magnitude, unit, "Type:", typeof match);
        try {
            // Format as "magnitude unit" instead of using math.unit()
            // const quantity = math.unit(`${magnitude} ${unit}`); // Commented out
            //console.log("Right after the match is used", `${magnitude} ${unit}`, "Type:", typeof magnitude);
            result = `(${magnitude} ${unit})`;
        } catch {
            // No assignment needed, `result` already defaults to `match`
        }
        return result;
    });

    // Return the final transformed equation
    return formattedEquation;
}


function parseEquation(equationStr, variables) {
    // Sort variable names by length in descending order to avoid partial replacements
    // this calls detectAndFormatUnits
    // input and output example --
    //  input: (10 m - y) / x  
    //  output: ((10 m) - ((3 meter))) / ((2 m) / s)
    //  And that output can go directly into math.evaluate
    const variablesSortedByName = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);

    // Replace constants first
    variablesSortedByName.forEach(([varName, varValue]) => {
        if (typeof varValue !== 'object' || !varValue.units) {
            equationStr = equationStr.replace(new RegExp(`\\b${varName}\\b`, 'g'), String(varValue));
        }
    });

    // Replace variables with magnitudes and units, formatting as "value unit"
    variablesSortedByName.forEach(([varName, varValue]) => {
        if (typeof varValue === 'object' && varValue.units) {
            try {
                // Format variable as "value unit" instead of using math.unit()
                // const unitValue = math.unit(`${varValue.value} ${varValue.units}`); // Commented out
                equationStr = equationStr.replace(new RegExp(`\\b${varName}\\b`, 'g'), `(${varValue.value} ${varValue.units})`);
            } catch {
                console.warn(`Invalid unit conversion for variable: ${varName}`);
            }
        }
    });

    // Detect and format standalone numbers with units
    equationStr = detectAndFormatUnits(equationStr);

    return equationStr;
}


/**
 * removeSuperscriptParentheses normalizes exponent notation in a unit string.
 * For example, it converts "mol^(-1)" to "mol^-1".
 *
 * @param {string} unitStr - The unit string to normalize.
 * @returns {string} The normalized unit string.
 */
function removeSuperscriptParentheses(unitStr) {
    return unitStr.replace(/([a-zA-Z]+)\^\(([-+]?[0-9]*\.?[0-9]+)\)/g, '$1^$2');
}

/**
 * Solves for the specified dependent variable in an equation involving multiple independent variables.
 * This function calls helper functions (parseEquation, parseVariable, and detectAndFormatUnits) as needed
 * to properly format the equation and evaluate it using math.js.
 *
 * Example usage:
 * const independentVariablesValuesAndUnits = {
 *   x: "2 m/s",
 *   y: "3 meter"
 * };
 * const equationString = "t = (10 m - y) / x"; // Equation rearranged so that t is isolated.
 * const dependentVariable = "t"
 * const solutions = solveEquation(equationString, independentVariablesValuesAndUnits, dependentVariable);
 * // Returns: [math.js Unit object representing t] which prints as 3.5 s
 *
 * @param {string} equationString - The equation as a string.
 * @param {Object} independentVariablesValuesAndUnits - Object mapping variable names to strings (e.g., "2 m/s").
 * @param {string} dependentVariable - The name of the dependent variable.
 * @returns {Array} An array containing the solution for the dependent variable.
 * @throws {Error} If the equation is not in the expected simple format.
 */
function solveEquation(equationString, independentVariablesValuesAndUnits, dependentVariable) {
    // Step 1: Replace any '**' with '^' for exponentiation.
    equationString = equationString.replace(/\*\*/g, '^');
    // Step 2: Split the equation at '='.
    const parts = equationString.split('=');
    if (parts.length !== 2) {
        throw new Error(`Equation must contain exactly one '=' sign and have the dependent variable isolated on one side. Equation: ${equationString}`);
    }
    const leftSide = parts[0].trim();
    const rightSide = parts[1].trim();

    // Step 3: Determine which side of the "=" contains the dependent variable.
    let expressionToEvaluate;
    if (leftSide === dependentVariable) {
        expressionToEvaluate = rightSide;
    } else if (rightSide === dependentVariable) {
        expressionToEvaluate = leftSide;
    } else {
        throw new Error("Complex equation solving not implemented. Ensure the dependent variable is isolated on left or right side.");
    }

    // Step 4: Process the expression by calling parseEquation.
    // This function replaces variable names with their "(value unit)" strings and internally calls detectAndFormatUnits.
    expressionToEvaluate = parseEquation(expressionToEvaluate, independentVariablesValuesAndUnits);
    expressionToEvaluate = expressionToEvaluate.replace(/\*\*/g, '^'); // replace because the independent variables can introduce ** style exponents back in.
    // Step 5: Build the evaluation scope for math.js.
    // For each independent variable, use parseVariable to convert its string (e.g., "2 m/s")
    // into a math.js Unit object. (Your parseVariable function should now call removeSuperscriptParentheses.)
    //let scope = {};
    //for (let varName in independentVariablesValuesAndUnits) {
    //            const parsedVariable = parseVariable(independentVariablesValuesAndUnits[varName]);
    //            scope[varName] = parsedVariable;
    //        }

    // Step 6: Evaluate the processed expression using math.js.
    //let result = math.evaluate(expressionToEvaluate, scope);
    
    let result = math.evaluate(expressionToEvaluate); //without scope
    // Return the result as an array (to mimic the Python version's list output).
    return [result];
    }

function parseEquationDict(equationDict) {
    function extractValueUnits(entry) {
        const trimmedEntry = entry.trim(); // Remove leading/trailing whitespace
        const splitEntry = trimmedEntry.split(" ", 2); // Split on the first space
        if (splitEntry.length > 1) {
            const value = splitEntry[0];
            const units = splitEntry[1]; // Everything after the number
            return [value, units];
        } else {
            return [parseFloat(splitEntry[0]), null]; // Handle constants without units
        }
    }

    function extractConstants(constantsDict) {
        const extractedConstants = {};
        for (const [name, value] of Object.entries(constantsDict)) {
            extractedConstants[name] = extractValueUnits(value);
        }
        return extractedConstants;
    }

    function extractEquation(equationString) {
        const variablesList = equationString.match(/[A-Za-z]+/g) || [];
        return { equationString, variablesList };
    }

    const graphicalDimensionality = equationDict.hasOwnProperty("graphical_dimensionality")
        ? equationDict["graphical_dimensionality"]
        : 2;

    const constantsExtractedDict = extractConstants(equationDict["constants"]);
    const equationExtractedDict = extractEquation(equationDict["equation_string"]);

    const xMatch = extractValueUnits(equationDict["x_variable"]);
    const yMatch = extractValueUnits(equationDict["y_variable"]);
    let zMatch = null;
    if (graphicalDimensionality === 3) {
        zMatch = extractValueUnits(equationDict["z_variable"]);
    }

    const xVariableExtractedDict = { label: xMatch[0], units: xMatch[1] };
    const yVariableExtractedDict = { label: yMatch[0], units: yMatch[1] };
    let zVariableExtractedDict = null;
    if (graphicalDimensionality === 3) {
        zVariableExtractedDict = { label: zMatch[0], units: zMatch[1] };
    }

    function prepareIndependentVariables(constantsExtractedDict) {
        const independentVariablesDict = {};
        for (const [name, [value, units]] of Object.entries(constantsExtractedDict)) {
            independentVariablesDict[name] = units ? `${value} ${units}` : `${value}`;
        }
        return independentVariablesDict;
    }

    const independentVariablesDict = prepareIndependentVariables(constantsExtractedDict);

    if (graphicalDimensionality === 2) {
        return [independentVariablesDict, constantsExtractedDict, equationExtractedDict, xVariableExtractedDict, yVariableExtractedDict];
    } else if (graphicalDimensionality === 3) {
        return [independentVariablesDict, constantsExtractedDict, equationExtractedDict, xVariableExtractedDict, yVariableExtractedDict, zVariableExtractedDict];
    }
}


function generateMultiplicativePoints(rangeMin, rangeMax, numOfPoints = null, factor = null, reverseScaling = false) {
    /**
     * Generates a sequence of points using relative spacing within a normalized range.
     * 
     * - Spacing between points changes multiplicatively (e.g., doubling means each interval doubles).
     * - Returns rangeMin and rangeMax explicitly in all cases.
     * - Works for negative values and cases where min is negative while max is positive.
     * - If `reverseScaling` is true, exponential scaling occurs from the max end instead.
     * 
     * @param {number} rangeMin - The starting value of the sequence.
     * @param {number} rangeMax - The maximum limit for generated values.
     * @param {number} [numOfPoints=null] - Desired number of points (excluding min/max).
     * @param {number} [factor=null] - Multiplication factor for spacing between successive values.
     * @param {boolean} [reverseScaling=false] - If true, spacing is applied in reverse direction.
     * 
     * @returns {number[]} List of generated points.
     * 
     * @throws {Error} If neither numOfPoints nor factor is provided.
     */

    // Define normalized bounds
    const relativeMin = 0;
    const relativeMax = 1;
    const totalValueRange = rangeMax - rangeMin;

    let normalizedPoints = [];

    // Case 1: numOfPoints is provided (factor may be provided too)
    if (numOfPoints !== null && numOfPoints > 1) {
        // Case 1a: Generate points using equal spacing in relative space
        const equalSpacingList = [relativeMin]; // Start at normalized min
        const equalSpacingValue = (relativeMax - relativeMin) / (numOfPoints - 1); // Normalized step size

        for (let stepIndex = 1; stepIndex < numOfPoints; stepIndex++) {
            equalSpacingList.push(relativeMin + stepIndex * equalSpacingValue);
        }

        // Case 1b: Generate points using multiplication factor (if provided)
        const factorSpacingList = [relativeMin];
        if (factor !== null && factor > 0) {
            let relativeSpacing = 0.01; // Start at 1% of the range (normalized units)
            let currentPosition = relativeMin;

            while (currentPosition + relativeSpacing < relativeMax) {
                currentPosition += relativeSpacing;
                factorSpacingList.push(currentPosition);
                relativeSpacing *= factor; // Multiply spacing by factor
            }
        }

        // Compare list lengths explicitly and select the better approach
        normalizedPoints = factorSpacingList.length > equalSpacingList.length ? factorSpacingList : equalSpacingList;
    }
    // Case 2: Only factor is provided, generate points using the multiplication factor
    else if (factor !== null && factor > 0) {
        let relativeSpacing = 0.01; // Start at 1% of the range
        let currentPosition = relativeMin;
        normalizedPoints = [relativeMin];

        while (currentPosition + relativeSpacing < relativeMax) {
            currentPosition += relativeSpacing;
            normalizedPoints.push(currentPosition);
            relativeSpacing *= factor; // Multiply spacing by factor
        }
    }
    // Case 3: Neither numOfPoints nor factor is provided, compute equal spacing dynamically
    else if (numOfPoints === null && factor === null) {
        const equalSpacingValue = (relativeMax - relativeMin) / 9; // Default to 9 intermediate points
        normalizedPoints = Array.from({ length: 9 }, (_, stepIndex) => relativeMin + stepIndex * equalSpacingValue);
    }
    // Case 4: Invalid input case—neither numOfPoints nor factor is properly set
    else {
        throw new Error("Either numOfPoints or factor must be provided.");
    }

    // Ensure the last relative point is relativeMax before scaling
    if (normalizedPoints[normalizedPoints.length - 1] !== relativeMax) {
        normalizedPoints.push(relativeMax);
    }

    // Scale normalized points back to the actual range
    const scaledPoints = reverseScaling
        ? normalizedPoints.map(p => rangeMax - ((relativeMax - p) * totalValueRange))
        : normalizedPoints.map(p => rangeMin + (p * totalValueRange));

    return scaledPoints;
}

/**
 * Generates a sequence of points based on the specified spacing method.
 *
 * Supported spacing types:
 * - "linear": Evenly spaced values between rangeMin and rangeMax.
 * - "logarithmic": Logarithmically spaced values.
 * - "exponential": Exponentially increasing values.
 * - A real number > 0: Used as a multiplication factor to generate values.
 *
 * @param {number} numOfPoints - The number of points to generate. Default is 10.
 * @param {number} rangeMin - The starting value of the sequence. Default is 0.
 * @param {number} rangeMax - The maximum limit for generated values. Default is 1.
 * @param {string|number} pointsSpacing - Defines the spacing method or multiplication factor.
 * @returns {number[]} List of generated points.
 * @throws {Error} If an unsupported spacing type is provided.
 */
function generatePointsBySpacing(numOfPoints = 10, rangeMin = 0, rangeMax = 1, pointsSpacing = "linear") {
    let spacingType = typeof pointsSpacing === "string" ? pointsSpacing.toLowerCase() : null;
    let pointsList = [];

    if (numOfPoints === null) numOfPoints = 10;
    if (rangeMin === null) rangeMin = 0;
    if (rangeMax === null) rangeMax = 1;
    if (spacingType === "none" || spacingType === "") spacingType = "linear";

    if (spacingType === "linear") {
        pointsList = Array.from({ length: numOfPoints }, (_, i) => 
            rangeMin + (i * (rangeMax - rangeMin) / (numOfPoints - 1))
        );
    } else if (spacingType === "logarithmic") {
        pointsList = Array.from({ length: numOfPoints }, (_, i) => 
            rangeMin * math.pow(rangeMax / rangeMin, i / (numOfPoints - 1))
        );
    } else if (spacingType === "exponential") {
        pointsList = Array.from({ length: numOfPoints }, (_, i) => 
            rangeMin * math.exp(i * math.log(rangeMax / rangeMin) / (numOfPoints - 1))
        );
    } else if (typeof pointsSpacing === "number" && pointsSpacing > 0) {
        pointsList = generateMultiplicativePoints(rangeMin, rangeMax, numOfPoints, pointsSpacing);
    } else {
        throw new Error(`Unsupported spacing type: ${pointsSpacing}`);
    }

    return pointsList;
}


/**
 * Extracts the necessary range and parameters from rangeDict and generates a sequence of points.
 * In practice, rangeDict can be a full equation dictionary with extra fields that will not be used.
 *
 * The function follows these rules:
 * 1. If `{variableName}_range_limits` is provided as a list of two numbers, it is used as the range.
 * 2. Otherwise, `{variableName}_range_default` is used as the range.
 * 3. Calls generatePointsBySpacing() to generate the appropriate sequence based on numOfPoints and pointsSpacing.
 *
 * @param {Object} rangeDict - Dictionary containing equation details, including range limits, numOfPoints, and spacing type.
 * @param {string} [variableName="x"] - Name of the variable to determine the range settings. Defaults to 'x'.
 * @returns {number[]} List of generated points.
 * @throws {Error} If no valid range limits exist.
 */
function generatePointsFromRangeDict(rangeDict, variableName = "x") {
    const rangeDefaultKey = `${variableName}_range_default`;
    const rangeLimitsKey = `${variableName}_range_limits`;

    let rangeMin, rangeMax;

    // Assigning default range values
    if (rangeDict[rangeDefaultKey]) {
        [rangeMin, rangeMax] = rangeDict[rangeDefaultKey];
    } else {
        throw new Error(`Missing ${rangeDefaultKey} in rangeDict.`);
    }

    // If `{variableName}_range_limits` is provided, update values only if they tighten the range
    if (rangeDict[rangeLimitsKey]) {
        const [limitMin, limitMax] = rangeDict[rangeLimitsKey];

        if (limitMin !== null && limitMin > rangeMin) {
            rangeMin = limitMin;
        }
        if (limitMax !== null && limitMax < rangeMax) {
            rangeMax = limitMax;
        }
    }

    // Ensure valid range exists
    if (rangeMin === undefined || rangeMax === undefined) {
        throw new Error(`At least one min and one max must be specified between ${rangeDefaultKey} and ${rangeLimitsKey}.`);
    }

    // Generate points using the specified spacing method
    // Now using string literals directly within bracket notation for all accesses
    return generatePointsBySpacing(rangeDict['num_of_points'], rangeMin, rangeMax, rangeDict['points_spacing']);
}


/**
 * ## Start of Portion of code for parsing out tagged custom units and returning them ##
 */

/**
 * Puts markup around custom units with '<' and '>' in a given string.
 *
 * The custom units are sorted from longest to shortest, and each occurrence in the string
 * is wrapped in '<' and '>'.
 *
 * @param {string} unitsString - The original units string.
 * @param {string[]} customUnitsList - List of custom unit strings.
 * @returns {string} The units string with custom units wrapped in '<' and '>'.
 */
function returnCustomUnitsMarkup(unitsString, customUnitsList) {
    // Sort the custom_units_list from longest to shortest.
    const sortedCustomUnitsList = customUnitsList.slice().sort((a, b) => b.length - a.length);
    // For each custom unit, replace all occurrences in the string.
    for (const customUnit of sortedCustomUnitsList) {
        // Escape special regex characters in the custom unit.
        const escapedCustomUnit = customUnit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedCustomUnit, 'g');
        unitsString = unitsString.replace(regex, '<' + customUnit + '>');
    }
    return unitsString;
}

/**
 * Extracts tags surrounded by '<' and '>' from a given string.
 *
 * These tags (used for custom units) are returned as an array of unique strings,
 * sorted from longest to shortest.
 *
 * @param {string} text - The input text to search for tags.
 * @returns {string[]} An array of unique tags (without the angle brackets), sorted by length descending.
 */
function extractTaggedStrings(text) {
    const regex = /<(.*?)>/g;
    let match;
    const tags = [];
    // Loop through all matches of the pattern.
    while ((match = regex.exec(text)) !== null) {
        tags.push(match[1]);
    }
    // Remove duplicates by using a Set, then sort from longest to shortest.
    const uniqueTags = Array.from(new Set(tags));
    uniqueTags.sort((a, b) => b.length - a.length);
    return uniqueTags;
}

/**
 * ## End of Portion of code for parsing out tagged custom units and returning them ##
 */

    /**
 * Converts expressions like "1/bar" to "(bar)**(-1)" iteratively.
 * The function works recursively, stopping when no further changes occur.
 *
 * @param {string} expression - The input mathematical expression.
 * @param {number} [depth=100] - Maximum iterations to refine the expression.
 * @returns {string} - The transformed expression.
 */
function convertInverseUnits(expression, depth = 100) {
    // Patterns to match valid reciprocals while ignoring multiplied units, so "1/bar * bar" is handled correctly.
    const patterns = [/1\/\((1\/.*?)\)/g, /1\/([a-zA-Z]+)/g];

    for (let i = 0; i < depth; i++) {
        let newExpression = expression;

        patterns.forEach(pattern => {
            newExpression = newExpression.replace(pattern, "($1)**(-1)");
        });

        // Stop early if no more changes are made
        if (newExpression === expression) {
            break;
        }
        expression = newExpression;
    }
    return expression;
}

/**
 * Splits a string at the first occurrence of a delimiter.
 *
 * @param {string} str - The input string to split.
 * @param {string} [delimiter=" "] - The delimiter to split the string at.
 * @returns {string[]} - An array with two elements: [before delimiter, after delimiter].
 */
function splitAtFirstDelimiter(str, delimiter = " ") {
    return str.split(delimiter, 2);
}

/**
 * Helper function to clean custom unit brackets. Removes '<' and '>' from a string.
 * In the future, this could be made more general rather than hardcoded for angle brackets.
 *
 * @param {string} inputString - The string to clean.
 * @returns {string} The string with angle brackets removed.
 */
function cleanBrackets(inputString) {
    // Use replaceAll to ensure all occurrences are removed
    return inputString.replace(/</g, "").replace(/>/g, "");
}


/**
 * Evaluates an equation dictionary and returns computed x_points, y_points (or z_points for 3D),
 * along with their associated units. For equations with multiple solutions (as in a circle),
 * all solutions are returned.
 *
 * NOTE: This function calls several helpers which have their own performance considerations.
 *
 * @param {Object} equationDict - Equation dictionary with keys such as 'equation_string',
 *                                'x_range_default', 'num_of_points', etc.
 * @param {boolean} [verbose=false] - If true, logs debugging information.
 * @returns {Object} evaluatedDict containing keys: graphical_dimensionality, x_units, y_units, 
 *          x_points, y_points and, for 3D, z_units and z_points.
 * @throws {Error} If graphical dimensionality is not supported or missing.
 */
    function evaluateEquationDict(equationDict, verbose = false) {
    // Create a deep copy of the input dictionary to avoid modifying the original mutable object.
    equationDict = JSON.parse(JSON.stringify(equationDict));

    // ---- Begin: Block to extract the x_points (and y_points for 3D) needed ----
    let equationString = equationDict.equation_string; // Use the copied object
    // ... rest of your function logic would then use `equationDict`
    // If graphical_dimensionality is not provided, default to 2.
    let graphicalDimensionality = equationDict.graphical_dimensionality || 2;
    let graphicalDimensionalityAdded = !("graphical_dimensionality" in equationDict);
    equationDict.graphical_dimensionality = graphicalDimensionality;

    // Allow override of verbose flag
    if (equationDict.verbose !== undefined) {
        verbose = equationDict.verbose;
    }

    // Generate the x_points range; for 3D, also generate y_points.
    const xPoints = generatePointsFromRangeDict(equationDict, "x");
    let yPoints;
    if (graphicalDimensionality === 3) {
        yPoints = generatePointsFromRangeDict(equationDict, "y");
    }
    // ---- End: Points extraction block ----

    // ---- Begin: Extract necessary variables using parseEquationDict ----
    let independentVariablesDict, constantsExtractedDict, equationExtractedDict;
    let xVariableExtractedDict, yVariableExtractedDict, zVariableExtractedDict;
    if (graphicalDimensionality === 2) {
        [independentVariablesDict, constantsExtractedDict, equationExtractedDict, xVariableExtractedDict, yVariableExtractedDict] =
            parseEquationDict(equationDict);
    } else if (graphicalDimensionality === 3) {
        [independentVariablesDict, constantsExtractedDict, equationExtractedDict, xVariableExtractedDict, yVariableExtractedDict, zVariableExtractedDict] =
            parseEquationDict(equationDict);
    } else {
        throw new Error("Error: graphical_dimensionality not received and/or not evaluatable by current code.");
    }
    // ---- End: parseEquationDict block ----


    // ---------------------------------------------------------------------------
    // Start of block to check for any custom units and add them to the mathJS if necessary.
    let customUnitsList = []; 

    // Loop over each key in independentVariablesDict.
    for (const constantEntryKey of Object.keys(independentVariablesDict)) {
        const independentVariablesString = independentVariablesDict[constantEntryKey];
        const customUnitsExtracted = extractTaggedStrings(independentVariablesString);
        independentVariablesDict[constantEntryKey] = cleanBrackets(independentVariablesDict[constantEntryKey]);
        // For each custom unit found, define it in mathJS.
        customUnitsExtracted.forEach(customUnit => {
        try { math.unit(customUnit); } catch { math.createUnit(customUnit); }
        });
        customUnitsList.push(...customUnitsExtracted);
    }

    // Check the x_variable_extracted_dict for custom units.
    let customUnitsExtracted = extractTaggedStrings(xVariableExtractedDict.units);
    xVariableExtractedDict.units = cleanBrackets(xVariableExtractedDict.units);
    customUnitsExtracted.forEach(customUnit => {
        try { math.unit(customUnit); } catch { math.createUnit(customUnit); }
    });
    customUnitsList.push(...customUnitsExtracted);

    // Check the y_variable_extracted_dict (technically not needed).
    customUnitsExtracted = extractTaggedStrings(yVariableExtractedDict.units);
    yVariableExtractedDict.units = cleanBrackets(yVariableExtractedDict.units);
    customUnitsExtracted.forEach(customUnit => {
        try { math.unit(customUnit); } catch { math.createUnit(customUnit); }
    });
    customUnitsList.push(...customUnitsExtracted);

    if (graphicalDimensionality === 3) {
        // Check the z_variable_extracted_dict (technically not needed).
        customUnitsExtracted = extractTaggedStrings(zVariableExtractedDict.units);
        zVariableExtractedDict.units = cleanBrackets(zVariableExtractedDict.units);
        customUnitsExtracted.forEach(customUnit => {
        try { math.unit(customUnit); } catch { math.createUnit(customUnit); }
        });
        customUnitsList.push(...customUnitsExtracted);
    }

    // Also check for any custom units in the equation_string.
    customUnitsExtracted = extractTaggedStrings(equationString);
    equationString = cleanBrackets(equationString);
    customUnitsExtracted.forEach(customUnit => {
        try { math.unit(customUnit); } catch { math.createUnit(customUnit); }
    });
    customUnitsList.push(...customUnitsExtracted);

    // Remove duplicates by converting to a Set and back to an array
    customUnitsList = [...new Set(customUnitsList)];
    // Sort the custom units list from longest to shortest.
    customUnitsList.sort((a, b) => b.length - a.length);
    // End of block to check for any custom units and add them to the mathJS if necessary.
    // ---------------------------------------------------------------------------

    // ---- Begin: Define independent variables ----
    let independentVariables = Object.keys(independentVariablesDict);
    independentVariables.push(xVariableExtractedDict.label);
    if (graphicalDimensionality === 3) {
        independentVariables.push(yVariableExtractedDict.label);
    }
    // ---- End: Define independent variables ----

    // ---- Begin: Define the dependent variable and prepare to solve ----
    let dependentVariable = ""; //initialized
    let zUnits = "";  // initialized
    let yUnits = "";  // initialized
    if (graphicalDimensionality === 3) {
        dependentVariable = zVariableExtractedDict.label;
    } else {
        dependentVariable = yVariableExtractedDict.label;
    }


    let solvedCoordinatesList = [];
    let dependentVariableUnits = ""; // initialized

    // For 2D, input_points_list is just xPoints.
    // For 3D, use Cartesian product of xPoints and yPoints.
    let inputPointsList;
    if (graphicalDimensionality === 2) {
        inputPointsList = xPoints;
    } else if (graphicalDimensionality === 3) {
        inputPointsList = [];
        for (const x of xPoints) {
        for (const y of yPoints) {
            inputPointsList.push([x, y]);
        }
        }
    } else {
        throw new Error("Error: graphical_dimensionality not received and/or not evaluatable by current code.");
    }
    let firstDependentVariablePointWithUnits = null; //just initializing
    // Loop over each input point, solve the equation, and store the results.
    for (const currentPoint of inputPointsList) {
        // Set independent variable values (with units) for the current point.
        if (graphicalDimensionality === 2) {
        independentVariablesDict[xVariableExtractedDict.label] = `${currentPoint} ${xVariableExtractedDict.units}`;
        } else if (graphicalDimensionality === 3) {
        independentVariablesDict[xVariableExtractedDict.label] = `${currentPoint[0]} ${xVariableExtractedDict.units}`;
        independentVariablesDict[yVariableExtractedDict.label] = `${currentPoint[1]} ${yVariableExtractedDict.units}`;
        }

        if (verbose) console.log("Evaluating point:", currentPoint);
        const dependentVariableSolutions = solveEquation(equationString, independentVariablesDict, dependentVariable);

        if (dependentVariableSolutions) {
            for (const dependentVariablePointWithUnits of dependentVariableSolutions) {
                const dependentVariablePointWithUnitsAsArray = dependentVariablePointWithUnits.toString().split(" ", 2);
                const solutionValue = parseFloat(dependentVariablePointWithUnitsAsArray[0]);
                // Capture units only from the first evaluation (then skip after that)
                if (!dependentVariableUnits && dependentVariablePointWithUnitsAsArray.length > 1) {
                    dependentVariableUnits = math.unit(1, dependentVariablePointWithUnitsAsArray[1]); // Store 1 reference unit so we can divide by it in each iteration.
                    firstDependentVariablePointWithUnits = dependentVariablePointWithUnits
                    if (graphicalDimensionality === 2){yUnits=dependentVariableUnits}
                    if (graphicalDimensionality === 3){zUnits=dependentVariableUnits}
                }

                // // Convert all subsequent iterations to match the first evaluation's units
                let standardizedSolution = dependentVariablePointWithUnits;
                standardizedSolution = math.divide(dependentVariablePointWithUnits, dependentVariableUnits);

                if (graphicalDimensionality === 2) {
                    solvedCoordinatesList.push([currentPoint, standardizedSolution]);
                } else if (graphicalDimensionality === 3) {
                    solvedCoordinatesList.push([currentPoint[0], currentPoint[1], standardizedSolution]);
                }
            }
        }

    }
    // ---- End: Solve loop ----

    // Separate the coordinates into individual arrays.
    let xPointsFinal, yPointsFinal, zPointsFinal;
    if (graphicalDimensionality === 2) {
        [xPointsFinal, yPointsFinal] = solvedCoordinatesList.reduce(
        ([xs, ys], [x, y]) => {
            xs.push(x);
            ys.push(y);
            return [xs, ys];
        },
        [[], []]
        );
    } else if (graphicalDimensionality === 3) {
        [xPointsFinal, yPointsFinal, zPointsFinal] = solvedCoordinatesList.reduce(
        ([xs, ys, zs], [x, y, z]) => {
            xs.push(x);
            ys.push(y);
            zs.push(z);
            return [xs, ys, zs];
        },
        [[], [], []]
        );
    }

    // Convert units to proper format and remove "1 " if present
    const formatUnits = unitStr => {
        let formatted = unitStr.toString().replace("1 ", ""); // Remove "1 " if it exists
        return formatted.includes("(") ? formatted : `(${formatted})`;
    };

    let xUnits = formatUnits(xVariableExtractedDict.units);
    if (graphicalDimensionality === 2) {
        yUnits = formatUnits(yUnits);
    } else if (graphicalDimensionality === 3) {
        yUnits = formatUnits(yVariableExtractedDict.units);
        zUnits = formatUnits(zUnits);
    }


    // Convert inverse units.
    yUnits = convertInverseUnits(yUnits);
    xUnits = convertInverseUnits(xUnits);
    if (graphicalDimensionality === 3) {
        zUnits = convertInverseUnits(zUnits);
    }

    // Reapply any custom unit markup for the dependent variable.
    if (graphicalDimensionality === 2) {
        yUnits = returnCustomUnitsMarkup(yUnits, customUnitsList);
    }
    if (graphicalDimensionality === 3) {
        zUnits = returnCustomUnitsMarkup(zUnits, customUnitsList);
    }

    // Build the evaluatedDict to return.
    let evaluatedDict = {
        graphical_dimensionality: graphicalDimensionality,
        x_units: xUnits,
        y_units: yUnits,
        x_points: xPointsFinal,
        y_points: yPointsFinal
    };
    if (graphicalDimensionality === 3) {
        evaluatedDict.z_units = zUnits;
        evaluatedDict.z_points = zPointsFinal;
    }

    // Remove the added graphical_dimensionality key if it wasn’t originally provided.
    if (graphicalDimensionalityAdded) {
        delete equationDict.graphical_dimensionality;
    }

    return evaluatedDict;
}

export {parseVariable};
window.parseVariable = parseVariable;
export {parseEquation};
window.parseEquation = parseEquation;
export {solveEquation};
window.solveEquation = solveEquation;
export {parseEquationDict};
window.parseEquationDict = parseEquationDict
export {generateMultiplicativePoints};
window.generateMultiplicativePoints = generateMultiplicativePoints;
export {generatePointsBySpacing};
window.generatePointsBySpacing = generatePointsBySpacing;
export {generatePointsFromRangeDict};
window.generatePointsFromRangeDict = generatePointsFromRangeDict;
export {returnCustomUnitsMarkup};
window.returnCustomUnitsMarkup = returnCustomUnitsMarkup;
export {extractTaggedStrings};
window.extractTaggedStrings = extractTaggedStrings;
export {convertInverseUnits};
window.convertInverseUnits = convertInverseUnits;
export {splitAtFirstDelimiter};
window.splitAtFirstDelimiter = splitAtFirstDelimiter;
export {evaluateEquationDict};
window.evaluateEquationDict = evaluateEquationDict;