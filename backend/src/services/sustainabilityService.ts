import { prisma } from '../app';
import { pythonService } from './pythonServiceManager';

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

interface AssessmentInput {
  projectId: string;
  userId: string;
  area?: number;
  floors?: number;
  type?: string;
  location?: string;
  budget?: number;
  bedrooms?: number;
  style?: string;
}

interface SustainabilityResult {
  carbonFootprint: number;
  carbonRating: string;
  energyScore: number;
  energyRating: string;
  solarPotential: string;
  solarKwhYear: number;
  waterEfficiency: number;
  waterRating: string;
  passiveCooling: string;
  floodResilience: string;
  greenMaterialScore: number;
  overallScore: number;
  overallRating: string;
  recommendations: string[];
  breakdown: Record<string, any>;
}

const COUNTRY_CARBON_FACTORS: Record<string, number> = {
  'Sierra Leone': 0.42,
  'Nigeria': 0.48,
  'Ghana': 0.38,
  'Kenya': 0.35,
  'USA': 0.45,
  'UK': 0.28,
  'default': 0.40,
};

const SOLAR_INSOLATION: Record<string, number> = {
  'Sierra Leone': 5.2,
  'Nigeria': 5.5,
  'Ghana': 5.0,
  'Kenya': 5.8,
  'USA': 4.5,
  'UK': 2.8,
  'default': 4.5,
};

function getCountryFactor(location: string): number {
  if (!location) return COUNTRY_CARBON_FACTORS.default;
  const country = Object.keys(COUNTRY_CARBON_FACTORS).find(k => location.includes(k));
  return COUNTRY_CARBON_FACTORS[country || 'default'] || COUNTRY_CARBON_FACTORS.default;
}

function getSolarInsolation(location: string): number {
  if (!location) return SOLAR_INSOLATION.default;
  const country = Object.keys(SOLAR_INSOLATION).find(k => location.includes(k));
  return SOLAR_INSOLATION[country || 'default'] || SOLAR_INSOLATION.default;
}

function getCarbonRating(kgCO2: number, area: number): string {
  const perM2 = kgCO2 / Math.max(area, 1);
  if (perM2 < 300) return 'A+';
  if (perM2 < 400) return 'A';
  if (perM2 < 550) return 'B';
  if (perM2 < 700) return 'C';
  if (perM2 < 900) return 'D';
  return 'E';
}

function getEnergyRating(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'E';
}

function getWaterRating(efficiency: number): string {
  if (efficiency >= 80) return 'A';
  if (efficiency >= 60) return 'B';
  if (efficiency >= 40) return 'C';
  if (efficiency >= 20) return 'D';
  return 'E';
}

function getOverallRating(score: number): string {
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}

function getSolarPotential(kwhYear: number): string {
  if (kwhYear > 15000) return 'Excellent';
  if (kwhYear > 10000) return 'Very Good';
  if (kwhYear > 6000) return 'Good';
  if (kwhYear > 3000) return 'Fair';
  return 'Poor';
}

function getPassiveCooling(style: string, floors: number): string {
  const favorableStyles = ['Tropical Modern', 'Sustainable/Green', 'African Contemporary', 'Modern'];
  if (floors <= 2 && favorableStyles.some(s => style?.includes(s))) return 'Excellent';
  if (floors <= 3) return 'Good';
  if (floors <= 5) return 'Fair';
  return 'Poor';
}

function getFloodResilience(floodRisk: string | null | undefined): string {
  if (!floodRisk) return 'Moderate';
  switch (floodRisk) {
    case 'low': return 'High';
    case 'medium': return 'Moderate';
    case 'high': return 'Low';
    default: return 'Moderate';
  }
}

function getGreenMaterialScore(style: string): number {
  const sustainable = ['Sustainable/Green', 'Tropical Modern', 'African Contemporary'];
  if (sustainable.some(s => style?.includes(s))) return 78;
  if (style?.includes('Modern')) return 55;
  return 45;
}

function generateRecommendations(result: SustainabilityResult, input: AssessmentInput): string[] {
  const recs: string[] = [];

  if (result.carbonRating < 'B') {
    recs.push('Use low-carbon concrete alternatives (fly ash or slag cement) to reduce embodied carbon.');
    recs.push('Source materials locally to reduce transportation emissions.');
  }

  if (result.energyScore < 65) {
    recs.push('Improve building envelope insulation — add double-glazed windows and roof insulation.');
    recs.push('Install energy-efficient HVAC system with smart zone controls.');
    recs.push('Add daylight harvesting sensors and LED lighting throughout.');
  }

  if (result.solarKwhYear > 6000) {
    recs.push(`Install a ${Math.round(result.solarKwhYear / 1500)}kW rooftop solar PV system to offset grid electricity.`);
  }

  if (result.waterEfficiency < 60) {
    recs.push('Install rainwater harvesting system — collect roof runoff for irrigation and non-potable uses.');
    recs.push('Specify low-flow fixtures (taps, showerheads, dual-flush toilets) to reduce water consumption.');
    recs.push('Design greywater recycling system for landscape irrigation.');
  }

  if (result.floodResilience === 'Low' || result.floodResilience === 'Moderate') {
    recs.push('Elevate finished floor level above predicted flood levels.');
    recs.push('Install perimeter drainage and French drains around foundation.');
    recs.push('Use flood-resistant materials for ground floor construction.');
  }

  if (result.passiveCooling !== 'Excellent') {
    recs.push('Optimize building orientation for cross-ventilation and reduce solar heat gain.');
    recs.push('Add shading devices (overhangs, louvers, vegetation) on east and west facades.');
  }

  if (result.greenMaterialScore < 60) {
    recs.push('Specify recycled-content materials (steel, aggregate, tiles) where possible.');
    recs.push('Use rapidly renewable materials like bamboo flooring and timber from certified sources.');
  }

  return recs.slice(0, 8);
}

async function assessFallback(input: AssessmentInput): Promise<SustainabilityResult> {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error('Project not found');

  const area = input.area || project.area || 300;
  const floors = input.floors || project.floors || 2;
  const type = input.type || project.type || 'Residential';
  const location = input.location || project.location || '';
  const style = input.style || project.style || 'Modern';
  const bedrooms = input.bedrooms || project.bedrooms || 3;

  const carbonFactor = getCountryFactor(location);
  const embodiedCarbon = area * 500 * carbonFactor;
  const operationalCarbon = area * 120 * carbonFactor * floors;
  const carbonFootprint = Math.round(embodiedCarbon + operationalCarbon);
  const carbonRating = getCarbonRating(carbonFootprint, area);

  const solarInsolation = getSolarInsolation(location);
  const roofArea = area * 0.7;
  const solarKwhYear = Math.round(roofArea * solarInsolation * 365 * 0.18);
  const solarPotential = getSolarPotential(solarKwhYear);

  const passiveScore = getPassiveCooling(style, floors) === 'Excellent' ? 85 : getPassiveCooling(style, floors) === 'Good' ? 65 : 40;
  const insulationScore = style?.includes('Sustainable') ? 80 : style?.includes('Modern') ? 60 : 45;
  const hvacScore = type === 'Commercial' ? 55 : 70;
  const lightingScore = 65;
  const energyScore = Math.round((passiveScore * 0.3 + insulationScore * 0.25 + hvacScore * 0.25 + lightingScore * 0.2));
  const energyRating = getEnergyRating(energyScore);

  const waterFixturesScore = 55;
  const rainwaterScore = location ? 50 : 30;
  const recyclingScore = style?.includes('Sustainable') ? 60 : 25;
  const waterEfficiency = Math.round((waterFixturesScore * 0.4 + rainwaterScore * 0.35 + recyclingScore * 0.25));
  const waterRating = getWaterRating(waterEfficiency);

  const passiveCooling = getPassiveCooling(style, floors);

  const gisData = await prisma.gISData.findFirst({ where: { projectId: input.projectId } });
  const floodResilience = getFloodResilience(gisData?.floodRisk);

  const greenMaterialScore = Math.round(getGreenMaterialScore(style));

  const overallScore = Math.round(
    (carbonRating === 'A+' || carbonRating === 'A' ? 85 : carbonRating === 'B' ? 65 : 40) * 0.25 +
    energyScore * 0.25 +
    (solarKwhYear > 6000 ? 80 : solarKwhYear > 3000 ? 55 : 30) * 0.15 +
    waterEfficiency * 0.1 +
    (passiveCooling === 'Excellent' ? 85 : passiveCooling === 'Good' ? 65 : 40) * 0.1 +
    (floodResilience === 'High' ? 85 : floodResilience === 'Moderate' ? 55 : 25) * 0.1 +
    greenMaterialScore * 0.05
  );
  const overallRating = getOverallRating(overallScore);

  const result: SustainabilityResult = {
    carbonFootprint,
    carbonRating,
    energyScore,
    energyRating,
    solarPotential,
    solarKwhYear,
    waterEfficiency,
    waterRating,
    passiveCooling,
    floodResilience,
    greenMaterialScore,
    overallScore,
    overallRating,
    recommendations: [],
    breakdown: {
      embodiedCarbon: Math.round(embodiedCarbon),
      operationalCarbon: Math.round(operationalCarbon),
      carbonPerM2: Math.round(carbonFootprint / Math.max(area, 1)),
      solarInsolation,
      roofArea: Math.round(roofArea),
      passiveScore,
      insulationScore,
      hvacScore,
      lightingScore,
      waterFixturesScore,
      rainwaterScore,
      recyclingScore,
      floodRisk: gisData?.floodRisk || 'unknown',
    },
  };

  result.recommendations = generateRecommendations(result, input);
  return result;
}

export async function assessSustainability(input: AssessmentInput): Promise<SustainabilityResult> {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error('Project not found');

  const area = input.area || project.area || 300;
  const floors = input.floors || project.floors || 2;
  const type = input.type || project.type || 'Residential';
  const location = input.location || project.location || '';
  const style = input.style || project.style || 'Modern';
  const bedrooms = input.bedrooms || project.bedrooms || 3;

  const gisData = await prisma.gISData.findFirst({ where: { projectId: input.projectId } });
  const floodRisk = gisData?.floodRisk || null;

  let result: SustainabilityResult | null = null;
  let aiProvider = false;

  if (pythonService.isHealthy()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(`${PYTHON_API}/api/analyze/sustainability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area,
          floors,
          building_type: type,
          style,
          bedrooms,
          location: location || null,
          flood_risk: floodRisk,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data: any = await resp.json();
        if (data?.assessment) {
          result = data.assessment as SustainabilityResult;
          aiProvider = true;
          if (!result.recommendations) result.recommendations = [];
          if (!result.breakdown) result.breakdown = {};
        }
      }
    } catch (e: any) {
      console.log(`Sustainability AI request failed: ${e.message}`);
    }
  }

  if (!result) {
    result = await assessFallback(input);
  }

  await prisma.sustainabilityAssessment.create({
    data: {
      projectId: input.projectId,
      userId: input.userId,
      carbonFootprint: result.carbonFootprint,
      carbonRating: result.carbonRating,
      energyScore: result.energyScore,
      energyRating: result.energyRating,
      solarPotential: result.solarPotential,
      solarKwhYear: result.solarKwhYear,
      waterEfficiency: result.waterEfficiency,
      waterRating: result.waterRating,
      passiveCooling: result.passiveCooling,
      floodResilience: result.floodResilience,
      greenMaterialScore: result.greenMaterialScore,
      overallScore: result.overallScore,
      overallRating: result.overallRating,
      recommendations: JSON.stringify(result.recommendations),
      data: JSON.stringify(result.breakdown),
    },
  });

  return result;
}

export async function getAssessmentHistory(projectId: string) {
  return prisma.sustainabilityAssessment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function getLatestAssessment(projectId: string) {
  return prisma.sustainabilityAssessment.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}