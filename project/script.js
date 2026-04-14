let cityData = {};
let chart;

// ✅ LOAD CSV
async function loadCSV() {
  try {
    const res = await fetch("diesel.csv");
    let text = await res.text();

    // remove BOM
    text = text.replace(/^\uFEFF/, "");

    const rows = text.split(/\r?\n/);

    cityData = {};

    rows.forEach((row, index) => {
      if (!row.trim()) return;

      const parts = row.split(",");

      // skip header
      if (index === 0) return;

      if (parts.length < 3) return;

      const city = parts[0].trim();
      const date = parts[1].trim();
      const price = Number(parts[2].trim());

      // 🔥 convert date → timestamp
      const time = new Date(date).getTime();

      if (!city || isNaN(time) || isNaN(price)) return;

      if (!cityData[city]) cityData[city] = [];

      cityData[city].push({ time, price });
    });

    console.log("Parsed Data:", cityData);

    initCities();

  } catch (err) {
    console.error(err);
    alert("CSV loading failed");
  }
}

// ✅ POPULATE CITY DROPDOWN
function initCities() {
  const select = document.getElementById("citySelect");
  select.innerHTML = "";

  const cities = Object.keys(cityData);

  if (cities.length === 0) {
    alert("No cities found!");
    return;
  }

  cities.sort().forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    select.appendChild(opt);
  });
}

// ✅ LINEAR REGRESSION (STABLE)
function linearRegression(xs, ys) {
  const n = xs.length;

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const slope =
    (n * sumXY - sumX * sumY) /
    (n * sumX2 - sumX * sumX);

  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// ✅ PREDICT FUNCTION
function predict() {
  const city = document.getElementById("citySelect").value;
  const inputYear = Number(document.getElementById("yearInput").value);

  if (!cityData[city]) {
    alert("Invalid city!");
    return;
  }

  const data = cityData[city];

  if (data.length < 2) {
    alert("Not enough data!");
    return;
  }

  // 🔥 convert year → timestamp
  const targetTime = new Date(inputYear + "-01-01").getTime();

  const xs = data.map(d => d.time);
  const ys = data.map(d => d.price);

  const { slope, intercept } = linearRegression(xs, ys);

  let pred = slope * targetTime + intercept;
  pred = Math.max(pred, 0);

  // ✅ SHOW RESULT
  const resultBox = document.getElementById("result");
  resultBox.classList.remove("hidden");
  resultBox.innerHTML =
    `Predicted Price in <b>${city}</b> (${inputYear})<br> ₹${pred.toFixed(2)} per litre`;

  drawChart(xs, ys, slope, intercept, targetTime, pred);
}

// ✅ DRAW CHART
function drawChart(xs, ys, slope, intercept, targetTime, pred) {
  const trend = [];

  const minTime = Math.min(...xs);

  // step = ~1 month
  for (let t = minTime; t <= targetTime; t += 1000 * 60 * 60 * 24 * 30) {
    trend.push({
      x: new Date(t).getFullYear(),
      y: slope * t + intercept
    });
  }

  const actual = xs.map((t, i) => ({
    x: new Date(t).getFullYear(),
    y: ys[i]
  }));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Actual",
          data: actual,
          backgroundColor: "blue"
        },
        {
          label: "Trend",
          data: trend,
          borderColor: "orange",
          showLine: true,
          fill: false
        },
        {
          label: "Prediction",
          data: [{
            x: new Date(targetTime).getFullYear(),
            y: pred
          }],
          backgroundColor: "green",
          pointRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Year" }
        },
        y: {
          title: { display: true, text: "Price ₹" }
        }
      }
    }
  });
}

// ✅ START APP
loadCSV();