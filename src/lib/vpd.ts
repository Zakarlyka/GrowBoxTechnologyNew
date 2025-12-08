// VPD Calculation Utilities
// Using Tetens formula with leaf temperature offset

const LEAF_TEMP_OFFSET = -2; // Leaf is typically 2°C cooler than air

export interface VPDResult {
  vpd: number | null;
  status: 'good' | 'too_humid' | 'too_dry' | 'offline';
  color: string;
  bgColor: string;
  borderColor: string;
  advice: string;
  targetHumidity?: number;
  isOffline: boolean;
}

// Calculate Saturated Vapor Pressure (kPa) using Tetens formula
export const calculateSVP = (tempC: number): number => {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
};

// Calculate VPD with leaf temperature offset
export const calculateVPD = (airTemp: number, rh: number): number => {
  const leafTemp = airTemp + LEAF_TEMP_OFFSET;
  const svpLeaf = calculateSVP(leafTemp);
  const svpAir = calculateSVP(airTemp);
  const avp = (rh / 100) * svpAir;
  return svpLeaf - avp;
};

// Calculate required humidity to reach target VPD
export const calculateTargetHumidity = (airTemp: number, targetVpd: number): number => {
  const leafTemp = airTemp + LEAF_TEMP_OFFSET;
  const svpLeaf = calculateSVP(leafTemp);
  const svpAir = calculateSVP(airTemp);
  // VPD = SVP_leaf - AVP
  // targetVpd = SVP_leaf - (rh/100 * SVP_air)
  // rh = (SVP_leaf - targetVpd) / SVP_air * 100
  const targetRh = ((svpLeaf - targetVpd) / svpAir) * 100;
  return Math.min(100, Math.max(0, targetRh));
};

// Get complete VPD analysis with status, colors, and advice
export const getVPDAnalysis = (airTemp: number | null, rh: number | null): VPDResult => {
  // Check for offline/invalid data: null values or both are 0
  const isOffline = airTemp === null || rh === null || (airTemp === 0 && rh === 0);
  
  if (isOffline) {
    return {
      vpd: null,
      status: 'offline',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-muted',
      advice: '',
      isOffline: true
    };
  }
  
  const vpd = calculateVPD(airTemp, rh);
  
  // Determine status and colors
  if (vpd < 0.8) {
    return {
      vpd,
      status: 'too_humid',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500',
      advice: '⚠️ Ризик плісняви! Підвищіть температуру або вентиляцію.',
      isOffline: false
    };
  } else if (vpd > 1.2) {
    const targetHumidity = calculateTargetHumidity(airTemp, 1.0);
    return {
      vpd,
      status: 'too_dry',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500',
      advice: `🌵 Занадто сухо! Підвищіть вологість до ~${Math.round(targetHumidity)}%`,
      targetHumidity: Math.round(targetHumidity),
      isOffline: false
    };
  } else {
    return {
      vpd,
      status: 'good',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500',
      advice: '🌿 Ідеальні умови для росту. Так тримати!',
      isOffline: false
    };
  }
};
