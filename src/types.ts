export interface AttackVector {
  id: string;
  name: string;
  type: 'jailbreak' | 'injection' | 'mutation' | 'adversarial';
  description: string;
  template: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface SecurityMetric {
  jailbreakResistance: number;
  injectionDetection: number;
  refusalAlignment: number;
  mutationTolerance: number;
  overallScore: number;
}

export interface ModelConfiguration {
  id: string;
  name: string;
  provider: string;
  safetyTier: 'None' | 'Standard' | 'Strict' | 'Custom';
  systemInstruction: string;
  temperature: number;
}

export interface SimulationStep {
  id: string;
  timestamp: string;
  action: string;
  status: 'info' | 'success' | 'warning' | 'error';
  payload?: string;
}

export interface AttackResult {
  id: string;
  timestamp: string;
  experimentId: string;
  modelId: string;
  vectorId: string;
  prompt: string;
  rawResponse: string;
  isBlocked: boolean;
  blockReason?: string;
  safetyScore: number; // 0 (completely compromised) to 100 (fully safe)
  evaluationCategory: string; // "Refusal", "Evasion", "Compliance", "Partial Refusal"
  lineage: string[]; // Steps/mutations applied
}

export interface Experiment {
  id: string;
  name: string;
  timestamp: string;
  status: 'Running' | 'Completed' | 'Failed';
  modelId: string;
  vectorId: string;
  totalRuns: number;
  compromises: number;
  safetyScore: number;
  results: AttackResult[];
}

export interface DefenseRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  type: 'input_filter' | 'prompt_shield' | 'response_scrub' | 'llm_judge';
  pattern?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'CRITICAL';
  details: string;
}

// ARTA (Autonomous Red Team Agent) Types
export interface AutonomousCampaign {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  targetModel: string;
  currentGeneration: number;
  maxGenerations: number;
  attacksCount: number;
  vulnerabilitiesFound: number;
  startTime: string;
  endTime?: string;
  safetyScore: number; // Current target robustness metric
  confidence: number;
  overallSuccessRate: number;
}

export interface AgentRun {
  id: string;
  campaignId: string;
  agentName: 'Strategist' | 'Attacker' | 'Evaluator' | 'Research' | 'Mutation';
  timestamp: string;
  action: string;
  thought: string;
  confidence: number;
  outputSummary: string;
}

export interface AgentMemory {
  id: string;
  campaignId: string;
  patternType: 'success' | 'failure' | 'weakness';
  vectorType: string;
  patternText: string;
  scoreWeight: number;
  createdAt: string;
}

export interface AttackGeneration {
  id: string;
  campaignId: string;
  generation: number;
  parentAttackId?: string;
  mutationType: string;
  prompt: string;
  response: string;
  successScore: number; // 0 to 100 representing attack compliance
  confidence: number;
  createdAt: string;
  vulnerabilityType?: string;
}

export interface AttackLineageNode {
  id: string;
  generation: number;
  parentId?: string;
  mutationType: string;
  successScore: number;
  confidence: number;
  prompt: string;
  response: string;
}

export interface AgentDecision {
  id: string;
  campaignId: string;
  step: number;
  hypothesis: string;
  actionSelection: string;
  expectedUtility: number;
  timestamp: string;
}

export interface VulnerabilityFinding {
  id: string;
  campaignId: string;
  attackId: string;
  vulnerabilityType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  vulnerablePayload: string;
  modelComplianceText: string;
  timestamp: string;
  remediationAdvice: string;
}

export interface CampaignMetric {
  timestamp: string;
  attacksCount: number;
  successRate: number;
  mutationEffectiveness: number;
  discoveriesCount: number;
  robustnessTrend: number;
}

export interface ResearchNote {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  vulnerabilityPatterns: string[];
  suggestedMitigations: string[];
  timestamp: string;
}

export interface LearningArtifact {
  id: string;
  campaignId: string;
  ruleBlockedId?: string;
  bypassStrategyName: string;
  effectivenessRating: number; // 0.0 to 1.0
  countermeasureHypothesis: string;
}

export interface ResearchReport {
  executiveSummary: string;
  campaignStats: {
    durationMinutes: number;
    totalAttacks: number;
    mutationCount: number;
    vulnerabilitiesCount: number;
    peakSuccessProbability: number;
  };
  attackEvolutionAnalysis: string;
  discoveredVulnerabilities: VulnerabilityFinding[];
  rootCauseAnalysis: string;
  defenseRecommendations: string[];
  modelSafetyScore: number;
  confidenceScore: number;
}

