// Mock ad data generation
function generateMockData() {
  const channels = ['巨量引擎', '腾讯广告', '快手', '百度', '网易'];
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    channels.forEach(channel => {
      const impressions = Math.floor(Math.random() * 50000) + 10000;
      const ctr = Math.random() * 0.05 + 0.01;
      const clicks = Math.floor(impressions * ctr);
      const cpc = Math.random() * 2 + 0.5;
      const cost = parseFloat((clicks * cpc).toFixed(2));
      const cvr = Math.random() * 0.1 + 0.02;
      const conversions = Math.floor(clicks * cvr);
      const conversionCost = conversions > 0 ? parseFloat((cost / conversions).toFixed(2)) : 0;

      data.push({
        date: dateStr,
        channel,
        impressions,
        clicks,
        ctr: parseFloat((ctr * 100).toFixed(2)),
        cost,
        conversions,
        conversionCost
      });
    });
  }

  return data;
}

function updateKPIs(data) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = data.filter(d => d.date === today);

  const totalImpressions = todayData.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = todayData.reduce((sum, d) => sum + d.clicks, 0);
  const totalCost = todayData.reduce((sum, d) => sum + d.cost, 0);
  const totalConversions = todayData.reduce((sum, d) => sum + d.conversions, 0);

  document.getElementById('impressions').textContent = totalImpressions.toLocaleString();
  document.getElementById('clicks').textContent = totalClicks.toLocaleString();
  document.getElementById('cost').textContent = '¥' + (totalCost > 0 ? totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');
  document.getElementById('conversions').textContent = totalConversions.toLocaleString();
}

let trendChart = null;

function updateChart(data) {
  const dates = [...new Set(data.map(d => d.date))].sort();
  const dailyCost = dates.map(date =>
    data.filter(d => d.date === date).reduce((sum, d) => sum + d.cost, 0)
  );
  const dailyConversions = dates.map(date =>
    data.filter(d => d.date === date).reduce((sum, d) => sum + d.conversions, 0)
  );

  const ctx = document.getElementById('trendChart').getContext('2d');

  if (trendChart) {
    trendChart.destroy();
  }

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => d.slice(5)),
      datasets: [
        {
          label: '消耗 (¥)',
          data: dailyCost,
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108,92,231,0.1)',
          yAxisID: 'y',
          tension: 0.3
        },
        {
          label: '转化数',
          data: dailyConversions,
          borderColor: '#00b894',
          backgroundColor: 'rgba(0,184,148,0.1)',
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: '近7日趋势'
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '消耗 (¥)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '转化数'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

function updateTable(data) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = data.filter(d => d.date === today);

  const tbody = document.querySelector('#channelTable tbody');
  tbody.innerHTML = todayData.map(d => `
    <tr>
      <td>${d.channel}</td>
      <td>${d.impressions.toLocaleString()}</td>
      <td>${d.clicks.toLocaleString()}</td>
      <td>${d.ctr}%</td>
      <td>¥${d.cost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${d.conversions.toLocaleString()}</td>
      <td>${d.conversionCost > 0 ? '¥' + d.conversionCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}</td>
    </tr>
  `).join('');
}

function updateSuggestions(data) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = data.filter(d => d.date === today);

  const suggestions = [];

  // Find channels with high cost and low conversions
  const maxCostChannel = todayData.reduce((max, d) => d.cost > max.cost ? d : max, todayData[0]);
  suggestions.push(`${maxCostChannel.channel} 消耗最高 (¥${maxCostChannel.cost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), 建议重点关注其转化效果。`);

  // Find channels with low CTR
  const lowCTR = todayData.filter(d => d.ctr < 1.5);
  if (lowCTR.length > 0) {
    suggestions.push(`${lowCTR.map(d => d.channel).join('、')} 点击率偏低 (<1.5%), 建议优化创意素材或调整定向策略。`);
  }

  // Find high conversion cost
  const highCostConv = todayData.filter(d => d.conversionCost > 100 && d.conversions > 0);
  if (highCostConv.length > 0) {
    suggestions.push(`${highCostConv.map(d => d.channel).join('、')} 转化成本较高 (>¥100), 建议调整出价策略或优化落地页。`);
  }

  suggestions.push('建议对比不同渠道的转化归因窗口, 确保数据口径一致。');

  document.getElementById('suggestionList').innerHTML = suggestions
    .map(s => `<div class="suggestion-item">${s}</div>`)
    .join('');
}

function init() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

  document.getElementById('startDate').value = weekAgo;
  document.getElementById('endDate').value = today;

  const data = generateMockData();
  updateKPIs(data);
  updateChart(data);
  updateTable(data);
  updateSuggestions(data);

  document.getElementById('refreshBtn').addEventListener('click', () => {
    const newData = generateMockData();
    updateKPIs(newData);
    updateChart(newData);
    updateTable(newData);
    updateSuggestions(newData);
  });
}

document.addEventListener('DOMContentLoaded', init);
