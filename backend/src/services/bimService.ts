import { prisma } from '../app';

interface ElementInput {
  type: string;
  subType?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  properties?: Record<string, any>;
  layer?: string;
  color?: string;
}

interface FloorPlanInput {
  name: string;
  description?: string;
  floorLevel?: number;
  width?: number;
  height?: number;
  scale?: number;
  settings?: Record<string, any>;
}

interface ClashResult {
  element1: { id: string; name: string; type: string };
  element2: { id: string; name: string; type: string };
  type: 'overlap' | 'adjacent' | 'containment';
  severity: 'high' | 'medium' | 'low';
  description: string;
  overlapArea: number;
}

const ELEMENT_TYPES = [
  'wall', 'door', 'window', 'room', 'column', 'beam', 'slab', 'stair',
  'ramp', 'railing', 'furniture', 'fixture', 'duct', 'pipe', 'cable_tray',
];

const ELEMENT_SUBTYPES: Record<string, string[]> = {
  wall: ['interior', 'exterior', 'partition', 'curtain', 'retaining', 'foundation'],
  door: ['hinged', 'sliding', 'folding', 'revolving', 'overhead', 'fire'],
  window: ['fixed', 'casement', 'sliding', 'awning', 'bay', 'skylight'],
  room: ['bedroom', 'living', 'kitchen', 'bathroom', 'office', 'corridor', 'staircase', 'storage', 'lobby', 'meeting'],
  column: ['rectangular', 'circular', 'square', 'l-shaped', 'composite'],
  beam: ['rectangular', 't-beam', 'l-beam', 'composite', 'transfer'],
  slab: ['flat', 'ribbed', 'waffle', 'composite', 'precast'],
  stair: ['straight', 'l-shaped', 'u-shaped', 'spiral', 'curved'],
};

const IFC_CLASSIFICATIONS: Record<string, string> = {
  wall: 'IfcWallStandardCase',
  door: 'IfcDoor',
  window: 'IfcWindow',
  room: 'IfcSpace',
  column: 'IfcColumn',
  beam: 'IfcBeam',
  slab: 'IfcSlab',
  stair: 'IfcStair',
  ramp: 'IfcRamp',
  railing: 'IfcRailing',
  furniture: 'IfcFurnishingElement',
  fixture: 'IfcFlowTerminal',
  duct: 'IfcDuctSegment',
  pipe: 'IfcPipeSegment',
  cable_tray: 'IfcCableTraySegment',
};

const CLASSIFICATION_CONFIDENCE: Record<string, Record<string, number>> = {
  wall: { interior: 0.95, exterior: 0.98, partition: 0.90, curtain: 0.85, retaining: 0.92, foundation: 0.88 },
  door: { hinged: 0.95, sliding: 0.92, folding: 0.85, revolving: 0.80, overhead: 0.82, fire: 0.90 },
  window: { fixed: 0.90, casement: 0.95, sliding: 0.92, awning: 0.85, bay: 0.80, skylight: 0.88 },
  column: { rectangular: 0.95, circular: 0.92, square: 0.95, 'l-shaped': 0.80, composite: 0.85 },
  beam: { rectangular: 0.95, 't-beam': 0.90, 'l-beam': 0.88, composite: 0.85, transfer: 0.92 },
};

const MATERIAL_TYPES: Record<string, string[]> = {
  wall: ['Concrete Block', 'Brick', 'Timber Frame', 'Steel Stud', 'Reinforced Concrete', 'Stone Masonry'],
  door: ['Timber', 'Steel', 'Aluminum', 'Glass', 'Composite', 'Fire-rated'],
  window: ['Aluminum Frame', 'uPVC', 'Timber', 'Steel Frame', 'Aluminum-Clad'],
  column: ['Reinforced Concrete', 'Structural Steel', 'Composite', 'Timber', 'Precast Concrete'],
  beam: ['Reinforced Concrete', 'Structural Steel', 'Composite', 'Timber', 'Prestressed Concrete'],
  slab: ['Reinforced Concrete', 'Precast Concrete', 'Composite Deck', 'Timber', 'Hollow Core'],
};

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): number {
  const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

export async function createFloorPlan(projectId: string, userId: string, input: FloorPlanInput) {
  const plan = await prisma.bIMFloorPlan.create({
    data: {
      projectId,
      userId,
      name: input.name,
      description: input.description || null,
      floorLevel: input.floorLevel || 0,
      width: input.width || 20,
      height: input.height || 15,
      scale: input.scale || 1,
      settings: input.settings ? JSON.stringify(input.settings) : null,
    },
  });
  return plan;
}

export async function getFloorPlans(projectId: string) {
  return prisma.bIMFloorPlan.findMany({
    where: { projectId },
    orderBy: { floorLevel: 'asc' },
    include: { bimElements: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function getFloorPlan(planId: string) {
  return prisma.bIMFloorPlan.findUnique({
    where: { id: planId },
    include: { bimElements: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function updateFloorPlan(planId: string, input: Partial<FloorPlanInput>) {
  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.floorLevel !== undefined) data.floorLevel = input.floorLevel;
  if (input.width !== undefined) data.width = input.width;
  if (input.height !== undefined) data.height = input.height;
  if (input.scale !== undefined) data.scale = input.scale;
  if (input.settings !== undefined) data.settings = JSON.stringify(input.settings);
  return prisma.bIMFloorPlan.update({ where: { id: planId }, data });
}

export async function deleteFloorPlan(planId: string) {
  await prisma.bIMElement.deleteMany({ where: { floorPlanId: planId } });
  return prisma.bIMFloorPlan.delete({ where: { id: planId } });
}

export async function addElement(floorPlanId: string, input: ElementInput) {
  const classification = IFC_CLASSIFICATIONS[input.type] || 'IfcBuildingElementProxy';
  const subtypeConfidence = CLASSIFICATION_CONFIDENCE[input.type]?.[input.subType || ''] || 0.85;

  return prisma.bIMElement.create({
    data: {
      floorPlanId,
      type: input.type,
      subtype: input.subType || null,
      name: input.name || `${input.type}_${Date.now()}`,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      rotation: input.rotation || 0,
      properties: input.properties ? JSON.stringify(input.properties) : JSON.stringify({}),
      classification,
      classificationScore: subtypeConfidence,
      layer: input.layer || 'default',
      color: input.color || getDefaultColor(input.type),
    },
  });
}

export async function updateElement(elementId: string, input: Partial<ElementInput>) {
  const data: any = {};
  if (input.type !== undefined) {
    data.type = input.type;
    data.classification = IFC_CLASSIFICATIONS[input.type] || 'IfcBuildingElementProxy';
  }
  if (input.subType !== undefined) {
    data.subtype = input.subType;
    data.classificationScore = CLASSIFICATION_CONFIDENCE[input.type || '']?.[input.subType] || 0.85;
  }
  if (input.name !== undefined) data.name = input.name;
  if (input.x !== undefined) data.x = input.x;
  if (input.y !== undefined) data.y = input.y;
  if (input.width !== undefined) data.width = input.width;
  if (input.height !== undefined) data.height = input.height;
  if (input.rotation !== undefined) data.rotation = input.rotation;
  if (input.properties !== undefined) data.properties = JSON.stringify(input.properties);
  if (input.layer !== undefined) data.layer = input.layer;
  if (input.color !== undefined) data.color = input.color;
  return prisma.bIMElement.update({ where: { id: elementId }, data });
}

export async function deleteElement(elementId: string) {
  return prisma.bIMElement.delete({ where: { id: elementId } });
}

export async function deleteElementsByPlan(floorPlanId: string, elementIds: string[]) {
  return prisma.bIMElement.deleteMany({ where: { floorPlanId, id: { in: elementIds } } });
}

export async function autoClassifyElements(floorPlanId: string) {
  const elements = await prisma.bIMElement.findMany({ where: { floorPlanId } });
  const results: any[] = [];

  for (const element of elements) {
    const props = element.properties ? JSON.parse(element.properties) : {};
    const w = element.width ?? 0;
    const h = element.height ?? 0;
    const aspectRatio = w / Math.max(h, 0.01);
    const isVertical = h > w;
    const isThin = Math.min(w, h) < 0.5;

    let detectedType = element.type;
    let detectedSubType = element.subtype || '';
    let confidence = 0.5;
    let reasoning: string[] = [];

    if (element.type === 'wall') {
      if (isThin && aspectRatio > 5) { confidence = 0.95; reasoning.push('High aspect ratio typical of wall elements'); }
      if (props.material?.toLowerCase().includes('brick')) { detectedSubType = 'brick'; confidence = 0.90; reasoning.push('Brick material detected'); }
      if (props.function?.toLowerCase().includes('load')) { detectedSubType = 'structural'; confidence = 0.85; reasoning.push('Load-bearing function indicated'); }
    } else if (element.type === 'door') {
      if (w < 1.2 && h > 2.0) { confidence = 0.92; reasoning.push('Standard door proportions'); }
      if (w > 2.0) { detectedSubType = 'sliding'; confidence = 0.80; reasoning.push('Wide opening suggests sliding door'); }
      if (props.fireRating) { detectedSubType = 'fire'; confidence = 0.90; reasoning.push('Fire rating indicates fire door'); }
    } else if (element.type === 'window') {
      if (w > 1.0 && h > 0.5) { confidence = 0.90; reasoning.push('Standard window dimensions'); }
      if (aspectRatio > 2.5) { detectedSubType = 'casement'; confidence = 0.75; reasoning.push('Wide aspect ratio suggests casement window'); }
    } else if (element.type === 'column') {
      if (Math.abs(aspectRatio - 1) < 0.3) { detectedSubType = 'square'; confidence = 0.85; reasoning.push('Square aspect ratio suggests square column'); }
      else if (aspectRatio > 1.5) { detectedSubType = 'rectangular'; confidence = 0.80; reasoning.push('Rectangular aspect ratio'); }
      if (props.structural === true) { confidence = 0.95; reasoning.push('Structural role confirmed'); }
    } else if (element.type === 'room') {
      if (w > 3 && h > 3) { confidence = 0.85; reasoning.push('Room-sized area'); }
      if (element.name?.toLowerCase().includes('bedroom')) { detectedSubType = 'bedroom'; confidence = 0.90; }
      else if (element.name?.toLowerCase().includes('bath')) { detectedSubType = 'bathroom'; confidence = 0.90; }
      else if (element.name?.toLowerCase().includes('kitchen')) { detectedSubType = 'kitchen'; confidence = 0.90; }
    }

    const ifcClass = IFC_CLASSIFICATIONS[detectedType] || 'IfcBuildingElementProxy';
    const finalConfidence = Math.max(confidence, element.classificationScore || 0);

    await prisma.bIMElement.update({
      where: { id: element.id },
      data: {
        classification: ifcClass,
        classificationScore: finalConfidence,
        subtype: detectedSubType || element.subtype,
      },
    });

    results.push({
      elementId: element.id,
      name: element.name,
      detectedType,
      detectedSubType: detectedSubType || element.subtype,
      ifcClass,
      confidence: finalConfidence,
      reasoning,
    });
  }

  return { total: elements.length, classified: results.length, results };
}

export async function detectClashes(floorPlanId: string): Promise<ClashResult[]> {
  const elements = await prisma.bIMElement.findMany({ where: { floorPlanId } });
  const clashes: ClashResult[] = [];

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      const rectA = { x: a.x, y: a.y, w: a.width ?? 0, h: a.height ?? 0 };
      const rectB = { x: b.x, y: b.y, w: b.width ?? 0, h: b.height ?? 0 };

      const overlap = rectsOverlap(rectA, rectB);

      if (overlap > 0.01) {
        const skipRoomPairs = a.type === 'room' && b.type === 'room';
        const skipWallPair = (a.type === 'wall' && b.type === 'wall') && overlap < 0.1;
        if (skipRoomPairs || skipWallPair) continue;

        const severity: 'high' | 'medium' | 'low' = overlap > 1 ? 'high' : overlap > 0.1 ? 'medium' : 'low';

        clashes.push({
          element1: { id: a.id, name: a.name || a.type, type: a.type },
          element2: { id: b.id, name: b.name || b.type, type: b.type },
          type: 'overlap',
          severity,
          description: `${a.name || a.type} overlaps ${b.name || b.type} by ${overlap.toFixed(2)} m²`,
          overlapArea: overlap,
        });
      }
    }
  }

  return clashes.sort((a, b) => b.overlapArea - a.overlapArea);
}

export async function quantityTakeoff(floorPlanId: string) {
  const elements = await prisma.bIMElement.findMany({ where: { floorPlanId } });

  const takeoff: Record<string, { count: number; totalArea: number; totalLength: number; subtypes: Record<string, number>; materials: Record<string, number> }> = {};

  for (const el of elements) {
    if (!takeoff[el.type]) {
      takeoff[el.type] = { count: 0, totalArea: 0, totalLength: 0, subtypes: {}, materials: {} };
    }
    const t = takeoff[el.type];
    t.count++;
    t.totalArea += (el.width ?? 0) * (el.height ?? 0);
    t.totalLength += el.type === 'wall' || el.type === 'beam' ? Math.max(el.width ?? 0, el.height ?? 0) : 0;

    if (el.subtype) {
      t.subtypes[el.subtype] = (t.subtypes[el.subtype] || 0) + 1;
    }

    if (el.properties) {
      const props = JSON.parse(el.properties);
      if (props.material) {
        t.materials[props.material] = (t.materials[props.material] || 0) + 1;
      }
    }
  }

  const summary = {
    totalElements: elements.length,
    byType: takeoff,
    totalWallLength: Math.round((takeoff.wall?.totalLength || 0) * 100) / 100,
    totalFloorArea: Math.round((takeoff.room?.totalArea || 0) * 100) / 100,
    elementCounts: Object.fromEntries(Object.entries(takeoff).map(([k, v]) => [k, v.count])),
  };

  return summary;
}

export async function generateBIMAssistantResponse(query: string, floorPlanId?: string): Promise<{ answer: string; suggestions: string[] }> {
  const q = query.toLowerCase();
  let context = '';
  let planName = '';
  let elementCount = 0;

  if (floorPlanId) {
    const plan = await prisma.bIMFloorPlan.findUnique({
      where: { id: floorPlanId },
      include: { bimElements: true },
    });
    if (plan) {
      planName = plan.name;
      elementCount = plan.bimElements.length;
      context = `Working on floor plan "${plan.name}" with ${elementCount} elements. `;
    }
  }

  let answer: string;
  let suggestions: string[] = [];

  if (q.includes('wall') || q.includes('partition') || (q.includes('draw') && q.includes('plan'))) {
    answer = `${context}To create walls in your floor plan:\n\n1. Click "Add Wall" from the element palette\n2. Click on the canvas to place the wall\n3. Drag the edges to adjust length and thickness\n4. Use the properties panel to set:\n   - Type: Interior, Exterior, Partition\n   - Material: Brick, Concrete Block, Timber Frame\n   - Height: Standard is 3m for residential\n5. Walls connect automatically when placed end-to-end\n\n💡 Tip: Use the grid snap toggle (bottom toolbar) for precise alignment.`;
    suggestions = ['How do I add doors in walls?', 'What wall thickness for exterior?', 'Explain wall layers'];
  } else if (q.includes('door')) {
    answer = `${context}Adding doors to your floor plan:\n\n1. Place a wall first, then select "Add Door" from the palette\n2. The door will snap to the nearest wall\n3. Configure door properties:\n   - Type: Hinged (standard), Sliding, Folding, Revolving\n   - Width: 0.9m (standard), 1.2m (double)\n   - Height: 2.1m (standard)\n4. Doors show swing direction on the plan\n\n💡 Tip: Fire doors need 30/60/90 minute ratings — set in properties.`;
    suggestions = ['What size door for bathroom?', 'How to add double doors?', 'Door clearance requirements'];
  } else if (q.includes('window')) {
    answer = `${context}Placing windows in your floor plan:\n\n1. Add a wall, then select "Add Window"\n2. Windows auto-snap to wall centerlines\n3. Configure:\n   - Type: Casement, Sliding, Fixed, Awning\n   - Width: 1.2m (standard bedroom), 1.8m (living room)\n   - Sill Height: 0.9m from floor\n4. Windows show on plan with centerline symbol\n\n💡 Tip: For natural lighting, window area should be ≥ 10% of room area.`;
    suggestions = ['Window-to-wall ratio best practice', 'What is egress window?', 'Window placement rules'];
  } else if (q.includes('room') || q.includes('space') || q.includes('area')) {
    answer = `${context}Creating rooms and spaces:\n\n1. Select "Add Room" and drag to create room boundaries\n2. Room elements auto-calculate area in m²\n3. For best results, align rooms with wall elements\n4. Configure room properties:\n   - Function: Bedroom, Living, Kitchen, Office\n   - Occupancy: Calculated from area ÷ person-density\n   - Floor Finish: Tile, Timber, Vinyl, Carpet\n\nCurrent plan ${planName ? `"${planName}"` : ''} has rooms with calculated areas ready for takeoff.`;
    suggestions = ['Calculate total floor area', 'Room area standards', 'How to create room schedule'];
  } else if (q.includes('clash') || q.includes('conflict') || q.includes('overlap')) {
    answer = `${context}Clash detection is a critical BIM process. For this floor plan:\n\n- Run "Detect Clashes" to find overlapping elements\n- Clashes are categorized by severity: High, Medium, Low\n- Common clashes: door intersecting wall, pipes through beams\n- Use the element properties panel to adjust positions\n\n💡 Tip: Run clash detection after every major edit.`;
    suggestions = ['Run clash detection now', 'What is hard clash vs soft clash?', 'How to resolve clashes'];
  } else if (q.includes('classif') || q.includes('ifc') || q.includes('standard')) {
    answer = `${context}BIM Classification and IFC Standards:\n\nElements in your floor plan can be classified using IFC (Industry Foundation Classes):\n- Walls → IfcWall / IfcWallStandardCase\n- Doors → IfcDoor\n- Windows → IfcWindow\n- Rooms → IfcSpace\n- Columns → IfcColumn\n- Beams → IfcBeam\n- Slabs → IfcSlab\n\nRun "Auto-Classify" to automatically detect and assign correct IFC types based on geometry and naming patterns.`;
    suggestions = ['Run auto-classification', 'What is IFC 2x3 vs IFC4?', 'Export to IFC format'];
  } else if (q.includes('quantity') || q.includes('takeoff') || q.includes('boq') || q.includes('count')) {
    answer = `${context}Quantity Takeoff from your BIM model:\n\nRun "Quantity Takeoff" to generate:\n- Element counts by type (walls, doors, windows)\n- Total wall length (linear meters)\n- Total floor area (m²)\n- Material quantities\n- Subtype breakdown\n\nThis data can be exported to the BOQ module for cost estimation.`;
    suggestions = ['Run quantity takeoff', 'Export quantities to BOQ', 'How to calculate concrete volume'];
  } else if (q.includes('hello') || q.includes('hi') || q.includes('help')) {
    answer = 'Welcome to the AI BIM Assistant! I can help you with:\n\n• **Drawing floor plans** — placing walls, doors, windows, rooms\n• **Classification** — IFC standards and auto-classification\n• **Clash detection** — finding and resolving element conflicts\n• **Quantity takeoff** — material quantities and measurements\n• **Export** — IFC, gbXML, DAE, OBJ formats\n\nWhat would you like to do?';
    suggestions = ['How to create a floor plan?', 'What is BIM classification?', 'Run clash detection'];
  } else {
    answer = `${context}I understand you're asking about "${query}". Here are things I can help with:\n\n• Drawing and editing floor plan elements (walls, doors, windows, rooms)\n• BIM classification and IFC standards\n• Clash detection and resolution\n• Quantity takeoff and material calculations\n• Exporting to standard formats\n\nCould you be more specific? For example: "How do I add a wall?" or "Run clash detection."`;
    suggestions = ['How to add a wall?', 'What is a clash?', 'Explain IFC classification'];
  }

  return { answer, suggestions };
}

function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    wall: '#4A90D9',
    door: '#8B4513',
    window: '#87CEEB',
    room: '#F0FFF0',
    column: '#808080',
    beam: '#A0522D',
    slab: '#D3D3D3',
    stair: '#DEB887',
    furniture: '#FFB6C1',
    fixture: '#FFD700',
  };
  return colors[type] || '#CCCCCC';
}

export {
  ELEMENT_TYPES,
  ELEMENT_SUBTYPES,
  IFC_CLASSIFICATIONS,
  MATERIAL_TYPES,
};
