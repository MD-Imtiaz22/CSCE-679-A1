/** Draw the two heatmaps using a common layout and color scale. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Same 0–40 °C mapping in both views and in the legend.
const COLORS = ['#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#e6f598',
  '#ffffbf', '#fdae61', '#f46d43', '#d53e4f', '#9e0142'];
const color = d3.scale.linear()
  .domain([0, 5, 10, 15, 17.5, 20, 25, 30, 35, 40])
  .range(COLORS).clamp(true);

const LAYOUT = {
  1: {left: 58, top: 30, stepX: 41, stepY: 38, cellW: 32, cellH: 30,
      legendX: 933, legendY: 43, legendH: 240, width: 1024, height: 498},
  2: {left: 88, top: 40, stepX: 97, stepY: 72, cellW: 78, cellH: 58,
      legendX: 1058, legendY: 48, legendH: 242, width: 1165, height: 930}
};

function getYearList(dataset, level) {
  const first = level === 1
    ? dataset.firstYear
    : Math.max(dataset.firstYear, dataset.lastYear - 9);
  return d3.range(first, dataset.lastYear + 1);
}

/** Place the year labels at the top and the month labels on the left. */
function drawAxes(svg, years, layout) {
  const x0 = layout.left - (layout.top === 40 ? 18 : 7);
  const axisTop = layout.top - 14;
  svg.append('path')
    .attr('class', 'axis-rule')
    .attr('d', `M${x0},${axisTop}H${layout.left + years.length * layout.stepX - 6}`);
  svg.append('path')
    .attr('class', 'axis-rule')
    .attr('d', `M${x0},${axisTop - 5}V${layout.top + 11 * layout.stepY + layout.cellH}`);

  svg.selectAll('.year-label').data(years).enter().append('text')
    .attr('class', 'axis-label year-label')
    .attr('x', (year, col) => layout.left + col * layout.stepX + layout.cellW / 2)
    .attr('y', axisTop - 6)
    .attr('text-anchor', 'middle')
    .text(year => year);

  svg.selectAll('.month-label').data(MONTHS).enter().append('text')
    .attr('class', 'axis-label month-label')
    .attr('x', x0 - 7)
    .attr('y', (month, row) => layout.top + row * layout.stepY + layout.cellH / 2 + 3)
    .attr('text-anchor', 'end')
    .text(month => month);
}

/** A vertical legend showing temperature/color mapping. */
function drawLegend(svg, layout) {
  const section = layout.legendH / 80; // 0.5 degree per section
  const legend = svg.append('g').attr('class', 'legend');
  legend.selectAll('rect').data(d3.range(80)).enter().append('rect')
    .attr('x', layout.legendX)
    .attr('y', index => layout.legendY + index * section)
    .attr('width', 22)
    .attr('height', section + 0.5)
    .attr('fill', index => color(index / 2));
  legend.append('text').attr('x', layout.legendX + 28)
    .attr('y', layout.legendY + 5).text('0 Celsius');
  legend.append('text').attr('x', layout.legendX + 28)
    .attr('y', layout.legendY + layout.legendH + 3).text('40 Celsius');
}

/** Show exactly the relevant month/date and high/low temperatures. */
function showTooltip(tooltip, html, event) {
  tooltip.innerHTML = html;
  tooltip.hidden = false;
  const x = Math.min(event.clientX + 12, window.innerWidth - tooltip.offsetWidth - 8);
  const y = Math.min(event.clientY + 12, window.innerHeight - tooltip.offsetHeight - 8);
  tooltip.style.left = `${Math.max(6, x)}px`;
  tooltip.style.top = `${Math.max(6, y)}px`;
}

function drawDailyLines(group, month, layout) {
  // The same 0–40 °C y-scale is used in every monthly mini chart.
  // Thus positions can be compared across months.
  const x = d3.scale.linear().domain([1, month.daysInCalendar])
    .range([3, layout.cellW - 3]);
  const y = d3.scale.linear().domain([0, 40])
    .range([layout.cellH - 3, 3]);
  const series = [
    {type: 'max', className: 'daily-max'},
    {type: 'min', className: 'daily-min'}
  ];
  series.forEach(seriesInfo => {
    const line = d3.svg.line()
      .x(day => x(day.day))
      .y(day => y(day[seriesInfo.type]));
    group.append('path').datum(month.days)
      .attr('class', `daily-line ${seriesInfo.className}`)
      .attr('d', line);
  });
}

export function drawHeatmap(dataset, level, measure, tooltip) {
  const svg = d3.select('#chart');
  const layout = LAYOUT[level];
  const years = getYearList(dataset, level);
  svg.selectAll('*').remove();
  svg.attr('width', layout.width).attr('height', layout.height)
    .attr('viewBox', `0 0 ${layout.width} ${layout.height}`);
  drawAxes(svg, years, layout);

  // Bind one month/year data item to one SVG group and background rectangle.
  const cells = [];
  years.forEach((year, col) => {
    for (let monthNumber = 1; monthNumber <= 12; monthNumber++) {
      const month = dataset.byMonth.get(`${year}-${monthNumber}`);
      if (month) cells.push({month, col, row: monthNumber - 1});
    }
  });
  const groups = svg.selectAll('.month-cell').data(cells).enter()
    .append('g').attr('class', 'month-cell')
    .attr('transform', d => `translate(${layout.left + d.col * layout.stepX},` +
      `${layout.top + d.row * layout.stepY})`);
  groups.append('rect')
    .attr('width', layout.cellW).attr('height', layout.cellH)
    .attr('fill', d => color(d.month[measure]));

  if (level === 2) {
    groups.each(function(d) { drawDailyLines(d3.select(this), d.month, layout); });
  }

  // Level 1 tooltip reports the monthly high and low; Level 2 finds
  // the day's data closest to the cursor within the miniature chart.
  groups.on('mousemove', function(d) {
    let html;
    if (level === 1) {
      const date = `${d.month.year}-${String(d.month.month).padStart(2, '0')}`;
      html = `Date: ${date}; max: ${d.month.max}; min: ${d.month.min}`;
    } else {
      const pixelX = d3.mouse(this)[0];
      const approximateDay = 1 + Math.max(0, Math.min(1, pixelX / layout.cellW)) *
        (d.month.daysInCalendar - 1);
      const nearest = d.month.days.reduce((best, day) =>
        Math.abs(day.day - approximateDay) < Math.abs(best.day - approximateDay)
          ? day : best);
      html = `Date: ${nearest.date}; max: ${nearest.max}; min: ${nearest.min}`;
    }
    showTooltip(tooltip, html, d3.event);
  }).on('mouseout', () => { tooltip.hidden = true; });

  drawLegend(svg, layout);
}
