// input.js - Handles input and calls evaluateEquation()

// Example JSON data
const jsonData = {
    "equation": {
        "equation_string": "k = A * e^((-Ea) / (R * T))",
        "constants": {
            "R": 8.314,
            "A": 1e13,
            "e": 2.71828
        }
    }
};

// Example user-provided variables
const variables = {
    Ea: 40000,
    T: 300
};

// Compute result
const result = evaluateEquation(jsonData, variables);

// Expose result globally for `testing.html`
window.result = result;
