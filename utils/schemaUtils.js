import { loadScript } from './loadingUtils.js';
//start of block to get Ajv ready
//    <!--  We use AJV for json validation. We use the 6.12.6 version because the later version had a compilation error. To reduce the external dependency, we have the source code on our github in he AJV folder, it is an under an MIT LICENSE, as noted in the LICENSE file of JSON Grapher.
//    <script src="https://cdnjs.cloudflare.com/ajax/libs/ajv/6.12.6/ajv.bundle.min.js" integrity="sha512-Xl0g/DHU98OkfXTsDfAAuTswzkniYQWPwLyGXzcpgDxCeH52eePfaHj/ictLAv2GvlPX2qZ6YV+3oDsw17L9qw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> -->
let ajvInstance;

if (navigator.onLine) {
    // Online: load from CDN
    const AjvConstructor = await loadScript('Ajv', 'https://cdn.jsdelivr.net/gh/AdityaSavara/JSONGrapher@main/utils/AJV/6.12.6/ajv.bundle.min.js');
    ajvInstance = new AjvConstructor();
    console.log('AJV loaded in schemaUtils.js from CDN');
} else {
    // Offline: load from local
    const AjvConstructor = await loadScript('Ajv', './utils/AJV/6.12.6/ajv.bundle.min.js');
    ajvInstance = new AjvConstructor();
    console.log('AJV loaded in schemaUtils.js from local copy');
}
//end of block to get Ajv ready.


      // function to extract from the datatype the location of the schema
      export function getSchemaLocation(jsonified, template = false, errorDiv = null) {
        if (!jsonified.datatype) {
          errorDiv.innerText += "Warning: The datatype field was not found in the record provided. Accordingly, a schema check will not be performed and the record will not be fully validated. \n";
          jsonified.datatype = ""; // Populate with an empty string
        }

        if (isValidUrl(jsonified.datatype)) {
          const template_suffix = jsonified.datatype.replace(
            ".schema.json",
            ".schema.template.json"
          );
          return !template ? jsonified.datatype : template_suffix;
        } else if (jsonified.datatype.endsWith("schema.json")) {
          if (template) {
            const template_suffix = jsonified.datatype.replace(
              ".schema.json",
              ".schema.template.json"
            );
            return "./utils/schema/" + template_suffix;
          } else {
            return "./utils/schema/" + jsonified.datatype;
          }
        } else {
          if (template) {
            return "./utils/schema/" + jsonified.datatype + ".schema.template.json";
          } else {
            return "./utils/schema/" + jsonified.datatype + ".schema.json";
          }
        }
      }

      // function to extract from the datatype the json schema
      export async function getSchemaType(jsonified, errorDiv) {
        let schema2body;
        const schema_location = getSchemaLocation(jsonified);
        const schema_template_location = getSchemaLocation(jsonified, true);
        try {
          const schema1 = await fetch(schema_location);
          const schema2 = await fetch(schema_template_location);
          const schema1body = await schema1.text();
          if (schema2.status == 404) {
            schema2body = "{}";
          } else {
            schema2body = await schema2.text();
          }
          const schema1json = JSON.parse(schema1body);
          const schema2json = JSON.parse(schema2body);
          return [schema1json, schema2json];
        } catch (err) {
          // TODO: !! error catching to be made informative.
          //errorDiv.innerText += "undocumented error in getSchemaType\n";

          try {
            const schema1 = await fetch("./utils/schema/0_PlotlyTemplate.json");
            const schema1body = await schema1.text();
            const schema1json = JSON.parse(schema1body);
            return [schema1json, {}];
          } catch (err2) {
            return [{}, {}];
          }
        }
      }

      // A function that prepares the plotly schema and the template for the jsonification
      export async function prepareUniversalSchemas() {
        const schema1 = await fetch("./utils/schema/plot-schema.json");
        const schema1body = await schema1.text();
        const schema1json = JSON.parse(schema1body);
        const schema2 = await fetch("./utils/schema/0_PlotlyTemplate.json");
        const schema2body = await schema2.text();
        const schema2json = await JSON.parse(schema2body);
        return [schema1json, schema2json];
      }



      export async function initializeUniversalSchemas() {
        try {
          const universalSchemas = await prepareUniversalSchemas();
          const schema1json = universalSchemas[0];
          const schema2json = universalSchemas[1];
          return [schema1json, schema2json];
        } catch (err) {
          console.log("Error from initializeJSONGrapher: ", err);
          // Return nulls to maintain consistent output structure on error
          return [null, null];
        }
      }

      // a function that merges jsonified with the template
      export function mergeFigDictWithTemplate(jsonified, schema_template) {
        const merged = JSON.parse(JSON.stringify(jsonified));

        merged.data.forEach((dataSet) => {
          dataSet.mode = schema_template.data[0].mode;
          dataSet.line = schema_template.data[0].mode;
        });

        return merged;
      }


      
      export async function validateData(jsonified, errorDiv) {
        // STEP 3: Check if the jsonified object is a valid JSON file against the schema
        let [schema_type, schema_template] = await getSchemaType(jsonified, errorDiv);

        if (Object.keys(schema_type).length === 0) {
          errorDiv.innerText +=
            "Schema check: There was no Schema specific to this DataType, or the schema was not compatible. The default scatter plot schema was used.\n";
          schema_type = schema;
        }

        // validate the json
        const validate = compileSchema(schema_type);
        const valid = validate(jsonified);

        if (!valid) {
          // Console log an error if the data is not valid against the schema
          console.log("validate errors: ", JSON.stringify(validate.errors));
          // Display an error message if the data is not valid against the schema
          errorDiv.innerText += `Json file does not match the schema. ${JSON.stringify(validate.errors)}\n`;
          errorDiv.innerText += `Json file does not match the schema. ${JSON.stringify(validate.errors)}\n`;
          return null;
        }

        let _jsonified = jsonified;
        if (Object.keys(schema_template).length !== 0) {
          _jsonified = mergeFigDictWithTemplate(jsonified, schema_template);
        }

        return _jsonified;
      }


      function compileSchema(schema) {
          if (!ajvInstance) {
            throw new Error('AJV has not been initialized yet.');
          }
          return ajvInstance.compile(schema);
        }
