import { trace_styles_collection_library} from './../styles/trace_styles_collection_library.js';
import { layout_styles_library} from './../styles/layout_styles_library.js';
// layout_styles.styles_library.default
// trace_styles_collection.styles_library.default

///// start of parse plot style and applying plot style functions ////

function parsePlotStyle(plotStyle) {
    /**
     * Parses the given plot style and returns a structured object with layout and data series styles.
     * If `plotStyle` is missing a `layout_style` or `trace_styles_collection`, it sets them to an empty string.
     *
     * @param {null|string|Array|Object} plotStyle - None, string, list of two items, or a dictionary.
     * @returns {Object} An object with `layout_style` and `trace_styles_collection` ensuring defaults.
     */
    let parsedPlotStyle;

    if (plotStyle === null) {
        parsedPlotStyle = { layout_style: null, trace_styles_collection: null };
    } else if (typeof plotStyle === "string") {
        parsedPlotStyle = { layout_style: plotStyle, trace_styles_collection: plotStyle };
    } else if (Array.isArray(plotStyle) && plotStyle.length === 2) {
        parsedPlotStyle = { layout_style: plotStyle[0], trace_styles_collection: plotStyle[1] };
    } else if (typeof plotStyle === "object") {
        if (!plotStyle.trace_styles_collection) {
            if (plotStyle.trace_style_collection) {
                console.warn("Warning: plotStyle has 'trace_style_collection', this key should be 'trace_styles_collection'. Using it, but fix the spelling error.");
                plotStyle.trace_styles_collection = plotStyle.trace_style_collection;
            } else if (plotStyle.traces_style_collection) {
                console.warn("Warning: plotStyle has 'traces_style_collection', this key should be 'trace_styles_collection'. Using it, but fix the spelling error.");
                plotStyle.trace_styles_collection = plotStyle.traces_style_collection;
            } else {
                plotStyle.trace_styles_collection = "";
            }
        }
        if (!plotStyle.layout_style) {
            plotStyle.layout_style = "";
        }

        parsedPlotStyle = {
            layout_style: plotStyle.layout_style ?? null,
            trace_styles_collection: plotStyle.trace_styles_collection ?? null,
        };
    } else {
        throw new Error("Invalid plot style: Must be null, a string, an array of two items, or an object with valid fields.");
    }

    return parsedPlotStyle;
}

function applyPlotStyleToPlotlyDict(figDict, plotStyle = null) {
    /**
     * Applies both layout_style and trace_styles_collection to a Plotly figure dictionary.
     * If either value is missing or an empty string, it is set to 'default'.
     *
     * @param {Object} figDict - The figure dictionary to update.
     * @param {Object|null} plotStyle - The plot style dictionary, or null to initialize defaults.
     * @returns {Object} Updated figure dictionary.
     */
    if (plotStyle === null) {
        plotStyle = { layout_style: {}, trace_styles_collection: {} }; // Fresh object per function call
    }

    // Parse and ensure defaults for missing values
    plotStyle = parsePlotStyle(plotStyle);
    plotStyle.layout_style ??= "";
    plotStyle.trace_styles_collection ??= "";

    // Apply layout style if not "none"
    if (String(plotStyle.layout_style).toLowerCase() !== "none") {
        if (plotStyle.layout_style === "") {
            plotStyle.layout_style = "default";
            if ("z" in figDict.data[0]) {
                console.warn("Warning: No layout_style provided and 'z' field found in first data series. " +
                    "For 'bubble2d' plots, it is recommended to set layout_style to 'default'. " +
                    "For 'mesh3d' graphs and 'scatter3d' graphs, it is recommended to set layout_style to 'default3d'. " +
                    "Set layout_style to 'none' or another layout_style to avoid this warning.");
            };
        }
        //figDict = removeLayoutStyleFromPlotlyDict(figDict);
        figDict = applyLayoutStyleToPlotlyDict(figDict, plotStyle.layout_style);
    }

    // Apply trace_styles_collection if not "none"
    if (String(plotStyle.trace_styles_collection).toLowerCase() !== "none") {
        if (plotStyle.trace_styles_collection === "") {
            plotStyle.trace_styles_collection = "default";
        }
        //figDict = removeTraceStylesCollectionFromPlotlyDict(figDict);
        figDict = applyTraceStylesCollectionToPlotlyDict(figDict, plotStyle.trace_styles_collection);
    }

    return figDict;
}



///// end of parse plot style and applying plot style functions ////

function applyTraceStylesCollectionToPlotlyDict(figDict, traceStylesCollection = "", traceStyleToApply = "") {
    /**
     * Iterates over all traces in the `data` array of a Plotly figure dictionary 
     * and applies styles to each one.
     *
     * @param {Object} figDict - A dictionary containing a `data` field with Plotly traces.
     * @param {String|Object} traceStylesCollection - Optional style preset or object.
     * @param {String} traceStyleToApply - Optional style preset to apply. Default is "default".
     * @returns {Object} Updated Plotly figure dictionary with defaults applied to each trace.
     */

    let traceStylesCollectionName;

    if (typeof traceStylesCollection === "string") {
        traceStylesCollectionName = traceStylesCollection;
    } else {
        traceStylesCollectionName = traceStylesCollection.name;
    }

    if (figDict.data && Array.isArray(figDict.data)) {
        figDict.data = figDict.data.map(trace => 
            applyTraceStyleToSingleDataSeries(trace, traceStylesCollection, traceStyleToApply)
        );
    }

    if (!figDict.plot_style) {
        figDict.plot_style = {};
    }
    figDict.plot_style.trace_styles_collection = traceStylesCollectionName;

    return figDict;
}

function applyTraceStyleToSingleDataSeries(dataSeries, traceStylesCollection = "", traceStyleToApply = "") {
    /**
     * Applies predefined styles to a single Plotly data series while preserving relevant fields.
     *
     * @param {Object} dataSeries - An object representing a single Plotly data series.
     * @param {String|Object} traceStylesCollection - Style preset or custom style dictionary.
     * @param {String} traceStyleToApply - Name of the style preset or custom style dictionary. Default is "default".
     * @returns {Object} Updated data series with style applied.
     */

    if (typeof dataSeries !== "object" || dataSeries === null) {
        return dataSeries; // Return unchanged if the data series is invalid.
    }

    if (typeof traceStyleToApply === "object") {
        dataSeries.trace_style = traceStyleToApply;
    }

    if (traceStyleToApply !== "") {
        dataSeries.trace_style = traceStyleToApply;
    } else {
        traceStyleToApply = dataSeries.trace_style || "";
        // If "none", return unchanged
        if (String(traceStyleToApply).toLowerCase() === "none") {
            return dataSeries;
        }

        // If traceStyle is a dictionary, set traceStyleToApply to it
        if (typeof traceStyleToApply === "object") {
            traceStyleToApply = traceStyleToApply;
        }
    }

    // If traceStyleToApply is a string but no traceStylesCollection was provided, return unchanged
    if (typeof traceStyleToApply === "string" &&
        (traceStylesCollection === "" || String(traceStylesCollection).toLowerCase() === "none")) {
        return dataSeries;
    }

    // If traceStyleToApply is "none", return unchanged
    if (String(traceStyleToApply).toLowerCase() === "none") {
        return dataSeries;
    }

    // Handle predefined hardcoded cases
    if (typeof traceStyleToApply === "string") {
        if (traceStyleToApply.toLowerCase() === "nature" || traceStyleToApply.toLowerCase() === "science") {
            traceStyleToApply = "default";
        }
    }


    // Because the 3D traces will not plot correctly unless recognized,
    // we have a hardcoded case for the situation where a 3D dataset is received without a plot style.
    if (traceStylesCollection === "default") {
        if (traceStyleToApply === "") {
            if (dataSeries?.z) {  // Checking if 'z' exists in dataSeries
                dataSeries["trace_style"] = "scatter3d";
                const uid = dataSeries?.uid || "";
                const name = dataSeries?.name || "";
                console.warn(`Warning: A dataseries was found with no trace_style but with a 'z' field. uid: ${uid}. name: ${name}. The trace style for this dataseries is being set to scatter3d.`);
            }
        }
    }


    // Remove existing formatting before applying new formatting
    //dataSeries = removeTraceStyleFromSingleDataSeries(dataSeries);

    // -------------------------------
    // Predefined traceStylesCollection
    // -------------------------------
    // Each traceStylesCollection is defined as an object containing multiple trace styles.
    // Users can select a style preset traceStylesCollection (e.g., "default", "minimalist", "bold"),
    // and this function will apply appropriate settings for the given traceStyle.
    //
    // Examples of Supported traceStyles:
    // - "scatter_spline" (default when type is not specified)
    // - "scatter"
    // - "spline"
    // - "bar"
    // - "heatmap"
    //
    // Note: Colors are intentionally omitted to allow users to define their own.
    // However, predefined colorscales are applied for heatmaps.

    const stylesAvailable = trace_styles_collection_library

    // Get the appropriate style dictionary
    let stylesCollectionDict;
    if (typeof traceStylesCollection === "object") {
        stylesCollectionDict = traceStylesCollection; // Use custom style directly
    } else {
        stylesCollectionDict = stylesAvailable[traceStylesCollection] || {};
        if (Object.keys(stylesCollectionDict).length === 0) {
            console.warn(`Warning: traceStylesCollection named '${traceStylesCollection}' not found. Using 'default' traceStylesCollection instead.`);
            stylesCollectionDict = stylesAvailable["default"] || {};
        }
    }
    // Determine the traceStyle, defaulting to the first item in a given style if none is provided
    let traceStyle = traceStyleToApply || dataSeries.trace_style || "";
    if (traceStyle === "") {
        traceStyle = Object.keys(stylesCollectionDict)[0]; // Take the first traceStyle name in the styleDict
    }
    // Check if traceStyle is a string and extract colorscale if applicable
    //This should be done before extracting the trace_style from the styles_available, because we need to split the string to break out the trace_style
    //Also should be initialized before determining the second half of colorscale_structure checks (which occurs after the trace_style application), since it affects that logic.
    let colorscale = ""; // Initialize as empty string for default case
    let colorscaleStructure = ""; // Initialize as empty string for default case
    if (typeof traceStyle === "string") {
        // If traceStyle includes a double underscore, separate the style and the colorscale
        if (traceStyle.includes("__")) {
            [traceStyle, colorscale] = traceStyle.split("__");
        }
        // If the style is just "bubble" (not explicitly 2D or 3D), default to bubble2d for backward compatibility
        if (
            traceStyle.includes("bubble") &&
            !traceStyle.includes("bubble2d") &&
            !traceStyle.includes("bubble3d")
        ) {
            traceStyle = traceStyle.replace("bubble", "bubble2d");
        }
    }



    if (colorscale.endsWith("_r")) {
        console.warn("Warning: Colorscale reverse with _r is not currently supported by browser-based Plotly. Colorscale reversing has been removed.");
        colorscale = colorscale.slice(0, -2);
    }

    //in python, plotly colorscale can be lowercase. In Javascript, first letter must be capitalized.
    // Capitalizes the first letter of the string if it's not already capitalized.
    if (colorscale) {
    colorscale = colorscale.charAt(0).toUpperCase() + colorscale.slice(1);
    }


    //The below function call does not just determine colorScaleStructure, it also calls the prepareBubbleSizes function as needed
    //for bubble2d and bubble3d plots.
    ({ dataSeries, colorscaleStructure} = determineColorScaleStructureFirstHalf(dataSeries, traceStyle, colorscale));  
    
    if (traceStyle in stylesCollectionDict) {
        traceStyle = stylesCollectionDict[traceStyle];
    } else if (!(traceStyle in stylesCollectionDict)) {  // Check if traceStyle isn't in the dictionary
        console.warn(`Warning: traceStyle named '${traceStyle}' not found in traceStylesCollection '${traceStylesCollection}'. Using the first traceStyle in traceStylesCollection '${traceStylesCollection}'.`);
        traceStyle = Object.keys(stylesCollectionDict)[0]; // Take the first traceStyle name in the styleDict
        traceStyle = stylesCollectionDict[traceStyle];
    }
    // Apply type and other predefined settings
    dataSeries.type = traceStyle?.type;
    for (const [key, value] of Object.entries(traceStyle)) {
        if (key !== "type") {
            if (typeof value === "object" && value !== null) { // Ensure value is an object
                dataSeries[key] = { ...dataSeries[key], ...value }; // Merge existing and new values
            } else if (typeof value === "string") {
                dataSeries[key] = value; // Direct assignment for strings
            } else {
                dataSeries[key] = value; // Direct assignment for non-object values
            }
        }
    }
        // Check if colorscale is provided and determine the colorscale structure
    if ((colorscale !== "") && (colorscaleStructure === "")) {
        ({ dataSeries, colorscaleStructure } = determineColorScaleStructureSecondHalf(dataSeries, traceStyle, colorscale));
    }
    dataSeries = applyColorScale(dataSeries, colorscale, colorscaleStructure);
    return dataSeries;
}

function determineColorScaleStructureFirstHalf(dataSeries, traceStyle, colorscale) {
    let colorscaleStructure = ""; // Initialize variable for later use
    // Ensure traceStyle is a string
    if (typeof traceStyle === "string") {
        // 3D and bubble plots have a colorscale by default
        if (traceStyle.toLowerCase().includes("bubble")) {
            // For bubble trace styles (both 2D and 3D), prepare bubble sizes first
            dataSeries = prepareBubbleSizes(dataSeries);
            colorscaleStructure = "bubble";
        } else if (traceStyle.toLowerCase().includes("mesh3d")) {
            colorscaleStructure = "mesh3d";
        } else if (traceStyle.toLowerCase().includes("scatter3d")) {
            colorscaleStructure = "scatter3d";
        }
    }
    return { dataSeries, colorscaleStructure };
}


function determineColorScaleStructureSecondHalf(dataSeries, traceStyle, colorscale) {
    let colorscaleStructure = ''; //Ok to assign as new, because this function is only entered if it is already an empty string.
    if (dataSeries.mode.includes("markers") || dataSeries.mode.includes("markers+lines") || dataSeries.mode.includes("lines+markers")) {
        colorscaleStructure = "marker";
    } else if (dataSeries.mode.includes("lines")) {
        colorscaleStructure = "line";
    } else if (dataSeries.type.includes("bar")) {
        colorscaleStructure = "marker";
    }
    return { dataSeries, colorscaleStructure };
}


function applyColorScale(dataSeries, colorscale, colorscaleStructure) {
    function cleanColorValues(listOfValues, variableStringForWarning) {
        if (listOfValues.includes(null)) {
            console.warn(`Warning: A colorscale based on ${variableStringForWarning} was requested. None values were found. They are being replaced with 0 values. It is recommended to provide data without None values.`);
            return listOfValues.map(value => value === null ? 0 : value);
        }
        return listOfValues;
    }
    // Apply colorscale based on structure type
    if (colorscaleStructure === "bubble" || colorscaleStructure === "scatter3d") {
        if (colorscale !== ""){ //if the colorscale is not an empty string, that means the user has supplied a colorscale.
            dataSeries.marker.colorscale = colorscale; 
            }
        dataSeries.marker.showscale = true;
        if (dataSeries.z) {
            dataSeries.marker.color = cleanColorValues(dataSeries.z, "z");
        } else if (dataSeries.z_points) {
            dataSeries.marker.color = cleanColorValues(dataSeries.z_points, "z_points");
        }
    } else if (colorscaleStructure === "mesh3d") {
        if (colorscale !== ""){ //if the colorscale is not an empty string, that means the user has supplied a colorscale.
            dataSeries.colorscale = colorscale; 
            }
        dataSeries.showscale = true;
        if (dataSeries.z) {
            dataSeries.intensity = cleanColorValues(dataSeries.z, "z");
        } else if (dataSeries.z_points) {
            dataSeries.intensity = cleanColorValues(dataSeries.z_points, "z_points");
        }
    } else if (colorscaleStructure === "marker") {
        dataSeries.marker.colorscale = colorscale;
        dataSeries.marker.showscale = true;
        dataSeries.marker.color = cleanColorValues(dataSeries.y, "y");
    } else if (colorscaleStructure === "line") {
        dataSeries.line.colorscale = colorscale;
        dataSeries.line.showscale = true;
        dataSeries.line.color = cleanColorValues(dataSeries.y, "y");
    }

    return dataSeries;
}





function prepareBubbleSizes(dataSeries) {
    // To make a bubble plot with Plotly, we use a 2D plot
    // and assign z values to marker sizes, scaling them to a max bubble size.
    if (!dataSeries.marker) {
        dataSeries.marker = {};
    }
    if (dataSeries.bubble_sizes !== undefined) {
        if (typeof dataSeries.bubble_sizes === "string") {
            // if bubble_sizes is a string, use it as a key to extract sizes
            let bubbleSizesVariableName = dataSeries.bubble_sizes;
            dataSeries.marker.size = dataSeries[bubbleSizesVariableName];
        } else {
            dataSeries.marker.size = dataSeries.bubble_sizes;
        }
    } else if (dataSeries.z_points) {
        dataSeries.marker.size = dataSeries.z_points;
    } else if (dataSeries.z) {
        dataSeries.marker.size = dataSeries.z;
    } else if (dataSeries.y) {
        dataSeries.marker.size = dataSeries.y;
    }

    // Function to normalize values to the max value in the list
    function normalizeToMax(startingList) {
        const maxValue = Math.max(...startingList);
        if (maxValue === 0) {
            return startingList.map(() => 0); // If max value is zero, return zeros
        } else {
            return startingList.map(value => value / maxValue); // Normalize values
        }
    }

    try {
        dataSeries.marker.size = normalizeToMax(dataSeries.marker.size);
    } catch (error) {
        throw new Error("Error: During bubble plot bubble size normalization, an issue occurred. This usually means the z variable hasn't been populated, such as by equation evaluation set to false or simulation evaluation set to false.");
    }

    // Scale the bubbles to a max size
    const maxBubbleSize = dataSeries.max_bubble_size || 50;
    dataSeries.marker.size = dataSeries.marker.size.map(value => value * maxBubbleSize);

    // Set hover text to original z values
    if (dataSeries.z_points) {
        dataSeries.text = dataSeries.z_points;
    } else if (dataSeries.z) {
        dataSeries.text = dataSeries.z;
    }
    return dataSeries;
}


function applyLayoutStyleToPlotlyDict(figDict, layoutStyleToApply = "default") {
    /**
     * Apply a predefined style to a Plotly figDict while preserving non-cosmetic fields.
     * 
     * @param {Object} figDict - Plotly-style figure dictionary.
     * @param {String|Object} layoutStyleToApply - Name of the style or a style dictionary to apply.
     * @returns {Object} Updated Plotly-style figure dictionary.
     */

    let layoutStyleToApplyName;
    if (typeof layoutStyleToApply === "string") {
        layoutStyleToApplyName = layoutStyleToApply;
    } else {
        layoutStyleToApplyName = Object.keys(layoutStyleToApply)[0]; // If it's a dictionary, it will have one key which is its name
    }

    if (!layoutStyleToApply || String(layoutStyleToApply).toLowerCase() === "none") {
        return figDict;
    }

    // Hardcoding some cases to call the default layout, for convenience
    if (["minimalist", "bold"].includes(layoutStyleToApply.toLowerCase())) {
        layoutStyleToApply = "default";
    }

    //get the local layout_styles_library
    const stylesAvailable = layout_styles_library

    // Use or get the specified style, or fallback to default if not found
    let styleDict;

    if (typeof layoutStyleToApply === "object") {
        styleDict = layoutStyleToApply;
    } else {
        // If stylesAvailable[layoutStyleToApply] exists, use it.
        // Otherwise, fallback to an empty object `{}` to prevent errors.
        styleDict = stylesAvailable[layoutStyleToApply] || {};
    }

    if (Object.keys(styleDict).length === 0) {
        console.warn(`Style named '${layoutStyleToApply}' not found with explicit layout dictionary. Using 'default' layout style.`);
        styleDict = stylesAvailable["default"] || {};
    }
    // Ensure layout exists in the figure
    figDict.layout = figDict.layout || {};

    // Extract non-cosmetic fields
    const nonCosmeticFields = {
        "title.text": figDict?.layout?.title?.text || null,
        "xaxis.title.text": figDict?.layout?.xaxis?.title?.text || null,
        "yaxis.title.text": figDict?.layout?.yaxis?.title?.text || null,
        "zaxis.title.text": figDict?.layout?.zaxis?.title?.text || null,
        "legend.title.text": figDict?.layout?.legend?.title?.text || null,
        "annotations.text": figDict?.layout?.annotations?.map(annotation => annotation.text) || [],
        "updatemenus.buttons.label": figDict?.layout?.updatemenus?.flatMap(menu => menu.buttons?.map(button => button.label)) || [],
        "coloraxis.colorbar.title.text": figDict?.layout?.coloraxis?.colorbar?.title?.text || null,
    };

    // Apply style dictionary to create a fresh layout object //using JSON to create a deep cpoy of the styleDict.layout
    const newLayout = structuredClone(styleDict.layout);
    // Restore non-cosmetic fields
    if (nonCosmeticFields["title.text"] != null) {
        newLayout.title = newLayout.title || {}; // Ensure title exists
        newLayout.title.text = nonCosmeticFields["title.text"];
    }

    if (nonCosmeticFields["xaxis.title.text"] != null) {
        newLayout.xaxis = newLayout.xaxis || {}; // Ensure xaxis exists
        newLayout.xaxis.title = newLayout.xaxis.title || {}; // Ensure title exists
        newLayout.xaxis.title.text = nonCosmeticFields["xaxis.title.text"];
    }

    if (nonCosmeticFields["yaxis.title.text"] != null) {
        newLayout.yaxis = newLayout.yaxis || {}; // Ensure yaxis exists
        newLayout.yaxis.title = newLayout.yaxis.title || {};
        newLayout.yaxis.title.text = nonCosmeticFields["yaxis.title.text"];
    }

    if (nonCosmeticFields["zaxis.title.text"] != null) {
        newLayout.zaxis = newLayout.zaxis || {}; // Ensure zaxis exists
        newLayout.zaxis.title = newLayout.zaxis.title || {};
        newLayout.zaxis.title.text = nonCosmeticFields["zaxis.title.text"];
    }

    if (nonCosmeticFields["legend.title.text"] != null) {
        newLayout.legend = newLayout.legend || {}; // Ensure legend exists
        newLayout.legend.title = newLayout.legend.title || {};
        newLayout.legend.title.text = nonCosmeticFields["legend.title.text"];
    }



    // Assign the new layout back into the figure dictionary
    figDict.layout = newLayout;
    // Update figDict to signify the new layout style used
    figDict.plot_style = figDict.plot_style || {};
    figDict.plot_style.layout_style = layoutStyleToApplyName;
    return figDict;
}

export {parsePlotStyle};
export {applyPlotStyleToPlotlyDict};

window.parsePlotStyle = parsePlotStyle;
window.applyPlotStyleToPlotlyDict = applyPlotStyleToPlotlyDict;