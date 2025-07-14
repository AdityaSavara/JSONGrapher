// A function checks the extension of the file and calls the appropriate function to jsonify the file
export function jsonifyData(filetype, dataLoaded, plotlyTemplate) {
    switch (filetype) {
        case "csv": {
            return jsonifyCSV(dataLoaded, plotlyTemplate);
        }
        case "tsv": {
            return jsonifyTSV(dataLoaded, plotlyTemplate);
        }
        default: {
            return JSON.parse(dataLoaded);
        }
    }
}

// A function that checks the uploaded file extension
export function findFileType(fileName) {
    let arrayName = fileName.split(".");
    let fileType;
    if (arrayName.includes("csv")) {
        fileType = "csv";
    } else if (arrayName.includes("tsv")) {
        fileType = "tsv";
    } else {
        fileType = "json";
    }
    return fileType;
}


// A function that jsonifies a TSV file
export function jsonifyTSV(fileContent, plotlyTemplate) {
    return jsonifyCSV(fileContent, plotlyTemplate, "\t");
}

// A function that jsonifies a CSV file
export function jsonifyCSV(fileContent, plotlyTemplate, delimiter = ",") {
    // Split the file into lines
    let arr = fileContent.split("\n");
    // Remove trailing empty row if present
    if (arr[arr.length - 1].length < 2) arr = arr.slice(0, arr.length - 1);

    // Extract metadata from header rows
    let comments    = arr[0].split(delimiter)[0].split(":")[1].trim();
    let data_type   = arr[1].split(delimiter)[0].split(":")[1].trim();
    let graph_title = arr[2].split(delimiter)[0].split(":")[1].trim();
    let x_label     = arr[3].split(delimiter)[0].split(":")[1].trim();
    let y_label     = arr[4].split(delimiter)[0].split(":")[1].trim();

    // Parse and clean series names
    let series_names_array = arr[5]
        .split(":")[1]
        .split('"')[0]
        .split(delimiter)
        .map(n => n.trim())
        .filter(name => name !== "");

    // Prepare delimter separated rows
    let rawData = arr.slice(7).map(row => row.split(delimiter));
    let columnCount = rawData[0].length;

    // Infer format: default to xyyy
    let series_columns_format = "xyyy";

    // Check for xyxy staggered format based on last-row y-values.
    // If any of the even-numbered columns (which would be y-columns) contain non-numeric values in last row,
    // we assume this is staggered xyxy format with alternating x/y series.
    if (columnCount >= 4) {
        const lastRow = rawData[rawData.length - 1];
        for (let i = 1; i < columnCount; i += 2) {
            const val = lastRow[i];
            if (val && isNaN(parseFloat(val))) {
                series_columns_format = "xyxy";
                break;
            }
        }
    }

    let newData = [];
    if (series_columns_format === "xyyy") {
        // Format: x column followed by multiple y columns
        let parsedData = rawData.map(row => row.map(val => parseFloat(val)));
        for (let i = 1; i < columnCount; i++) {
            let series_number = i - 1;
            let x_series = parsedData.map(row => row[0]).filter(val => !isNaN(val));
            let y_series = parsedData.map(row => row[i]).filter(val => !isNaN(val));
            let seriesJSON = JSON.parse(JSON.stringify(plotlyTemplate.data[0]));
            seriesJSON.name = series_names_array[series_number] || `Series ${i}`;
            seriesJSON.x = x_series;
            seriesJSON.y = y_series;
            seriesJSON.uid = String(series_number);
            newData.push(seriesJSON);
        }

    } else {
        // Format: alternating x/y column pairs
        for (let i = 0; i < columnCount; i += 2) {
            let series_number = i / 2;
            let x_vals = [];
            let y_vals = [];
            rawData.forEach(row => {
                let x = parseFloat(row[i]);
                let y = parseFloat(row[i + 1]);
                if (!isNaN(x) && !isNaN(y)) {
                    x_vals.push(x);
                    y_vals.push(y);
                }
            });
            let seriesJSON = JSON.parse(JSON.stringify(plotlyTemplate.data[0]));
            seriesJSON.name = series_names_array[series_number] || `Series ${series_number + 1}`;
            seriesJSON.x = x_vals;
            seriesJSON.y = y_vals;
            seriesJSON.uid = String(series_number);
            newData.push(seriesJSON);
        }
    }
    // Build final result JSON
    let resultJSON = JSON.parse(JSON.stringify(plotlyTemplate));
    resultJSON.comments = comments;
    resultJSON.datatype = data_type;
    resultJSON.layout.title = { text: graph_title };
    resultJSON.layout.xaxis.title = { text: x_label };
    resultJSON.layout.yaxis.title = { text: y_label };
    resultJSON.data = newData;
    return resultJSON;
}

// A function that will create a csv string from the jsonified data
// Supports both XYYY and XYXY formats for CSV export
export function createCSV(jsonified) {
    //Ensure valid input.
    if (!jsonified || typeof jsonified !== "object") {
        console.warn("Invalid input to createCSV:", jsonified);
        return {
            csv: "",
            filename: "invalid.csv"
        };
    }
    // Defining the variables
    let csv = "";
    const xLabel = jsonified.layout?.xaxis?.title?.text || "";
    const yLabel = jsonified.layout?.yaxis?.title?.text || "";
    const comments = jsonified?.comments || "";
    const dataType = jsonified?.datatype || "";
    const chartLabel = jsonified.layout?.title?.text || "UntitledGraph";
    const dataSets = Array.isArray(jsonified?.data) ? jsonified.data : [];
    let seriesName = "";
    // Adding the name of each dataset separated by comma
    dataSets.forEach((dataSet, dataSetIndex) => {
        const last = dataSetIndex === dataSets.length - 1;
        const suffix = !last ? "," : "";
        seriesName += (dataSet?.name || "") + suffix;
    });
    // Concatenating the values into the string
    csv += "comments: " + comments + "\r\n";
    csv += "DataType: " + dataType + "\r\n";
    csv += "Chart_label: " + chartLabel + "\r\n";
    csv += "x_label: " + xLabel + "\r\n";
    csv += "y_label: " + yLabel + "\r\n";
    csv += "series_names:, " + seriesName + "\r\n";
    // Determine whether x arrays are equal across datasets
    const allXEqual = dataSets.every(dataSet =>
        JSON.stringify(dataSet?.x || []) === JSON.stringify(dataSets[0]?.x || [])
    );
    if (allXEqual) {
        // XYYY format: All series share the same x-axis
        csv += "x_values";
        dataSets.forEach((dataSet, dataSetIndex) => {
            const idx = `_${dataSetIndex + 1}`;
            const suffix = dataSetIndex === dataSets.length - 1 ? "\r\n" : "";
            csv += ",y" + idx + suffix;
        });
        const xValues = dataSets[0]?.x || [];
        const yValuesArray = dataSets.map(dataSet => dataSet?.y || []);
        xValues.forEach((xValue, rowIndex) => {
            let row = xValue;
            yValuesArray.forEach(yArray => {
                row += "," + yArray[rowIndex];
            });
            csv += row + "\r\n";
        });
    } else {
        // XYXY format: Each series has its own x and y values
        // Writing headers for each pair of x/y columns
        csv += dataSets.map((dataSet, dataSetIndex) => `x_${dataSetIndex + 1},y_${dataSetIndex + 1}`).join(",") + "\r\n";
        // Compute the longest x-array length among all datasets using a loop
        // Note: Math.max could have been used here for conciseness
        let maxLength = 0;
        dataSets.forEach(dataSet => {
            const length = (dataSet?.x || []).length;
            if (length > maxLength) {
                maxLength = length;
            }
        });
        // Loop through each row index up to maxLength
        // For each series, get the x and y value at current index
        // If a value is missing at that index, fallback to empty string
        for (let rowIndex = 0; rowIndex < maxLength; rowIndex++) {
            const row = dataSets.map(dataSet => {
                const xArray = dataSet?.x || [];
                const yArray = dataSet?.y || [];
                const xVal = xArray[rowIndex] !== undefined ? xArray[rowIndex] : "";
                const yVal = yArray[rowIndex] !== undefined ? yArray[rowIndex] : "";
                return `${xVal},${yVal}`;
            }).join(",");
            csv += row + "\r\n";
        }
    }
    return {
        csv: csv,
        filename: "mergedRecord" + ".csv"
    };
}



// Gets the name of the uploaded file with the extension removed.
export function getBaseFileName(fileName) {
    let arrayName = fileName.split(".");
    return arrayName[0];
}


// Helper function to read file as text using Promises, so we can use await.
export async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.fileName = file.name;
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", () => reject(new Error("File reading error")));
    reader.readAsText(file);
  });
}


window.jsonifyData = jsonifyData; //line needed for index.html to see the function after importing.
window.findFileType = findFileType; //line needed for index.html to see the function after importing.
window.jsonifyTSV = jsonifyTSV; //line needed for index.html to see the function after importing.
window.jsonifyCSV = jsonifyCSV; //line needed for index.html to see the function after importing.
window.getBaseFileName = getBaseFileName; //line needed for index.html to see the function after importing.
window.readFileAsText = readFileAsText; //line needed for index.html to see the function after importing.
