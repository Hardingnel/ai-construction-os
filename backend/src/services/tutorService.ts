import { prisma, db } from '../app';
import { pythonService } from './pythonServiceManager';

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

interface ExplainRequest {
  concept: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

interface MentorRequest {
  question: string;
  sessionId?: string;
  userId: string;
  context?: string;
}

interface GlossarySearchRequest {
  query?: string;
  category?: string;
  difficulty?: string;
}

const CONSTRUCTION_CONCEPTS: Record<string, {
  beginner: string;
  intermediate: string;
  advanced: string;
  category: string;
}> = {
  'foundation': {
    beginner: 'The foundation is like the shoes of a building. Just like you need strong shoes to stand on any ground, a building needs a strong foundation to sit on the soil. It spreads out the weight of the building so it doesn\'t sink or tip over. Foundations are usually made of concrete and steel bars (reinforcement) buried underground.',
    intermediate: 'A foundation transfers building loads (dead, live, wind, seismic) to the soil. Types include shallow (strip, pad, raft) and deep (pile, pier). Design considers soil bearing capacity, water table, and structural loads. Reinforcement detailing follows code requirements for crack control and moment resistance.',
    advanced: 'Foundation engineering involves bearing capacity analysis (Terzaghi, Meyerhoff methods), settlement calculations (elastic, consolidation), lateral earth pressure, and soil-structure interaction. Deep foundations require dynamic pile testing, negative skin friction analysis, and group efficiency factors. Seismic design includes liquefaction potential, site class effects per ASCE 7, and ductility detailing.',
    category: 'Structural',
  },
  'beam': {
    beginner: 'A beam is like a horizontal bridge that carries the floor or roof above it. Imagine a plank of wood between two chairs — it holds things up. Beams in buildings are made of reinforced concrete or steel and are supported by columns at each end.',
    intermediate: 'Beams are horizontal flexural members that resist transverse loads through bending. Design involves calculating bending moment and shear force diagrams, selecting reinforcement for tension zones, and checking deflection, crack width, and shear capacity per codes like BS 8110 or Eurocode 2.',
    advanced: 'Beam analysis covers elastic and plastic section modulus, moment redistribution, T-beam effective flange width, strut-and-tie models for deep beams, torsion design, and serviceability limit states (deflection, crack control). Advanced topics include composite action with slabs, continuous beam moment envelopes, and seismic ductility detailing for plastic hinge zones.',
    category: 'Structural',
  },
  'column': {
    beginner: 'A column is like a sturdy leg that holds up the building. It stands upright and carries the weight from the beams and floors above down to the foundation. Columns are the reason buildings can be multiple stories tall.',
    intermediate: 'Columns are vertical compression members that support axial loads from beams and slabs. Design considers slenderness ratio, buckling (Euler\'s theory), biaxial bending, and reinforcement detailing. Short columns fail by crushing, slender columns by buckling. Interaction diagrams determine capacity under combined axial + moment loading.',
    advanced: 'Advanced column design addresses second-order effects (P-Δ, P-δ), biaxial bending interaction surfaces, confinement reinforcement for ductility, lap splice detailing per seismic zones, and fire resistance (cover requirements, spalling). Buckling analysis includes effective length factors from alignment charts, and non-linear inelastic buckling for slender sections.',
    category: 'Structural',
  },
  'slab': {
    beginner: 'A slab is like the flat tabletop of a building — it\'s the floor you walk on and the ceiling of the room below. It\'s a big flat sheet of concrete that sits on beams or walls.',
    intermediate: 'Slabs are horizontal plate elements spanning between supports. Types include one-way (spanning in one direction), two-way (spanning both ways), flat plate (no beams), ribbed/waffle, and post-tensioned. Design covers bending reinforcement distribution, shear at column supports, deflection control, and serviceability.',
    advanced: 'Advanced slab design includes yield line analysis, finite element modeling for irregular geometries, punching shear at column-slab connections (including shear reinforcement like stud rails), post-tensioning tendon profiles and friction losses, long-term deflection considering creep and shrinkage, and diaphragm action for lateral load distribution.',
    category: 'Structural',
  },
  'reinforcement': {
    beginner: 'Reinforcement is like the skeleton inside concrete. Concrete is strong when you squeeze it (compression) but weak when you pull it (tension). Steel bars are placed inside the concrete to handle the pulling forces, making the building safe and strong.',
    intermediate: 'Steel reinforcement provides tensile strength to concrete structures. Common grades include 250, 460, 500 MPa yield strength. Bars come in diameters 6–40mm with surface deformations for bond. Design covers minimum/maximum areas, spacing limits, cover for durability, development length for anchorage, and lap splice lengths.',
    advanced: 'Advanced reinforcement topics include strain compatibility in over-reinforced vs under-reinforced sections, bond stress distribution, hooked and headed bar anchorage, mechanical couplers for large bars, corrosion protection (epoxy coating, galvanizing, stainless steel, cathodic protection), and fiber-reinforced polymer (FRP) bars as non-corrosive alternatives.',
    category: 'Materials',
  },
  'concrete': {
    beginner: 'Concrete is like artificial rock that we make by mixing cement (the glue), sand, gravel (stones), and water. When it dries, it becomes super hard and strong. It\'s the most common building material in the world because it\'s cheap, strong, and can be shaped into anything.',
    intermediate: 'Concrete is a composite of cement (OPC, PPC), fine aggregate (sand), coarse aggregate (gravel/crushed stone), and water. Water-cement ratio determines strength (lower = stronger). Grade designations like C25/30 indicate characteristic cylinder/cube strength in MPa. Tests include slump (workability), cube/crushing (strength), and non-destructive (rebound hammer, UPV).',
    advanced: 'Advanced concrete technology covers supplementary cementitious materials (fly ash, slag, silica fume, metakaolin), chemical admixtures (superplasticizers, retarders, accelerators, air-entrainers), high-performance concrete (HPC > 60 MPa), self-compacting concrete (SCC), fiber-reinforced concrete (steel, glass, polypropylene fibers), and durability modeling (chloride ingress, carbonation, ASR, sulfate attack, freeze-thaw).',
    category: 'Materials',
  },
  'brick': {
    beginner: 'Bricks are like building blocks made from clay that are baked in a very hot oven (kiln). They are stacked and stuck together with mortar (like cement glue) to make walls. Bricks have been used for thousands of years because they are strong, fireproof, and keep buildings cool.',
    intermediate: 'Bricks are masonry units classified by material (clay, concrete, fly ash), manufacturing process (extruded, pressed, hand-molded), and strength (common bricks 5–15 MPa, engineering bricks > 25 MPa). Bond patterns (English, Flemish, Stretcher) affect wall strength and appearance. Mortar mix proportions (1:3 to 1:6 cement:sand) determine joint strength.',
    advanced: 'Advanced masonry includes reinforced and confined masonry for seismic regions, brick masonry compressive strength testing (prism tests per ASTM C1314), flexural bond strength, water absorption limits (< 20%), efflorescence control, thermal conductivity (U-value calculation), and heritage conservation mortar specifications (NHL-based, breathable mortars for historic structures).',
    category: 'Materials',
  },
  'roof': {
    beginner: 'A roof is like a hat for the building. It protects everything inside from rain, sun, and wind. Roofs can be flat (like a patio) or sloped (like a triangle). In Africa, many roofs are made of corrugated iron sheets or clay tiles.',
    intermediate: 'Roof design considers structural support (trusses, rafters, purlins), cladding material (metal sheets, tiles, slate, thatch), insulation (thermal resistance U-value), drainage (slope, gutter sizing, downpipe placement), and ventilation (ridge vents, soffit vents). Truss types include king post, queen post, Howe, fan, and Fink configurations.',
    advanced: 'Advanced roofing includes green/living roof systems (extensive vs intensive, drainage layers, waterproofing membranes, vegetation selection), cool roofs (solar reflectance index SRI > 78 for low-slope roofs), photovoltaic-integrated roofing (BIPV), thermally broken standing seam metal roofs, and structural behavior of folded plate and shell roof structures.',
    category: 'Structural',
  },
  'sustainable construction': {
    beginner: 'Sustainable construction means building in a way that doesn\'t hurt the planet. This means using less energy, less water, fewer materials, and creating less waste. It\'s like building a house that pays attention to nature and tries to protect it.',
    intermediate: 'Green building practices include energy-efficient design (passive solar, high-performance envelope, efficient HVAC), water conservation (low-flow fixtures, rainwater harvesting), sustainable materials (recycled content, locally sourced, rapidly renewable), waste management (construction waste recycling), and IAQ (low-VOC materials, proper ventilation). Certifications: LEED, BREEAM, EDGE.',
    advanced: 'Advanced sustainability involves whole-building life cycle assessment (LCA per ISO 14040/14044), embodied carbon optimization using EN 15978 modules (A1–A3, A4–A5, B1–B7, C1–C4), net-zero carbon operational performance (Passivhaus, EnerPHit), circular economy principles (design for disassembly, material passports), and biodiversity net gain calculations using the DEFRA metric.',
    category: 'Sustainability',
  },
  'quantity surveying': {
    beginner: 'A quantity surveyor (QS) is like a money manager for construction. They figure out how much everything will cost before building starts (estimating), keep track of spending during construction, and make sure the project stays on budget. They also measure quantities of materials needed.',
    intermediate: 'QS roles include cost planning (elemental estimates, cost models), procurement (tender documentation, contract selection — JCT, NEC, FIDIC), measurement (NRM/SMM7 rules), valuation of work in progress (interim valuations, variation orders), and final account preparation. Key skills: BOQ preparation, rate analysis, cash flow forecasting.',
    advanced: 'Advanced quantity surveying includes BIM 5D cost integration (quantity takeoff from IFC models), risk analysis (Monte Carlo simulation for contingency), life cycle costing (LCC per ISO 15686, NPV analysis), dispute resolution (adjudication, arbitration, expert witness), and infrastructure cost models (CESMM4 for civil works, POMI for mechanical/electrical).',
    category: 'Management',
  },
  'project management': {
    beginner: 'Project management in construction means being the boss who makes sure everything happens on time and within budget. The project manager plans the work, hires the team, checks quality, solves problems, and keeps the client happy.',
    intermediate: 'Construction PM involves scope, schedule, cost, quality, safety, and communication management. Tools include WBS (Work Breakdown Structure), Gantt charts (critical path method), earned value management (EVM), RFI/submittal tracking, punch lists, and closeout documentation. Software: MS Project, Primavera P6, Procore.',
    advanced: 'Advanced PM covers integrated project delivery (IPD), lean construction (Last Planner System, Takt planning, JIT delivery), building information modeling (BIM) execution plans, contract administration (change order management, claims analysis, delay analysis — TIA, windows analysis), dispute avoidance boards, and international project delivery considerations (cultural, legal, logistics).',
    category: 'Management',
  },
  'bim': {
    beginner: 'BIM (Building Information Modeling) is like a 3D computer model of a building — but smarter. Instead of just a drawing, it contains information about everything: walls, pipes, doors, cost, schedule. It\'s like a super-smart digital twin of the real building.',
    intermediate: 'BIM maturity levels range from 0 (CAD, 2D) to 3 (fully integrated, interoperable). Level 2 (mandatory in UK since 2016) requires collaborative 3D models with COBie data. IFC (Industry Foundation Classes) is the open standard for data exchange. LOD (Level of Development) defines detail from 100 (conceptual) to 500 (as-built).',
    advanced: 'Advanced BIM includes parametric modeling (Dynamo, Grasshopper for computational design), 4D (schedule) and 5D (cost) integration, point cloud-to-BIM for existing conditions (laser scanning, photogrammetry), digital twins (IoT sensor integration for facility management, real-time monitoring), and semantic web ontologies (ifcOWL, Brick Schema for smart buildings).',
    category: 'Technology',
  },
  'excavation': {
    beginner: 'Excavation is just a fancy word for digging. Before you can build anything, you need to dig a hole in the ground for the foundation. It includes removing trees, leveling the ground, and digging trenches.',
    intermediate: 'Excavation involves site clearing, topsoil stripping, bulk excavation for basements, and trench excavation for foundations/services. Types: open cut (sloped sides), braced excavation (sheet piles, soldier piles with lagging), and cofferdams (for underwater). Factors: soil type, groundwater, depth, adjacent structures, OSHA shoring requirements.',
    advanced: 'Advanced excavation engineering includes earth pressure theories (Rankine, Coulomb) for shoring design, groundwater control (wellpoints, deep wells, slurry walls, grouting), ground freezing for deep shafts, excavation monitoring (inclinometers, settlement markers, piezometers, automated total stations), and top-down construction methods for deep basements in urban areas.',
    category: 'Construction',
  },
  'formwork': {
    beginner: 'Formwork is like a mold for wet concrete. You build a box made of wood or metal in the shape you want (like a beam or column), pour the wet concrete in, wait for it to harden, then remove the mold. The concrete now holds that shape forever.',
    intermediate: 'Formwork systems include traditional timber (plywood with lumber supports), engineered (aluminum or steel panels, table forms for slabs, jump forms for cores), and stay-in-place (insulated concrete forms, steel decking for composite slabs). Design considers concrete pressure (rate of pour, temperature, vibration), deflection limits, and stripping times (early strength requirements).',
    advanced: 'Advanced formwork includes self-climbing formwork for tall cores (hydraulic climbing systems), slip forming for silos/towers (continuous jacking, conical slip), tunnel form for repetitive cell construction (hotels, prisons), and fabric formwork for architectural concrete (geometric flexibility, reduced waste, unique textures).',
    category: 'Construction',
  },
};

const GLOSSARY_ENTRIES = [
  { term: 'Abutment', definition: 'The substructure that supports the ends of a bridge span and retains the approach embankment.', category: 'Structural', difficulty: 'intermediate' },
  { term: 'Aggregate', definition: 'Granular material like sand, gravel, or crushed stone used in concrete and asphalt mixtures. Provides bulk, strength, and dimensional stability.', category: 'Materials', difficulty: 'beginner' },
  { term: 'Architrave', definition: 'A decorative molding or trim around door and window openings, covering the joint between the frame and wall surface.', category: 'Finishing', difficulty: 'beginner' },
  { term: 'Batten', definition: 'A thin strip of timber used to fix roofing sheets or as a decorative vertical element on external walls.', category: 'Materials', difficulty: 'intermediate' },
  { term: 'Bearing Capacity', definition: 'The maximum load per unit area that the ground can safely support without failure or excessive settlement.', category: 'Geotechnical', difficulty: 'intermediate' },
  { term: 'Bond (Brick)', definition: 'The systematic arrangement of bricks in a wall to ensure strength and stability, such as English or Flemish bond.', category: 'Masonry', difficulty: 'beginner' },
  { term: 'Cantilever', definition: 'A beam or slab that projects horizontally beyond its support, fixed at one end and free at the other, like a balcony.', category: 'Structural', difficulty: 'intermediate' },
  { term: 'Curing', definition: 'The process of maintaining adequate moisture and temperature in concrete to allow proper hydration of cement and achieve design strength.', category: 'Materials', difficulty: 'beginner' },
  { term: 'Damp Proof Course (DPC)', definition: 'A horizontal barrier layer installed in walls to prevent moisture rising from the ground by capillary action (rising damp).', category: 'Masonry', difficulty: 'beginner' },
  { term: 'Deflection', definition: 'The degree to which a structural element bends under load. Excessive deflection can cause cracking in finishes and serviceability problems.', category: 'Structural', difficulty: 'intermediate' },
  { term: 'Eaves', definition: 'The lower edge of a roof that projects beyond the face of the wall, providing weather protection and directing rainwater away.', category: 'Architectural', difficulty: 'beginner' },
  { term: 'Efflorescence', definition: 'A white crystalline deposit of soluble salts that appears on the surface of brickwork or concrete, caused by moisture migration.', category: 'Materials', difficulty: 'intermediate' },
  { term: 'Fascia', definition: 'A vertical board fixed to the ends of roof rafters, supporting the gutter and providing a finished appearance.', category: 'Architectural', difficulty: 'beginner' },
  { term: 'Ferrule', definition: 'A metal ring or cap used to reinforce or protect the end of a tool handle, pipe, or electrical conduit.', category: 'General', difficulty: 'advanced' },
  { term: 'Flashing', definition: 'A thin sheet of metal or waterproof material installed to prevent water penetration at roof joints, valleys, chimneys, and wall penetrations.', category: 'Roofing', difficulty: 'intermediate' },
  { term: 'Formwork', definition: 'Temporary or permanent molds into which concrete is poured to achieve desired shapes like beams, columns, and slabs.', category: 'Construction', difficulty: 'beginner' },
  { term: 'Gable', definition: 'The triangular upper part of a wall at the end of a pitched roof, between the slopes of the roof.', category: 'Architectural', difficulty: 'beginner' },
  { term: 'Haunch', definition: 'The thickened part of a beam or slab near its support, designed to resist higher shear forces or provide extra strength.', category: 'Structural', difficulty: 'advanced' },
  { term: 'Insulation (R-value)', definition: 'A measure of thermal resistance. Higher R-values indicate better insulation performance, reducing heat transfer through building elements.', category: 'Building Science', difficulty: 'intermediate' },
  { term: 'Joinery', definition: 'The craft of making wooden fittings like doors, windows, stairs, cabinets, and other finished woodwork in a building.', category: 'Finishing', difficulty: 'beginner' },
  { term: 'Kerb (Curb)', definition: 'The stone or concrete edging along a road or pavement that separates the roadway from the pedestrian walkway.', category: 'Civil', difficulty: 'beginner' },
  { term: 'Lintel', definition: 'A horizontal structural member (concrete, steel, or timber) spanning an opening like a door or window to support the wall above.', category: 'Structural', difficulty: 'beginner' },
  { term: 'Mastic', definition: 'A viscous, adhesive compound used as a sealant, filler, or adhesive in construction, particularly for joints and glazing.', category: 'Materials', difficulty: 'intermediate' },
  { term: 'Mullion', definition: 'A vertical structural element that divides window or door openings into separate panes or sections.', category: 'Architectural', difficulty: 'intermediate' },
  { term: 'Nogging', definition: 'Horizontal timber pieces fixed between wall studs to provide lateral bracing, fire stopping, and fixing support for cladding.', category: 'Carpentry', difficulty: 'advanced' },
  { term: 'Parapet', definition: 'A low protective wall or railing along the edge of a roof, balcony, bridge, or terrace.', category: 'Architectural', difficulty: 'beginner' },
  { term: 'Pointing', definition: 'The finishing of mortar joints in brick or stone masonry to improve appearance and weather resistance.', category: 'Masonry', difficulty: 'beginner' },
  { term: 'Purlin', definition: 'A horizontal beam in a roof structure that supports the roof sheeting or rafters between the roof trusses.', category: 'Structural', difficulty: 'intermediate' },
  { term: 'Reinforcement Cover', definition: 'The thickness of concrete protecting steel reinforcement from corrosion and fire, measured from the bar surface to the concrete face.', category: 'Structural', difficulty: 'intermediate' },
  { term: 'Scaffolding', definition: 'A temporary elevated platform and supporting structure used by workers during construction, maintenance, or repair of buildings.', category: 'Safety', difficulty: 'beginner' },
  { term: 'Shuttering', definition: 'Another term for formwork — the mold used to shape poured concrete during construction.', category: 'Construction', difficulty: 'beginner' },
  { term: 'Soffit', definition: 'The underside of a building element such as a roof overhang, beam, arch, or staircase.', category: 'Architectural', difficulty: 'intermediate' },
  { term: 'Subgrade', definition: 'The natural soil or prepared ground on which a foundation, pavement, or road base is constructed.', category: 'Geotechnical', difficulty: 'intermediate' },
  { term: 'Suspended Ceiling', definition: 'A secondary ceiling hung below the main structural ceiling, used to hide services (wiring, ducts) and improve acoustics.', category: 'Finishing', difficulty: 'beginner' },
  { term: 'Tender (Construction)', definition: 'A formal offer to carry out construction work for a stated price, typically submitted in response to a client\'s invitation.', category: 'Procurement', difficulty: 'intermediate' },
  { term: 'U-Value', definition: 'A measure of heat transfer through a building element (wall, roof, window) — lower U-values mean better thermal insulation.', category: 'Building Science', difficulty: 'intermediate' },
  { term: 'Valley (Roof)', definition: 'The internal angle where two sloping roof surfaces meet, directing water toward the gutters.', category: 'Roofing', difficulty: 'intermediate' },
  { term: 'Weep Hole', definition: 'Small openings left in masonry walls or retaining walls to allow trapped moisture to drain out.', category: 'Masonry', difficulty: 'beginner' },
  { term: 'Xeriscaping', definition: 'A landscaping approach that uses drought-tolerant plants and water-efficient techniques to reduce irrigation needs.', category: 'Landscape', difficulty: 'intermediate' },
  { term: 'Yield Point', definition: 'The stress at which a material (especially steel) begins to deform permanently (plastically) under load.', category: 'Materials', difficulty: 'advanced' },
  { term: 'Zoning', definition: 'Municipal regulations that govern land use — specifying what can be built (residential, commercial, industrial), building height limits, setbacks, and density.', category: 'Planning', difficulty: 'intermediate' },
];

export async function explainConcept(req: ExplainRequest) {
  if (pythonService.isHealthy()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(`${PYTHON_API}/api/analyze/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'explain',
          query: req.concept,
          level: req.level || 'intermediate',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data: any = await resp.json();
        if (data?.tutor?.found !== undefined) {
          return data.tutor;
        }
      }
    } catch (e: any) {
      console.log(`Tutor explain AI request failed: ${e.message}`);
    }
  }

  const entry = CONSTRUCTION_CONCEPTS[req.concept.toLowerCase()];
  if (!entry) {
    return {
      found: false,
      concept: req.concept,
      message: 'I don\'t have information on this concept yet. Try searching our glossary or asking a different question.',
      suggestions: Object.keys(CONSTRUCTION_CONCEPTS).slice(0, 5),
    };
  }

  let explanation = entry.beginner;
  if (req.level === 'intermediate') explanation = entry.intermediate;
  if (req.level === 'advanced') explanation = entry.advanced;

  const relatedTerms = Object.entries(CONSTRUCTION_CONCEPTS)
    .filter(([key]) => key !== req.concept.toLowerCase())
    .slice(0, 3)
    .map(([key, val]) => ({ term: key.charAt(0).toUpperCase() + key.slice(1), category: val.category }));

  return {
    found: true,
    concept: req.concept.charAt(0).toUpperCase() + req.concept.slice(1),
    category: entry.category,
    explanation,
    level: req.level || 'beginner',
    relatedTerms,
    nextSteps: [
      `Ask about a related topic like ${relatedTerms.map(t => t.term).join(', ')}`,
      'Search the glossary for more technical definitions',
      'Start a mentor session for interactive Q&A',
    ],
  };
}

export async function searchGlossary(query?: string, category?: string, difficulty?: string) {
  let results = [...GLOSSARY_ENTRIES];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(e =>
      e.term.toLowerCase().includes(q) ||
      e.definition.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  if (category) {
    results = results.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  if (difficulty) {
    results = results.filter(e => e.difficulty === difficulty);
  }

  const categories = [...new Set(GLOSSARY_ENTRIES.map(e => e.category))];

  return {
    total: results.length,
    results: results.slice(0, 50),
    categories,
    filters: { query, category, difficulty },
  };
}

export async function glossarySeed() {
  let count = 0;
  for (const entry of GLOSSARY_ENTRIES) {
    await db.glossaryEntry.upsert({
      where: { term: entry.term },
      update: {},
      create: entry,
    });
    count++;
  }
  return { seeded: count };
}

export async function mentorChat(req: MentorRequest) {
  let session = req.sessionId
    ? await db.tutorSession.findUnique({ where: { id: req.sessionId } })
    : null;

  if (!session) {
    session = await db.tutorSession.create({
      data: { userId: req.userId, topic: req.question.slice(0, 100), context: req.context },
    });
  }

  const userMessage = await db.tutorMessage.create({
    data: { sessionId: session.id, role: 'user', content: req.question },
  });

  const { response, relatedTerms } = await generateMentorResponse(req.question, session.context || undefined);

  const tutorMessage = await db.tutorMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: response,
      metadata: JSON.stringify({ relatedTerms }),
    },
  });

  return {
    sessionId: session.id,
    question: req.question,
    answer: response,
    relatedTerms,
    message: tutorMessage,
    conversation: [
      { role: 'user', content: userMessage.content, createdAt: userMessage.createdAt },
      { role: 'assistant', content: tutorMessage.content, createdAt: tutorMessage.createdAt },
    ],
  };
}

async function generateMentorResponse(question: string, context?: string): Promise<{ response: string; relatedTerms: string[] }> {
  if (pythonService.isHealthy()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(`${PYTHON_API}/api/analyze/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'mentor',
          query: question,
          context: context || 'general',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data: any = await resp.json();
        if (data?.tutor?.answer) {
          return { response: data.tutor.answer, relatedTerms: data.tutor.relatedTerms || [] };
        }
      }
    } catch (e: any) {
      console.log(`Tutor mentor AI request failed: ${e.message}`);
    }
  }

  const q = question.toLowerCase();
  const relatedTerms: string[] = [];

  const matchedConcepts = Object.entries(CONSTRUCTION_CONCEPTS).filter(([key]) =>
    q.includes(key) || key.split(' ').some(w => q.includes(w))
  );

  let response: string;

  if (matchedConcepts.length > 0) {
    const [key, entry] = matchedConcepts[0];
    relatedTerms.push(key.charAt(0).toUpperCase() + key.slice(1));

    if (q.includes('how') || q.includes('why') || q.includes('what')) {
      response = `Great question about ${key}! ${entry.intermediate}\n\n${entry.advanced.split('.')[0]}.`;
    } else if (q.includes('compare') || q.includes('difference') || q.includes('vs')) {
      const other = matchedConcepts.length > 1 ? matchedConcepts[1] : null;
      if (other) {
        response = `Comparing **${key}** and **${other[0]}**:\n\n**${key}**: ${entry.beginner.split('.')[0]}.\n\n**${other[0]}**: ${other[1].beginner.split('.')[0]}.\n\nIn practice, they work together in a building — ${key} supports ${other[0]} and vice versa.`;
        relatedTerms.push(other[0].charAt(0).toUpperCase() + other[0].slice(1));
      } else {
        response = `Let me explain **${key}** in detail:\n\n${entry.intermediate}\n\nWant to know more? Ask about related topics like design calculations, material choices, or real-world applications.`;
      }
    } else if (q.includes('example') || q.includes('application')) {
      response = `Great — practical examples of **${key}**:\n\n${entry.advanced.split('.')[0]}. This is commonly seen in ${entry.category.toLowerCase()} projects.\n\nFor instance, ${key} plays a critical role in ensuring structural integrity and safety. Would you like to dive deeper into design methodology or code requirements?`;
    } else {
      response = `Let me break down **${key}** for you:\n\n${entry.intermediate}\n\nCategory: ${entry.category}\n\nWould you like me to explain this like you're a beginner, or go deeper into advanced concepts?`;
    }
  } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    response = 'Hello! I\'m your AI Construction Tutor. I can help you with:\n\n- **Explaining concepts** — ask about foundations, beams, concrete, BIM, etc.\n- **Construction terms** — search the glossary for any term\n- **Project help** — design, planning, costing, or compliance questions\n- **Career advice** — skills, certifications, and learning paths\n\nWhat would you like to learn about today?';
  } else if (q.includes('career') || q.includes('become') || q.includes('certification')) {
    response = 'Great that you\'re thinking about a construction career! Here are some paths:\n\n**Entry-level**: Site supervisor, junior estimator, CAD technician\n**Professional**: Architect (requires RIBA/NCARB), Structural Engineer (IStructE/ASCE), Quantity Surveyor (RICS)\n**Certifications**: PMP (Project Management), LEED AP (Sustainability), CSCS (UK site card), PRINCE2\n\nWhat area interests you most — design, management, or hands-on construction?';
  } else if (q.includes('cost') || q.includes('budget') || q.includes('price')) {
    response = 'Construction costs typically break down into:\n\n- **Materials** (35–45% of total cost)\n- **Labor** (25–35%)\n- **Equipment** (10–15%)\n- **Overhead & profit** (15–20%)\n\nTo estimate accurately, Quantity Surveyors use the NRM (New Rules of Measurement) framework. Would you like me to explain how to prepare a budget or BOQ?';
  } else if (q.includes('safety') || q.includes('hazard') || q.includes('risk')) {
    response = 'Construction safety is critical. Key focus areas:\n\n- **Working at height** — scaffolding, guardrails, harnesses\n- **Excavation** — shoring, sloping, trench boxes\n- **Electrical safety** — lockout/tagout, GFCI, grounding\n- **PPE** — hard hats, safety boots, hi-vis vests, gloves\n- **Site protocols** — inductions, daily briefings, permit-to-work\n\nEvery site needs a Safety Management Plan per OHSAS 18001 / ISO 45001. Would you like details on any specific area?';
  } else {
    response = `I'm not sure I understand "${question.slice(0, 60)}..." — could you rephrase?\n\nI can help with:\n- Explaining construction concepts (foundations, beams, concrete, etc.)\n- Defining construction terms\n- Project management, costs, safety, or sustainability\n\nTry asking: "What is a beam?" or "Explain foundations like I\'m a beginner."`;
  }

  return { response, relatedTerms };
}

export async function getSessionHistory(userId: string) {
  return db.tutorSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 2 } },
    take: 20,
  });
}

export async function getSessionMessages(sessionId: string) {
  return db.tutorMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getContextualHelp(page: string) {
  const helpMap: Record<string, { title: string; content: string; tips: string[] }> = {
    dashboard: {
      title: 'Dashboard Overview',
      content: 'Your project control center. Shows key metrics like project counts, task completion rates, recent activity, and budget summaries.',
      tips: ['Click any project card to open it', 'Task completion rate updates in real-time', 'Use the sidebar to navigate to specific tools'],
    },
    generator: {
      title: 'AI Design Generator',
      content: 'Generate building designs using AI. Select a project, describe your vision (style, size, rooms), and the AI creates architectural plans.',
      tips: ['Be specific in your prompt for best results', 'You can generate multiple variations', 'Results are saved to your project automatically'],
    },
    design: {
      title: 'Design Studio',
      content: 'A visual workspace for creating and editing building designs. Use drawing tools, drag-and-drop elements, and modify 3D models.',
      tips: ['Use the toolbar for drawing tools', 'The right panel shows element properties', 'Zoom with scroll wheel, orbit with middle mouse'],
    },
    bim: {
      title: 'BIM Viewer',
      content: 'View and navigate 3D building models. Explore structural, architectural, and MEP elements with layer controls and measurement tools.',
      tips: ['Toggle layers to see different systems', 'Click elements to view properties', 'Use section planes to see inside the model'],
    },
    gis: {
      title: 'GIS Analysis',
      content: 'Geographic Information System tools for site analysis. View terrain, flood risk, soil types, and environmental constraints on interactive maps.',
      tips: ['Select a project to see its location data', 'Flood risk data comes from environmental databases', 'Export GIS data for reports'],
    },
    boq: {
      title: 'BOQ & Estimation',
      content: 'Bill of Quantities management. Create, organize, and estimate costs for construction items with rate analysis and budget tracking.',
      tips: ['Items are organized by category', 'Unit rates update automatically from market data', 'Export BOQ as PDF or Excel for tendering'],
    },
    projects: {
      title: 'Project Management',
      content: 'Manage all your construction projects from one place. Track phases, milestones, tasks, budget, and team assignments.',
      tips: ['Use phases to break down the project lifecycle', 'Milestones mark key deadlines', 'Each project has its own dashboard'],
    },
    marketplace: {
      title: 'Marketplace',
      content: 'Browse and purchase construction plans, BIM models, and design templates. Published by professionals worldwide.',
      tips: ['Filter by type and price range', 'Preview plans before purchasing', 'Publish your own designs to earn revenue'],
    },
    team: {
      title: 'Team Management',
      content: 'Manage your construction team members, their roles, specialties, and hourly rates. Invite new members and track assignments.',
      tips: ['Assign roles based on expertise', 'Hourly rates affect BOQ labor costs', 'Team members can be assigned to tasks'],
    },
    compliance: {
      title: 'Compliance Engine',
      content: 'Automated building code compliance checking. Run checks against international or country-specific building codes for your project.',
      tips: ['Select the applicable country first', 'Run checks after major design changes', 'Review findings to address violations'],
    },
    sustainability: {
      title: 'Sustainability Intelligence',
      content: 'Environmental performance analysis. Assess carbon footprint, energy efficiency, solar potential, water conservation, and climate resilience.',
      tips: ['Run a new assessment after design changes', 'Review recommendations to improve scores', 'Track score improvements over time'],
    },
    settings: {
      title: 'Settings',
      content: 'Configure your account, preferences, notification settings, and team defaults.',
      tips: ['Update your profile information', 'Configure sync preferences', 'Manage team permissions here'],
    },
  };

  return helpMap[page.toLowerCase()] || {
    title: 'Need Help?',
    content: 'Use the AI Tutor from the sidebar for interactive Q&A, or search the glossary for construction terms.',
    tips: ['Click the AI Tutor button for help', 'Search the glossary for definitions', 'Ask about any construction concept'],
  };
}
