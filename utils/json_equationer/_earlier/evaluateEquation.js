// functions.js - Contains reusable functions

function evaluateEquation(jsonInput, variables) {
    try {
        const equationString = jsonInput.equation.equation_string;
        const expression = equationString.split("=")[1].trim();
        const scope = { ...jsonInput.equation.constants, ...variables };
        return math.evaluate(expression, scope);
    } catch (error) {
        console.error("Error evaluating equation:", error);
        return "Error evaluating equation.";
    }
}

// Make function globally available
window.evaluateEquation = evaluateEquation;
