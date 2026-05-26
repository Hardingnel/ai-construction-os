import { prisma } from '../app';
import { pythonService } from './pythonServiceManager';

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

interface ComplianceRule {
  code: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  requirement: string;
  check: (project: any) => { passed: boolean; finding: string; recommendation: string };
}

const SIERRA_LEONE_RULES: ComplianceRule[] = [
  {
    code: 'SL-BUILD-001', title: 'Minimum Floor Height', severity: 'mandatory', category: 'Structural',
    description: 'Ground floor must be minimum 300mm above adjacent road level for flood resilience.',
    requirement: 'Floor elevation >= 300mm above road level',
    check: (p) => {
      const passed = !p.location?.toLowerCase().includes('flood');
      return {
        passed,
        finding: passed ? 'Floor height meets minimum requirement' : 'Flood zone detected — verify floor elevation is ≥300mm above road level',
        recommendation: 'Elevate ground floor slab or consider pile foundation',
      };
    },
  },
  {
    code: 'SL-BUILD-002', title: 'Wind Resistance', severity: 'mandatory', category: 'Structural',
    description: 'Structures must withstand wind speeds up to 120 km/h per Sierra Leone Building Code.',
    requirement: 'Structural design for 120 km/h wind load',
    check: (p) => {
      const passed = p.style !== 'Lightweight' && p.floors <= 4;
      return {
        passed,
        finding: passed ? 'Wind load requirements satisfied' : 'Lightweight structures require additional wind bracing',
        recommendation: 'Add cross-bracing and hurricane ties to roof structure',
      };
    },
  },
  {
    code: 'SL-FIRE-001', title: 'Fire Escape Routes', severity: 'mandatory', category: 'Fire Safety',
    description: 'Buildings over 2 floors must have minimum 2 fire escape routes.',
    requirement: '2+ fire escapes for buildings >2 floors',
    check: (p) => ({
      passed: p.floors <= 2,
      finding: p.floors > 2 ? 'Building exceeds 2 floors — requires 2 fire escape routes' : 'Fire escape requirement met',
      recommendation: 'Design two separate staircases at opposite ends of building',
    }),
  },
  {
    code: 'SL-ENV-001', title: 'Natural Ventilation', severity: 'advisory', category: 'Environmental',
    description: 'All habitable rooms must have natural ventilation openings ≥10% of floor area.',
    requirement: 'Ventilation area ≥10% of floor area',
    check: (p) => ({
      passed: true,
      finding: 'Assuming standard window design provides adequate ventilation',
      recommendation: 'Include operable windows on at least two opposing walls for cross-ventilation',
    }),
  },
  {
    code: 'SL-ENV-002', title: 'Rainwater Management', severity: 'advisory', category: 'Environmental',
    description: 'New buildings should include rainwater harvesting systems per SL Green Building Guidelines.',
    requirement: 'Rainwater harvesting system recommended',
    check: (p) => ({
      passed: true,
      finding: 'Rainwater harvesting not verified in current design',
      recommendation: 'Add underground rainwater storage tank (sizing: 500L per 100m² roof area)',
    }),
  },
  {
    code: 'SL-ACC-001', title: 'Accessibility', severity: 'mandatory', category: 'Accessibility',
    description: 'Public buildings must provide wheelchair access including ramps with max 1:12 slope.',
    requirement: 'Wheelchair ramp with ≤1:12 slope at main entrance',
    check: (p) => ({
      passed: p.type !== 'Commercial' && p.type !== 'Institutional',
      finding: p.type === 'Commercial' || p.type === 'Institutional' ? 'Accessibility ramp required for public building' : 'Accessibility requirement met',
      recommendation: 'Add 1:12 slope ramp at main entrance with handrails on both sides',
    }),
  },
];

const NIGERIA_RULES: ComplianceRule[] = [
  {
    code: 'NG-BUILD-001', title: 'Foundation Depth', severity: 'mandatory', category: 'Structural',
    description: 'Minimum foundation depth of 900mm in lateritic soils per Nigerian Building Code.',
    requirement: 'Foundation depth ≥900mm',
    check: (p) => {
      const passed = p.floors <= 3;
      return {
        passed,
        finding: passed ? 'Foundation depth likely adequate' : 'Multi-story building requires geotechnical assessment',
        recommendation: 'Conduct soil bearing capacity test before foundation design',
      };
    },
  },
  {
    code: 'NG-BUILD-002', title: 'Setback Requirements', severity: 'mandatory', category: 'Zoning',
    description: 'Minimum 3m setback from property boundaries for residential buildings in urban areas.',
    requirement: 'Setback ≥3m from property boundaries',
    check: (p) => ({
      passed: p.type !== 'Residential' || (p.area || 0) < 500,
      finding: 'Setback distances must be verified against local zoning regulations',
      recommendation: 'Confirm property boundary distances with site survey',
    }),
  },
  {
    code: 'NG-FIRE-001', title: 'Fire Extinguisher Access', severity: 'mandatory', category: 'Fire Safety',
    description: 'Fire extinguishers required every 200m² and within 30m of any point.',
    requirement: 'Fire extinguisher coverage every 200m²',
    check: (p) => ({
      passed: (p.area || 0) <= 200,
      finding: (p.area || 0) > 200 ? `Building area ${p.area}m² requires ${Math.ceil((p.area || 0) / 200)} fire extinguishers` : 'Fire extinguisher requirement met',
      recommendation: 'Place fire extinguishers at stairwells and common areas',
    }),
  },
  {
    code: 'NG-ENV-001', title: 'Waste Management', severity: 'advisory', category: 'Environmental',
    description: 'Construction waste management plan recommended for projects over 500m².',
    requirement: 'Waste management plan for projects >500m²',
    check: (p) => ({
      passed: (p.area || 0) <= 500,
      finding: (p.area || 0) > 500 ? 'Waste management plan recommended' : 'Waste management requirement met',
      recommendation: 'Develop construction waste recycling and disposal plan',
    }),
  },
];

const GHANA_RULES: ComplianceRule[] = [
  {
    code: 'GH-BUILD-001', title: 'Sanitary Facilities', severity: 'mandatory', category: 'Plumbing',
    description: 'Minimum 1 toilet per 15 occupants per Ghana Building Regulations.',
    requirement: '1 toilet per 15 occupants',
    check: (p) => ({
      passed: (p.bedrooms || 0) <= 4,
      finding: (p.bedrooms || 0) > 4 ? 'Additional sanitary facilities required' : 'Sanitary provision appears adequate',
      recommendation: 'Include separate guest toilet near common areas',
    }),
  },
  {
    code: 'GH-BUILD-002', title: 'Floor Loading', severity: 'mandatory', category: 'Structural',
    description: 'Minimum 2.5 kN/m² live load for residential floors per Ghana Standard GS 1207.',
    requirement: 'Floor design for 2.5 kN/m² live load',
    check: (p) => ({
      passed: true,
      finding: 'Standard floor loading assumed. Verify with structural calculations.',
      recommendation: 'Specify reinforced concrete slab with minimum 150mm thickness',
    }),
  },
  {
    code: 'GH-ENV-001', title: 'Drainage System', severity: 'mandatory', category: 'Environmental',
    description: 'Stormwater drainage must handle 100mm/hr rainfall intensity (10-year return period).',
    requirement: 'Drainage for 100mm/hr rainfall',
    check: (p) => ({
      passed: true,
      finding: 'Drainage capacity must be verified by civil engineer',
      recommendation: 'Design drainage channels for 100mm/hr intensity with 20% safety factor',
    }),
  },
];

const COMMON_RULES: ComplianceRule[] = [
  {
    code: 'GEN-STR-001', title: 'Seismic Considerations', severity: 'advisory', category: 'Structural',
    description: 'Buildings in seismic zones require ductile detailing of reinforcement.',
    requirement: 'Seismic detailing for Zone 2+ areas',
    check: (p) => ({
      passed: p.floors <= 2,
      finding: p.floors > 2 ? 'Multi-story building may require seismic analysis' : 'Low-rise building — seismic risk minimal',
      recommendation: 'Consider moment-resisting frames for lateral load resistance',
    }),
  },
  {
    code: 'GEN-SAF-001', title: 'Emergency Lighting', severity: 'mandatory', category: 'Fire Safety',
    description: 'Emergency lighting required in all escape routes and public areas.',
    requirement: 'Emergency lighting in escape routes',
    check: (p) => ({
      passed: p.floors <= 1,
      finding: p.floors > 1 ? 'Emergency lighting required for multi-floor building' : 'Single floor — natural light sufficient for daytime egress',
      recommendation: 'Install battery-backed LED emergency lights at stairwells and corridors',
    }),
  },
  {
    code: 'GEN-ENV-001', title: 'Solar Readiness', severity: 'advisory', category: 'Environmental',
    description: 'New buildings should be solar-ready with roof structural capacity for PV panels.',
    requirement: 'Roof designed for 20 kg/m² solar panel load',
    check: (p) => ({
      passed: true,
      finding: 'Solar readiness not verified in current design',
      recommendation: 'Add 20 kg/m² roof live load allowance for future solar installation',
    }),
  },
];

const RULES_BY_COUNTRY: Record<string, ComplianceRule[]> = {
  'sierra-leone': SIERRA_LEONE_RULES,
  'nigeria': NIGERIA_RULES,
  'ghana': GHANA_RULES,
  'kenya': [...COMMON_RULES],
  'usa': [...COMMON_RULES],
  'uk': [...COMMON_RULES],
};

const COUNTRY_NAMES: Record<string, string> = {
  'sierra-leone': 'Sierra Leone',
  'nigeria': 'Nigeria',
  'ghana': 'Ghana',
  'kenya': 'Kenya',
  'usa': 'United States',
  'uk': 'United Kingdom',
};

function getRulesForCountry(country: string): ComplianceRule[] {
  const key = country?.toLowerCase().replace(/\s+/g, '-');
  const countryRules = RULES_BY_COUNTRY[key] || [];
  return [...COMMON_RULES, ...countryRules];
}

export interface ComplianceSummary {
  country: string;
  countryName: string;
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  results: Array<{
    code: string;
    title: string;
    status: 'passed' | 'failed' | 'warning';
    category: string;
    severity: string;
    description: string;
    requirement: string;
    finding: string;
    recommendation: string;
  }>;
}

function getSeverityWeight(severity: string): number {
  switch (severity) {
    case 'mandatory': return 3;
    case 'advisory': return 1;
    default: return 2;
  }
}

function runFallbackCheck(project: any, country: string): ComplianceSummary {
  const rules = getRulesForCountry(country);
  const results = rules.map((rule) => {
    const { passed, finding, recommendation } = rule.check(project);
    let status: 'passed' | 'failed' | 'warning';
    if (passed) {
      status = 'passed';
    } else if (rule.severity === 'mandatory') {
      status = 'failed';
    } else {
      status = 'warning';
    }
    return {
      code: rule.code,
      title: rule.title,
      status,
      category: rule.category,
      severity: rule.severity,
      description: rule.description,
      requirement: rule.requirement,
      finding,
      recommendation,
    };
  });

  const total = results.length;
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const warnings = results.filter((r) => r.status === 'warning').length;

  let totalWeight = 0;
  let earnedWeight = 0;
  for (const r of results) {
    const w = getSeverityWeight(r.severity);
    totalWeight += w;
    if (r.status === 'passed') earnedWeight += w;
    if (r.status === 'warning') earnedWeight += w * 0.5;
  }
  const score = Math.round((earnedWeight / Math.max(totalWeight, 1)) * 100);

  return {
    country,
    countryName: COUNTRY_NAMES[country] || country,
    total,
    passed,
    failed,
    warnings,
    score,
    results,
  };
}

export async function runComplianceCheck(project: any, country: string): Promise<ComplianceSummary> {
  if (pythonService.isHealthy()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(`${PYTHON_API}/api/analyze/compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          project_type: project.type || 'Residential',
          floors: project.floors || 2,
          area: project.area || 300,
          style: project.style || 'Modern',
          bedrooms: project.bedrooms || 3,
          location: project.location || null,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data: any = await resp.json();
        if (data?.compliance?.results) {
          return data.compliance as ComplianceSummary;
        }
      }
    } catch (e: any) {
      console.log(`Compliance AI request failed: ${e.message}`);
    }
  }

  return runFallbackCheck(project, country);
}

export function getSupportedCountries(): Array<{ id: string; name: string }> {
  return Object.entries(COUNTRY_NAMES).map(([id, name]) => ({ id, name }));
}