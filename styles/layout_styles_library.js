// This file stores the automatically loaded trace_styles_collection for JSONGrapher.
// It is not recommended to overwrite this file.
//
// Each object below, like "default" or "Nature," represents a 'layout_style'.
// Style names are currently case-sensitive, but this may change in the future.

const layout_styles_library = {
    default: {
        layout: {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            title: { font: { size: 18 }, x: 0.5 },
            xaxis: { showgrid: true, gridcolor: "#ddd", gridwidth: 1,
                title: { font: { size: 18 } }, tickfont: { size: 18 } },
            yaxis: { showgrid: true, gridcolor: "#ddd", gridwidth: 1,
                 title: { font: { size: 18 } }, tickfont: { size: 18 } },
            legend: {
                title: { font: { size: 10 } },
                font: { size: 10 }
            }
        }
    },
    default3d: {
        layout: {
            title: { font: { size: 32 }, x: 0.5 },
            xaxis: { title: { font: { size: 12 } }, tickfont: { size: 12 } },
            yaxis: { title: { font: { size: 12 } }, tickfont: { size: 12 } },
            zaxis: { title: { font: { size: 12 } }, tickfont: { size: 12 } },
            legend: {
                title: { font: { size: 10 } },
                font: { size: 10 }
            }
        }
    },
    Nature: {
        layout: {
            title: { font: { size: 32, family: "Times New Roman", color: "black" } },
            font: { size: 25, family: "Times New Roman" },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            xaxis: {
                showgrid: true, gridcolor: "#ddd", gridwidth: 1,
                linecolor: "black", linewidth: 2, ticks: "outside",
                tickwidth: 2, tickcolor: "black"
            },
            yaxis: {
                showgrid: true, gridcolor: "#ddd", gridwidth: 1,
                linecolor: "black", linewidth: 2, ticks: "outside",
                tickwidth: 2, tickcolor: "black"
            }
        }
    },
    Science: {
        layout: {
            title: { font: { size: 32, family: "Arial", color: "black" } },
            font: { size: 25, family: "Arial" },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            xaxis: {
                showgrid: true, gridcolor: "#ccc", gridwidth: 1,
                linecolor: "black", linewidth: 2, ticks: "outside",
                tickwidth: 2, tickcolor: "black"
            },
            yaxis: {
                showgrid: true, gridcolor: "#ccc", gridwidth: 1,
                linecolor: "black", linewidth: 2, ticks: "outside",
                tickwidth: 2, tickcolor: "black"
            }
        }
    }
};

