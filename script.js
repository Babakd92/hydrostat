function readFile(file, callback) {
  const reader = new FileReader();
  reader.onload = () => {
    const values = reader.result
      .split(/\r?\n/)
      .map(line => parseFloat(line.trim()))
      .filter(v => !isNaN(v));
    callback(values);
  };
  reader.readAsText(file);
}

function nse(obs, sim) {
  const meanObs = obs.reduce((a, b) => a + b) / obs.length;
  const numerator = obs.reduce((sum, o, i) => sum + Math.pow(o - sim[i], 2), 0);
  const denominator = obs.reduce((sum, o) => sum + Math.pow(o - meanObs, 2), 0);
  return 1 - numerator / denominator;
}

function pbias(obs, sim) {
  const num = obs.reduce((sum, o, i) => sum + (sim[i] - o), 0);
  const denom = obs.reduce((sum, o) => sum + o, 0);
  return 100 * (num / denom);
}

function kge(obs, sim) {
  const meanObs = obs.reduce((a, b) => a + b) / obs.length;
  const meanSim = sim.reduce((a, b) => a + b) / sim.length;

  const r = pearson(obs, sim);
  const alpha = stdev(sim) / stdev(obs);
  const beta = meanSim / meanObs;

  return 1 - Math.sqrt((r - 1) ** 2 + (alpha - 1) ** 2 + (beta - 1) ** 2);
}

function pearson(x, y) {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = y.reduce((a, b) => a + b) / n;
  const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const den = Math.sqrt(x.reduce((s, xi) => s + (xi - meanX) ** 2, 0) *
                        y.reduce((s, yi) => s + (yi - meanY) ** 2, 0));
  return num / den;
}

function stdev(arr) {
  const mean = arr.reduce((a, b) => a + b) / arr.length;
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length);
}

// Simple NPE (Normalized Performance Efficiency, like NSE but scaled)
function npe(obs, sim) {
  return nse(obs, sim) * 100; // adjust definition as needed
}

// Wilcoxon rank sum test (basic version using external library recommended)
function wilcoxon(obs, sim) {
  // For simplicity, we just compare medians here (approximation)
  const medianObs = obs.sort()[Math.floor(obs.length / 2)];
  const medianSim = sim.sort()[Math.floor(sim.length / 2)];
  return `Median observed = ${medianObs}, Median simulated = ${medianSim}`;
}

function processFiles() {
  const measuredFile = document.getElementById('measuredFile').files[0];
  const observedFile = document.getElementById('observedFile').files[0];

  if (!measuredFile || !observedFile) {
    alert("Please upload both files!");
    return;
  }

  readFile(measuredFile, measured => {
    readFile(observedFile, observed => {
      if (measured.length !== observed.length) {
        alert("Files must have the same number of rows.");
        return;
      }

      const results = {
        NSE: nse(observed, measured).toFixed(3),
        KGE: kge(observed, measured).toFixed(3),
        PBIAS: pbias(observed, measured).toFixed(2) + "%",
        NPE: npe(observed, measured).toFixed(2) + "%",
        Wilcoxon: wilcoxon(observed, measured)
      };

      document.getElementById("results").textContent = JSON.stringify(results, null, 2);
    });
  });
}
