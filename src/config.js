let initialized = false; // Tracks whether the configuration has been initialized
const testURLCDN = 'https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/src/AJV/6.12.6/ajv.bundle.min.js'

export const config = {
    useRemote: false,  // Flag indicating if remote resources should be used
    moduleSourceBaseURL: 'https://github.com/AdityaSavara/JSONGrapher/blob/main/src/', // URL for remote module source
    localBaseURL: './src/' // Default local base path for module loading
};

/**
 * Updates the local base URL for module resolution.
 * @param {string} path - The new relative or absolute path to use for local modules.
 */
export function setLocalBaseURL(path) {
    config.localBaseURL = path;
}

/**
 * Performs a HEAD request to determine if the specified CDN resource is accessible.
 * @param {string} url - The URL to test.
 * @returns {Promise<boolean>} - Resolves to true if the resource is accessible; false otherwise.
 */
async function canAccessCDN(url) {
    try {
        console.log(url, "CDN check");
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

async function canAccessLocal() {
    try {
        const url = config.localBaseURL + 'AJV/6.12.6/ajv.bundle.min.js'
        const res = await fetch(url, { method: 'HEAD' });
        config.checkLocal = res
        return res.ok;
    } catch {
        return false;
    }
}

// Optimistically attempts local accessibility check during module load
canAccessLocal()
    .then(result => config.checkLocal = result);

// Optimistically attempts CDN accessibility check during module load
canAccessCDN(testURLCDN)
    .then(result => {
        config.useRemote = result; 
        config.checkCDN = result;
    });

let configPromise = null;

/**
 * Checks accessibility of both remote and local module URLs.
 * Sets useRemote to true/false based on if the sources are reachable.
 * If both or neither are available, defaults to local.
 */
export async function initConfig() {
    if (initialized) return;
    if (!configPromise) {
        const remoteURL = 'https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/src/AJV/6.12.6/ajv.bundle.min.js';
        configPromise = Promise.all([
            canAccessCDN(remoteURL),
            canAccessLocal()
        ]).then(([remoteOk, localOk]) => {
            config.useRemote = remoteOk && !localOk;
            initialized = true;

            let cdnStatus;
            let localStatus;

            if (remoteOk) cdnStatus = 'CDN is available';
            else cdnStatus = 'CDN is unavailable';

            if (localOk) localStatus = 'Local is available';
            else localStatus = 'Local is unavailable';

            if (config.useRemote) {
                console.log(`Initialization: ${cdnStatus}, ${localStatus} → Using CDN`);
            } else {
                console.log(`Initialization: ${cdnStatus}, ${localStatus} → Using Local`);
            }
        });
    }
    await configPromise;
}


/**
 * Returns the current configuration object.
 * Ensures configuration is initialized before access.
 * @returns {Promise<object>} - Resolves to the config object.
 */
export async function getConfig() {
    if (!initialized) {
        await initConfig();
    }
    return config;
}
