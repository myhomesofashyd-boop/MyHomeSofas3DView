import { jsPDF } from 'jspdf';

function money(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function valueOrDash(value) {
  return value ? String(value) : '-';
}

function addSectionTitle(doc, title, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 4, 196, y + 4);
  return y + 11;
}

function addRows(doc, rows, x, y, valueWidth = 112, labelWidth = 42) {
  let nextY = y;

  rows.forEach(([label, value]) => {
    const text = doc.splitTextToSize(String(valueOrDash(value)), valueWidth);
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, nextY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(text, x + labelWidth, nextY);
    nextY += Math.max(7, text.length * 5);
  });

  return nextY;
}

function addInfoCard(doc, title, rows, x, y, width) {
  const rowHeights = rows.map(([, value]) => Math.max(6.5, doc.splitTextToSize(String(valueOrDash(value)), width - 48).length * 4.6));
  const height = 13 + rowHeights.reduce((total, item) => total + item, 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + 5, y + 8);
  addRows(doc, rows, x + 5, y + 17, width - 52, 38);
  return y + height + 6;
}

function addImageFrame(doc, title, image, x, y, width, height) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(title, x, y - 3);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, y, width, height, 2, 2);

  if (!image) {
    doc.setFont('helvetica', 'normal');
    doc.text('Image unavailable', x + 5, y + height / 2);
    return;
  }

  doc.addImage(image, 'PNG', x + 1.5, y + 1.5, width - 3, height - 3, undefined, 'SLOW');
}

function addApprovalFooter(doc, y) {
  let nextY = y;
  const note = 'Customer confirmation: dimensions, material, color, and payment details are approved for manufacturing.';
  const noteLines = doc.splitTextToSize(note, 182);

  if (nextY + noteLines.length * 4.5 + 20 > 292) {
    doc.addPage();
    nextY = 18;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, nextY, 196, nextY);
  nextY += 7;

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(noteLines, 14, nextY);
  nextY += noteLines.length * 4.5 + 8;

  doc.setTextColor(15, 23, 42);
  doc.text('Customer Signature: ____________________', 14, nextY);
  doc.text('Showroom Signature: ____________________', 112, nextY);
}

function addDocumentHeader(doc, subtitle) {
  const now = new Date();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('My Home Sofas', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle, 14, 22);
  doc.text(`Date: ${now.toLocaleString()}`, 137, 15);
  doc.text('Sizes in inches', 137, 22);
}

export function generateDemoPdf({ customer, config, sofaModel, viewer3dImage, topPlanImage }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  addDocumentHeader(doc, 'Customer Copy');

  addImageFrame(doc, 'Sofa View', viewer3dImage, 14, 42, 182, 90);

  let y = addSectionTitle(doc, 'Quick Summary', 146);
  const summaryStartY = y;
  y = addInfoCard(
    doc,
    'Design',
    [
      ['Overall Size', sofaModel.dimensions],
      ['Seat Count', sofaModel.seats.label],
      ['Seat Division', sofaModel.seats.division],
      ['Sofa Style', config.sofaCategory],
      ['Theme', config.theme],
    ],
    14,
    y,
    88,
  );
  addInfoCard(
    doc,
    'Product Finish',
    [
      ['Product Code', config.fabricProductCode || '-'],
      ['Model Name', config.fabricModelName || '-'],
      ['Color Name', config.fabricColorName || config.color.toUpperCase()],
      ['Material', config.material],
      ['Price', config.fabricPrice || '-'],
    ],
    108,
    summaryStartY,
    88,
  );
  addApprovalFooter(doc, Math.max(y + 10, 258));

  doc.addPage();
  addDocumentHeader(doc, 'Order Details');
  addImageFrame(doc, 'Top View', topPlanImage, 14, 42, 182, 82);

  y = addSectionTitle(doc, 'Customer Details', 138);
  y = addInfoCard(
    doc,
    'Customer',
    [
      ['Customer Name', customer.name],
      ['Phone Number', customer.phone],
      ['Alternate Phone', customer.alternatePhone],
      ['Address', customer.address],
      ['Expected Delivery', customer.expectedDeliveryDate],
      ['Advance Paid', money(customer.advanceAmount)],
      ['Yet To Pay', money(customer.balanceAmount)],
    ],
    14,
    y,
    182,
  );

  y = addSectionTitle(doc, 'Sofa Selection', y + 4);
  y = addRows(
    doc,
    [
      ['Sofa Type', config.type],
      ['Sofa Category', config.sofaCategory],
      ['Theme', config.theme],
      ['Material', config.material],
      ['Product Code', config.fabricProductCode || '-'],
      ['Model Name', config.fabricModelName || '-'],
      ['Color Name', config.fabricColorName || '-'],
      ['Price', config.fabricPrice || '-'],
      ['Category', config.fabricWebCategory || config.fabricCatalogName || '-'],
      ['Selected Colour', config.color.toUpperCase()],
      ['Seat Size', `${config.seatWidth}" wide x ${config.depth}" deep`],
      ['Arm Style', config.armStyle],
      ['Handle Layout', config.handleLayout],
      ['Handle Size', `${config.handleSize}"`],
      ['Back Style', config.backStyle],
      ['Cushions', config.cushionStyle],
      ['Legs', config.legStyle],
      ['Recliner', config.reclinerMode],
      ['Stitching', config.stitching],
      ['Product Details', config.fabricTechnicalSpecs || '-'],
    ],
    14,
    y,
    124,
    38,
  );

  if (y > 228) {
    doc.addPage();
    y = 18;
  }

  y = addSectionTitle(doc, 'Sizes', y + 4);
  y = addRows(
    doc,
    [
      ['Seat Count', sofaModel.seats.label],
      ['Seat Division', sofaModel.seats.division],
      ['Overall Size', sofaModel.dimensions],
      ...sofaModel.measurements,
    ],
    14,
    y,
    126,
    38,
  );

  addApprovalFooter(doc, Math.max(y + 10, 258));

  const safeName = (customer.name || 'customer').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  doc.save(`sofa-proof-${safeName || 'customer'}.pdf`);
}
