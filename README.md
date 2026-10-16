# CSCE 679 — Assignment 1

Implementation of Level 1 and Level from the assignment github.

## Direct through pages
https://md-imtiaz22.github.io/CSCE-679-A1/level1.html
https://md-imtiaz22.github.io/CSCE-679-A1/level2.html

## Running locally

From the folder containing level1.html, run from powershell:

py -m http.server 8000 --bind 127.0.0.1

Open http://127.0.0.1:8000/level1.html for Level 1, or http://127.0.0.1:8000/level2.html for Level 2.


- level1.html, level2.html: Level 1 and Level 2 pages.
- js/data.js: loads and groups the supplied CSV by month.
- js/heatmap.js: draws axes, rectangles, daily lines, tooltips, and the shared color legend using D3.js.
- js/main.js: loads the dataset and handles the max/min selection.
- js/d3.v3.min.js: D3.js v3 library.
- css/style.css: simple styling.
- temperature_daily.csv: original provided dataset.

