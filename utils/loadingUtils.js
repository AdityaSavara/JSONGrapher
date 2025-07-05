// This module is for loading scripts that place a global variable in the window.
// For example, the script from mathJS, when run, places "math" as a variable in the window.
// And the script from Ajv, when run, places a constructor (normally named Ajv) in the window.
// that global variable gest *renamed locally* by loadScript, so "math" becomes "mathModule"
//  and "Ajv" becomes "AjvConstructor", we then use those local names of the global variables
// to start whatever we need to, in our work. It's a bit confusing, but useful.
//
//Example usage for mathJS, which does not require a constructor.
//    import { loadScript } from './../loadingUtils.js';
//    let math;
//    loadScript('math', 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.1/math.min.js', (mathModule) => {
//      math = mathModule;
//      console.log('mathJS instance ready:', math);
//    });
//
// Example usage for loading the ajv script, which requires a constructor. Paths should be as desired for actual usage.
// The 3rd argument is an optional callback, since some modules require a constructor to be called after loading.
// Note that the user does not get to choose the first argument of loadScript arbitrarily.
// It is usually defined in the original script like "global.Ajv =..."
// In this case, the Ajv bundle has "global:"undefined"!=typeof self?self:this).Ajv"
// 
//      import {loadScript} from './utils/loadingUtils.js'
//      let ajvInstance;
//      loadScript('Ajv', 'https://github.com/AdityaSavara/JSONGrapher/blob/main/utils/AJV/6.12.6/ajv.bundle.min.js', (AjvConstructor) => {
//          ajvInstance = new AjvConstructor();
//          console.log('AJV instance ready:', ajvInstance);
//      });



/**
 * Loads an external script and invokes a callback once the global object is available.
 *
 * @param {string} globalVariableNameToUse - The expected global variable name after the script loads (e.g. 'Ajv')
 * @param {string} url - The script URL to load (supports GitHub or CDN links)
 * @param {function} onReadyCallback - Callback function to invoke with the global object when the script is available
 * @param {boolean} [forceReload=false] - Whether to force reinjection even if the script is already present
 */
export function loadScript(globalVariableNameToUse, url, onReadyCallback, forceReload = false) {
  const runWhenReady = () => injectScript(globalVariableNameToUse, url, onReadyCallback, forceReload);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runWhenReady);
  } else {
    runWhenReady();
  }
}


/**
 * Dynamically injects a <script> tag and invokes a callback with the loaded global export.
 *
 * @param {string} globalVarName - The global variable name the script defines (e.g. "Ajv" or "math").
 * @param {string} scriptUrl      - The URL of the script to load (supports CDN or GitHub URLs).
 * @param {function} callback     - Function to call with the loaded module/constructor once available.
 * @param {boolean} forceReload   - If true, removes any existing <script> tag before loading.
 */
function injectScript(globalVarName, scriptUrl, callback, forceReload) {
  // 1. Compute the actual URL to load (e.g. rewrite GitHub blobs to raw or add CDN prefixes).
  const finalURL = createCDNURLasNeeded(scriptUrl);
  // 2. See if a <script> tag for this exact src already exists in the document.
  const existingScript = document.querySelector(`script[src="${finalURL}"]`);
  // 3. Immediately check window for the library's export under the given name.
  //    This is how we grab the module or constructor that the script has placed on `window`.
  const globalObj = window[globalVarName];
  // 4. If we’ve already injected the <script> and we're not forcing a reload…
  if (existingScript && !forceReload) {
    console.log(`Script for ${globalVarName} already present. Skipping injection.`);

    // 4a. If the globalObj is already set (i.e. the library loaded earlier),
    //     we can call the callback right away, passing that object in.
    //     This is where `callback(globalObj)` hands you the constructor/module
    //     so you can assign it to your own local variable.
    if (globalObj) {
      callback(globalObj);
    }
    return; // nothing more to do
  }

  // 5. If we’re forcing a reload, remove the old <script> so we can re-inject.
  if (existingScript && forceReload) {
    existingScript.remove();
    console.log(`Previous script for ${globalVarName} removed. Reloading...`);
  }

  // 6. Create a new <script> tag pointing at our library URL.
  const script = document.createElement('script');
  script.src = finalURL;

  // 7. When the browser finishes downloading & executing the script:
  script.onload = () => {
    // 7a. Pull the new export off window again (it should now be defined).
    const loadedObj = window[globalVarName];

    if (loadedObj) {
      console.log(`${globalVarName} loaded successfully.`);

      // 7b. Invoke the callback with the loaded object.
      //     Inside your callback you typically do:
      //       yourLocalVar = new loadedObj();   // for constructors
      //     or
      //       yourLocalVar = loadedObj;         // for plain modules
      callback(loadedObj);
    } else {
      console.warn(`Script loaded, but global "${globalVarName}" not found.`);
    }
  };

  // 8. If the script fails to load (network error, 404, etc.), log an error.
  script.onerror = () => {
    console.error(`Failed to load script: ${finalURL}`);
  };

  // 9. Finally, append the <script> tag to <head> to kick off loading.
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
