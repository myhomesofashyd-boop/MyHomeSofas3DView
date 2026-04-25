import React from 'react';
import {
  ARM_STYLES,
  BACK_STYLES,
  CUSHION_STYLES,
  DEFAULT_CONFIG,
  HANDLE_LAYOUTS,
  LEG_STYLES,
  RECLINER_MODES,
  SOFA_CATEGORIES,
} from '../utils/sofaEngine';

const sofaTypes = ['Straight', 'L-Shape'];
const themes = ['Modern', 'Classic', 'Luxury'];
const materials = ['Leather', 'Fabric', 'Velvet'];
const orientations = ['Left Corner', 'Right Corner'];
const stitchingOptions = ['Matching Stitch', 'Contrast Stitch', 'Diamond Stitch'];

function SelectField({ label, value, options, onChange, placeholder }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <select
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const entry = typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SliderField({ label, value, min, max, onChange }) {
  const [draftValue, setDraftValue] = React.useState(String(value));

  React.useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitValue = () => {
    const nextValue = Number(draftValue);
    if (Number.isNaN(nextValue)) return;
    const clampedValue = Math.min(max, Math.max(min, nextValue));
    setDraftValue(String(clampedValue));
    onChange(clampedValue);
  };

  return (
    <label className="grid gap-3 text-sm font-semibold text-slate-700">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-bold text-slate-900">{value}"</span>
      </span>
      <div className="grid grid-cols-[1fr_82px] items-center gap-3">
        <input
          className="h-3 w-full cursor-pointer"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-right text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          type="number"
          min={min}
          max={max}
          value={draftValue}
          onBlur={commitValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <span className="flex justify-between text-xs font-medium text-slate-400">
        <span>{min}"</span>
        <span>{max}"</span>
      </span>
    </label>
  );
}

export default function ControlPanel({ config, sofaModel, fabricCatalog, onChange }) {
  const [fabricSearch, setFabricSearch] = React.useState('');
  const update = (key, value) => onChange({ ...config, [key]: value });

  const webCategories = React.useMemo(
    () => [...new Set(fabricCatalog.map((item) => item.webCategory || item.catalogName).filter(Boolean))].sort(),
    [fabricCatalog],
  );

  const visibleCatalogItems = React.useMemo(() => {
    const search = fabricSearch.trim().toLowerCase();
    return fabricCatalog.filter((item) => {
      const itemCategory = item.webCategory || item.catalogName || '';
      if (config.fabricWebCategory && itemCategory !== config.fabricWebCategory) return false;
      if (!search) return true;
      return [
        item.productId || item.productCode,
        item.modelName,
        item.colorName,
        item.material,
        item.technicalSpecs,
        item.price,
        item.webCategory || item.catalogName,
        item.seoKeywords2,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [config.fabricWebCategory, fabricCatalog, fabricSearch]);

  const productOptions = visibleCatalogItems.map((item) => ({
    value: item.id || `${item.productId || item.productCode}-${item.modelName}-${item.colorName}`,
    label: `${item.productId || item.productCode || 'Product'} - ${item.modelName || item.colorName || 'Model'}`,
  }));

  const selectedCatalogItem = React.useMemo(
    () =>
      fabricCatalog.find(
        (item) =>
          (item.webCategory || item.catalogName || '') === config.fabricWebCategory &&
          (item.productId || item.productCode || '') === config.fabricProductCode &&
          item.colorName === config.fabricColorName,
      ) || null,
    [config.fabricColorName, config.fabricProductCode, config.fabricWebCategory, fabricCatalog],
  );

  const applyCatalogItem = (itemId) => {
    const selectedItem = visibleCatalogItems.find(
      (item) => (item.id || `${item.catalogName}-${item.productCode}-${item.colorName}`) === itemId,
    );
    if (!selectedItem) return;

    onChange({
      ...config,
      material: selectedItem.material || 'Fabric',
      color: selectedItem.hexColor || config.color,
      fabricCatalogName: selectedItem.webCategory || selectedItem.catalogName || '',
      fabricProductCode: selectedItem.productId || selectedItem.productCode || '',
      fabricColorName: selectedItem.colorName || '',
      fabricModelName: selectedItem.modelName || '',
      fabricTechnicalSpecs: selectedItem.technicalSpecs || '',
      fabricPrice: selectedItem.price || '',
      fabricWebCategory: selectedItem.webCategory || selectedItem.catalogName || '',
      fabricSeoKeywords2: selectedItem.seoKeywords2 || '',
    });
  };

  const clearFabricSelection = () => {
    onChange({
      ...config,
      fabricCatalogName: '',
      fabricProductCode: '',
      fabricColorName: '',
      fabricModelName: '',
      fabricTechnicalSpecs: '',
      fabricPrice: '',
      fabricWebCategory: '',
      fabricSeoKeywords2: '',
    });
    setFabricSearch('');
  };

  return (
    <aside className="flex w-full flex-col gap-4 overflow-y-auto rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur xl:h-[calc(100vh-8.75rem)] xl:w-[300px] xl:min-w-[300px] xl:sticky xl:top-28">
      <div>
        <h2 className="text-xl font-black text-slate-950">Sofa Design</h2>
        <p className="mt-1 text-sm text-slate-500">Choose the shape, comfort, and finish for this design.</p>
      </div>

      <section className="grid gap-4 rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-4">
        <SelectField label="Sofa Type" value={config.type} options={sofaTypes} onChange={(value) => update('type', value)} />
        <SelectField label="Sofa Style" value={config.sofaCategory} options={SOFA_CATEGORIES} onChange={(value) => update('sofaCategory', value)} />

        {config.type === 'Straight' ? (
          <>
            <SliderField label="Length" value={config.length} min={60} max={140} onChange={(value) => update('length', value)} />
            <SliderField label="Depth" value={config.depth} min={30} max={44} onChange={(value) => update('depth', value)} />
            <SliderField label="Height" value={config.height} min={28} max={48} onChange={(value) => update('height', value)} />
            <SliderField label="Seat Width" value={config.seatWidth} min={18} max={36} onChange={(value) => update('seatWidth', value)} />
          </>
        ) : (
          <>
            <SliderField label="Main Length" value={config.mainLength} min={80} max={160} onChange={(value) => update('mainLength', value)} />
            <SliderField label="Side Length" value={config.sideLength} min={60} max={120} onChange={(value) => update('sideLength', value)} />
            <SliderField label="Depth" value={config.depth} min={30} max={44} onChange={(value) => update('depth', value)} />
            <SliderField label="Height" value={config.height} min={28} max={48} onChange={(value) => update('height', value)} />
            <SliderField label="Seat Width" value={config.seatWidth} min={18} max={36} onChange={(value) => update('seatWidth', value)} />
            <SelectField label="Corner Side" value={config.orientation} options={orientations} onChange={(value) => update('orientation', value)} />
          </>
        )}
      </section>

      <section className="grid gap-4 rounded-[20px] border border-slate-200/80 bg-white/95 p-4">
        <SelectField label="Theme" value={config.theme} options={themes} onChange={(value) => update('theme', value)} />
        <SelectField label="Cover Material" value={config.material} options={materials} onChange={(value) => update('material', value)} />
        <SelectField label="Arm Style" value={config.armStyle} options={ARM_STYLES} onChange={(value) => update('armStyle', value)} />
        <SelectField label="Handle Layout" value={config.handleLayout} options={HANDLE_LAYOUTS} onChange={(value) => update('handleLayout', value)} />
        <SliderField label="Handle Size" value={config.handleSize} min={2} max={10} onChange={(value) => update('handleSize', value)} />
        <SelectField label="Back Style" value={config.backStyle} options={BACK_STYLES} onChange={(value) => update('backStyle', value)} />
        <SelectField label="Cushions" value={config.cushionStyle} options={CUSHION_STYLES} onChange={(value) => update('cushionStyle', value)} />
        <SelectField label="Leg Style" value={config.legStyle} options={LEG_STYLES} onChange={(value) => update('legStyle', value)} />
        <SelectField label="Recliner" value={config.reclinerMode} options={RECLINER_MODES} onChange={(value) => update('reclinerMode', value)} />
        <SelectField label="Stitching" value={config.stitching} options={stitchingOptions} onChange={(value) => update('stitching', value)} />
      </section>

      <section className="grid gap-4 rounded-[20px] border border-slate-200/80 bg-white/95 p-4">
        <div>
          <p className="text-sm font-black text-slate-950">Fabric Selection</p>
          <p className="mt-1 text-sm text-slate-500">Choose from your product list.</p>
        </div>

        <SelectField
          label="Category"
          value={config.fabricWebCategory}
          options={webCategories}
          placeholder="Choose category"
          onChange={(value) =>
            onChange({
              ...config,
              fabricCatalogName: value,
              fabricWebCategory: value,
              fabricProductCode: '',
              fabricColorName: '',
              fabricModelName: '',
              fabricTechnicalSpecs: '',
              fabricPrice: '',
              fabricSeoKeywords2: '',
            })
          }
        />

        <TextField
          label="Search Product"
          value={fabricSearch}
          placeholder="Product, model, or colour"
          onChange={setFabricSearch}
        />

        <SelectField
          label="Product / Model"
          value={selectedCatalogItem ? selectedCatalogItem.id || `${selectedCatalogItem.productId || selectedCatalogItem.productCode}-${selectedCatalogItem.modelName}-${selectedCatalogItem.colorName}` : ''}
          options={productOptions}
          placeholder={productOptions.length ? 'Choose shade' : 'No matching shades'}
          onChange={applyCatalogItem}
        />

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Selected Shade
          <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="h-7 w-7 rounded-full border border-slate-200" style={{ backgroundColor: config.color }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {config.fabricProductCode || 'No product selected'}{config.fabricColorName ? ` / ${config.fabricColorName}` : ''}
              </p>
              <p className="truncate text-xs text-slate-500">{config.fabricModelName || config.fabricWebCategory || 'Manual colour selection'}</p>
            </div>
          </div>
        </label>

        {(config.fabricPrice || config.fabricTechnicalSpecs) ? (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {config.fabricPrice ? <p>Price: {config.fabricPrice}</p> : null}
            {config.fabricTechnicalSpecs ? <p className="line-clamp-3">Details: {config.fabricTechnicalSpecs}</p> : null}
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Sofa Colour
          <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
            <input
              className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
              type="color"
              value={config.color}
              onChange={(event) => update('color', event.target.value)}
            />
            <span className="text-sm font-bold text-slate-700">{config.fabricColorName || 'Custom shade'}</span>
          </div>
        </label>

        <button
          className="h-10 rounded-full border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          type="button"
          onClick={clearFabricSelection}
        >
          Clear Fabric Selection
        </button>
      </section>

      <section className="grid gap-3 rounded-[20px] border border-sky-100 bg-sky-50/90 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Seating</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{sofaModel.seats.label}</p>
          <p className="mt-1 text-sm font-semibold text-sky-800">{sofaModel.seats.division}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Overall Size</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{sofaModel.dimensions}</p>
        </div>
      </section>

      <button
        className="h-11 rounded-full border border-slate-300 bg-white px-4 font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
        type="button"
        onClick={() => onChange(DEFAULT_CONFIG)}
      >
        Reset Design
      </button>
    </aside>
  );
}
