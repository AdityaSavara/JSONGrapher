These files are for testing model simulation calls directly, without JSONGrapher, and are useful for making model files, simulation files, and debugging.
The sections below describe the various files.

####### JAVASCRIPT SIMULATOR TESTER  ############
####### javascript_function_tester.html ##########
This file tests model simulators that have a javascript front end. 
Currently, all JSONGrapher model simulators must have a javascript front end and must be hosted on github.

To test a javascript simulator and JSONGrapher JSON file combination:
1. Open this file on your computer in a browser.
2. Upload a valid JSONGrapher JSON file with model call. 
3. Upload a valid javascript file (it must only have a single function, simulate).
4. Click "Run Simulate". 

Example files:
    JSON Files: Any json file from JSONGrapherExamples\ExampleModelRecords.
    Javascript File: Langmuir_Isotherm.js from JSONGrapherExamples\ExampleSimulators.
    
Please note that the simulation step will ignore any model url in the JSONGrapher JSON and will use the uploaded javascript file. Also, if will only attempt to simulate a single series model call which must be in the first data field. 
Since all JSONGrapher model simulators must have a javascript front end, the above file can actually test any JSONGrapher model simulator (even the https call ones). But, typically this will be used for direct javascript simulators.

####### HTTPS CALL SIMULATOR TESTER ############
####### httpsCall_tester.html ##########
This file is for when model simulators require an httpsCall, such as for a python flask model.
See the manual for more details.

To perform the testing:
1. Open this file on your computer in a browser.
2. Run the program that will receive the call (such as JSONGrapherExamples\ModelSimulatorPython\flask_connector.py with python_models directory)
3. Start your https link, such as the one below:
ssh -p 443 -o StrictHostKeyChecking=no -R0:127.0.0.1:5000 a.pinggy.io x:xff x:fullurl a:origin:adityasavara.github.io x:passpreflight
4. Copy and paste your https link into the browser webpage and click "Make HTTPS Ping Call".
5. Upload a valid JSONGrapher JSON file with model call (such as https_343_kinetic.json )
6. Click to make the simulate call.

Example files and Commands:
    Example https link creation: ssh -p 443 -o StrictHostKeyChecking=no -R0:127.0.0.1:5000 a.pinggy.io x:xff x:fullurl a:origin:adityasavara.github.io x:passpreflight
    Example receiver: JSONGrapherExamples\ModelSimulatorPython\flask_connector.py (download it with python_models directory)
    JSON File: https_343_equilibrium.json from \JSONGrapherExamples\ExampleModelRecordsHttpsCall
    Simulating Files: \JSONGrapherExamples\ModelSimulatorPython\python_models
    
Please note that with this file, the simulation step will ignore the httpsCall link inside your JSON file but will still be using https_simulator_link.js
The simulation step will also use your backend simulator (in this case, one from the python_models directory).
If you want to use your own python models, itt is necessary for your python model function calls to be linked inside the dictionary in flask_connector_settings.py

