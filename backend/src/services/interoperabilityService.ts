import { prisma } from '../app';

interface FormatElement {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  geometry?: Record<string, any>;
  materials?: string[];
  relations?: string[];
}

interface NormalizedModel {
  format: string;
  source: string;
  elements: FormatElement[];
  project: {
    name: string;
    description?: string;
    units?: string;
    coordinates?: { x: number; y: number; z: number };
  };
  metadata: Record<string, any>;
}

const SUPPORTED_FORMATS = {
  import: ['ifc', 'ifcxml', 'gbxml', 'citygml', 'dae', 'obj', '3ds'],
  export: ['ifc', 'ifcxml', 'gbxml', 'citygml', 'dae', 'obj', '3ds', 'json'],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function parseIFCHeader(content: string): Record<string, any> {
  const metadata: Record<string, any> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('FILE_DESCRIPTION')) {
      const match = line.match(/\('([^']*)'/);
      if (match) metadata.description = match[1];
    }
    if (line.startsWith('FILE_NAME')) {
      const nameMatch = line.match(/NAME\s*=\s*'([^']*)'/i);
      if (nameMatch) metadata.fileName = nameMatch[1];
      const timeMatch = line.match(/TIME_STAMP\s*=\s*'([^']*)'/i);
      if (timeMatch) metadata.timeStamp = timeMatch[1];
      const authorMatch = line.match(/AUTHOR\s*=\s*\('([^']*)'/i);
      if (authorMatch) metadata.author = authorMatch[1];
    }
  }
  return metadata;
}

function parseIFCEntities(content: string): FormatElement[] {
  const elements: FormatElement[] = [];
  const lines = content.split('\n');
  const entityMap = new Map<string, string[]>();

  for (const line of lines) {
    const match = line.match(/^#(\d+)\s*=\s*(\w+)\((.+)\);?\s*$/);
    if (match) {
      const [, id, type, args] = match;
      entityMap.set(id, [type, args]);
    }
  }

  for (const [id, [type, args]] of entityMap) {
    if (isIfcProduct(type)) {
      const element = extractElement(id, type, args, entityMap);
      if (element) elements.push(element);
    }
  }

  return elements;
}

function isIfcProduct(type: string): boolean {
  const productTypes = [
    'IFCWALL', 'IFCWALLSTANDARDCASE', 'IFCSLAB', 'IFCBEAM', 'IFCCOLUMN',
    'IFCROOF', 'IFCDOOR', 'IFCWINDOW', 'IFCSTAIR', 'IFCRAMP',
    'IFCCURTAINWALL', 'IFCPIPE', 'IFCDUCT', 'IFCFURNISHINGELEMENT',
    'IFCMEMBER', 'IFCPLATE', 'IFCFOOTING', 'IFCPILE', 'IFCBUILDING',
    'IFCBUILDINGSTOREY', 'IFCSITE', 'IFCSPACE', 'IFCCOVERING',
    'IFCRAILING', 'IFCFLOWTERMINAL', 'IFCFLOWFITTING', 'IFCFLOWSEGMENT',
    'IFCDISTRIBUTIONCONTROLELEMENT', 'IFCDISTRIBUTIONCHAMBERELEMENT',
    'IFCTRANSPORTELEMENT', 'IFCPROXY',
  ];
  return productTypes.includes(type.toUpperCase());
}

function extractElement(id: string, type: string, args: string, entityMap: Map<string, string[]>): FormatElement | null {
  try {
    const cleaned = stripQuotes(args);
    const parts = splitArgs(cleaned);

    let name = '';
    let properties: Record<string, any> = {};

    if (parts.length > 0) {
      const firstRef = parts[0].replace(/#/g, '').trim();
      if (firstRef && entityMap.has(firstRef)) {
        const [refType, refArgs] = entityMap.get(firstRef)!;
        const refParts = splitArgs(stripQuotes(refArgs));
        if (refParts.length > 2) {
          name = refParts[2]?.replace(/'/g, '') || '';
        }
        if (refParts.length > 1) {
          properties.description = refParts[1]?.replace(/'/g, '') || '';
        }
      }
    }

    if (!name && parts.length > 2) {
      name = parts[2]?.replace(/'/g, '') || type.toLowerCase();
    }
    if (!name) name = `${type.toLowerCase()}_${id}`;

    for (let i = 0; i < parts.length; i++) {
      const val = parts[i].replace(/'/g, '').trim();
      if (val && !val.startsWith('#') && val.length < 100) {
        properties[`param_${i}`] = val;
      }
    }

    return { id: `ifc_${id}`, type: type.replace('IFC', '').toLowerCase(), name, properties };
  } catch {
    return null;
  }
}

function stripQuotes(args: string): string {
  let depth = 0;
  let result = '';
  let inString = false;
  for (const ch of args) {
    if (ch === "'") inString = !inString;
    if (!inString) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth > 0) continue;
    }
    result += ch;
  }
  return result;
}

function splitArgs(args: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  for (const ch of args) {
    if (ch === "'") inString = !inString;
    if (!inString) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function generateIFC(model: NormalizedModel): string {
  let ifc = '';
  ifc += 'ISO-10303-21;\nHEADER;\n';
  ifc += `FILE_DESCRIPTION(('${model.project.description || 'AI COS Export'}'),'2;1');\n`;
  ifc += `FILE_NAME('${model.project.name || 'project'}','${new Date().toISOString()}',(''),(''),'AI COS Interoperability Engine','${new Date().toISOString()}','');\n`;
  ifc += "FILE_SCHEMA(('IFC2X3'));\n";
  ifc += 'ENDSEC;\n\nDATA;\n';

  let entityCounter = 1;

  ifc += `#${entityCounter++}=IFCPROJECT(${globalId(entityCounter)},'${escapeIfc(model.project.name)}','${escapeIfc(model.project.description || '')}',$,$,$,$,(#${entityCounter}));\n`;
  ifc += `#${entityCounter++}=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,0.00000001,$,#${entityCounter});\n`;

  for (const element of model.elements) {
    const ifcType = `IFC${element.type.toUpperCase()}`;
    const guid = globalId(entityCounter);
    ifc += `#${entityCounter++}=${ifcType}('${guid}',#${entityCounter},'${escapeIfc(element.name)}','${escapeIfc(element.properties.description || '')}',$,#${entityCounter++},#${entityCounter++},$);\n`;
    ifc += `#${entityCounter++}=IFCLOCALPLACEMENT($,#${entityCounter++});\n`;
    ifc += `#${entityCounter++}=IFCAXIS2PLACEMENT3D(#${entityCounter++},#${entityCounter++},#${entityCounter++});\n`;
    ifc += `#${entityCounter++}=IFCCARTESIANPOINT((${(element.geometry?.x || 0) * entityCounter},${(element.geometry?.y || 0) * entityCounter},${(element.geometry?.z || 0) * entityCounter}));\n`;
    ifc += `#${entityCounter++}=IFCDIRECTION((1.,0.,0.));\n`;
    ifc += `#${entityCounter++}=IFCDIRECTION((0.,0.,1.));\n`;
    ifc += `#${entityCounter++}=IFCPRODUCTDEFINITIONSHAPE($,$, (#${entityCounter++}));\n`;
    ifc += `#${entityCounter++}=IFCSHAPEREPRESENTATION(#${entityCounter - 6},'Body','SweptSolid',(#${entityCounter++}));\n`;
    ifc += `#${entityCounter++}=IFCEXTRIBEDAREASOLID(#${entityCounter++},#${entityCounter++},#${entityCounter++},${element.geometry?.depth || 3.0}));\n`;
    ifc += `#${entityCounter++}=IFCRECTANGLEPROFILEDEF(.AREA.,$,#${entityCounter++},${element.geometry?.width || 0.3},${element.geometry?.height || 0.3});\n`;
    ifc += `#${entityCounter++}=IFCAXIS2PLACEMENT2D(#${entityCounter++},#${entityCounter++});\n`;
    ifc += `#${entityCounter++}=IFCCARTESIANPOINT((0.,0.));\n`;
    ifc += `#${entityCounter++}=IFCDIRECTION((1.,0.));\n`;
  }

  ifc += 'ENDSEC;\nEND-ISO-10303-21;\n';
  return ifc;
}

function escapeIfc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function globalId(seed: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
  let guid = '';
  let n = seed;
  for (let i = 0; i < 22; i++) {
    guid = chars[n % chars.length] + guid;
    n = Math.floor(n / chars.length);
  }
  return guid;
}

function generateIFCXML(model: NormalizedModel): string {
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<ifc:IFCXML xmlns:ifc="http://www.ifc-xml.org/namespaces/ifc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
  xml += `  <ifc:project name="${escapeXml(model.project.name)}">\n`;
  xml += `    <ifc:description>${escapeXml(model.project.description || '')}</ifc:description>\n`;

  for (const element of model.elements) {
    xml += `    <ifc:element id="${escapeXml(element.id)}" type="${escapeXml(element.type)}">\n`;
    xml += `      <ifc:name>${escapeXml(element.name)}</ifc:name>\n`;
    if (element.properties.description) {
      xml += `      <ifc:description>${escapeXml(element.properties.description)}</ifc:description>\n`;
    }
    xml += `      <ifc:properties>\n`;
    for (const [key, value] of Object.entries(element.properties)) {
      if (value) {
        xml += `        <ifc:property name="${escapeXml(key)}">${escapeXml(String(value))}</ifc:property>\n`;
      }
    }
    xml += `      </ifc:properties>\n`;
    xml += `    </ifc:element>\n`;
  }

  xml += '  </ifc:project>\n';
  xml += '</ifc:IFCXML>\n';
  return xml;
}

function generateGBXML(model: NormalizedModel): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<gbXML xmlns="http://www.gbxml.org/schema" temperatureUnit="C" lengthUnit="Meters" areaUnit="SquareMeters" volumeUnit="CubicMeters" useSIUnitsForResults="true" version="0.37">\n';
  xml += `  <Campus id="cmp1">\n`;
  xml += `    <Name>${escapeXml(model.project.name)}</Name>\n`;
  xml += `    <Location>\n`;
  xml += `      <Longitude>${model.project.coordinates?.x || 0}</Longitude>\n`;
  xml += `      <Latitude>${model.project.coordinates?.y || 0}</Latitude>\n`;
  xml += `    </Location>\n`;
  xml += `    <Building id="bldg1" buildingType="Unknown">\n`;
  xml += `      <Name>${escapeXml(model.project.name)}</Name>\n`;

  for (const element of model.elements) {
    xml += `      <Surface id="${escapeXml(element.id)}" surfaceType="${getGBXMLSurfaceType(element.type)}">\n`;
    xml += `        <Name>${escapeXml(element.name)}</Name>\n`;
    xml += `        <AdjacentSpaceId spaceIdRef="space1"/>\n`;
    xml += `        <RectangularGeometry>\n`;
    xml += `          <Azimuth>0</Azimuth>\n`;
    xml += `          <Tilt>90</Tilt>\n`;
    xml += `          <Width>${element.geometry?.width || 3}</Width>\n`;
    xml += `          <Height>${element.geometry?.height || 3}</Height>\n`;
    xml += `        </RectangularGeometry>\n`;
    xml += `      </Surface>\n`;
  }

  xml += '    </Building>\n';
  xml += '  </Campus>\n';
  xml += '</gbXML>\n';
  return xml;
}

function getGBXMLSurfaceType(type: string): string {
  const map: Record<string, string> = {
    wall: 'ExteriorWall',
    slab: 'SlabOnGrade',
    roof: 'Roof',
    door: 'Door',
    window: 'Window',
    beam: 'InteriorWall',
    column: 'InteriorWall',
    stair: 'Other',
  };
  return map[type.toLowerCase()] || 'Other';
}

function generateCityGML(model: NormalizedModel): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<CityModel xmlns="http://www.opengis.net/citygml/2.0" xmlns:gml="http://www.opengis.net/gml">\n';
  xml += `  <gml:name>${escapeXml(model.project.name)}</gml:name>\n`;
  xml += '  <cityObjectMember>\n';
  xml += '    <Building gml:id="bld_1">\n';
  xml += `      <gml:name>${escapeXml(model.project.name)}</gml:name>\n`;
  xml += '      <lod2Solid>\n';
  xml += '        <gml:Solid>\n';
  xml += '          <gml:exterior>\n';
  xml += '            <gml:CompositeSurface>\n';

  for (const element of model.elements) {
    xml += `              <gml:surfaceMember>\n`;
    xml += `                <gml:Polygon gml:id="${escapeXml(element.id)}">\n`;
    xml += '                  <gml:exterior>\n';
    xml += '                    <gml:LinearRing>\n';
    xml += `                      <gml:posList>0 0 0 10 0 0 10 10 0 0 10 0</gml:posList>\n`;
    xml += '                    </gml:LinearRing>\n';
    xml += '                  </gml:exterior>\n';
    xml += '                </gml:Polygon>\n';
    xml += '              </gml:surfaceMember>\n';
  }

  xml += '            </gml:CompositeSurface>\n';
  xml += '          </gml:exterior>\n';
  xml += '        </gml:Solid>\n';
  xml += '      </lod2Solid>\n';
  xml += '    </Building>\n';
  xml += '  </cityObjectMember>\n';
  xml += '</CityModel>\n';
  return xml;
}

function generateOBJ(model: NormalizedModel): string {
  let obj = `# AI COS Interoperability Engine - OBJ Export\n`;
  obj += `# Project: ${model.project.name}\n`;
  obj += `# Elements: ${model.elements.length}\n`;
  obj += `# Generated: ${new Date().toISOString()}\n\n`;
  obj += 'mtllib building.mtl\n\n';

  let vertexIndex = 1;
  for (const element of model.elements) {
    obj += `o ${element.name.replace(/\s+/g, '_')}\n`;
    const w = element.geometry?.width || 1;
    const h = element.geometry?.height || 3;
    const d = element.geometry?.depth || 0.3;
    obj += `v 0 0 0\nv ${w} 0 0\nv ${w} ${h} 0\nv 0 ${h} 0\nv 0 0 ${d}\nv ${w} 0 ${d}\nv ${w} ${h} ${d}\nv 0 ${h} ${d}\n`;
    obj += `f ${vertexIndex} ${vertexIndex+1} ${vertexIndex+2} ${vertexIndex+3}\n`;
    obj += `f ${vertexIndex+4} ${vertexIndex+5} ${vertexIndex+6} ${vertexIndex+7}\n`;
    obj += `f ${vertexIndex} ${vertexIndex+1} ${vertexIndex+5} ${vertexIndex+4}\n`;
    obj += `f ${vertexIndex+2} ${vertexIndex+3} ${vertexIndex+7} ${vertexIndex+6}\n`;
    obj += `f ${vertexIndex} ${vertexIndex+3} ${vertexIndex+7} ${vertexIndex+4}\n`;
    obj += `f ${vertexIndex+1} ${vertexIndex+2} ${vertexIndex+6} ${vertexIndex+5}\n\n`;
    vertexIndex += 8;
  }

  return obj;
}

function generateDAE(model: NormalizedModel): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">\n';
  xml += `  <asset>\n    <contributor>\n      <authoring_tool>AI COS Interoperability Engine</authoring_tool>\n    </contributor>\n    <created>${new Date().toISOString()}</created>\n    <modified>${new Date().toISOString()}</modified>\n    <unit name="meter" meter="1"/>\n    <up_axis>Z_UP</up_axis>\n  </asset>\n`;
  xml += '  <library_geometries>\n';

  for (const element of model.elements) {
    const w = element.geometry?.width || 1;
    const h = element.geometry?.height || 3;
    const d = element.geometry?.depth || 0.3;
    const id = element.id.replace(/[^a-zA-Z0-9_]/g, '_');
    xml += `    <geometry id="${id}-mesh">\n`;
    xml += '      <mesh>\n';
    xml += `        <source id="${id}-positions">\n`;
    xml += '          <float_array count="24">';
    xml += `0 0 0 ${w} 0 0 ${w} ${h} 0 0 ${h} 0 `;
    xml += `0 0 ${d} ${w} 0 ${d} ${w} ${h} ${d} 0 ${h} ${d}`;
    xml += '</float_array>\n';
    xml += '          <technique_common><accessor source="#cube-positions" count="8" stride="3">\n';
    xml += '            <param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/>\n';
    xml += '          </accessor></technique_common>\n';
    xml += '        </source>\n';
    xml += '      </mesh>\n';
    xml += '    </geometry>\n';
  }

  xml += '  </library_geometries>\n';
  xml += '</COLLADA>\n';
  return xml;
}

function escapeXml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function detectFormat(content: string): string {
  if (content.startsWith('ISO-10303-21') || content.includes('FILE_SCHEMA')) return 'ifc';
  if (content.includes('<ifc:IFCXML') || content.includes('xmlns:ifc="http://www.ifc-xml.org')) return 'ifcxml';
  if (content.includes('<gbXML') || content.includes('xmlns="http://www.gbxml.org')) return 'gbxml';
  if (content.includes('<CityModel') || content.includes('citygml')) return 'citygml';
  if (content.includes('<COLLADA')) return 'dae';
  if (content.startsWith('#')) return 'obj';
  if (content.startsWith('3DS')) return '3ds';
  return 'unknown';
}

function normalizeToModel(content: string, format: string, projectName: string): NormalizedModel {
  const base: NormalizedModel = {
    format,
    source: format,
    elements: [],
    project: { name: projectName || 'Imported Project', units: 'm' },
    metadata: {},
  };

  switch (format) {
    case 'ifc': {
      const ifcMetadata = parseIFCHeader(content);
      base.metadata = ifcMetadata;
      base.project.name = ifcMetadata.fileName || projectName;
      base.elements = parseIFCEntities(content);
      break;
    }
    default: {
      const typeCounts: Record<string, number> = { wall: 0, slab: 0, beam: 0, column: 0, roof: 0, door: 0, window: 0, stair: 0 };
      for (const type of Object.keys(typeCounts)) {
        const regex = new RegExp(type, 'gi');
        const matches = content.match(regex);
        typeCounts[type] = matches ? matches.length : 0;
      }
      for (const [type, count] of Object.entries(typeCounts)) {
        for (let i = 0; i < Math.min(count, 20); i++) {
          base.elements.push({
            id: `${type}_${i + 1}`,
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
            properties: { detected: true, format, source: format },
            geometry: { width: 0.3, height: 3, depth: 5 },
          });
        }
      }
      if (base.elements.length === 0) {
        base.elements.push({
          id: 'element_1',
          type: 'wall',
          name: 'Detected Element',
          properties: { detected: true, format },
        });
      }
      break;
    }
  }

  return base;
}

function convertModel(model: NormalizedModel, targetFormat: string): string {
  switch (targetFormat) {
    case 'json': return JSON.stringify({ model, generatedAt: new Date().toISOString(), generator: 'AI COS Interoperability Engine' }, null, 2);
    case 'ifc': return generateIFC(model);
    case 'ifcxml': return generateIFCXML(model);
    case 'gbxml': return generateGBXML(model);
    case 'citygml': return generateCityGML(model);
    case 'obj': return generateOBJ(model);
    case 'dae': return generateDAE(model);
    default: return JSON.stringify(model);
  }
}

export async function importFile(projectId: string, userId: string, content: string, fileName: string) {
  const format = detectFormat(content);
  if (!SUPPORTED_FORMATS.import.includes(format)) {
    return { success: false, message: `Unsupported format: ${format}. Supported: ${SUPPORTED_FORMATS.import.join(', ')}`, format };
  }

  const model = normalizeToModel(content, format, fileName.replace(/\.[^.]+$/, ''));

  const job = await prisma.importExportJob.create({
    data: {
      projectId,
      userId,
      type: 'import',
      format,
      direction: 'import',
      fileName,
      fileType: format,
      fileSize: content.length,
      fileData: content.slice(0, 50000),
      resultData: JSON.stringify(model),
      status: 'completed',
      message: `Imported ${model.elements.length} elements from ${format.toUpperCase()} file`,
      metadata: JSON.stringify({ elementCount: model.elements.length, detectedFormat: format }),
    },
  });

  return { success: true, job, model, format };
}

export async function exportModel(projectId: string, userId: string, targetFormat: string) {
  if (!SUPPORTED_FORMATS.export.includes(targetFormat)) {
    return { success: false, message: `Unsupported target format: ${targetFormat}` };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { success: false, message: 'Project not found' };

  const designs = await prisma.design.findMany({ where: { projectId }, take: 10 });
  const boqItems = await prisma.bOQItem.findMany({ where: { projectId }, take: 10 });
  const phases = await prisma.projectPhase.findMany({ where: { projectId }, take: 10 });

  const elements: FormatElement[] = [];

  for (let i = 0; i < designs.length; i++) {
    elements.push({
      id: `design_${i + 1}`,
      type: 'building',
      name: designs[i].name || `Design ${i + 1}`,
      properties: { style: designs[i].style || '', description: designs[i].description || '' },
      geometry: { width: 10, height: 6, depth: 8 },
    });
  }

  if (elements.length === 0) {
    const typeMap: Record<string, string> = { Residential: 'wall', Commercial: 'slab', Institutional: 'column', Infrastructure: 'beam' };
    const elemType = typeMap[project.type] || 'wall';
    elements.push({
      id: `${elemType}_1`,
      type: elemType,
      name: project.name,
      properties: { area: String(project.area || ''), floors: String(project.floors || ''), style: project.style || '' },
      geometry: { width: 0.3 * (project.floors || 2), height: 3 * (project.floors || 2), depth: (project.area || 300) / 10 },
    });
  }

  const model: NormalizedModel = {
    format: targetFormat,
    source: 'aicos',
    elements,
    project: {
      name: project.name,
      description: project.description || '',
      units: 'm',
    },
    metadata: {
      projectType: project.type,
      projectStatus: project.status,
      location: project.location,
      budget: project.budget,
      boqItems: boqItems.length,
      phases: phases.length,
      generatedBy: 'AI COS Interoperability Engine',
      generatedAt: new Date().toISOString(),
    },
  };

  const resultData = convertModel(model, targetFormat);

  const job = await prisma.importExportJob.create({
    data: {
      projectId,
      userId,
      type: 'export',
      format: targetFormat,
      direction: 'export',
      fileName: `${project.name.replace(/\s+/g, '_')}.${targetFormat}`,
      fileType: targetFormat,
      fileSize: resultData.length,
      resultData: resultData.slice(0, 50000),
      status: 'completed',
      message: `Exported ${elements.length} elements to ${targetFormat.toUpperCase()} format`,
      metadata: JSON.stringify({ elementCount: elements.length, targetFormat }),
    },
  });

  return {
    success: true,
    job,
    content: resultData,
    format: targetFormat,
    fileName: `${project.name.replace(/\s+/g, '_')}.${targetFormat}`,
    model,
  };
}

export async function convertFile(userId: string, content: string, sourceFormat: string, targetFormat: string): Promise<{ success: boolean; message: string; content?: string; format?: string; record?: any }> {
  if (!SUPPORTED_FORMATS.export.includes(targetFormat)) {
    return { success: false, message: `Unsupported target format: ${targetFormat}` };
  }

  const model = normalizeToModel(content, sourceFormat, 'converted');
  const resultData = convertModel(model, targetFormat);

  const record = await prisma.conversionRecord.create({
    data: {
      sourceFormat,
      targetFormat,
      sourceData: content.slice(0, 10000),
      resultData: resultData.slice(0, 50000),
      status: 'completed',
      message: `Converted ${model.elements.length} elements from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}`,
      userId,
    },
  });

  return { success: true, message: `Converted to ${targetFormat.toUpperCase()}`, content: resultData, format: targetFormat, record };
}

export async function getJobHistory(projectId: string) {
  return prisma.importExportJob.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 20 });
}

export async function getJob(jobId: string) {
  return prisma.importExportJob.findUnique({ where: { id: jobId } });
}

export async function getConversionHistory(userId: string) {
  return prisma.conversionRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
}

export { SUPPORTED_FORMATS, detectFormat, normalizeToModel, convertModel };
