// equation.js
import { evaluateEquationDict } from './equation_evaluator.js'; // Import the evaluator function

class Equation {
    /**
     * A class to manage mathematical equations with units and to evaluate them.
     * Provides utilities for evaluating, formatting, exporting, and printing.
     *
     * Initialization:
     * - Now initialized as a blank plain JavaScript object.
     * - Defaults to an empty equation with predefined structure.
     * - Accepts an optional plain object (`initialDict`) to prepopulate the equation object.
     *
     * Example structure:
     * ```
     * const customDict = {
     * equation_string: "k = A * (e ** (-Ea / (R * T)))",
     * x_variable: "T (K)",
     * y_variable: "k (s**-1)",
     * constants: {"Ea": "30000 J/mol", "R": "8.314 J/(mol*K)", "A": "1*10**13 (s**-1)", "e": "2.71828"},
     * num_of_points: 10,
     * x_range_default: [200, 500],
     * x_range_limits: [null, 600],
     * points_spacing: "Linear",
     * graphical_dimensionality: 2
     * };
     *
     * const equationInstance = new Equation(customDict);
     * ```
     */

    constructor(initialDict = null) {
        /**Initialize an empty equation plain object.*/
        this.equationDict = {
            equation_string: '',
            x_variable: '',
            y_variable: '',
            constants: {}, // Now a plain object
            num_of_points: null, // Expected: Integer, defines the minimum number of points to be calculated for the range.
            x_range_default: [0, 1], // Default to [0,1] instead of an empty list.
            x_range_limits: [null, null], // Allows null for either limit.
            x_points_specified: [], // This was a Map before but seems like it should be an array
            points_spacing: '',
            reverse_scaling: false,
        };

        // If a plain object is provided, update the default values
        if (initialDict && Object.keys(initialDict).length > 0) {
            // Ensure initialDict is a plain object for direct merge
            if (typeof initialDict === 'object' && initialDict !== null && !Array.isArray(initialDict)) {
                // Deep merge for nested objects/arrays like 'constants'
                this.equationDict = this.#deepMerge(this.equationDict, initialDict);
            } else {
                throw new TypeError("initialDict must be a plain JavaScript object.");
            }
        }
    }

    // Helper for deep merging objects (important for 'constants')
    #deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    if (!target[key]) {
                        target[key] = {};
                    }
                    this.#deepMerge(target[key], source[key]); // Recurse for nested objects
                } else if (Array.isArray(source[key])) {
                    target[key] = [...source[key]]; // Create a new array for arrays
                } else {
                    target[key] = source[key]; // Assign primitive values
                }
            }
        }
        return target;
    }


    validateUnit(value) {
        /**Ensure that the value is either a pure number or contains a unit.*/
        const unitPattern = /^\d+(\.\d+)?(.*)?$/;
        if (!unitPattern.test(value)) {
            throw new Error(`Invalid format: '${value}'. Expected a numeric value, optionally followed by a unit.`);
        }
    }

    addConstants(constants) {
        /**Add constants to the equation object, supporting both single and multiple additions.*/
        if (typeof constants === 'object' && constants !== null && !Array.isArray(constants)) {
            // Single constant case (constants is a plain object)
            for (let [name, value] of Object.entries(constants)) {
                this.validateUnit(value);
                this.equationDict.constants[name] = value; // Accessing constants as a plain object
            }
        } else if (Array.isArray(constants)) { // Multiple constants case (array of plain objects)
            for (let constantObj of constants) {
                if (typeof constantObj === 'object' && constantObj !== null && !Array.isArray(constantObj)) {
                    for (let [name, value] of Object.entries(constantObj)) {
                        this.validateUnit(value);
                        this.equationDict.constants[name] = value; // Accessing constants as a plain object
                    }
                } else {
                    throw new Error("Each item in the list must be a plain object containing a constant name-value pair.");
                }
            }
        } else {
            throw new TypeError("Expected a plain object for one constant or an array of plain objects for multiple constants.");
        }
    }

    setXVariable(xVariable) {
        /**
         * Set the x-variable in the equation object.
         * Expected format: A descriptive string including the variable name and its unit.
         * Example: "T (K)" for temperature in Kelvin.
         */
        this.equationDict.x_variable = xVariable; // Direct property assignment
    }

    setYVariable(yVariable) {
        /**
         * Set the y-variable in the equation object.
         * Expected format: A descriptive string including the variable name and its unit.
         * Example: "k (s**-1)" for a rate constant with inverse seconds as the unit.
         */
        this.equationDict.y_variable = yVariable; // Direct property assignment
    }

    setZVariable(zVariable) {
        /**
         * Set the z-variable in the equation object.
         * Expected format: A descriptive string including the variable name and its unit.
         * Example: "E (J)" for energy with joules as the unit.
         */
        this.equationDict.z_variable = zVariable; // Direct property assignment
    }

    setXRangeDefault(xRange) {
        /**
         * Set the default x range.
         * Expected format: An array of two numeric values representing the range boundaries.
         * Example: setXRange([200, 500]) for temperatures between 200K and 500K.
         */
        if (!Array.isArray(xRange) || xRange.length !== 2 || !xRange.every(i => typeof i === 'number')) {
            throw new Error("x_range must be an array of two numeric values.");
        }
        this.equationDict.x_range_default = xRange; // Direct property assignment
    }

    setXRangeLimits(xLimits) {
        /**
         * Set the hard limits for x values.
         * Expected format: An array of two values (numeric or null) defining absolute boundaries.
         * Example: setXRangeLimits([100, 600]) to prevent x values outside this range.
         * Example: setXRangeLimits([null, 500]) allows an open lower limit.
         */
        if (!Array.isArray(xLimits) || xLimits.length !== 2) {
            throw new Error("x_limits must be an array of two elements (numeric or null).");
        }
        if (!xLimits.every(i => typeof i === 'number' || i === null)) {
            throw new Error("Elements in x_limits must be numeric or null.");
        }
        this.equationDict.x_range_limits = xLimits; // Direct property assignment
    }

    setYRangeDefault(yRange) {
        /**
         * Set the default y range.
         * Expected format: An array of two numeric values representing the range boundaries.
         * Example: setYRange([0, 100]) for a percentage scale.
         */
        if (!Array.isArray(yRange) || yRange.length !== 2 || !yRange.every(i => typeof i === 'number')) {
            throw new Error("y_range must be an array of two numeric values.");
        }
        this.equationDict.y_range_default = yRange; // Direct property assignment
    }

    setYRangeLimits(yLimits) {
        /**
         * Set the hard limits for y values.
         * Expected format: An array of two values (numeric or null) defining absolute boundaries.
         * Example: setYRangeLimits([null, 50]) allows an open lower limit but restricts the upper limit.
         */
        if (!Array.isArray(yLimits) || yLimits.length !== 2) {
            throw new Error("y_limits must be an array of two elements (numeric or null).");
        }
        if (!yLimits.every(i => typeof i === 'number' || i === null)) {
            throw new Error("Elements in y_limits must be numeric or null.");
        }
        this.equationDict.y_range_limits = yLimits; // Direct property assignment
    }

    setZRangeDefault(zRange) {
        /**
         * Set the default z range.
         * Expected format: An array of two numeric values representing the range boundaries.
         * Example: setZRange([0, 5000]) for energy values in Joules.
         */
        if (!Array.isArray(zRange) || zRange.length !== 2 || !zRange.every(i => typeof i === 'number')) {
            throw new Error("z_range must be an array of two numeric values.");
        }
        this.equationDict.z_range_default = zRange; // Direct property assignment
    }

    setZRangeLimits(zLimits) {
        /**
         * Set the hard limits for z values.
         * Expected format: An array of two values (numeric or null) defining absolute boundaries.
         * Example: setZRangeLimits([100, null]) allows an open upper limit but restricts the lower boundary.
         */
        if (!Array.isArray(zLimits) || zLimits.length !== 2) {
            throw new Error("z_limits must be an array of two elements (numeric or null).");
        }
        if (!zLimits.every(i => typeof i === 'number' || i === null)) {
            throw new Error("Elements in z_limits must be numeric or null.");
        }
        this.equationDict.z_range_limits = zLimits; // Direct property assignment
    }

    getZMatrix(xPoints = null, yPoints = null, zPoints = null) {
        /**
         * Constructs a Z matrix mapping unique (x, y) values to corresponding z values.
         *
         * Parameters:
         * - xPoints (Array): Array of x coordinates.
         * - yPoints (Array): Array of y coordinates.
         * - zPoints (Array): Array of z values.
         *
         * Returns:
         * - zMatrix (2D Array): Matrix of z values.
         */
        if (xPoints === null) {
            xPoints = this.equationDict.x_points; // Accessing directly
        }
        if (yPoints === null) {
            yPoints = this.equationDict.y_points; // Accessing directly
        }
        if (zPoints === null) {
            zPoints = this.equationDict.z_points; // Accessing directly
        }

        // Get unique x and y values
        const uniqueX = [...new Set(xPoints)].sort((a, b) => a - b);
        const uniqueY = [...new Set(yPoints)].sort((a, b) => a - b);

        // Create an empty matrix filled with NaNs
        const zMatrix = Array(uniqueX.length).fill(0).map(() => Array(uniqueY.length).fill(NaN));

        // Map z values to corresponding x, y indices
        let pointIndex = 0; // For 3D, z_points are flattened
        for (let x of uniqueX) {
            for (let y of uniqueY) {
                const xIdx = uniqueX.indexOf(x);
                const yIdx = uniqueY.indexOf(y);
                // This assumes z_points are ordered by x then y, which the dummy evaluateEquationDict does.
                // A more robust solution would iterate through (x, y, z) triplets.
                if (this.equationDict.graphical_dimensionality === 3 && zPoints && zPoints[pointIndex] !== undefined) {
                    zMatrix[xIdx][yIdx] = zPoints[pointIndex];
                    pointIndex++;
                } else if (this.equationDict.graphical_dimensionality !== 3 && xPoints && yPoints && zPoints) {
                    // For 2D, find the matching (x,y) pair
                    for (let k = 0; k < xPoints.length; k++) {
                        if (xPoints[k] === x && yPoints[k] === y) {
                            zMatrix[xIdx][yIdx] = zPoints[k];
                            break; // Found the point
                        }
                    }
                }
            }
        }

        return zMatrix;
    }


    setNumOfPoints(numPoints) {
        /**
         * Set the number of calculation points.
         * Expected format: Integer, specifies the number of discrete points for calculations.
         * Example: setNumOfPoints(10) for ten data points.
         */
        if (!Number.isInteger(numPoints) || numPoints <= 0) {
            throw new Error("Number of points must be a positive integer.");
        }
        this.equationDict.num_of_points = numPoints; // Direct property assignment
    }

    setEquation(equationString) {
        /**Modify the equation string.*/
        this.equationDict.equation_string = equationString; // Direct property assignment
    }

    getEquationDict() {
        /**Return the complete equation plain object.*/
        return this.equationDict; // Now returns a plain object
    }

    evaluateEquation(removeEquationFields = false, verbose = false) {
        // Direct call to the imported function, passing the plain object
        const evaluatedDict = evaluateEquationDict(this.equationDict, verbose);

        // evaluatedDict is now expected to be a plain object
        let graphicalDimensionality = evaluatedDict.graphical_dimensionality !== undefined 
                                    ? evaluatedDict.graphical_dimensionality 
                                    : 2;

        this.equationDict.x_units = evaluatedDict.x_units; // Direct property assignment
        this.equationDict.y_units = evaluatedDict.y_units; // Direct property assignment
        this.equationDict.x_points = evaluatedDict.x_points; // Direct property assignment
        this.equationDict.y_points = evaluatedDict.y_points; // Direct property assignment

        if (graphicalDimensionality === 3) {
            this.equationDict.z_units = evaluatedDict.z_units; // Direct property assignment
            this.equationDict.z_points = evaluatedDict.z_points; // Direct property assignment
        }

        if (removeEquationFields === true) {
            // Create a new plain object
            const newEquationDict = {};
            newEquationDict.x_units = this.equationDict.x_units;
            newEquationDict.y_units = this.equationDict.y_units;
            newEquationDict.x_points = this.equationDict.x_points;
            newEquationDict.y_points = this.equationDict.y_points;
            if (graphicalDimensionality === 3) {
                newEquationDict.z_units = this.equationDict.z_units;
                newEquationDict.z_points = this.equationDict.z_points;
            }
            this.equationDict = newEquationDict;
        }
        return this.equationDict;
    }

    printEquationDict(prettyPrint = true, evaluateEquation = true, removeEquationFields = false) {
        let equationDictToPrint;

        if (evaluateEquation === true) {
            // evaluateEquation now returns a plain object
            equationDictToPrint = this.evaluateEquation(removeEquationFields);
        } else {
            // If not evaluating, create a shallow copy of the internal object
            equationDictToPrint = { ...this.equationDict };
        }

        if (removeEquationFields === true) {
            const tempDict = {}; // Now a plain object
            if (this.equationDict.x_units !== undefined) tempDict.x_units = this.equationDict.x_units;
            if (this.equationDict.y_units !== undefined) tempDict.y_units = this.equationDict.y_units;
            if (this.equationDict.x_points !== undefined) tempDict.x_points = this.equationDict.x_points;
            if (this.equationDict.y_points !== undefined) tempDict.y_points = this.equationDict.y_points;
            if (this.equationDict.z_units !== undefined) tempDict.z_units = this.equationDict.z_units;
            if (this.equationDict.z_points !== undefined) tempDict.z_points = this.equationDict.z_points;
            equationDictToPrint = tempDict;
        }

        if (prettyPrint === false) {
            console.log(equationDictToPrint);
        } else {
            // No conversion needed, it's already a plain object
            const equationJsonString = JSON.stringify(equationDictToPrint, null, 4);
            console.log(equationJsonString);
        }
    }

    exportToJsonFile(filename, evaluateEquation = true, removeEquationFields = false) {
        let equationDictToExport;

        if (evaluateEquation === true) {
            // evaluateEquation now returns a plain object
            equationDictToExport = this.evaluateEquation(removeEquationFields);
        } else {
            // If not evaluating, create a shallow copy of the internal object
            equationDictToExport = { ...this.equationDict };
        }

        if (removeEquationFields === true) {
            const tempDict = {}; // Now a plain object
            if (this.equationDict.x_units !== undefined) tempDict.x_units = this.equationDict.x_units;
            if (this.equationDict.y_units !== undefined) tempDict.y_units = this.equationDict.y_units;
            if (this.equationDict.x_points !== undefined) tempDict.x_points = this.equationDict.x_points;
            if (this.equationDict.y_points !== undefined) tempDict.y_points = this.equationDict.y_points;
            if (this.equationDict.z_units !== undefined) tempDict.z_units = this.equationDict.z_units;
            if (this.equationDict.z_points !== undefined) tempDict.z_points = this.equationDict.z_points;
            equationDictToExport = tempDict;
        }

        console.log(`(Simulated) Exporting to file: ${filename}`);
        // Already a plain object, directly stringify
        const jsonString = JSON.stringify(equationDictToExport, null, 4);
        console.log("JSON to be exported:\n", jsonString);
        // ... (rest of the browser download code, no changes needed to the `obj` construction as it's now direct)
        return equationDictToExport; // Still returning the plain object
    }
}

// Export the class to be accessible in the HTML file
export { Equation };