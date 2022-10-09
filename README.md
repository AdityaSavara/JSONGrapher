# [JSONGrapher]()

Online address for using the JSON Grapher: 
https://adityasavara.github.io/JSONGrapher/

JSON grapher allows creating scatter-line plots from one or more JSON files containing x-y data.

The direct links to the example files are:  
 https://github.com/AdityaSavara/JSONGrapher/raw/main/data/8259_edited_Series1.json  
 https://github.com/AdityaSavara/JSONGrapher/raw/main/data/8259_edited_Series2.json  
 https://github.com/AdityaSavara/JSONGrapher/raw/main/data/8259_edited_Series3.json  
 https://github.com/AdityaSavara/JSONGrapher/raw/main/data/8259_edited_both_series.json  

Some additional files, including invalid files, are inside https://github.com/AdityaSavara/JSONGrapher/tree/main/data .

The top level field of "title" describes the data type (such as CO2_Adsorption_Isotherm, CO2_Differential_Adsorption_Enthalpy, NH3_Temperature_Programmed_Desorption). The xaxis title and yaxis title are intended for units (such as kJ/mol and  mol/m^2).  All three of these titles must match when attempting to plot multiple series on the same graph. If the top level title does not match, that means the data should not be compared, and if either of the axes titles do not match between series, that will be taken as an indication that the units are not correct. In the future, there may be features to convert units or to upload data series by CSV files.

Additional Information:

The format that is recommended to be used is shown in the files with names that begin with "8259_edited". When using this format, it is possible to add additional series onto the existing plot from multiple json files.  When doing so, the top-level title must match, as well as the X axis title and Y axis title. The axes titles are meant to be used for units. All other settings, such as chart title, will be taken from the first json file loaded.

JSON Grapher was made by Piotr Paszek. He has significant experience with javascript and data visiualization, and he may be hired at https://www.upwork.com/freelancers/paszek
