let initialized = false;//global variable to keep trakck of whether config has been initialized.

export const config = {
    useRemote: false,  
    moduleSourceBaseURL: 'https://github.com/AdityaSavara/JSONGrapher/blob/main/src/',
    localBaseURL: './src/'
};

//This function checks whether modules can be accessed by CDN or not.
async function canAccessCDN(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

//When config.js is first loaded, this line checks if CDNs can be accessed, and sets config.useRemote based on test result
canAccessCDN(`https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/src/AJV/6.12.6/ajv.bundle.min.js`)
    .then(result => config.useRemote = result);

// Call this once at app startup
export async function initConfig() {
    if (initialized) return; // Prevent double init

    const testURL = `https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/src/AJV/6.12.6/ajv.bundle.min.js`;
    const result = await canAccessCDN(testURL);
    config.useRemote = result;
    initialized = true;
}

// Safe accessor for other modules that initializes only if needed
export async function getConfig() {
    if (!initialized) {
        await initConfig();
    }
    return config;
}