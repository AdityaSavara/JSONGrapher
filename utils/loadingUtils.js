// Example usage for loading the ajv script. Paths should be as desired for actual usage.
// Note that the user does not get to choose the first argument of loadScript arbitrarily.
// It is usually defined in the original script like "global.Ajv =..."
// In this case, the Ajv bundle has "global:"undefined"!=typeof self?self:this).Ajv"
// 
//      import {loadScript} from './utils/loadingUtils.js'
//      let ajvInstance;
//      loadScript('Ajv', './utils/AJV/6.12.6/ajv.bundle.min.js', (AjvConstructor) => {
//          ajvInstance = new AjvConstructor();
//          console.log('AJV instance ready:', ajvInstance);
//      });



/**
 * Loads an external script and invokes a callback once the global object is available.
 *
 * @param {string} globalVariableNameToUse - The expected global variable name after the script loads (e.g. 'Ajv')
 * @param {string} url - The script URL to load (supports GitHub or CDN links)
 * @param {function} onReady - Callback to invoke with the global object when the script is available
 * @param {boolean} [forceReload=false] - Whether to force reinjection even if the script is already present
 */
export function loadScript(globalVariableNameToUse, url, onReady, forceReload = false) {
  const runWhenReady = () => injectScript(globalVariableNameToUse, url, onReady, forceReload);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runWhenReady);
  } else {
    runWhenReady();
  }
}

/**
 * Dynamically injects a <script> tag into the document. Optionally removes previous instance.
 *
 * @param {string} globalVarName - The name of the expected global variable exposed by the script this is defined 
 * @param {string} scriptUrl - The URL of the script to load
 * @param {function} callback - Callback invoked with the loaded global object
 * @param {boolean} forceReload - If true, reinjects the script even if it exists
 */
function injectScript(globalVarName, scriptUrl, callback, forceReload) {
  const finalURL = createCDNURLasNeeded(scriptUrl);
  const existingScript = document.querySelector(`script[src="${finalURL}"]`);
  const globalObj = window[globalVarName];

  if (existingScript && !forceReload) {
    console.log(`Script for ${globalVarName} already present. Skipping injection.`);
    if (globalObj) {
      callback(globalObj);
    }
    return;
  }

  if (existingScript && forceReload) {
    existingScript.remove();
    console.log(`Previous script for ${globalVarName} removed. Reloading...`);
  }

  const script = document.createElement('script');
  script.src = finalURL;
  script.onload = () => {
    const loadedObj = window[globalVarName];
    if (loadedObj) {
      console.log(`${globalVarName} loaded successfully.`);
      callback(loadedObj);
    } else {
      console.warn(`Script loaded, but global "${globalVarName}" not found.`);
    }
  };
  script.onerror = () => {
    console.error(`Failed to load script: ${finalURL}`);
  };
  document.head.appendChild(script);
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
