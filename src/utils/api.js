const DEFAULT_GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw7s3zE_d0khw5uPSegjMo2Mh09Yyleudzus8JU-d8reG17o_sEyTZDkDpRy6BDAH4H/exec';
const GOOGLE_SCRIPT_URL = (import.meta.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_GOOGLE_SCRIPT_URL).trim();
const LOCAL_DEMOS_KEY = 'sofa-configurator-saved-demos';
const LOCAL_FABRIC_CATALOG_KEY = 'sofa-configurator-fabric-catalog';

function readLocalDemos() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_DEMOS_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeLocalDemos(demos) {
  localStorage.setItem(LOCAL_DEMOS_KEY, JSON.stringify(demos));
}

function readLocalCatalog() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_FABRIC_CATALOG_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function sortByCreatedAt(items) {
  return [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

async function requestGoogleScript(action, payload) {
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error('Google Apps Script URL is not configured.');
  }

  const isGet = !payload;
  const url = isGet ? `${GOOGLE_SCRIPT_URL}?action=${encodeURIComponent(action)}` : GOOGLE_SCRIPT_URL;
  const options = isGet
    ? { method: 'GET' }
    : {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
      };

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the Google Apps Script endpoint.');
    }
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Google Sheets request failed.');
  }

  return data;
}

export async function checkDbHealth() {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      ok: true,
      storage: 'browser',
      message: 'Running in static mode with browser storage. Add VITE_GOOGLE_SCRIPT_URL to sync with Google Sheets.',
    };
  }

  return requestGoogleScript('health');
}

export async function fetchDemos() {
  if (!GOOGLE_SCRIPT_URL) {
    return sortByCreatedAt(readLocalDemos()).slice(0, 100);
  }

  const data = await requestGoogleScript('demos');
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchFabricCatalog() {
  if (!GOOGLE_SCRIPT_URL) {
    return readLocalCatalog();
  }

  const data = await requestGoogleScript('catalog');
  return Array.isArray(data.items) ? data.items : [];
}

export async function saveDemo(payload) {
  if (!GOOGLE_SCRIPT_URL) {
    const demos = readLocalDemos();
    const nextDemo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customerName: payload.customer.name,
      phone: payload.customer.phone,
      alternatePhone: payload.customer.alternatePhone || '',
      address: payload.customer.address || '',
      expectedDeliveryDate: payload.customer.expectedDeliveryDate || '',
      advanceAmount: Number(payload.customer.advanceAmount || 0),
      balanceAmount: Number(payload.customer.balanceAmount || 0),
      sofaType: payload.config.type,
      sofaCategory: payload.config.sofaCategory,
      material: payload.config.material,
      color: payload.config.color,
      seatCount: payload.sofa.seats.label,
      dimensions: payload.sofa.dimensions,
      config: payload.config,
      customer: payload.customer,
      createdAt: new Date().toISOString(),
    };
    writeLocalDemos(sortByCreatedAt([nextDemo, ...demos]).slice(0, 100));
    return { ok: true, id: nextDemo.id, storage: 'browser' };
  }

  return requestGoogleScript('saveDemo', { payload });
}

export async function deleteDemo(id) {
  if (!GOOGLE_SCRIPT_URL) {
    const demos = readLocalDemos().filter((item) => String(item.id) !== String(id));
    writeLocalDemos(demos);
    return { ok: true, storage: 'browser' };
  }

  return requestGoogleScript('deleteDemo', { id });
}
