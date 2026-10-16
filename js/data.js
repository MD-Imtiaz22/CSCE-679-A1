/** Load daily observations and group them by year and month. */
export function loadTemperatures(filename) {
  return new Promise((resolve, reject) => {
    d3.csv(filename, (error, rows) => {
      if (error) return reject(error);

      // d3.csv in D3 v3 loads numeric columns as strings.
      const days = rows.map(row => {
        const [year, month, day] = row.date.split('-').map(Number);
        return {
          date: row.date,
          year,
          month,
          day,
          max: Number(row.max_temperature),
          min: Number(row.min_temperature)
        };
      }).filter(d => Number.isFinite(d.max) && Number.isFinite(d.min));

      const byMonth = new Map();
      days.forEach(day => {
        const key = `${day.year}-${day.month}`;
        if (!byMonth.has(key)) {
          byMonth.set(key, {year: day.year, month: day.month, days: []});
        }
        byMonth.get(key).days.push(day);
      });

      // A monthly maximum is the highest DAILY maximum; a monthly
      // minimum is the lowest DAILY minimum.
      byMonth.forEach(month => {
        month.max = d3.max(month.days, d => d.max);
        month.min = d3.min(month.days, d => d.min);
        month.days.sort((a, b) => a.day - b.day);
        month.daysInCalendar = new Date(month.year, month.month, 0).getDate();
      });

      resolve({
        byMonth,
        firstYear: d3.min(days, d => d.year),
        lastYear: d3.max(days, d => d.year)
      });
    });
  });
}
