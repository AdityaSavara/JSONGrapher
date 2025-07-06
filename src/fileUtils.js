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
    // Separate rows
    let arr = fileContent.split("\n");
    // If last row is empty, remove it
    if (arr[arr.length - 1].length < 2) {
        arr = arr.slice(0, arr.length - 1);
    }
    // Count number of columns
    let number_of_columns = arr[0].split("\t").length;
    // Extract the config information
    let comments     = arr[0].split("\t")[0].split(":")[1].trim();
    let data_type    = arr[1].split("\t")[0].split(":")[1].trim();
    let chart_label  = arr[2].split("\t")[0].split(":")[1].trim();
    let x_label      = arr[3].split("\t")[0].split(":")[1].trim();
    let y_label      = arr[4].split("\t")[0].split(":")[1].trim();
    let custom       = arr[5]; // This field is for custom JSON objects and is currently ignored.
    // Extract the series names
    let series_names_array = arr[5]
        .split(":")[1]
        .split('"')[0]
        .split("\t")
        .map(n => n.trim());
    // Ignore arr[7], which is custom_variables:
    // Extract the data
    let data = arr
        .slice(8)
        .map(row => row.split("\t").map(str => Number(str)));
    let resultJSON = JSON.parse(JSON.stringify(plotlyTemplate, null, 2)); // clone of the template. The ", null, 2" is optional to make the json more human readable.
    resultJSON.comments = comments;
    resultJSON.datatype = data_type;
    resultJSON.layout.title = { text: chart_label };
    resultJSON.layout.xaxis.title = { text: x_label };
    resultJSON.layout.yaxis.title = { text: y_label };
    let newData = [];
    series_names_array.forEach((series_name, index) => {
        let dataClone = JSON.parse(
            JSON.stringify(plotlyTemplate.data[0], null, 2)
        ); // the ", null, 2" is optional to make the json more human readable.
        dataClone.name = series_name;
        dataClone.x = data.map(row => row[0]);
        dataClone.y = data.map(row => row[index + 1]);
        dataClone.uid += String(index);
        newData.push(dataClone);
    });
    resultJSON.data = newData;
    return resultJSON;
}

// A function that jsonifies a CSV file
export function jsonifyCSV(fileContent, plotlyTemplate) {
    // Separate rows
    let arr = fileContent.split("\n");
    // If last row is empty, remove it
    if (arr[arr.length - 1].length < 2) {
        arr = arr.slice(0, arr.length - 1);
    }
    // Count number of columns
    let number_of_columns = arr[5].split(",").length;
    // Extract the config information
    let comments     = arr[0].split(",")[0].split(":")[1].trim();
    let data_type    = arr[1].split(",")[0].split(":")[1].trim();
    let chart_label  = arr[2].split(",")[0].split(":")[1].trim();
    let x_label      = arr[3].split(",")[0].split(":")[1].trim();
    let y_label      = arr[4].split(",")[0].split(":")[1].trim();
    // Extract the series names
    let series_names_array = arr[5]
        .split(":")[1]
        .split('"')[0]
        .split(",")
        .map(n => n.trim());
    // Extract the data
    let data = arr
        .slice(7)
        .map(row => row.split(",").map(str => Number(str)));
    let resultJSON = JSON.parse(JSON.stringify(plotlyTemplate, null, 2)); // Clone of the template. The "null, 2" are optional arguments that increase human readability.
    resultJSON.comments = comments;
    resultJSON.datatype = data_type;
    resultJSON.layout.title = { text: chart_label };
    resultJSON.layout.xaxis.title = { text: x_label };
    resultJSON.layout.yaxis.title = { text: y_label };
    // Remove any series where the series name is blank.
    function isNotBlank(value) {
        return value != "";
    }
    series_names_array = series_names_array.filter(isNotBlank);
    // We make a data set for each series_name, this way the blank series_name that have been removed will not be included.
    let newData = [];
    series_names_array.forEach((series_name, index) => {
        let dataClone = JSON.parse(
            JSON.stringify(plotlyTemplate.data[0]),
            null,
            2
        ); // The ", null, 2" are optional arguments to increase human readability.
        dataClone.name = series_name;
        dataClone.x = data.map(row => row[0]);
        dataClone.y = data.map(row => row[index + 1]);
        dataClone.uid = dataClone.uid + String(index);
        newData.push(dataClone);
    });
    resultJSON.data = newData;
    return resultJSON;
}


      // A function that will create a csv string from the jsonified data
      // Returns Error: "The CSV could not be created: currently the CSV export only supports creating CSV files for XYYY data and not for cases that require XYXY."
      export function createCSV(jsonified) {
        // Defining the variables
        let csv = "";
        let bulkValues = "";
        let errors = false;
        const csvHeadersArray = [];
        const csvValuesArray = [];
        const xLabel = jsonified.layout.xaxis.title.text;
        const yLabel = jsonified.layout.yaxis.title.text;
        const comments = jsonified.comments;
        const dataType = jsonified.datatype;
        const chartLabel = jsonified.layout.title.text;
        const dataSets = jsonified.data;
        const dataSetIndex = jsonified.data.length - 1;
        const dataSet = jsonified.data[dataSetIndex];
        let seriesName = "";

        // Adding the name of each dataset separated by comma
        dataSets.forEach((dataSet) => {
          const last =
            dataSets.indexOf(dataSet) === dataSets.length - 1 ? true : false;
          const suffix = !last ? "," : "";
          seriesName += dataSet.name + suffix;
        });

        // Concatenating the values into the string
        csv += "comments: " + comments + "\r\n";
        csv += "DataType: " + dataType + "\r\n";
        csv += "Chart_label: " + chartLabel + "\r\n";
        csv += "x_label: " + xLabel + "\r\n";
        csv += "y_label: " + yLabel + "\r\n";
        csv += "series_names: " + seriesName + "\r\n";

        csv += "x_values";

        // Iterating through the data sets and adding the x and y headers to the csv string and checking if all x arrays are equal
        dataSets.forEach((dataSet, index) => {
          const idx = `_${index + 1}`;
          const suffix = index === dataSets.length - 1 ? "\r\n" : "";
          csv += ",y" + idx + suffix;
        });
        dataSets[0].x = dataSets[0].x || []; //create the x array if it does not exist (for equation dataseries etc.)
        dataSets[0].y = dataSets[0].y || []; //create the y array if it does not exist (for equation dataseries etc.)
        dataSets[0].x.forEach((x, _index) => {
          let extraYValues = "";
          for (let i = 0; i < dataSets.length; i++) {
            extraYValues += "," + dataSets[i].y[_index];
          }
          csv += x + extraYValues + "\r\n";
        });

        for (const dataSet of dataSets) {
          const first_X_array = dataSets[0].x;
          // Checking if all the x arrays are equal
          if (dataSet.x.toString() !== first_X_array.toString()) {
            errors = true;
            csv =
              "Error: The CSV could not be created: currently the CSV export only supports creating CSV files for XYYY data and not for cases that require XYXY.";
          }
        }

        return {
          csv: csv,
          filename: chartLabel + ".csv",
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
