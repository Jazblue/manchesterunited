const seasonsUrl = './data/seasons.json';
const valuationUrl = './data/valuation.json';

const summaryGrid = document.getElementById('summaryGrid');
const chart = document.getElementById('chart');
const seasonTable = document.getElementById('seasonTable');
const timeline = document.getElementById('timeline');
const valuationList = document.getElementById('valuationList');
const viewSelect = document.getElementById('viewSelect');
const filterSelect = document.getElementById('filterSelect');
const resetBtn = document.getElementById('resetBtn');
const chartTitle = document.getElementById('chartTitle');
const chartNote = document.getElementById('chartNote');

let allSeasons = [];
let valuations = [];

function managerBuckets(data) {
  const counts = new Map();
  data.forEach(item => {
    const lead = item.manager.split('/')[0].trim();
    counts.set(lead, (counts.get(lead) || 0) + 1);
  });
  return [...counts.entries()];
}

function filteredData() {
  let data = [...allSeasons];
  if (filterSelect.value === 'trophy') data = data.filter(x => x.trophies.length > 0);
  if (filterSelect.value === 'top4') data = data.filter(x => x.league_position <= 4);
  return data;
}

function getBarClass(item, view) {
  const value = view === 'league' ? item.league_position : item.trophies.length;
  if (view === 'league') {
    if (value <= 4) return 'elite';
    if (value <= 8) return 'solid';
    return 'poor';
  }
  if (value >= 2) return 'elite';
  if (value === 1) return 'solid';
  return 'poor';
}

function renderSummary(data) {
  const bestFinish = Math.min(...data.map(x => x.league_position));
  const totalTrophies = data.reduce((sum, x) => sum + x.trophies.length, 0);
  const managers = managerBuckets(data).sort((a, b) => b[1] - a[1]);
  const avgPos = (data.reduce((sum, x) => sum + x.league_position, 0) / data.length).toFixed(1);

  const cards = [
    ['Best league finish', `${bestFinish}${bestFinish === 1 ? 'st' : ''}`],
    ['Total trophies', totalTrophies],
    ['Most common manager', managers[0]?.[0] || 'N/A'],
    ['Average league position', avgPos]
  ];

  summaryGrid.innerHTML = cards.map(([label, value]) => `
    <div class="summary-card">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `).join('');
}

function renderChart(data) {
  const view = viewSelect.value;
  chartTitle.textContent = view === 'league' ? 'League position by season' : 'Trophies won by season';
  chartNote.textContent = view === 'league'
    ? 'Lower is better. Bars are scaled so stronger finishes sit higher visually.'
    : 'Bar height represents total trophies won that season.';

  chart.innerHTML = data.map(item => {
    const raw = view === 'league' ? item.league_position : item.trophies.length;
    const height = view === 'league' ? ((21 - item.league_position) / 20) * 320 : Math.max(item.trophies.length * 70, 14);
    const title = `${item.season}\nPosition: ${item.league_position}\nTrophies: ${item.trophies.join(', ') || 'None'}\nManager: ${item.manager}\nChairman: ${item.chairman}`;
    return `
      <div class="bar-wrap" title="${title}">
        <div class="bar ${getBarClass(item, view)}" style="height:${height}px">
          ${item.trophies.length ? `<span class="trophy-count">${item.trophies.length}</span>` : ''}
          ${view === 'trophies' ? raw : ''}
        </div>
        <div class="bar-label">${item.season}</div>
      </div>
    `;
  }).join('');
}

function renderTable(data) {
  seasonTable.innerHTML = data.map(item => `
    <tr>
      <td>${item.season}</td>
      <td>${item.league_position}</td>
      <td>${item.trophies.join(', ') || 'None'}</td>
      <td>${item.manager}</td>
      <td>${item.chairman}</td>
    </tr>
  `).join('');
}

function renderTimeline() {
  const eras = [];
  let current = null;
  allSeasons.forEach(item => {
    const leadManager = item.manager.split('/')[0].trim();
    if (!current || current.manager !== leadManager) {
      current = { manager: leadManager, from: item.season, to: item.season };
      eras.push(current);
    } else {
      current.to = item.season;
    }
  });
  timeline.innerHTML = eras.map(era => `<div class="era">${era.manager}, ${era.from} to ${era.to}</div>`).join('');
}

function renderValuations() {
  valuationList.innerHTML = valuations.map(item => `
    <div class="valuation-item">
      <strong>${item.year}</strong>
      <span>${item.value}</span>
      <span>${item.label}</span>
    </div>
  `).join('');
}

function render() {
  const data = filteredData();
  renderSummary(data);
  renderChart(data);
  renderTable(data);
}

Promise.all([fetch(seasonsUrl).then(r => r.json()), fetch(valuationUrl).then(r => r.json())]).then(([seasons, valuationData]) => {
  allSeasons = seasons;
  valuations = valuationData;
  renderTimeline();
  renderValuations();
  render();
});

viewSelect.addEventListener('change', render);
filterSelect.addEventListener('change', render);
resetBtn.addEventListener('click', () => {
  viewSelect.value = 'league';
  filterSelect.value = 'all';
  render();
});
