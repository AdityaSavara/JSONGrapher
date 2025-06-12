// Start section of code with functions for cleaning figDicts for Plotly compatibility


function cleanJsonFigDict(jsonFigDict, fieldsToUpdate = null) {
    /**
     * Ensures JSONGrapher .json files are compatible with the current Plotly format.
     * This function can optionally remove fields like 'simulate' and 'equation'.
     * The 'superscripts' option is usually applied right before plotting, as it affects unit conversions.
     *
     * @param {Object} jsonFigDict - The figure dictionary.
     * @param {Array} fieldsToUpdate - List of fields to update. If null, defaults to basic fields.
     * @returns {Object} Updated figure dictionary.
     */
    
    if (fieldsToUpdate === null) {
        fieldsToUpdate = ["title_field", "extraInformation", "nested_comments"];
    }

    let figDict = jsonFigDict;
    if (fieldsToUpdate.includes("title_field")) {
        figDict = updateTitleField(figDict);
    }
    if (fieldsToUpdate.includes("extraInformation")) {
        figDict = removeExtraInformationField(figDict);
    }
    if (fieldsToUpdate.includes("nested_comments")) {
        figDict = removeNestedComments(figDict);
    }
    if (fieldsToUpdate.includes("simulate")) {
        figDict = removeSimulateField(figDict);
    }
    if (fieldsToUpdate.includes("equation")) {
        figDict = removeEquationField(figDict);
    }
    if (fieldsToUpdate.includes("custom_units_chevrons")) {
        figDict = removeCustomUnitsChevrons(figDict);
    }
    if (fieldsToUpdate.includes("bubble")) { // Must be updated before traceStyle is removed
        figDict = removeBubbleFields(figDict);
    }
    if (fieldsToUpdate.includes("trace_style")) {
        figDict = removeTraceStyleField(figDict);
    }
    if (fieldsToUpdate.includes("3d_axes")) { // Handles 3D plots
        figDict = update3DAxes(figDict);
    }
    if (fieldsToUpdate.includes("superscripts")) {
        figDict = updateSuperscriptsStrings(figDict);
    }

    return figDict;
}

function updateTitleField(figDictOrSubdict, depth = 1, maxDepth = 10) {
    /**
     * Ensures JSONGrapher .json files are compatible with Plotly's recommended title field formatting.
     * Recursively checks for 'title' fields and converts them to dictionary format.
     *
     * @param {Object} figDictOrSubdict - The figure dictionary or sub-dictionary to update.
     * @param {Number} depth - Current depth in the recursion.
     * @param {Number} maxDepth - Maximum depth allowed.
     * @returns {Object} Updated dictionary with correct title formatting.
     */

    if (depth > maxDepth || typeof figDictOrSubdict !== "object" || figDictOrSubdict === null) {
        return figDictOrSubdict;
    }

    for (const [key, value] of Object.entries(figDictOrSubdict)) {
        if (key === "title" && typeof value === "string") { // Convert axis labels
            figDictOrSubdict[key] = { text: value };
        } else if (typeof value === "object" && value !== null) { // Nested dictionary
            figDictOrSubdict[key] = updateTitleField(value, depth + 1, maxDepth);
        } else if (Array.isArray(value)) { // Lists can contain nested dictionaries
            figDictOrSubdict[key] = value.map(item => 
                typeof item === "object" && item !== null ? updateTitleField(item, depth + 1, maxDepth) : item
            );
        }
    }
    return figDictOrSubdict;
}

function updateSuperscriptsStrings(figDictOrSubdict, depth = 1, maxDepth = 10) {
    /**
     * Ensures JSONGrapher .json files are compatible with Plotly's recommended title field formatting.
     * Recursively checks for 'title' fields and applies superscript replacements.
     *
     * @param {Object} figDictOrSubdict - The figure dictionary or sub-dictionary to update.
     * @param {Number} depth - Current depth in the recursion.
     * @param {Number} maxDepth - Maximum depth allowed.
     * @returns {Object} Updated dictionary with superscript formatting.
     */

    if (depth > maxDepth || typeof figDictOrSubdict !== "object" || figDictOrSubdict === null) {
        return figDictOrSubdict;
    }
    for (const [key, value] of Object.entries(figDictOrSubdict)) {
        if (key === "title" && figDictOrSubdict[key].text) { // Axis labels and graph title
            figDictOrSubdict[key].text = replaceSuperscripts(figDictOrSubdict[key].text);
        }
        if (key === "data") { // Legend items
            figDictOrSubdict[key].forEach(dataDict => {
                if (dataDict.name) {
                    dataDict.name = replaceSuperscripts(dataDict.name);
                }
            });
        } else if (typeof value === "object" && value !== null) { // Nested dictionary
            figDictOrSubdict[key] = updateSuperscriptsStrings(value, depth + 1, maxDepth);
        } else if (Array.isArray(value)) { // Lists can contain nested dictionaries
            figDictOrSubdict[key] = value.map(item => 
                typeof item === "object" && item !== null ? updateSuperscriptsStrings(item, depth + 1, maxDepth) : item
            );
        }
    }
    return figDictOrSubdict;
}

function replaceSuperscripts(inputString) {
    /**
     * Converts superscript expressions like `x^(2)` or `y**(-3)` into HTML `<sup>` tags.
     * Example usage: replaceSuperscripts("x^(2) + y**(-3) = z^(test)")
     *
     * @param {String} inputString - The text containing superscripts.
     * @returns {String} Modified text with superscript HTML formatting.
     */
    if (typeof inputString !== 'string') {
        console.log("In the replaceSuperscripts Function, encountered an inputString that is not a string.", inputString);
        throw new TypeError("Expected a string but received: " + typeof inputString + " " + String(inputString));
    }
    return inputString
        .replace(/\^\((.*?)\)|\*\*\((.*?)\)/g, (_, group1, group2) => `<sup>${group1 || group2}</sup>`)
        .replace(/<sup>\((\d+)\)<\/sup>/g, "<sup>$1</sup>")  // Remove parentheses for numbers
        .replace(/<sup>\((\w)\)<\/sup>/g, "<sup>$1</sup>")    // Remove parentheses for single letters
        .replace(/<sup>\(-(\d+)\)<\/sup>/g, "<sup>-$1</sup>"); // Handle negative numbers
}

function convertTo3DLayout(layout) {
    /**
     * Converts a 2D Plotly layout into a 3D-compatible format by moving axis fields inside `scene`.
     * Ensures the original layout is not modified.
     *
     * @param {Object} layout - The original Plotly layout object.
     * @returns {Object} New layout object with 3D formatting.
     */
    let newLayout = JSON.parse(JSON.stringify(layout)); // Deep copy to avoid modifying original layout

    // Add the axis fields inside `scene`
    newLayout.scene = {
        xaxis: layout.xaxis || {},
        yaxis: layout.yaxis || {},
        zaxis: layout.zaxis || {}
    };

    // Remove the original axis fields from the top-level layout
    delete newLayout.xaxis;
    delete newLayout.yaxis;
    delete newLayout.zaxis;

    return newLayout;
}

function removeBubbleFields(figDict) {
    /**
     * Removes `z` and `z_points` from bubble plots since they are used for size calculations.
     *
     * @param {Object} figDict - Plotly figure dictionary containing `data` field.
     * @returns {Object} Updated figure dictionary with bubble-related fields removed.
     */
    let bubbleFound = false;

    figDict.data.forEach(dataSeries => {
        if (dataSeries.trace_style === "bubble" || "max_bubble_size" in dataSeries) {
            bubbleFound = true;

            delete dataSeries.z;
            delete dataSeries.z_points;
            delete dataSeries.max_bubble_size;
        }
    });

    if (bubbleFound && figDict.layout.zaxis) {
        delete figDict.layout.zaxis;
    }

    return figDict;
}

function update3DAxes(figDict) {
    /**
     * Converts layout to 3D and removes unnecessary `z_matrix` fields from certain 3D plot types.
     *
     * @param {Object} figDict - Plotly figure dictionary.
     * @returns {Object} Updated figure dictionary with 3D configurations applied.
     */
    if (figDict.layout.zaxis) {
        figDict.layout = convertTo3DLayout(figDict.layout);

        figDict.data.forEach(dataSeries => {
            if (dataSeries.type === "scatter3d" || dataSeries.type === "mesh3d") {
                delete dataSeries.z_matrix;
            } else if (dataSeries.type === "surface") {
                if ("z_matrix" in dataSeries) {
                    delete dataSeries.z;
                    console.warn("The Surface type of 3D plot has not been fully implemented yet. It requires replacing z with z_matrix after equation evaluation.");
                }
            }
        });
    }

    return figDict;
}

function removeExtraInformationField(figDict, depth = 1, maxDepth = 10) {
    /**
     * Ensures JSONGrapher .json files are compatible with the current Plotly format.
     * Recursively removes 'extraInformation' fields.
     *
     * @param {Object} figDict - The figure dictionary.
     * @param {Number} depth - Current recursion depth.
     * @param {Number} maxDepth - Maximum recursion depth.
     * @returns {Object} Updated figure dictionary.
     */
    if (depth > maxDepth || typeof figDict !== "object" || figDict === null) {
        return figDict;
    }

    Object.keys(figDict).forEach(key => {
        if (key === "extraInformation" || key === "extra_information") {
            delete figDict[key];
        } else if (typeof figDict[key] === "object" && figDict[key] !== null) {
            figDict[key] = removeExtraInformationField(figDict[key], depth + 1, maxDepth);
        } else if (Array.isArray(figDict[key])) {
            figDict[key] = figDict[key].map(item =>
                typeof item === "object" && item !== null ? removeExtraInformationField(item, depth + 1, maxDepth) : item
            );
        }
    });

    return figDict;
}

function removeNestedComments(data, topLevel = true) {
    /**
     * Removes 'comments' fields that are not at the top level of the JSON structure.
     * Starts with `topLevel = true` initially, then becomes false for recursion.
     *
     * @param {Object} data - The JSON dictionary containing plot data.
     * @param {Boolean} topLevel - Indicates whether function is at top level.
     * @returns {Object} Updated JSON dictionary without nested comments.
     */
    if (typeof data !== "object" || data === null) {
        return data;
    }

    Object.keys(data).forEach(key => {
        if (typeof data[key] === "object" && data[key] !== null) {
            data[key] = removeNestedComments(data[key], false);
        } else if (Array.isArray(data[key])) {
            data[key] = data[key].map(item =>
                typeof item === "object" && item !== null ? removeNestedComments(item, false) : item
            );
        }
    });

    // Only remove 'comments' if not at the top level
    if (!topLevel) {
        Object.keys(data).forEach(key => {
            if (key === "comments") {
                delete data[key];
            }
        });
    }

    return data;
}

function removeSimulateField(jsonFigDict) {
    /**
     * Removes the 'simulate' field from all data series in the JSON figure dictionary.
     *
     * @param {Object} jsonFigDict - The figure dictionary.
     * @returns {Object} Updated figure dictionary without 'simulate' field.
     */
    jsonFigDict.data.forEach(dataDict => {
        delete dataDict.simulate;
    });

    return jsonFigDict;
}

function removeEquationField(jsonFigDict) {
    /**
     * Removes the 'equation' field from all data series in the JSON figure dictionary.
     *
     * @param {Object} jsonFigDict - The figure dictionary.
     * @returns {Object} Updated figure dictionary without 'equation' field.
     */
    jsonFigDict.data.forEach(dataDict => {
        delete dataDict.equation;
    });

    return jsonFigDict;
}

function removeTraceStyleField(jsonFigDict) {
    /**
     * Removes the 'trace_style' and 'tracetype' fields from all data series in the JSON figure dictionary.
     *
     * @param {Object} jsonFigDict - The figure dictionary.
     * @returns {Object} Updated figure dictionary without trace style fields.
     */
    jsonFigDict.data.forEach(dataDict => {
        delete dataDict.trace_style;
        delete dataDict.tracetype;
    });

    return jsonFigDict;
}

function removeCustomUnitsChevrons(jsonFigDict) {
    /**
     * Removes custom unit chevrons (`<` and `>`) from axis titles.
     * If a key doesn't exist, it silently handles the error.
     *
     * @param {Object} jsonFigDict - The figure dictionary.
     * @returns {Object} Updated figure dictionary without chevrons.
     */
    try {
        jsonFigDict.layout.xaxis.title.text = jsonFigDict.layout.xaxis.title.text.replace(/<|>/g, "");
    } catch (error) {}

    try {
        jsonFigDict.layout.yaxis.title.text = jsonFigDict.layout.yaxis.title.text.replace(/<|>/g, "");
    } catch (error) {}

    try {
        jsonFigDict.layout.zaxis.title.text = jsonFigDict.layout.zaxis.title.text.replace(/<|>/g, "");
    } catch (error) {}

    return jsonFigDict;
}


// End section of code with functions for cleaning fig_dicts for plotly compatibility ###


export { cleanJsonFigDict };

window.cleanJsonFigDict = cleanJsonFigDict;