import React, { useEffect, useMemo, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import DemoForm from './components/DemoForm';
import DemoLogPanel from './components/DemoLogPanel';
import HistoryPanel from './components/HistoryPanel';
import PromptPanel from './components/PromptPanel';
import SofaViewer from './components/SofaViewer';
import { checkDbHealth, deleteDemo, fetchDemos, fetchFabricCatalog, saveDemo } from './utils/api';
import { DEFAULT_CONFIG, generateSofa, getHistorySummary } from './utils/sofaEngine';
import { generateDemoPdf } from './utils/pdfReport';

const STORAGE_KEY = 'sofa-configurator-history';
const DEBOUNCE_MS = 650;

const DEFAULT_CUSTOMER = {
  name: '',
  phone: '',
  alternatePhone: '',
  address: '',
  expectedDeliveryDate: '',
  advanceAmount: '',
  balanceAmount: '',
};

function readHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function makeHistoryItem(config) {
  const sofa = generateSofa(config);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: config.type,
    dimensions: sofa.dimensions,
    theme: config.theme,
    material: config.material,
    color: config.color,
    seatCount: sofa.seats,
    summary: getHistorySummary(config),
    config,
  };
}

function configSignature(config) {
  return JSON.stringify(config);
}

function getViewerSnapshot() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;

  try {
    const exportCanvas = document.createElement('canvas');
    const scale = 2;
    exportCanvas.width = Math.max(1800, canvas.width * scale);
    exportCanvas.height = Math.max(1200, canvas.height * scale);

    const context = exportCanvas.getContext('2d');
    if (!context) return canvas.toDataURL('image/png');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#f8fafc';
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    return exportCanvas.toDataURL('image/png', 1);
  } catch {
    return null;
  }
}

function NavButton({ targetId, children }) {
  const scrollToSection = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <button
      className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-200 hover:bg-white"
      type="button"
      onClick={scrollToSection}
    >
      {children}
    </button>
  );
}

function QuickStat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-white/70 bg-white/80 text-slate-900',
    blue: 'border-blue-200/70 bg-blue-50/90 text-blue-900',
    emerald: 'border-emerald-200/70 bg-emerald-50/90 text-emerald-900',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm backdrop-blur ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

function filledLine(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `${label}: ${value}.`;
}

function buildImagePrompt(config, sofaModel, customer) {
  const productLines = [
    filledLine('Product code', config.fabricProductCode),
    filledLine('Model name', config.fabricModelName),
    filledLine('Colour name', config.fabricColorName),
    filledLine('Material', config.material),
    filledLine('Product category', config.fabricWebCategory || config.fabricCatalogName),
    filledLine('Product details', config.fabricTechnicalSpecs),
    filledLine('Price', config.fabricPrice),
    filledLine('Product tags', config.fabricSeoKeywords2),
  ].filter(Boolean);

  const sizeLines = [
    filledLine('Overall size', sofaModel.dimensions),
    filledLine('Seat format', `${sofaModel.seats.label}, ${sofaModel.seats.division}`),
    filledLine('Sofa type', config.type),
    filledLine('Sofa style', config.sofaCategory),
    config.type === 'Straight' ? filledLine('Length', `${config.length}"`) : '',
    config.type === 'L-Shape' ? filledLine('Main length', `${config.mainLength}"`) : '',
    config.type === 'L-Shape' ? filledLine('Side length', `${config.sideLength}"`) : '',
    config.type === 'L-Shape' ? filledLine('Corner side', config.orientation) : '',
    filledLine('Depth', `${config.depth}"`),
    filledLine('Height', `${config.height}"`),
    filledLine('Seat width', `${config.seatWidth}"`),
  ].filter(Boolean);

  const designLines = [
    filledLine('Theme', config.theme),
    filledLine('Arm style', config.armStyle),
    filledLine('Handle layout', config.handleLayout),
    filledLine('Handle size', `${config.handleSize}"`),
    filledLine('Back style', config.backStyle),
    filledLine('Cushions', config.cushionStyle),
    filledLine('Leg style', config.legStyle),
    filledLine('Recliner', config.reclinerMode),
    filledLine('Stitching', config.stitching),
    filledLine('Sofa colour', config.color),
  ].filter(Boolean);

  const customerLines = [
    filledLine('Customer name', customer.name),
    filledLine('Phone number', customer.phone),
    filledLine('Alternate phone', customer.alternatePhone),
    filledLine('Address', customer.address),
    filledLine('Expected delivery', customer.expectedDeliveryDate),
    filledLine('Advance paid', customer.advanceAmount),
    filledLine('Yet to pay', customer.balanceAmount),
  ].filter(Boolean);

  return [
    'Premium showroom sofa image. Show the full sofa clearly in a clean luxury showroom with soft natural light, rich fabric detail, neat stitching, and an uncluttered background.',
    sizeLines.length ? `Sizes and layout: ${sizeLines.join(' ')}` : '',
    designLines.length ? `Design choices: ${designLines.join(' ')}` : '',
    productLines.length ? `Selected product: ${productLines.join(' ')}` : '',
    customerLines.length ? `Order details: ${customerLines.join(' ')}` : '',
  ].filter(Boolean).join('\n\n');
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [customer, setCustomer] = useState(DEFAULT_CUSTOMER);
  const [history, setHistory] = useState(readHistory);
  const [demos, setDemos] = useState([]);
  const [fabricCatalog, setFabricCatalog] = useState([]);
  const [viewerMode, setViewerMode] = useState('3d');
  const [appStatus, setAppStatus] = useState({ ok: true, message: '' });
  const [saveStatus, setSaveStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const saveTimer = useRef(null);
  const lastSavedSignature = useRef('');
  const hasMounted = useRef(false);
  const sofaModel = useMemo(() => generateSofa(config), [config]);
  const imagePrompt = useMemo(() => buildImagePrompt(config, sofaModel, customer), [config, customer, sofaModel]);

  async function refreshDemos() {
    try {
      const data = await fetchDemos();
      setDemos(data);
    } catch (error) {
      setAppStatus({ ok: false, message: 'Saved designs could not be opened right now.' });
    }
  }

  async function refreshFabricCatalog() {
    try {
      const items = await fetchFabricCatalog();
      setFabricCatalog(items);
    } catch (error) {
      setFabricCatalog([]);
      setAppStatus({ ok: false, message: 'Product list could not be opened right now.' });
    }
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    document.title = 'My Home Sofas';
    checkDbHealth()
      .then(() => Promise.all([refreshDemos(), refreshFabricCatalog()]))
      .catch(() => {
        setAppStatus({ ok: true, message: '' });
        return Promise.all([refreshDemos(), refreshFabricCatalog()]);
      });
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }

    const signature = configSignature(config);
    window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      if (signature === lastSavedSignature.current) return;

      setHistory((current) => {
        const nextItem = makeHistoryItem(config);
        const withoutDuplicate = current.filter((item) => configSignature(item.config) !== signature);
        return [nextItem, ...withoutDuplicate].slice(0, 10);
      });
      lastSavedSignature.current = signature;
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(saveTimer.current);
  }, [config]);

  const loadConfig = (nextConfig) => {
    setConfig({ ...DEFAULT_CONFIG, ...nextConfig });
  };

  const loadDemo = (demo) => {
    loadConfig(demo.config);
    setCustomer({ ...DEFAULT_CUSTOMER, ...demo.customer });
  };

  const deleteHistoryItem = (id) => {
    setHistory((current) => current.filter((item) => item.id !== id));
  };

  const saveCompletedDemo = async () => {
    setSaveStatus('Saving design...');
    try {
      await saveDemo({ customer, config, sofa: sofaModel });
      setSaveStatus('Design saved.');
      await refreshDemos();
    } catch (error) {
      setSaveStatus('This design could not be saved right now.');
    }
  };

  const generatePdfFromViewer = async () => {
    const previousViewMode = viewerMode;
    setViewerMode('3d');
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const viewer3dImage = getViewerSnapshot();

    setViewerMode('top');
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const topPlanImage = getViewerSnapshot();

    setViewerMode(previousViewMode);
    generateDemoPdf({ customer, config, sofaModel, viewer3dImage, topPlanImage });
  };

  const deleteCompletedDemo = async (id) => {
    try {
      await deleteDemo(id);
      await refreshDemos();
    } catch (error) {
      setAppStatus({ ok: false, message: 'This saved design could not be removed right now.' });
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(imagePrompt);
      setCopyStatus('Copied.');
    } catch {
      setCopyStatus('The text is ready below.');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.14),_transparent_20%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_42%,_#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-4 sm:px-5 xl:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">My Home Sofas</p>
              <h1 className="mt-2 text-[1.55rem] font-black leading-tight text-slate-950 sm:text-3xl xl:text-[2rem]">
                Design a sofa, choose the exact fabric shade, and prepare a customer-ready presentation.
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-[15px]">
                Adjust the design, review the finish, save customer details, and prepare a polished customer copy.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <NavButton targetId="sofa-design-home">Design</NavButton>
              <NavButton targetId="customer-proof">Customer Details</NavButton>
              <NavButton targetId="image-prompt">Image Text</NavButton>
              <NavButton targetId="customers-log">Saved Designs</NavButton>
            </nav>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickStat label="Current Style" value={`${config.sofaCategory} / ${sofaModel.seats.label}`} tone="slate" />
            <QuickStat label="Overall Size" value={sofaModel.dimensions} tone="blue" />
            <QuickStat
              label="Selected Fabric"
              value={
                config.fabricProductCode
                  ? `${config.fabricProductCode} / ${config.fabricColorName || 'Shade'}`
                  : `${config.material} / ${config.theme}`
              }
              tone="emerald"
            />
            <QuickStat label="Recliner" value={config.reclinerMode === 'None' ? 'Standard' : config.reclinerMode} tone="slate" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1680px] gap-5 px-4 py-5 sm:px-5 xl:grid-cols-[300px_minmax(0,1fr)_320px] xl:px-8">
        <ControlPanel config={config} sofaModel={sofaModel} fabricCatalog={fabricCatalog} onChange={setConfig} />

        <main className="grid min-w-0 gap-5">
          <section
            id="sofa-design-home"
            className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[24px]"
          >
            <div className="flex flex-col gap-4 border-b border-slate-200/80 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Design View</p>
                <p className="mt-2 text-2xl font-black text-slate-950 sm:text-[1.9rem]">{sofaModel.dimensions}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {config.type} design with {config.fabricColorName || config.material.toLowerCase()} finish.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  className="h-11 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                  type="button"
                  onClick={() => document.getElementById('customer-proof')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Customer Details
                </button>
                <button
                  className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  type="button"
                  onClick={generatePdfFromViewer}
                >
                  Customer Copy
                </button>
              </div>
            </div>

            <SofaViewer config={config} sofaModel={sofaModel} viewMode={viewerMode} onViewModeChange={setViewerMode} />
          </section>

          <section
            id="customer-proof"
            className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5"
          >
            <DemoForm
              customer={customer}
              onChange={setCustomer}
              onSaveDemo={saveCompletedDemo}
              onGeneratePdf={generatePdfFromViewer}
              saveStatus={saveStatus}
              dbStatus={appStatus}
            />
          </section>

          <section id="image-prompt">
            <PromptPanel prompt={imagePrompt} copyStatus={copyStatus} onCopy={copyPrompt} />
          </section>

          <DemoLogPanel demos={demos} onLoad={loadDemo} onDelete={deleteCompletedDemo} />
        </main>

        <HistoryPanel history={history} onLoad={loadConfig} onDelete={deleteHistoryItem} onClear={() => setHistory([])} />
      </div>
    </div>
  );
}
