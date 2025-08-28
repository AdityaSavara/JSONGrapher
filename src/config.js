let initialized = false; // Tracks whether the configuration has been initialized
const testURLCDN = 'https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/src/AJV/6.12.6/ajv.bundle.min.js'

/**
 * Configuration object for module loading behavior.
 * Determines whether to use remote or local sources and sets base URLs accordingly.
 *
 * @property {Boolean} useRemote - Flag indicating if remote resources should be used.
 * @property {String} moduleSourceBaseURL - URL for remote module source.
 * @property {String} localBaseURL - Default local base path for module loading.
 */
export const config = {
  useRemote: false,  // Flag indicating if remote resources should be used
  moduleSourceBaseURL: 'https://github.com/AdityaSavara/JSONGrapher/blob/main/src/', // URL for remote module source
  localBaseURL: './src/' // Default local base path for module loading
};


/**
 * Updates the local base URL for module resolution.
 * @param {string} path - The new relative or absolute path to use for local modules.
 */
/**
 * Updates the local base URL used for module loading.
 *
 * @param {String} path - The new local base path to assign to the config.
 */
export function setLocalBaseURL(path) {
  config.localBaseURL = path;
}


/**
 * Performs a HEAD request to determine if the specified CDN resource is accessible.
 * @param {string} url - The URL to test.
 * @returns {Promise<boolean>} - Resolves to true if the resource is accessible; false otherwise.
 */
/**
 * Checks whether a given CDN URL is accessible by sending a HEAD request.
 * Logs the URL being checked and returns a boolean indicating availability.
 *
 * @param {String} url - The CDN URL to test for accessibility.
 * @returns {Promise<Boolean>} True if the URL responds with a successful status, false otherwise.
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


/**
 * Checks whether a local resource is accessible by sending a HEAD request.
 * Stores the response object in `config.checkLocal` for later inspection.
 *
 * @returns {Promise<Boolean>} True if the local resource responds successfully, false otherwise.
 */
async function canAccessLocal() {
  try {
    const url = config.localBaseURL + 'AJV/6.12.6/ajv.bundle.min.js';
    const res = await fetch(url, { method: 'HEAD' });
    config.checkLocal = res;
    return res.ok;
  } catch {
    return false;
  }
}


// Optimistically attempts local accessibility check during module load
/**
 * Asynchronously checks local resource availability and updates `config.checkLocal` with the result.
 * This is a convenience call to `canAccessLocal()` that stores the boolean outcome.
 */
canAccessLocal()
  .then(result => config.checkLocal = result);


// Optimistically attempts CDN accessibility check during module load
/**
 * Asynchronously checks CDN availability and updates `config.useRemote` and `config.checkCDN`.
 * This determines whether remote resources should be used based on accessibility.
 */
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
/**
 * Initializes the configuration by checking CDN and local resource availability.
 * Sets `config.useRemote` based on accessibility and logs the decision.
 * Ensures initialization runs only once and caches the result in `configPromise`.
 *
 * @returns {Promise<void>} Resolves when configuration is initialized.
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
/**
 * Retrieves the configuration object, initializing it if necessary.
 * Ensures CDN/local availability checks are completed before returning config.
 *
 * @returns {Promise<Object>} The finalized configuration object.
 */
export async function getConfig() {
  if (!initialized) {
    await initConfig();
  }
  return config;
}

