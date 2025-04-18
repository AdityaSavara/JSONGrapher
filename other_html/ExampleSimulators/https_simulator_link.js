async function simulate(input) {
    // Internal logging mechanism
    const log = [];
    function appendToLog(entry) {
        log.push(entry);
        console.log(entry); // Optionally output logs to console
    }
    

    // Log the input JSON object as a string
    const inputString = JSON.stringify(input, null, 2);
    appendToLog(`Input as string:\n${inputString}`);

    /**
     * Normalizes the entered URL by trimming spaces, removing extra slashes, 
     * and ensuring it doesn't contain "http://" or "https://"
     * @param {string} input - The raw user input URL
     * @returns {string} - Cleaned-up URL
     */
    function normalizeHttpsCallURL(input) {
        return input.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }

    // Extract `httpsCallInput` from the provided JSON input
    const httpsCallInput = input.simulate?.httpsCallLink?.trim();
    if (!httpsCallInput) {
        appendToLog(`Error: Please enter a valid HTTPS call link. Received: ${input.simulate?.httpsCallLink || 'undefined or null'}`);
        return log; // Return the log for debugging or external use
    }

    // Prepare the cleaned-up URL for the request
    const postCallURL = normalizeHttpsCallURL(httpsCallInput);
    const fullURL = `https://${postCallURL}`;

    // Log the full URL once before any tests
    appendToLog(`Received the full httpsCallURL: ${fullURL}`);

    // Perform a "no-cors" GET fetch attempt
    appendToLog("Attempting no-cors GET");
    appendToLog("Wait until you see text with the word 'Response' or the word 'Error'.");
    try {
        const noCorsResponse = await fetch(fullURL, { mode: 'no-cors' });
        appendToLog(`No-cors fetch succeeded: ${noCorsResponse}`);
        appendToLog("Http call with no-cors passed.");
    } catch (error) {
        appendToLog(`No-cors fetch error: ${error}`);
        appendToLog("Http call with no-cors failed.");
    }

    // Perform a cors POST request to the https server
    appendToLog("Attempting cors POST");
    appendToLog("Wait until you see text with the word 'Response' or the word 'Error'.");
    try {
        const postResponse = await fetch(fullURL, { method: 'POST' });
        appendToLog(`Post fetch succeeded: ${postResponse}`);
        appendToLog("Https call to https server for POST request passed.");
    } catch (error) {
        appendToLog(`Post fetch error: ${error}`);
        appendToLog("Https call to https server for POST request failed.");
    }

    let jsonResponse = null;

    try {
        // Perform actual POST request with JSON payload
        const response = await fetch(fullURL, {
            method: 'POST',
            mode: 'cors',
            headers: new Headers({
                'Origin': 'adityasavara.github.io',
                'Referer': 'adityasavara.github.io',
                'X-Pinggy-No-Screen': 'True',
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(input) // Use the provided `input` data
        });

        const responseStringFromPost = await response.text();
        appendToLog(`Response from POST:\n${responseStringFromPost}`);

        // JSONify the response string
        jsonResponse = JSON.parse(responseStringFromPost);
        appendToLog(`JSON Response:\n${JSON.stringify(jsonResponse, null, 2)}`);
    } catch (error) {
        appendToLog(`Error during POST request: ${error.message}`);
    }

    
    // Preparing the return
    let responseToReturn; // intialize.
    // Check if jsonResponse exists
    if (jsonResponse) {
        responseToReturn = jsonResponse; // Assign JSON response to the variable
    } else {
        // Prepend a message to the log indicating an error occurred
        log.unshift("Error: An error occurred while processing the simulation. This array contains the logs.");
        responseToReturn = log; // Assign the log to the variable
    }
    
    // Return the response
    return responseToReturn;

}
