function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {object} report
 */
export function buildTickerReportCsv(report) {
  const m = report.meta;
  const lines = [];
  lines.push(`Symbol,${escapeCsvCell(m.symbol)}`);
  lines.push(`Company,${escapeCsvCell(m.companyName)}`);
  lines.push(`Period,${escapeCsvCell(m.periodLabel)}`);
  lines.push(`Benchmark,${escapeCsvCell(m.benchmark)}`);
  lines.push('');
  lines.push('Metric,Value');
  for (const row of report.statsGrid || []) {
    lines.push(`${escapeCsvCell(row.label)},${escapeCsvCell(row.value)}`);
  }
  lines.push('');
  lines.push('Trailing Returns,,');
  lines.push('Period,Ticker,S&P 500 (SPY),Excess');
  for (const row of report.trailingReturns || []) {
    lines.push(
      [row.period, row.ticker, row.bench, row.excess].map(escapeCsvCell).join(',')
    );
  }
  lines.push('');
  lines.push('Monthly Statistics,,');
  for (const row of report.monthlyStatsLeft || []) {
    lines.push(`${escapeCsvCell(row.label)},${escapeCsvCell(row.value)}`);
  }
  for (const row of report.monthlyStatsRight || []) {
    lines.push(`${escapeCsvCell(row.label)},${escapeCsvCell(row.value)}`);
  }
  lines.push('');
  lines.push('Drawdown Metrics,,');
  for (const row of report.drawdownMetrics || []) {
    lines.push(`${escapeCsvCell(row.label)},${escapeCsvCell(row.value)}`);
  }
  lines.push('');
  lines.push('Relative Strength,,');
  for (const row of report.relativeStrength || []) {
    lines.push(`${escapeCsvCell(row.label)},${escapeCsvCell(row.value)}`);
  }
  lines.push('');
  lines.push('FAQs,,');
  for (const item of report.faqs || []) {
    lines.push(`Q,${escapeCsvCell(item.q)}`);
    lines.push(`A,${escapeCsvCell(item.a)}`);
  }
  return lines.join('\n');
}

/**
 * @param {object} report
 */
export function downloadTickerReportCsv(report) {
  const csv = buildTickerReportCsv(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const filename = `${report.meta.symbol}_${report.meta.periodKey}_report.csv`;
  downloadBlob(blob, filename);
}

/**
 * @param {HTMLElement} rootEl
 * @param {object} report
 */
export async function downloadTickerReportPdf(rootEl, report) {
  if (!rootEl || typeof document === 'undefined') return;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const canvas = await html2canvas(rootEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: getComputedStyle(rootEl).backgroundColor || '#ffffff',
    logging: false
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentW = pageW - margin * 2;
  const imgH = (canvas.height * contentW) / canvas.width;
  let heightLeft = imgH;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentW, imgH);
  heightLeft -= pageH - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgH + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentW, imgH);
    heightLeft -= pageH - margin * 2;
  }

  pdf.save(`${report.meta.symbol}_${report.meta.periodKey}_report.pdf`);
}
