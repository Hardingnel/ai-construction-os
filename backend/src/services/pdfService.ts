import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncate(s: string | null | undefined, max = 80): string {
  if (!s) return '-';
  return s.length > max ? s.substring(0, max) + '...' : s;
}

export async function generateComplianceReport(check: any): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;

  page.drawText('AI Construction OS - Compliance Report', { x: 50, y, size: 18, font: bold });
  y -= 25;
  page.drawText(`Project: ${check.project?.name || 'N/A'}`, { x: 50, y, size: 11, font });
  y -= 16;
  page.drawText(`Date: ${formatDate(check.createdAt)}`, { x: 50, y, size: 11, font });
  y -= 16;
  page.drawText(`Status: ${check.status} | Score: ${check.score ?? 'N/A'}`, { x: 50, y, size: 11, font });
  y -= 25;

  page.drawText(`Passed: ${check.passedItems} | Failed: ${check.failedItems} | Warnings: ${check.warningItems}`, { x: 50, y, size: 10, font });
  y -= 20;

  if (check.summary) {
    page.drawText(`Summary: ${check.summary}`, { x: 50, y, size: 10, font });
    y -= 20;
  }

  page.drawText('--- Check Results ---', { x: 50, y, size: 12, font: bold });
  y -= 20;

  for (const result of check.results || []) {
    if (y < 60) {
      doc.addPage([612, 792]);
      y = height - 50;
    }
    const statusIcon = result.passed ? 'PASS' : result.status === 'warning' ? 'WARN' : 'FAIL';
    page.drawText(`[${statusIcon}] ${result.title || 'Untitled'}`, { x: 50, y, size: 10, font: bold });
    y -= 14;
    if (result.description) {
      page.drawText(`  ${truncate(result.description, 100)}`, { x: 50, y, size: 9, font });
      y -= 12;
    }
    if (result.finding) {
      page.drawText(`  Finding: ${truncate(result.finding, 100)}`, { x: 50, y, size: 9, font });
      y -= 12;
    }
    if (result.recommendation) {
      page.drawText(`  Recommendation: ${truncate(result.recommendation, 100)}`, { x: 50, y, size: 9, font });
      y -= 12;
    }
    y -= 8;
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function generateBOQReport(project: any): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let currentPage = page;
  let y = height - 50;

  currentPage.drawText('AI Construction OS - Bill of Quantities', { x: 50, y, size: 18, font: bold });
  y -= 25;
  currentPage.drawText(`Project: ${project.name}`, { x: 50, y, size: 11, font });
  y -= 16;
  currentPage.drawText(`Date: ${formatDate(project.createdAt)}`, { x: 50, y, size: 11, font });
  y -= 25;

  currentPage.drawText(`Code`, { x: 50, y, size: 9, font: bold });
  currentPage.drawText(`Description`, { x: 100, y, size: 9, font: bold });
  currentPage.drawText(`Qty`, { x: 350, y, size: 9, font: bold });
  currentPage.drawText(`Rate`, { x: 400, y, size: 9, font: bold });
  currentPage.drawText(`Total`, { x: 470, y, size: 9, font: bold });
  y -= 14;

  let grandTotal = 0;
  for (const item of project.boqItems || []) {
    if (y < 60) {
      currentPage = doc.addPage([612, 792]);
      y = height - 50;
    }
    currentPage.drawText(`${item.code || ''}`, { x: 50, y, size: 8, font });
    currentPage.drawText(`${truncate(item.description, 30)}`, { x: 100, y, size: 8, font });
    currentPage.drawText(`${item.quantity}`, { x: 350, y, size: 8, font });
    currentPage.drawText(`$${item.unitRate?.toFixed(2) || '0.00'}`, { x: 400, y, size: 8, font });
    currentPage.drawText(`$${item.total?.toFixed(2) || '0.00'}`, { x: 470, y, size: 8, font });
    y -= 14;
    grandTotal += item.total || 0;
  }

  y -= 10;
  currentPage.drawText(`Grand Total: $${grandTotal.toFixed(2)}`, { x: 350, y, size: 12, font: bold });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function generateSustainabilityReport(assessment: any, project: any): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { height } = page.getSize();
  let y = height - 50;

  page.drawText('AI Construction OS - Sustainability Report', { x: 50, y, size: 18, font: bold });
  y -= 25;
  page.drawText(`Project: ${project?.name || 'N/A'}`, { x: 50, y, size: 11, font });
  y -= 16;
  page.drawText(`Date: ${formatDate(assessment.createdAt)}`, { x: 50, y, size: 11, font });
  y -= 25;

  const fields = [
    ['Overall Score', `${assessment.overallScore ?? 'N/A'} / 100`],
    ['Overall Rating', assessment.overallRating || 'N/A'],
    ['Carbon Footprint', assessment.carbonFootprint ? `${assessment.carbonFootprint} kgCO2` : 'N/A'],
    ['Carbon Rating', assessment.carbonRating || 'N/A'],
    ['Energy Efficiency', assessment.energyEfficiency ? `${assessment.energyEfficiency}%` : 'N/A'],
    ['Energy Score', `${assessment.energyScore ?? 'N/A'}`],
    ['Energy Rating', assessment.energyRating || 'N/A'],
    ['Solar Potential', assessment.solarPotential || 'N/A'],
    ['Solar kWh/year', `${assessment.solarKwhYear ?? 'N/A'}`],
    ['Water Efficiency', assessment.waterEfficiency ? `${assessment.waterEfficiency}%` : 'N/A'],
    ['Water Rating', assessment.waterRating || 'N/A'],
    ['Passive Cooling', assessment.passiveCooling || 'N/A'],
    ['Flood Resilience', assessment.floodResilience || 'N/A'],
    ['Green Material Score', assessment.greenMaterialScore ? `${assessment.greenMaterialScore}%` : 'N/A'],
  ];

  for (const [label, value] of fields) {
    if (y < 60) {
      const newPage = doc.addPage([612, 792]);
      y = height - 50;
    }
    page.drawText(`${label}:`, { x: 50, y, size: 10, font: bold });
    page.drawText(`${value}`, { x: 200, y, size: 10, font });
    y -= 16;
  }

  if (assessment.recommendations) {
    y -= 10;
    page.drawText('Recommendations:', { x: 50, y, size: 12, font: bold });
    y -= 18;
    page.drawText(`${assessment.recommendations}`, { x: 50, y, size: 9, font });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
