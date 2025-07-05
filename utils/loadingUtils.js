// This module is for loading scripts that place a global variable in the window.
// For example, the script from mathJS, when run, places "math" as a variable in the window.
// And the script from Ajv, when run, places a constructor (normally named Ajv) in the window.
// That global variable gets *renamed locally* by loadScript, so "math" becomes "mathModule"
// and "Ajv" becomes "AjvConstructor". We then use those local names of the global variables
// to start whatever we need to, in our work. It's a bit confusing, but useful.
// The loadScript function uses a Promise inside because that allows us to
// have the same module instance loaded across different places while ensuring that
// even if the import statement executes early, the importing module will wait for the loading to really finish.
//
// Example usage for mathJS, which does not require a constructor:
//     import { loadScript } from './loadingUtils.js';
//     const math = await loadScript('math', 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.1/math.min.js');
//     console.log('mathJS instance ready:', math);
//
// Example usage for loading the ajv script, which requires a constructor:
//     import { loadScript } from './loadingUtils.js';
//     const AjvConstructor = await loadScript('Ajv', 'https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/utils/AJV/6.12.6/ajv.bundle.min.js');
//     const ajvInstance = new AjvConstructor();
//     console.log('AJV instance ready:', ajvInstance);

/**
 * Loads an external script and returns a Promise that resolves
 * with the global object once available (e.g., Ajv constructor or math module).
 *
 * @param {string} globalVarName - Expected global name placed on `window` by the library.
 * @param {string} scriptUrl - The script URL to load (GitHub, CDN, etc.).
 * @param {boolean} [forceReload=false] - Whether to force script reinjection.
 * @returns {Promise<any>} - Resolves with the loaded global object.
 */
export function loadScript(globalVarName, scriptUrl, forceReload = false) {
  return new Promise((resolve, reject) => {
    const finalURL = createCDNURLasNeeded(scriptUrl);
    const existingScript = document.querySelector(`script[src="${finalURL}"]`);
    const globalObj = window[globalVarName];

    if (existingScript && !forceReload) {
      console.log(`Script for ${globalVarName} already present. Skipping injection.`);
      if (globalObj) {
        resolve(globalObj); // Global already available — resolve immediately
      } else {
        // Wait for the existing script to finish loading
        existingScript.addEventListener('load', () => resolve(window[globalVarName]));
        existingScript.addEventListener('error', () =>
          reject(new Error(`Script load failed: ${finalURL}`))
        );
      }
      return;
    }

    if (existingScript && forceReload) {
      existingScript.remove();
      console.log(`Previous script for ${globalVarName} removed. Reloading...`);
    }

    const script = document.createElement('script');
    script.src = finalURL;
    script.async = true;

    script.onload = () => {
      const loadedObj = window[globalVarName];
      if (loadedObj) {
        console.log(`${globalVarName} loaded successfully.`);
        resolve(loadedObj);
      } else {
        reject(new Error(`Script loaded, but global "${globalVarName}" not found.`));
      }
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script: ${finalURL}`));
    };

    document.head.appendChild(script);
  });
}



/**
 * Converts GitHub blob or raw URLs into jsDelivr CDN URLs if applicable.
 * If the input is not a supported GitHub URL, errors or returns the original URL.
 *
 * @param {string} inputUrl - Original script URL (GitHub blob/raw or standard CDN)
 * @returns {string} A jsDelivr-compatible CDN URL if conversion applies, or the original URL
 */
function createCDNURLasNeeded(inputUrl) {
  // Handle relative URLs:
  // These include:
  // - './path/to/file.js' (relative to current file)
  // - '../scripts/util.js' (relative to parent directory)
  // - '/assets/main.js' (relative to site root)
  // These are not external resources and should not be altered.
  if (/^(\.{0,2}\/|\/)/.test(inputUrl)) {
    return inputUrl;
  }

  try {
    const url = new URL(inputUrl);

    // Convert GitHub "blob" URLs to jsDelivr CDN format
    // Example: https://github.com/user/repo/blob/branch/file.js
    if (url.hostname === 'github.com') {
      const [, user, repo, blob, branch, ...pathParts] = url.pathname.split('/');
      if (blob === 'blob' && user && repo && branch && pathParts.length) {
        const path = pathParts.join('/');
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
      }
    }

    // Convert raw.githubusercontent.com URLs to jsDelivr CDN format
    // Example: https://raw.githubusercontent.com/user/repo/branch/file.js
    if (url.hostname === 'raw.githubusercontent.com') {
      const [, user, repo, branch, ...pathParts] = url.pathname.split('/');
      if (user && repo && branch && pathParts.length) {
        const path = pathParts.join('/');
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
      }
    }

    // If no conversion rule matches, return the original input
    return inputUrl;
  } catch (error) {
    // If input is not a valid URL, return it unchanged
    console.error(`Invalid URL or conversion failed: ${error.message}`);
    return inputUrl;
  }
}
