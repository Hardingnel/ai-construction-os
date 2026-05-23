export const APP_NAME = 'AI Construction OS';
export const APP_DESCRIPTION = 'AI-powered Architecture, Engineering & Construction Management System';

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/', shortcut: 'Ctrl+1' },
  { label: 'AI Generator', icon: 'Brain', path: '/generator', shortcut: 'Ctrl+2' },
  { label: 'Design Studio', icon: 'PenTool', path: '/design', shortcut: 'Ctrl+3' },
  { label: 'BIM Viewer', icon: 'Box', path: '/bim', shortcut: 'Ctrl+4' },
  { label: 'GIS Analysis', icon: 'Map', path: '/gis', shortcut: 'Ctrl+5' },
  { label: 'BOQ & Estimation', icon: 'Calculator', path: '/boq', shortcut: 'Ctrl+6' },
  { label: 'Projects', icon: 'FolderKanban', path: '/projects', shortcut: 'Ctrl+7' },
  { label: 'Marketplace', icon: 'Store', path: '/marketplace', shortcut: 'Ctrl+8' },
  { label: 'Team', icon: 'Users', path: '/team', shortcut: 'Ctrl+9' },
  { label: 'Settings', icon: 'Settings', path: '/settings', shortcut: 'Ctrl+0' },
];

export const BUILDING_STYLES = [
  'Modern', 'Contemporary', 'Minimalist', 'Industrial', 'Mediterranean',
  'African Contemporary', 'Colonial', 'Victorian', 'Tropical Modern',
  'Asian Fusion', 'Scandinavian', 'Rustic', 'Art Deco', 'Neoclassical',
  'Sustainable/Green',
];

export const PROJECT_TYPES = [
  'Residential', 'Commercial', 'Industrial', 'Mixed-Use', 'Institutional',
  'Infrastructure', 'Landscape', 'Interior Design', 'Renovation',
];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'SLL', 'NGN', 'KES', 'GHS', 'ZAR', 'XOF'];

export const AI_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

export const MEASUREMENT_UNITS = {
  metric: { length: 'm', area: 'm²', volume: 'm³' },
  imperial: { length: 'ft', area: 'ft²', volume: 'ft³' },
};
