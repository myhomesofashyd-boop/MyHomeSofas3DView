export const DEFAULT_CONFIG = {
  type: 'Straight',
  sofaCategory: 'Recliner Sofa',
  length: 96,
  depth: 34,
  height: 36,
  seatWidth: 24,
  mainLength: 108,
  sideLength: 72,
  orientation: 'Left Corner',
  theme: 'Modern',
  material: 'Leather',
  color: '#5f6f8f',
  armStyle: 'Track Arm',
  handleLayout: 'First and Last Handles',
  handleSize: 5,
  backStyle: 'Channel Back',
  cushionStyle: 'Box Cushions',
  legStyle: 'Wood Legs',
  reclinerMode: 'Manual Recliner',
  stitching: 'Contrast Stitch',
  fabricCatalogName: '',
  fabricProductCode: '',
  fabricColorName: '',
  fabricModelName: '',
  fabricTechnicalSpecs: '',
  fabricPrice: '',
  fabricWebCategory: '',
  fabricSeoKeywords2: '',
};

const INCHES_PER_UNIT = 24;
const DEFAULT_SEAT_WIDTH = 24;

export const SOFA_CATEGORIES = [
  'Standard Sofa',
  'Recliner Sofa',
  'Lounge Sofa',
  'Sofa Cum Bed',
  'Chesterfield',
  'Loveseat',
  'Sectional Corner',
];

export const ARM_STYLES = ['Track Arm', 'Rolled Arm', 'Pillow Arm', 'Slim Arm'];
export const HANDLE_LAYOUTS = [
  'First and Last Handles',
  'Handle For Every Seat',
  'No Left Handle',
  'No Right Handle',
  'No Corner Return Handles',
  'No Handles',
];
export const BACK_STYLES = ['Plain Back', 'Channel Back', 'Button Tufted', 'High Back'];
export const CUSHION_STYLES = ['Box Cushions', 'Single Bench', 'Split Cushions'];
export const LEG_STYLES = ['Hidden Base', 'Wood Legs', 'Metal Legs'];
export const RECLINER_MODES = ['None', 'Manual Recliner', 'Motorized Recliner'];

function toSceneUnits(inches) {
  return inches / INCHES_PER_UNIT;
}

function fromSceneUnits(units) {
  return Math.round(units * INCHES_PER_UNIT);
}

function profileFor(config) {
  const totalHeight = toSceneUnits(config.height || 36);
  const baseHeight = toSceneUnits(config.theme === 'Luxury' ? 12 : 10);
  const cushionHeight = toSceneUnits(config.theme === 'Luxury' ? 6 : 4.5);
  const armHeight = Math.min(totalHeight, toSceneUnits(config.theme === 'Classic' ? 27 : 24));
  const backHeight = totalHeight;

  return {
    totalHeight,
    baseHeight,
    cushionHeight,
    armHeight,
    backHeight,
    cushionLift: toSceneUnits(config.theme === 'Luxury' ? 2 : 1),
    armThickness: toSceneUnits(config.handleSize || 5),
    backThickness: toSceneUnits(config.backStyle === 'High Back' ? 6 : 4),
  };
}

function handleCountForSeatMath(config) {
  if (config.handleLayout === 'No Handles') return 0;
  if (config.handleLayout === 'No Left Handle' || config.handleLayout === 'No Right Handle') return 1;
  return 2;
}

function seatsForLength(length, config) {
  const seatWidth = Math.max(16, Number(config.seatWidth || DEFAULT_SEAT_WIDTH));
  const handleSize = Math.max(0, Number(config.handleSize || 0));

  if (config.handleLayout === 'Handle For Every Seat') {
    return Math.max(1, Math.floor((length - handleSize) / (seatWidth + handleSize)));
  }

  return Math.max(1, Math.floor((length - handleCountForSeatMath(config) * handleSize) / seatWidth));
}

export function calculateSeats(config) {
  if (config.type === 'L-Shape') {
    const mainSeats = seatsForLength(config.mainLength, config);
    const sideSeats = seatsForLength(config.sideLength, {
      ...config,
      handleLayout: config.handleLayout === 'No Corner Return Handles' ? 'No Handles' : config.handleLayout,
    });

    return {
      mainSeats,
      sideSeats,
      total: mainSeats + sideSeats,
      label: `${mainSeats} + ${sideSeats} Seater Corner`,
      compact: `${mainSeats}+${sideSeats} seats`,
      division: `Main ${mainSeats} seats, side ${sideSeats} seats`,
    };
  }

  const total = seatsForLength(config.length, config);

  return {
    mainSeats: total,
    sideSeats: 0,
    total,
    label: `${total}-Seater`,
    compact: `${total} seats`,
    division: `${total} seats in one straight line`,
  };
}

function getHandleDescription(config) {
  return `${config.handleLayout}, handle size ${config.handleSize}"`;
}

export function getDimensionsLabel(config) {
  if (config.type === 'L-Shape') {
    return `${config.mainLength}" x ${config.sideLength}" x ${config.depth}" x ${config.height}"`;
  }

  return `${config.length}" x ${config.depth}" x ${config.height}"`;
}

export function getMeasurementRows(config, seats) {
  const rows = [
    ['Sofa Type', config.type],
    ['Sofa Category', config.sofaCategory],
    ['Depth / Breadth', `${config.depth}"`],
    ['Height', `${config.height}"`],
    ['Seat Size', `${config.seatWidth}" wide x ${config.depth}" deep`],
    ['Handle Layout', getHandleDescription(config)],
    ['Seat Division', seats.division],
  ];

  if (config.type === 'L-Shape') {
    rows.splice(2, 0, ['Main Length', `${config.mainLength}"`], ['Side Length', `${config.sideLength}"`], ['Orientation', config.orientation]);
  } else {
    rows.splice(2, 0, ['Length', `${config.length}"`]);
  }

  return rows;
}

export function getHistorySummary(config) {
  const seats = calculateSeats(config);
  const dimensions =
    config.type === 'L-Shape'
      ? `${config.mainLength}" x ${config.sideLength}"`
      : `${config.length}" x ${config.depth}"`;

  return `${config.sofaCategory} | ${dimensions} | ${seats.compact}`;
}

export function getMaterialSettings(material, color) {
  const shared = { color, metalness: 0.02 };

  if (material === 'Leather') {
    return { ...shared, roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.38 };
  }

  if (material === 'Velvet') {
    return { ...shared, roughness: 0.58, sheen: 0.8, sheenRoughness: 0.7 };
  }

  return { ...shared, roughness: 0.86 };
}

function addBox(parts, id, position, size, variant = 'base') {
  parts.push({ id, shape: 'box', position, size, variant });
}

function addCylinder(parts, id, position, radius, height, variant = 'leg') {
  parts.push({ id, shape: 'cylinder', position, radius, height, variant });
}

function resolveSectionHandles(section, config) {
  const baseStart = section.startArm !== false;
  const baseEnd = section.endArm !== false;

  if (config.handleLayout === 'No Handles') {
    return { start: false, end: false, betweenSeats: false };
  }

  if (config.handleLayout === 'No Corner Return Handles' && section.id === 'side') {
    return { start: false, end: false, betweenSeats: false };
  }

  if (config.handleLayout === 'No Left Handle') {
    return {
      start: section.startIsLeft ? false : baseStart,
      end: section.endIsLeft ? false : baseEnd,
      betweenSeats: false,
    };
  }

  if (config.handleLayout === 'No Right Handle') {
    return {
      start: section.startIsRight ? false : baseStart,
      end: section.endIsRight ? false : baseEnd,
      betweenSeats: false,
    };
  }

  return {
    start: baseStart,
    end: baseEnd,
    betweenSeats: config.handleLayout === 'Handle For Every Seat',
  };
}

function place(center, axis, axisValue, depthAxis, depthValue, y) {
  const next = [...center];
  const axisIndex = axis === 'x' ? 0 : 2;
  const depthIndex = depthAxis === 'x' ? 0 : 2;
  next[axisIndex] += axisValue;
  next[depthIndex] += depthValue;
  next[1] = y;
  return next;
}

function addSection(parts, annotations, section, config, profile) {
  const axis = section.axis;
  const depthAxis = axis === 'x' ? 'z' : 'x';
  const axisSize = section.length;
  const depthSize = section.depth;
  const baseHeight = profile.baseHeight;
  const armThickness = profile.armThickness;
  const backThickness = profile.backThickness;
  const seatCount = section.seatCount;
  const handles = resolveSectionHandles(section, config);
  const dividerCount = handles.betweenSeats ? Math.max(0, seatCount - 1) : 0;
  const handleSpace = (handles.start ? armThickness : 0) + (handles.end ? armThickness : 0) + dividerCount * armThickness;
  const usableLength = Math.max(axisSize - handleSpace, toSceneUnits(config.seatWidth || DEFAULT_SEAT_WIDTH));
  const seatSegment = usableLength / seatCount;
  const cushionDepth = Math.max(depthSize - backThickness - toSceneUnits(2), toSceneUnits(20));
  const cushionY = baseHeight + profile.cushionHeight / 2 + profile.cushionLift;
  const backY = profile.backHeight / 2;
  const armY = profile.armHeight / 2;
  const frontDirection = -section.backDirection;

  const baseSize = axis === 'x' ? [axisSize, baseHeight, depthSize] : [depthSize, baseHeight, axisSize];
  addBox(parts, `${section.id}-base`, [section.center[0], baseHeight / 2, section.center[2]], baseSize, 'base');

  const backSize = axis === 'x' ? [axisSize, profile.backHeight, backThickness] : [backThickness, profile.backHeight, axisSize];
  addBox(
    parts,
    `${section.id}-back-rest`,
    place(section.center, axis, 0, depthAxis, section.backDirection * (depthSize / 2 - backThickness / 2), backY),
    backSize,
    'frame',
  );

  const armSize = axis === 'x' ? [armThickness, profile.armHeight, depthSize] : [depthSize, profile.armHeight, armThickness];
  if (handles.start) {
    addBox(parts, `${section.id}-start-arm`, place(section.center, axis, -axisSize / 2 + armThickness / 2, depthAxis, 0, armY), armSize, 'frame');
  }
  if (handles.end) {
    addBox(parts, `${section.id}-end-arm`, place(section.center, axis, axisSize / 2 - armThickness / 2, depthAxis, 0, armY), armSize, 'frame');
  }

  const cushionSize = axis === 'x'
    ? [seatSegment - toSceneUnits(1), profile.cushionHeight, cushionDepth]
    : [cushionDepth, profile.cushionHeight, seatSegment - toSceneUnits(1)];
  const backPadSize = axis === 'x'
    ? [seatSegment - toSceneUnits(1), toSceneUnits(config.backStyle === 'High Back' ? 18 : 13), toSceneUnits(2.5)]
    : [toSceneUnits(2.5), toSceneUnits(config.backStyle === 'High Back' ? 18 : 13), seatSegment - toSceneUnits(1)];

  for (let index = 0; index < seatCount; index += 1) {
    const startOffset = -axisSize / 2 + (handles.start ? armThickness : 0);
    const axisOffset = startOffset + seatSegment / 2 + index * (seatSegment + (handles.betweenSeats ? armThickness : 0));
    const label = `${section.labelPrefix}${index + 1}`;
    const seatCenter = place(section.center, axis, axisOffset, depthAxis, frontDirection * backThickness / 2, cushionY);
    addBox(parts, `${section.id}-seat-${index}`, seatCenter, cushionSize, 'cushion');
    addBox(
      parts,
      `${section.id}-back-pad-${index}`,
      place(section.center, axis, axisOffset, depthAxis, section.backDirection * (depthSize / 2 - backThickness - toSceneUnits(1)), cushionY + toSceneUnits(7)),
      backPadSize,
      config.backStyle === 'Button Tufted' ? 'tufted' : 'back-pad',
    );

    if (config.sofaCategory.includes('Recliner') && index < Math.min(seatCount, 3)) {
      const reclinerSize = axis === 'x'
        ? [seatSegment - toSceneUnits(2), toSceneUnits(4), toSceneUnits(12)]
        : [toSceneUnits(12), toSceneUnits(4), seatSegment - toSceneUnits(2)];
      addBox(parts, `${section.id}-recliner-${index}`, place(section.center, axis, axisOffset, depthAxis, frontDirection * (depthSize / 2 + toSceneUnits(5)), toSceneUnits(3)), reclinerSize, 'recliner');
    }

    annotations.push({
      id: `${section.id}-seat-label-${index}`,
      type: 'text',
      text: `${label}: ${fromSceneUnits(seatSegment)}"`,
      position: [seatCenter[0], toSceneUnits(1), seatCenter[2]],
      size: 0.13,
      color: '#0f172a',
    });

    if (handles.betweenSeats && index < seatCount - 1) {
      const handleOffset = startOffset + seatSegment + index * (seatSegment + armThickness) + armThickness / 2;
      addBox(parts, `${section.id}-seat-handle-${index}`, place(section.center, axis, handleOffset, depthAxis, 0, armY), armSize, 'frame');
    }
  }

  if (config.backStyle === 'Channel Back') {
    for (let index = 1; index < seatCount; index += 1) {
      const axisOffset = -usableLength / 2 + seatSegment * index;
      const seamSize = axis === 'x' ? [toSceneUnits(0.7), toSceneUnits(14), toSceneUnits(1)] : [toSceneUnits(1), toSceneUnits(14), toSceneUnits(0.7)];
      addBox(parts, `${section.id}-channel-${index}`, place(section.center, axis, axisOffset, depthAxis, section.backDirection * (depthSize / 2 - backThickness - toSceneUnits(2.2)), cushionY + toSceneUnits(7)), seamSize, 'seam');
    }
  }

  if (config.sofaCategory === 'Sofa Cum Bed') {
    const extensionSize = axis === 'x' ? [usableLength, toSceneUnits(4), toSceneUnits(20)] : [toSceneUnits(20), toSceneUnits(4), usableLength];
    addBox(parts, `${section.id}-bed-extension`, place(section.center, axis, 0, depthAxis, frontDirection * (depthSize / 2 + toSceneUnits(10)), toSceneUnits(2.4)), extensionSize, 'extension');
  }

  if (config.legStyle !== 'Hidden Base') {
    const legRadius = toSceneUnits(config.legStyle === 'Metal Legs' ? 1.1 : 1.5);
    const legHeight = toSceneUnits(5);
    const axisInset = axisSize / 2 - toSceneUnits(7);
    const depthInset = depthSize / 2 - toSceneUnits(7);
    [-axisInset, axisInset].forEach((axisOffset) => {
      [-depthInset, depthInset].forEach((depthOffset, index) => {
        addCylinder(parts, `${section.id}-leg-${axisOffset}-${index}`, place(section.center, axis, axisOffset, depthAxis, depthOffset, -legHeight / 2), legRadius, legHeight, 'leg');
      });
    });
  }

  const dimensionY = toSceneUnits(0.3);
  const outside = section.backDirection * (depthSize / 2 + toSceneUnits(10));
  const start = place(section.center, axis, -axisSize / 2, depthAxis, outside, dimensionY);
  const end = place(section.center, axis, axisSize / 2, depthAxis, outside, dimensionY);
  annotations.push({
    id: `${section.id}-length-dim`,
    type: 'line',
    points: [start, end],
    text: `${section.dimensionLabel}: ${fromSceneUnits(axisSize)}"`,
    labelPosition: place(section.center, axis, 0, depthAxis, outside + section.backDirection * toSceneUnits(3), dimensionY),
  });

  const depthStart = place(section.center, axis, axisSize / 2 + toSceneUnits(7), depthAxis, -depthSize / 2, dimensionY);
  const depthEnd = place(section.center, axis, axisSize / 2 + toSceneUnits(7), depthAxis, depthSize / 2, dimensionY);
  annotations.push({
    id: `${section.id}-depth-dim`,
    type: 'line',
    points: [depthStart, depthEnd],
    text: `Breadth: ${config.depth}"`,
    labelPosition: place(section.center, axis, axisSize / 2 + toSceneUnits(12), depthAxis, 0, dimensionY),
  });
}

function createSections(config, seats) {
  const depth = toSceneUnits(config.depth);

  if (config.type === 'L-Shape') {
    const mainLength = toSceneUnits(config.mainLength);
    const sideLength = toSceneUnits(config.sideLength);
    const direction = config.orientation === 'Left Corner' ? -1 : 1;
    return [
      {
        id: 'main',
        axis: 'x',
        center: [0, 0, 0],
        length: mainLength,
        depth,
        backDirection: 1,
        seatCount: seats.mainSeats,
        labelPrefix: 'M',
        dimensionLabel: 'Main Length',
        startArm: direction > 0,
        endArm: direction < 0,
        startIsLeft: true,
        startIsRight: false,
        endIsLeft: false,
        endIsRight: true,
      },
      {
        id: 'side',
        axis: 'z',
        center: [direction * (mainLength / 2 - depth / 2), 0, -(sideLength / 2 - depth / 2)],
        length: sideLength,
        depth,
        backDirection: direction,
        seatCount: seats.sideSeats,
        labelPrefix: 'S',
        dimensionLabel: 'Side Length',
        startArm: false,
        endArm: false,
        startIsLeft: direction < 0,
        startIsRight: direction > 0,
        endIsLeft: direction < 0,
        endIsRight: direction > 0,
      },
    ];
  }

  return [
    {
      id: 'straight',
      axis: 'x',
      center: [0, 0, 0],
      length: toSceneUnits(config.length),
      depth,
      backDirection: 1,
      seatCount: seats.total,
      labelPrefix: 'Seat ',
      dimensionLabel: 'Length',
      startIsLeft: true,
      startIsRight: false,
      endIsLeft: false,
      endIsRight: true,
    },
  ];
}

function getHeightAnnotation(config, totalHeight) {
  const width = toSceneUnits(config.type === 'L-Shape' ? Math.max(config.mainLength, config.sideLength) : config.length);
  const depth = toSceneUnits(config.type === 'L-Shape' ? config.sideLength : config.depth);
  const x = -width / 2 - toSceneUnits(9);
  const z = depth / 2 + toSceneUnits(9);

  return {
    id: 'height-dim',
    type: 'height',
    points: [[x, 0, z], [x, totalHeight, z]],
    text: `Height: ${config.height}"`,
    labelPosition: [x - toSceneUnits(3), totalHeight / 2, z],
  };
}

export function generateSofa(config) {
  const seats = calculateSeats(config);
  const profile = profileFor(config);
  const sections = createSections(config, seats);
  const parts = [];
  const annotations = [];

  sections.forEach((section) => addSection(parts, annotations, section, config, profile));
  annotations.push(getHeightAnnotation(config, profile.totalHeight));

  return {
    parts,
    annotations,
    seats,
    dimensions: getDimensionsLabel(config),
    measurements: getMeasurementRows(config, seats),
  };
}
