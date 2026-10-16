import { loadTemperatures } from './data.js';
import { drawHeatmap } from './heatmap.js';

// Both pages use the same D3 rendering code; only the level differs.
const level = Number(document.body.dataset.level);
const tooltip = document.getElementById('tooltip');
let measure = 'max';
let dataset;

// Switching between monthly max and min temperatures.
document.querySelectorAll('input[name="measure"]').forEach(input => {
  input.addEventListener('change', () => {
    measure = input.value;
    if (dataset) drawHeatmap(dataset, level, measure, tooltip);
  });
});

loadTemperatures('temperature_daily.csv').then(data => {
  dataset = data;
  drawHeatmap(dataset, level, measure, tooltip);
}).catch(error => {
  document.getElementById('error').textContent =
    'Could not load temperature_daily.csv. Use a local HTTP server; see README.md.';
  console.error(error);
});
