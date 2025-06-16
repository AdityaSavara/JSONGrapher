// A function checks the extension of the file and calls the appropriate function to jsonify the file
export function jsonifyData(filetype, dataLoaded) {
    switch (filetype) {
        case "csv": {
            return jsonifyCSV(dataLoaded);
        }
        case "tsv": {
            return jsonifyTSV(dataLoaded);
        }
        default: {
            return JSON.parse(dataLoaded);
        }
    }
}

// A function that checks the uploaded file extension
export function findFileType(fileName) {
    let arrayName = fileName.split(".");

    if (arrayName.includes("csv")) {
        return "csv";
    }

    if (arrayName.includes("tsv")) {
        return "tsv";
    }

    return "json";
}


// A function that jsonifies a TSV file
export function jsonifyTSV(fileContent) {
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
export function jsonifyCSV(fileContent) {
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

// Gets the name of the uploaded file
export function getFileName(fileName) {
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
window.getFileName = getFileName; //line needed for index.html to see the function after importing.
window.readFileAsText = readFileAsText; //line needed for index.html to see the function after importing.
