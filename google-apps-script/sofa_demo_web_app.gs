const DEMO_SHEET_NAME = 'sofa_demos';
const DEMO_SPREADSHEET_ID = '12gsY2kPAVvCvWva0Zu0jo9aXtjMfULCblszilpSqVOY';
const FABRIC_CATALOG_SPREADSHEET_ID = '1Zelr5BRHPDN8SxzvJV-heZEsDwt6pl3o2SPKACaMwrU';
const FABRIC_CATALOG_SHEET_NAME = 'catalog_details';

const DEMO_HEADERS = [
  'id',
  'createdAt',
  'customerName',
  'phone',
  'alternatePhone',
  'address',
  'expectedDeliveryDate',
  'advanceAmount',
  'balanceAmount',
  'sofaType',
  'sofaCategory',
  'material',
  'color',
  'seatCount',
  'dimensions',
  'configJson',
  'customerJson',
];

const FABRIC_HEADERS = [
  'product ID',
  'Model Name',
  'color name',
  'material',
  'technical specs',
  'price',
  'web category',
  'SEO keywords2',
];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'health';

  try {
    if (action === 'health') {
      return jsonOutput({
        ok: true,
        storage: 'remote',
        message: 'Ready',
      });
    }

    if (action === 'demos') {
      return jsonOutput({
        ok: true,
        items: getDemoRows(),
      });
    }

    if (action === 'catalog') {
      return jsonOutput({
        ok: true,
        items: getFabricCatalogRows(),
      });
    }

    return jsonOutput({
      ok: false,
      message: 'Unknown action.',
    });
  } catch (error) {
    return jsonOutput({
      ok: false,
      message: error.message,
    });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;

    if (action === 'saveDemo') {
      const id = saveDemoRecord(body.payload || {});
      return jsonOutput({ ok: true, id: id, storage: 'remote' });
    }

    if (action === 'deleteDemo') {
      deleteDemoRecord(body.id);
      return jsonOutput({ ok: true, storage: 'remote' });
    }

    return jsonOutput({
      ok: false,
      message: 'Unknown action.',
    });
  } catch (error) {
    return jsonOutput({
      ok: false,
      message: error.message,
    });
  }
}

function getDemoSheet() {
  const spreadsheet = SpreadsheetApp.openById(DEMO_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(DEMO_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(DEMO_SHEET_NAME);
  }

  ensureHeaders(sheet, DEMO_HEADERS);
  return sheet;
}

function getFabricCatalogSheet() {
  const spreadsheet = SpreadsheetApp.openById(FABRIC_CATALOG_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(FABRIC_CATALOG_SHEET_NAME);

  if (!sheet) {
    throw new Error('Fabric catalog sheet was not found.');
  }

  ensureHeaders(sheet, FABRIC_HEADERS);
  return sheet;
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaderReset = headers.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsHeaderReset) {
    headerRange.setValues([headers]);
  }
}

function getDemoRows() {
  const sheet = getDemoSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, DEMO_HEADERS.length).getValues();
  return values
    .map(function (row) {
      return toDemoObject(row);
    })
    .filter(function (item) {
      return item && item.id;
    })
    .sort(function (left, right) {
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
}

function getFabricCatalogRows() {
  const sheet = getFabricCatalogSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, FABRIC_HEADERS.length).getValues();
  return values
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

function saveDemoRecord(payload) {
  const customer = payload.customer || {};
  const config = payload.config || {};
  const sofa = payload.sofa || {};

  if (!customer.name || !customer.phone) {
    throw new Error('Customer name and phone number are required.');
  }

  const id = String(new Date().getTime()) + '-' + Math.floor(Math.random() * 100000);
  const row = [
    id,
    new Date().toISOString(),
    customer.name || '',
    customer.phone || '',
    customer.alternatePhone || '',
    customer.address || '',
    customer.expectedDeliveryDate || '',
    Number(customer.advanceAmount || 0),
    Number(customer.balanceAmount || 0),
    config.type || '',
    config.sofaCategory || '',
    config.material || '',
    config.color || '',
    (sofa.seats && sofa.seats.label) || '',
    sofa.dimensions || '',
    JSON.stringify(config),
    JSON.stringify(customer),
  ];

  getDemoSheet().appendRow(row);
  return id;
}

function deleteDemoRecord(id) {
  if (!id) {
    throw new Error('Demo id is required.');
  }

  const sheet = getDemoSheet();
  const values = sheet.getDataRange().getValues();

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][0]) === String(id)) {
      sheet.deleteRow(rowIndex + 1);
      return;
    }
  }

  throw new Error('Demo not found.');
}

function toDemoObject(row) {
  if (!row || !row[0]) return null;

  return {
    id: row[0],
    createdAt: row[1],
    customerName: row[2],
    phone: row[3],
    alternatePhone: row[4],
    address: row[5],
    expectedDeliveryDate: row[6],
    advanceAmount: Number(row[7] || 0),
    balanceAmount: Number(row[8] || 0),
    sofaType: row[9],
    sofaCategory: row[10],
    material: row[11],
    color: row[12],
    seatCount: row[13],
    dimensions: row[14],
    config: parseJson(row[15]),
    customer: parseJson(row[16]),
  };
}

function parseJson(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
