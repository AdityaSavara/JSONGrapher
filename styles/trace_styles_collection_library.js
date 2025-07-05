// This file stores the automatically loaded trace_styles_collection for JSONGrapher.
// It is not recommended to overwrite this file.
//
// Any styles upgrades made to this file should be made to both the javascript and the python version.
// The python version is at: https://github.com/AdityaSavara/jsongrapher-py/tree/main/JSONGrapher/styles
//
// Each object below represents one 'trace_styles_collection'.
// "default" is the first one.

export const trace_styles_collection_library = {
    default: {
        scatter_spline: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 2 },
            marker: { size: 10 }
        },
        scatter_line: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "linear", width: 2 },
            marker: { size: 10 }
        },
        line: {
            type: "scatter",
            mode: "lines",
            line: { shape: "linear", width: 2 },
            marker: { size: 10 }
        },
        lines: {
            type: "scatter",
            mode: "lines",
            line: { shape: "linear", width: 2 },
            marker: { size: 10 }
        },
        scatter: {
            type: "scatter",
            mode: "markers",
            marker: { size: 10 }
        },
        bubble: {
            type: "scatter",
            mode: "markers",
            marker: {
                color: "auto",
                colorscale: "Jet",
                showscale: true
            }
        },
        bubble2d: {
            type: "scatter",
            mode: "markers",
            marker: {
                color: "auto",
                colorscale: "Jet",
                showscale: true
            }
        },        
        spline: {
            type: "scatter",
            mode: "lines",
            line: { shape: "spline", width: 2 },
            marker: { size: 0 } // Hide markers for smooth curves
        },
        bar: {
            type: "bar",
            marker: {
                color: "blue",
                opacity: 0.8,
                line: { color: "black", width: 2 }
            }
        },
        default: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 2 },
            marker: { size: 10 }
        },
        curve3d: {
            mode: "lines",
            type: "scatter3d",
            line: { width: 4 }
        },
        scatter3d: {
            mode: "markers",
            type: "scatter3d",
            marker: { color: "", colorscale: "Jet", showscale: true }
        },
        mesh3d: {
            type: "mesh3d",
            intensity: [],
            colorscale: "Jet",
            showscale: true
        },
        bubble3d: {
            mode: "markers",
            type: "scatter3d",
            marker: { color: "", colorscale: "Jet", showscale: true }
        },
        heatmap: {
            type: "heatmap",
            colorscale: "Viridis"
        }
    },
    minimalist: {
        scatter_spline: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 1 },
            marker: { size: 6 }
        },
        scatter: {
            type: "scatter",
            mode: "lines",
            line: { shape: "linear", width: 1 },
            marker: { size: 0 }
        },
        spline: {
            type: "scatter",
            mode: "lines",
            line: { shape: "spline", width: 1 },
            marker: { size: 0 }
        },
        bar: { type: "bar" },
        heatmap: {
            type: "heatmap",
            colorscale: "Greys"
        }
    },
    bold: {
        scatter_spline: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 4 },
            marker: { size: 10 }
        },
        scatter: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 4 },
            marker: { size: 12 }
        },
        spline: {
            type: "scatter",
            mode: "lines",
            line: { shape: "spline", width: 4 },
            marker: { size: 0 }
        },
        bar: { type: "bar" },
        heatmap: {
            type: "heatmap",
            colorscale: "Jet"
        }
    },
    scatter: { // This style forces all traces into scatter.
        scatter_spline: {
            type: "scatter",
            mode: "markers",
            marker: { size: 10 }
        },
        scatter: {
            type: "scatter",
            mode: "markers",
            marker: { size: 10 }
        },
        spline: {
            type: "scatter",
            mode: "markers",
            marker: { size: 10 }
        },
        bar: {
            type: "scatter",
            mode: "markers",
            marker: { size: 10 }
        },
        heatmap: {
            type: "heatmap",
            colorscale: "Viridis"
        }
    },
    scatter_spline: { // This style forces all traces into spline only.
        scatter_spline: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 2 },
            marker: { size: 0 }
        },
        scatter: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 2 },
            marker: { size: 0 }
        },
        spline: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 2 },
            marker: { size: 0 }
        },
        bar: {
            type: "scatter",
            mode: "lines+markers",
            line: { shape: "spline", width: 2 },
            marker: { size: 0 }
        },
        heatmap: {
            type: "heatmap",
            colorscale: "Viridis"
        }
    }
};

