# [JSONGrapher]()

Online address for using the JSONGrapher: https://www.jsongrapher.com <br>
Python version of JSONgrapher: https://github.com/AdityaSavara/jsongrapher-py <br>

JSON grapher allows drag-and-drop plotting of 2D, 3D, and 4D plots from JSON files containing x,y or x,y,z data.
Plot multiple datasets fromd different sources on the same graph.
JSONGrapher automatically converts between different units such as (kg to g) or(km/s to m/s) to enable comparison of data.

[![JSONGrapher Concept](./other_html/ConceptImage.png)](./other_html/ConceptImage.png)

Try right clicking to download and save some of the example files below to drag and drop into jsongrapher.com::
 https://github.com/AdityaSavara/JSONGrapherExamples/raw/main/ExampleDataRecords/1-CO2__Adsorption_Isotherms/CO2AdsorptionNaX2.json <br>
 https://github.com/AdityaSavara/JSONGrapherExamples/raw/main/ExampleDataRecords/1-CO2__Adsorption_Isotherms/CO2Adsorption_NaX_and_CaX_two_series.json <br>
 https://github.com/AdityaSavara/JSONGrapherExamples/raw/main/ExampleDataRecords/1-CO2__Adsorption_Isotherms/CO2AdsorptionNaX2.csv <br>
 https://github.com/AdityaSavara/JSONGrapherExamples/raw/main/ExampleDataRecords/1-CO2__Adsorption_Isotherms/CO2AdsorptionNaX2.tsv.txt <br>
 https://github.com/AdityaSavara/JSONGrapherExamples/raw/main/ExampleDataRecords/9-3D-Arrhenius/Rate_Constant_mesh3d.json
 https://github.com/AdityaSavara/JSONGrapherExamples/raw/main/ExampleDataRecords/9-3D-Arrhenius/Rate_Constant_scatter3d.json
  

Some additional example files are available at https://github.com/AdityaSavara/JSONGrapherExamples

The top level field of "datatype" describes the data type (such as CO2_Adsorption_Isotherm, CO2_Differential_Adsorption_Enthalpy, NH3_Temperature_Programmed_Desorption). The xaxis title and yaxis title are intended for units (such as kJ/mol and  mol/m^2).  All three of these titles must match when attempting to plot multiple series on the same graph. If the top level title does not match, that means the data should not be compared, and if either of the axes titles do not match between series, that will be taken as an indication that the units are not correct. In the future, there may be features to convert units or to upload data series by CSV files.

Additional Information:

The format that is recommended to be used is shown in the file CO2AdsorptionNaX2.json. When using this format, it is possible to add additional series onto the existing plot from multiple json files.  When doing so, the top-level title must match, as well as the X axis title and Y axis title. The axes titles are meant to be used for units. All other settings, such as chart title, will be taken from the first json file loaded.

Piotr Paszek made the initial core code of JSON Grapher, which relies on plotly.  He has significant experience with javascript and data visualization, and he may be hired at https://www.upwork.com/freelancers/paszek

Med. Amar Filali added most of the additional features: including unit conversions (using UUC), the ability for external simulations, and CSV download of the last dataset. He has significant experience in making dynamic websites and specialized Javascript codes. He may be hired at https://www.upwork.com/freelancers/~01844d5a23ecf022cf

Aditya Savara added advanced features such as 3D plotting, color gradients (colorscales), and the symbolic expressions (equations) module.

The idea of JSONGrapher was conceived of by Aditya Savara, and it is used as a demonstration for the concepts described in a publication which has the core authors of Aditya Savara, Sylvain Gouttebroze, Stefan Andersson, Francesca Lønstad Bleken.