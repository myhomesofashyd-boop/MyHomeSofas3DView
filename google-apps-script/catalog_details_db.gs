const CATALOG_SPREADSHEET_ID = '1Zelr5BRHPDN8SxzvJV-heZEsDwt6pl3o2SPKACaMwrU';
const CATALOG_SHEET_NAME = 'catalog_details';

const CATALOG_HEADERS = [
  'product ID',
  'Model Name',
  'color name',
  'material',
  'technical specs',
  'price',
  'web category',
  'SEO keywords2',
];

function setupCatalogDetailsSheet() {
  const sheet = getCatalogSheet();
  ensureHeaders(sheet, CATALOG_HEADERS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, CATALOG_HEADERS.length);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'catalog';

  try {
    if (action === 'health') {
      setupCatalogDetailsSheet();
      return jsonOutput({ ok: true, storage: 'catalog-details', message: 'Ready' });
    }

    if (action === 'catalog') {
      return jsonOutput({ ok: true, items: getCatalogRows() });
    }

    return jsonOutput({ ok: false, message: 'Unknown action.' });
  } catch (error) {
    return jsonOutput({ ok: false, message: error.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.action === 'upsertProduct') {
      const id = upsertProduct(body.payload || {});
      return jsonOutput({ ok: true, id: id, storage: 'catalog-details' });
    }

    if (body.action === 'deleteProduct') {
      deleteProduct(body.productId);
      return jsonOutput({ ok: true, storage: 'catalog-details' });
    }

    return jsonOutput({ ok: false, message: 'Unknown action.' });
  } catch (error) {
    return jsonOutput({ ok: false, message: error.message });
  }
}

function getCatalogSheet() {
  const spreadsheet = SpreadsheetApp.openById(CATALOG_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CATALOG_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CATALOG_SHEET_NAME);
  }

  ensureHeaders(sheet, CATALOG_HEADERS);
  return sheet;
}

function getCatalogRows() {
  const sheet = getCatalogSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return [];

  return sheet
    .getRange(2, 1, lastRow - 1, CATALOG_HEADERS.length)
    .getValues()
    .map(function (row, index) {
      return {
        id: String(index + 2),
        productId: row[0] || '',
        productCode: row[0] || '',
        modelName: row[1] || '',
        colorName: row[2] || '',
        material: row[3] || 'Fabric',
        technicalSpecs: row[4] || '',
        price: row[5] || '',
        webCategory: row[6] || '',
        catalogName: row[6] || '',
        seoKeywords2: row[7] || '',
      };
    })
    .filter(function (item) {
      return item.productId || item.modelName || item.colorName;
    });
}

function upsertProduct(product) {
  const productId = product.productId || product.productCode || product['product ID'];
  if (!productId) throw new Error('product ID is required.');

  const sheet = getCatalogSheet();
  const row = [
    productId,
    product.modelName || product['Model Name'] || '',
    product.colorName || product['color name'] || '',
    product.material || '',
    product.technicalSpecs || product['technical specs'] || '',
    product.price || '',
    product.webCategory || product['web category'] || '',
    product.seoKeywords2 || product['SEO keywords2'] || '',
  ];

  const values = sheet.getDataRange().getValues();
  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][0]) === String(productId)) {
      sheet.getRange(rowIndex + 1, 1, 1, CATALOG_HEADERS.length).setValues([row]);
      return productId;
    }
  }

  sheet.appendRow(row);
  return productId;
}

function deleteProduct(productId) {
  if (!productId) throw new Error('product ID is required.');

  const sheet = getCatalogSheet();
  const values = sheet.getDataRange().getValues();
  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][0]) === String(productId)) {
      sheet.deleteRow(rowIndex + 1);
      return;
    }
  }

  throw new Error('Product not found.');
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const range = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = range.getValues()[0];
  const needsUpdate = headers.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsUpdate) {
    range.setValues([headers]);
  }
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
