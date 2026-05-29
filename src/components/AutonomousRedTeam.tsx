import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Flame, RefreshCw, StopCircle, Terminal, Eye, Cpu, HelpCircle, 
  Layers, Database, FileText, ChevronRight, TrendingUp, Download, ShieldCheck, 
  AlertTriangle, ArrowRight, Zap, Target, Sliders, ChevronDown, Award, Sparkles, Check, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar
} from 'recharts';
import { 
  AutonomousCampaign, AgentRun, AgentMemory, AttackGeneration, 
  VulnerabilityFinding, CampaignMetric, ResearchNote, LearningArtifact, ResearchReport 
} from '../types';

// Let's seed initial bench records for our Autonomous Benchmark Mode
const MODEL_BENCHMARKS = [
  { name: 'Gemini 1.5 Pro', robustness: 92, speed: 85, alignment: 94, formatting: 90, average: 90 },
  { name: 'Gemini 3.5 Flash', robustness: 88, speed: 96, alignment: 91, formatting: 95, average: 92 },
  { name: 'GPT-4o (Standard)', robustness: 86, speed: 88, alignment: 87, formatting: 92, average: 88 },
  { name: 'Claude 3.5 Sonnet', robustness: 94, speed: 78, alignment: 95, formatting: 88, average: 88 },
  { name: 'Llama 3 (Ollama)', robustness: 74, speed: 92, alignment: 70, formatting: 82, average: 79 },
  { name: 'Mistral (HuggingFace)', robustness: 68, speed: 85, alignment: 65, formatting: 78, average: 74 }
];

export function AutonomousRedTeam() {
  const [campaigns, setCampaigns] = useState<AutonomousCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  
  // Detailed Campaign Metrics state
  const [details, setDetails] = useState<{
    campaign: AutonomousCampaign | null;
    runs: AgentRun[];
    memories: AgentMemory[];
    attacks: AttackGeneration[];
    findings: VulnerabilityFinding[];
    notes: ResearchNote[];
    artifacts: LearningArtifact[];
    metrics: CampaignMetric[];
    report: ResearchReport | null;
  }>({
    campaign: null,
    runs: [],
    memories: [],
    attacks: [],
    findings: [],
    notes: [],
    artifacts: [],
    metrics: [],
    report: null
  });

  // UI state variables
  const [isStarting, setIsStarting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [maxGenerations, setMaxGenerations] = useState(5);
  const [selectedAttackNode, setSelectedAttackNode] = useState<AttackGeneration | null>(null);
  
  // Lineage pan/zoom simulation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lineageFilter, setLineageFilter] = useState<'all' | 'compromised' | 'blocked'>('all');

  // Replay Controller Timeline settings
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);
  const replayTimerRef = useRef<NodeJS.Timeout | any>(null);

  // Benchmarking model selection
  const [selectedBenchModel, setSelectedBenchModel] = useState('Gemini 1.5 Pro');

  // Load active campaigns list on startup
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns/autonomous');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
        if (data.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to query campaigns list:', err);
    }
  };

  // Queries all data components for active campaign
  const fetchCampaignDetails = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/campaigns/autonomous/${id}/details`);
      if (res.ok) {
        const data = await res.json();
        setDetails({
          campaign: data.campaign,
          runs: data.runs || [],
          memories: data.memories || [],
          attacks: data.attacks || [],
          findings: data.findings || [],
          notes: data.notes || [],
          artifacts: data.artifacts || [],
          metrics: data.metrics || [],
          report: data.report
        });

        // Set the selected attack node automatically if not set
        if (data.attacks && data.attacks.length > 0) {
          setSelectedAttackNode(data.attacks[data.attacks.length - 1]);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve campaign details:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignDetails(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  // Set up periodic tracking timer to poll active campaign status
  useEffect(() => {
    let timer: NodeJS.Timeout | any = null;
    const isAnyCampaignRunning = campaigns.some(c => c.status === 'running') || (details.campaign && details.campaign.status === 'running');
    
    if (isAnyCampaignRunning) {
      timer = setInterval(() => {
        fetchCampaigns();
        if (selectedCampaignId) {
          fetchCampaignDetails(selectedCampaignId);
        }
      }, 1500); // Fast responsive updates during active run
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [campaigns, selectedCampaignId, details.campaign]);

  // Action: Launch campaign
  const handleStartCampaign = async () => {
    setIsStarting(true);
    try {
      const res = await fetch('/api/campaigns/autonomous/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetModel: selectedModel,
          maxGenerations,
          name: `ARTA Evaluation Session: ${selectedModel.toUpperCase()}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCampaignId(data.id);
        await fetchCampaigns();
        await fetchCampaignDetails(data.id);
      }
    } catch (err) {
      console.error('Failed to trigger start command:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Action: Stop campaign
  const handleStopCampaign = async (campaignId: string) => {
    try {
      const res = await fetch('/api/campaigns/autonomous/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      if (res.ok) {
        await fetchCampaigns();
        await fetchCampaignDetails(campaignId);
      }
    } catch (err) {
      console.error('Failed to send stop signal:', err);
    }
  };

  // Timeline / Replay System logic
  const toggleReplay = () => {
    if (isReplaying) {
      setIsReplaying(false);
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    } else {
      setIsReplaying(true);
      const limit = details.attacks.length;
      if (limit === 0) return;

      let currentIndex = replayIndex >= limit - 1 ? 0 : replayIndex + 1;
      setReplayIndex(currentIndex);
      setSelectedAttackNode(details.attacks[currentIndex]);

      replayTimerRef.current = setInterval(() => {
        currentIndex++;
        if (currentIndex < limit) {
          setReplayIndex(currentIndex);
          setSelectedAttackNode(details.attacks[currentIndex]);
        } else {
          setIsReplaying(false);
          clearInterval(replayTimerRef.current);
        }
      }, 2500); // 2.5 seconds stepping through attacks
    }
  };

  const handleStepForward = () => {
    const limit = details.attacks.length;
    if (limit === 0) return;
    const nextIdx = Math.min(limit - 1, replayIndex + 1);
    setReplayIndex(nextIdx);
    setSelectedAttackNode(details.attacks[nextIdx]);
  };

  const handleStepBackward = () => {
    const limit = details.attacks.length;
    if (limit === 0) return;
    const prevIdx = Math.max(0, replayIndex - 1);
    setReplayIndex(prevIdx);
    setSelectedAttackNode(details.attacks[prevIdx]);
  };

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  // Export report buttons
  const handleDownloadReport = (format: 'json' | 'csv') => {
    if (!details.report) return;
    
    let mimeType = 'application/json';
    let content = '';
    let fileName = `ARTA_Research_Report_${selectedCampaignId}`;

    if (format === 'json') {
      content = JSON.stringify(details.report, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      // CSV Export
      const headers = ['Vulnerability Type', 'Severity', 'Vulnerable Payload', 'Compliance Output', 'Date'];
      const rows = details.findings.map(f => [
        `"${f.vulnerabilityType.replace(/"/g, '""')}"`,
        f.severity,
        `"${f.vulnerablePayload.replace(/"/g, '""').substr(0, 100)}..."`,
        `"${f.modelComplianceText.replace(/"/g, '""').substr(0, 100)}..."`,
        f.timestamp
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper arrays & selections
  const latestRunAgent = details.runs.slice(-1)[0];
  const benchmarkModelSelectedData = MODEL_BENCHMARKS.find(b => b.name === selectedBenchModel) || MODEL_BENCHMARKS[0];

  const radarData = [
    { subject: 'Robustness', score: benchmarkModelSelectedData.robustness, fullMark: 100 },
    { subject: 'APM Evasion', score: benchmarkModelSelectedData.speed, fullMark: 100 },
    { subject: 'Alignment Score', score: benchmarkModelSelectedData.alignment, fullMark: 100 },
    { subject: 'Constraint Check', score: benchmarkModelSelectedData.formatting, fullMark: 100 },
    { subject: 'Refusal Quality', score: benchmarkModelSelectedData.average, fullMark: 100 },
  ];

  const filteredLineage = details.attacks.filter(node => {
    if (lineageFilter === 'compromised') return node.successScore >= 50;
    if (lineageFilter === 'blocked') return node.successScore < 50;
    return true;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 select-none" id="arta-console">
      {/* Target config & select side controls (3 Columns) */}
      <section className="xl:col-span-3 flex flex-col space-y-5" id="arta-sidebar">
        
        {/* Launch Control Panel */}
        <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-4 flex flex-col space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-zinc-850">
            <Cpu className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="font-semibold text-xs text-white uppercase tracking-wider font-sans">ARTA Execution Node</span>
          </div>

          {/* Model Config Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Target Audit Model</label>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={details.campaign?.status === 'running'}
              className="w-full bg-zinc-950 border border-zinc-850 text-xs rounded px-2.5 py-1.5 text-zinc-300 outline-none outline-transparent focus:border-red-500/50 cursor-pointer disabled:opacity-60 font-mono transition-colors"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep reasoning)</option>
              <option value="openai-gpt-4o">OpenAI GPT-4o Standard Node</option>
              <option value="anthropic-claude">Claude 3.5 Sonnet Sandbox</option>
              <option value="llama-3-local">Llama-3 Host Node (Ollama)</option>
            </select>
          </div>

          {/* Generations Limit */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">Mutation Generation Limit</label>
            <div className="flex items-center space-x-2">
              <input 
                type="range" 
                min={2} 
                max={15} 
                value={maxGenerations}
                onChange={(e) => setMaxGenerations(parseInt(e.target.value, 10))}
                disabled={details.campaign?.status === 'running'}
                className="flex-1 accent-red-600 h-1 rounded bg-zinc-900 cursor-pointer disabled:opacity-60"
              />
              <span className="font-mono text-xs text-red-400 font-bold bg-red-950/20 border border-red-900/45 px-2 py-0.5 rounded">
                G-{maxGenerations}
              </span>
            </div>
          </div>

          <div className="relative pt-2">
            {details.campaign && details.campaign.status === 'running' ? (
              <button
                onClick={() => handleStopCampaign(selectedCampaignId)}
                className="w-full bg-red-650 hover:bg-red-550 border border-red-700 hover:border-red-550 text-white font-mono p-2.5 rounded text-xs shrink-0 font-bold tracking-tight uppercase flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
              >
                <StopCircle className="h-4 w-4 animate-spin-slow text-zinc-100" />
                <span>Terminate Campaign</span>
              </button>
            ) : (
              <button
                onClick={handleStartCampaign}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-red-900 to-red-600 hover:from-red-600 hover:to-red-500 text-white border border-red-900 hover:border-red-500 font-mono p-2.5 rounded text-xs font-bold tracking-wider uppercase flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-md shadow-red-950/20 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{isStarting ? 'PROVISIONING...' : 'Start Audit Engine'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Campaign select / index table */}
        <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-4 flex flex-col space-y-3 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block">Audit History Logs</span>
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.3 rounded font-mono">
              {campaigns.length} total
            </span>
          </div>

          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {campaigns.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCampaignId(c.id)}
                className={`w-full text-left p-2 rounded text-xs flex justify-between items-center transition-all border cursor-pointer ${
                  selectedCampaignId === c.id
                    ? 'bg-red-950/15 border-red-800/60 text-red-400'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-350'
                }`}
              >
                <div className="truncate space-y-0.5 flex-1 pr-2">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-[10px] font-mono text-zinc-600">{c.id} • {c.targetModel}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 space-y-1 font-mono text-[10px]">
                  <span className={`px-1 rounded-sm text-[8px] uppercase tracking-tighter ${
                    c.status === 'running' ? 'bg-red-900 text-red-200 border border-red-700 animate-pulse' :
                    c.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                    'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}>
                    {c.status}
                  </span>
                  <span className="font-semibold text-zinc-500">Robust: {c.safetyScore}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model Benchmarking Comparison Mode */}
        <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-4 flex flex-col space-y-3 shadow-xl">
          <div className="pb-1.5 border-b border-zinc-850 flex justify-between items-center">
            <span className="font-mono text-[10px] text-zinc-400 uppercase block tracking-wider">Benchmark Leaderboard</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 uppercase block">Focus Node Comparator</label>
            <select
              value={selectedBenchModel}
              onChange={(e) => setSelectedBenchModel(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-350 border border-zinc-850 font-mono text-[10px] rounded p-1"
            >
              {MODEL_BENCHMARKS.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Model Robustness stats bar compares */}
          <div className="space-y-1.5 pt-1.5 text-[10px] font-mono">
            {MODEL_BENCHMARKS.slice(0, 4).map(bm => (
              <div key={bm.name} className="flex justify-between items-center">
                <span className="text-zinc-450 text-[10.5px]">{bm.name}</span>
                <div className="flex items-center space-x-2 w-32 justify-end">
                  <div className="flex-1 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                    <div 
                      className={`h-full rounded-full ${
                        bm.robustness >= 90 ? 'bg-emerald-500' :
                        bm.robustness >= 80 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${bm.robustness}%` }}
                    />
                  </div>
                  <span className="font-bold text-zinc-300 w-8 text-right">{bm.robustness}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recharts comparison Radar */}
          <div className="h-32 w-full mt-1.5">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 7.5 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 6.5 }} />
                <Radar name={benchmarkModelSelectedData.name} dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Main interactive terminal dashboard panels (9 columns) */}
      <section className="xl:col-span-9 flex flex-col space-y-6" id="arta-main-container">
        
        {/* TOP STATUS AND STATS BLOCK */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Model Target</span>
            <p className="text-sm font-bold text-white mt-1.5 truncate uppercase">{details.campaign?.targetModel || selectedModel}</p>
          </div>

          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Generation Range</span>
            <p className="text-xl font-bold font-mono text-red-500 mt-1">
              G-{details.campaign?.currentGeneration || 1}<span className="text-xs text-zinc-600">/{details.campaign?.maxGenerations || maxGenerations}</span>
            </p>
          </div>

          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Attacks Generated</span>
            <p className="text-xl font-bold font-mono text-white mt-1">
              {details.campaign?.attacksCount || 0} <span className="text-[10px] text-zinc-500">runs</span>
            </p>
          </div>

          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Vulnerabilities Detected</span>
            <p className="text-xl font-bold font-mono text-red-500 mt-1 flex items-center space-x-1.5">
              <span>{details.campaign?.vulnerabilitiesFound || 0}</span>
              {details.campaign && details.campaign.vulnerabilitiesFound > 0 && (
                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
              )}
            </p>
          </div>

          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Target Robustness score</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xl font-bold font-mono ${
                (details.campaign?.safetyScore || 100) >= 80 ? 'text-emerald-400' :
                (details.campaign?.safetyScore || 100) >= 50 ? 'text-amber-400' : 'text-red-500'
              }`}>
                {details.campaign?.safetyScore || 100}/100
              </span>
            </div>
          </div>

        </div>

        {/* MIDDLE SECTION: Live Agent feed & Command Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column 1: Live Real-Time Agent Thought Process & Feed */}
          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-5 flex flex-col h-[340px]">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-850">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold text-xs text-white uppercase tracking-wider font-sans">Multi-Agent Cognitive Feed</span>
              </div>
              {latestRunAgent && (
                <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/40 font-mono px-2 py-0.5 rounded animate-pulse">
                  ACTIVE: {latestRunAgent.agentName.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1 font-mono text-[11px] leading-relaxed">
              {details.runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-zinc-500">
                  <Sparkles className="h-6 w-6 text-zinc-700 animate-spin-slow mb-2" />
                  <p className="text-zinc-500">Cognitive feed inactive.</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Boot campaign loop to monitor multi-agent actions.</p>
                </div>
              ) : (
                details.runs.slice().reverse().map((run) => (
                  <div key={run.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg space-y-1 px-4 border-l-2 border-l-indigo-600 text-zinc-350">
                    <div className="flex justify-between items-center text-[10px] pb-1 border-b border-zinc-900 bg-black/10">
                      <span className={`font-bold uppercase tracking-tight ${
                        run.agentName === 'Strategist' ? 'text-[#818cf8]' :
                        run.agentName === 'Attacker' ? 'text-amber-400' :
                        run.agentName === 'Evaluator' ? 'text-[#ec4899]' :
                        run.agentName === 'Research' ? 'text-[#38bdf8]' : 'text-emerald-400'
                      }`}>
                        ⚙️ {run.agentName} agent
                      </span>
                      <span className="text-zinc-600 font-mono">{run.timestamp.split('T')[1].substr(0, 8)}</span>
                    </div>
                    <p className="font-semibold text-white/90 text-xs mt-1.5">{run.action}</p>
                    <p className="text-zinc-400 text-[10.5px] italic font-sans py-0.5">"{run.thought}"</p>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-900/60 mt-1">
                      <span>CONFIDENCE: {run.confidence}%</span>
                      <span className="text-zinc-400 shrink-0 truncate max-w-[140px] block">{run.outputSummary}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Live Attack Hack-Terminal */}
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-zinc-900 rounded-lg p-5 flex flex-col h-[340px]">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-850">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="font-semibold text-xs text-white uppercase tracking-wider font-sans">Sandbox Attack Terminal</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-400/50"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400/50"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-pulse"></div>
              </div>
            </div>

            <div className="flex-1 bg-black/60 border border-zinc-905 overflow-y-auto mt-4 rounded p-4 font-mono text-[10.5px] text-zinc-350 leading-relaxed space-y-2">
              {details.attacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-zinc-700">
                  <Terminal className="h-5 w-5 mb-1.5" />
                  <span>Awaiting ingress dispatch parameters...</span>
                </div>
              ) : (
                details.attacks.slice().map((atk, index) => (
                  <div key={atk.id} className="pb-2.5 border-b border-zinc-950 last:border-0">
                    <div className="flex items-center space-x-2 text-zinc-550 border-b border-zinc-900/40 pb-1 mb-1 bg-[#0b0c10]/20 flex-wrap">
                      <span className="text-[#888]">G-{atk.generation}</span>
                      <span className="text-red-500 font-bold shrink-0">[ATTACK_GEN]</span>
                      <span className="text-zinc-500 overflow-hidden text-ellipsis truncate max-w-[120px]">{atk.id}</span>
                      <span className="text-zinc-600 font-mono font-medium ml-auto text-[9px]">{atk.createdAt.split('T')[1].substr(0, 8)}</span>
                    </div>
                    
                    <div className="space-y-1 px-2.5 py-1 border-l-2 border-red-900/35">
                      <p className="text-zinc-300 font-semibold line-clamp-1"><span className="text-zinc-550 mr-1 font-bold">PAYLOAD:</span> {atk.prompt}</p>
                      
                      <div className="bg-black/30 p-2 border border-zinc-900 rounded font-mono text-[9.5px]/1.4 mt-1">
                        <span className="text-[#64748b] block font-semibold">TARGET RESPONSE STREAM:</span>
                        <p className="text-zinc-400 line-clamp-2">{atk.response}</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-[#555]">MUTATION: <strong className="text-zinc-400 font-medium">{atk.mutationType}</strong></span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${atk.successScore >= 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                            COMPLIANCE: {atk.successScore}%
                          </span>
                          <span className="text-zinc-650">|</span>
                          <span className={`px-1.5 py-0.2 rounded-sm text-[8px] font-mono font-bold uppercase ${
                            atk.successScore >= 50 ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          }`}>
                            {atk.successScore >= 50 ? 'COMPROMISED' : 'BLOCKED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="animate-pulse text-zinc-500">_</div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Lineage Graph & Timeline Visualization */}
        <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center pb-3.5 border-b border-zinc-850 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-xs text-white uppercase tracking-wider font-sans">Attack Mutation Ancestry Graph (Lineage Node Tree)</span>
            </div>
            
            {/* Filter buttons on visualizer node */}
            <div className="flex items-center space-x-2">
              <select
                value={lineageFilter}
                onChange={(e: any) => setLineageFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-[10.5px] font-mono rounded px-2.5 py-1 text-zinc-450 outline-none"
              >
                <option value="all">Display All Chromosomes</option>
                <option value="compromised">Bypasses Only (Success &gt;= 50%)</option>
                <option value="blocked">Refusals Only (Success &lt; 50%)</option>
              </select>

              <div className="flex bg-zinc-950 rounded border border-zinc-850 p-0.5">
                <button 
                  onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
                  className="font-mono text-zinc-400 text-xs px-2 hover:bg-zinc-900 rounded"
                >
                  -
                </button>
                <span className="text-[10px] font-mono text-zinc-550 align-baseline leading-relaxed px-1.5">{(zoom*100).toFixed(0)}%</span>
                <button 
                  onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                  className="font-mono text-zinc-400 text-xs px-2 hover:bg-zinc-900 rounded"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Canvas area drawing ancestors flow nodes */}
          <div className="relative border border-zinc-950 bg-black/40 h-[280px] rounded-lg mt-4 overflow-hidden flex items-center justify-center p-4">
            
            {filteredLineage.length === 0 ? (
              <div className="text-zinc-600 text-xs text-center font-mono">
                <Layers className="h-8 w-8 mx-auto stroke-zinc-700 animate-pulse mb-1.5" />
                <span>No ancestry graph segments captured. Initiating campaign will produce mutated child branches.</span>
              </div>
            ) : (
              <div 
                className="absolute inset-0 flex items-center justify-start overflow-x-auto overflow-y-hidden px-8 transition-transform duration-300"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                <div className="flex items-center space-x-12 min-w-full">
                  
                  {filteredLineage.map((node, nodeIdx) => (
                    <div key={node.id} className="flex items-center shrink-0">
                      
                      {/* Connection horizontal line vector */}
                      {nodeIdx > 0 && (
                        <div className="relative w-12 h-0.5 bg-gradient-to-r from-red-500/20 to-red-500/80 shrink-0">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-45 border-r border-t border-red-500 w-1.5 h-1.5" />
                          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-zinc-650 bg-black px-1 border border-zinc-900 rounded-sm italic lowercase tracking-tight scale-90">
                            mutation block
                          </span>
                        </div>
                      )}

                      {/* Display card representing attack target chromosome */}
                      <button
                        onClick={() => setSelectedAttackNode(node)}
                        className={`text-left p-3.5 rounded-lg border w-48 transition-all hover:bg-zinc-[#111] hover:scale-102 flex flex-col space-y-1.5 shadow-md ${
                          selectedAttackNode?.id === node.id
                            ? 'bg-red-950/20 shadow-red-950/30 border-red-600'
                            : 'bg-zinc-950 border-zinc-850 shadow-black'
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="text-[9px] font-mono text-red-400 font-bold tracking-tight uppercase">GEN {node.generation}</span>
                          <span className={`px-1.5 rounded-sm text-[8px] font-mono font-black ${
                            node.successScore >= 50 ? 'bg-red-950 text-red-400 border border-red-900/40' : 'bg-emerald-950 text-emerald-405'
                          }`}>
                            {node.successScore >= 50 ? 'COMPROMISE' : 'BLOCKED'}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-200 truncate font-semibold">{node.mutationType}</p>
                        <p className="text-[9px] text-zinc-450 line-clamp-2 leading-relaxed font-mono">{node.prompt}</p>

                        <div className="flex justify-between items-center text-[9px] font-mono pt-1.5 border-t border-zinc-900/60 mt-1">
                          <span className="text-zinc-550 truncate max-w-[100px]">{node.id}</span>
                          <span className="text-zinc-400 font-bold">{node.successScore}% YIELD</span>
                        </div>
                      </button>

                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* Float details panel context if any node is active */}
            {selectedAttackNode && (
              <div className="absolute bottom-3 left-4 right-4 bg-zinc-950/95 backdrop-blur border border-red-900/35 px-4 py-2 rounded font-mono text-[10px] text-zinc-350 flex justify-between items-center">
                <div className="truncate space-y-0.5 flex-1 pr-3">
                  <span className="font-semibold text-red-400">Node Inspector:</span>{' '}
                  <span className="text-zinc-200 font-sans text-[11px] inline-block pr-1 font-bold">{selectedAttackNode.mutationType}</span>{' '}
                  <span className="text-zinc-550 shrink-0">({selectedAttackNode.id})</span>
                  <p className="text-zinc-300 truncate max-w-2xl font-light text-[9.5px]">Wrapper directive: "{selectedAttackNode.prompt}"</p>
                </div>
                <div className="flex space-x-2 text-zinc-450 shrink-0 font-bold border-l border-zinc-900 pl-3">
                  <span className={selectedAttackNode.successScore >= 50 ? 'text-red-400' : 'text-emerald-400'}>
                    Safety Compromised: {selectedAttackNode.successScore}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* METRICS CHARTS, TIMELINE & VULNERABILITY TIMELINE TABULATOR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Box 1 & 2: Campaign Evolution stats chart widgets */}
          <div className="lg:col-span-2 bg-[#0b0b0b] border border-zinc-900 rounded-lg p-5 flex flex-col">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 pb-3 border-b border-zinc-850">
              Campaign Security Evolution Trend Metrics
            </span>
            
            <div className="h-48 w-full mt-4">
              {details.metrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-zinc-650 font-mono text-[11px]">
                  <span>Timeline chart telemetry inactive. Run campaign sandbox loop.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={details.metrics}>
                    <defs>
                      <linearGradient id="colorRobustness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEffectiveness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" />
                    <XAxis dataKey="timestamp" tick={{ fill: '#71717a', fontSize: 8.5 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 8.5 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px' }} />
                    <Area type="monotone" name="Target Robustness %" dataKey="robustnessTrend" stroke="#10b981" fillOpacity={1} fill="url(#colorRobustness)" />
                    <Area type="monotone" name="Attack Yield %" dataKey="successRate" stroke="#ef4444" fillOpacity={1} fill="url(#colorEffectiveness)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Box 3: Vulnerability Findings timelines list */}
          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-5 flex flex-col h-[260px]">
            <div className="pb-2.5 border-b border-zinc-850 flex justify-between items-center">
              <span className="font-mono text-xs uppercase text-zinc-400 block tracking-tight">Vulnerabilities Discovered</span>
              <span className="text-[10px] bg-red-950 font-mono border border-red-800 text-red-400 rounded px-1.5 flex items-center space-x-1 font-bold animate-pulse">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{details.findings.length} Isolated</span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1 font-mono text-[10.5px]">
              {details.findings.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-zinc-500">
                  <ShieldCheck className="h-6 w-6 stroke-zinc-700 mb-1" />
                  <span>No vulnerabilities flagged. Target node secure.</span>
                </div>
              ) : (
                details.findings.slice().reverse().map(f => (
                  <div key={f.id} className="p-2.5 bg-black/40 border border-zinc-900 rounded flex flex-col space-y-1 text-zinc-350">
                    <div className="flex justify-between items-center border-b border-zinc-900 bg-red-950/10 px-1 py-0.2">
                      <span className="text-[#f87171] font-bold uppercase shrink-0">⚠️ Vulnerable: {f.vulnerabilityType}</span>
                      <span className="text-zinc-620 scale-90">{f.timestamp.split('T')[1].substr(0, 5)}</span>
                    </div>
                    <p className="text-zinc-400 text-[9.5px]/1.4 leading-normal font-light line-clamp-1 italic">Payload: "{f.vulnerablePayload.substr(0, 80)}"</p>
                    <p className="text-[9px] text-[#84cc16] mt-0.5 leading-tight"><strong className="text-zinc-500 mr-1 font-medium select-none">Remediation:</strong>{f.remediationAdvice}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* TIMELINE CONTROL DECK & REPLAY PANEL */}
        {details.attacks.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] shadow-lg">
            <div className="flex items-center space-x-2 shrink-0">
              <Sliders className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-white uppercase text-[10px] tracking-widest block pr-1.5">Simulation Replay Matrix</span>
              <span className="bg-zinc-900 border border-zinc-805 text-zinc-405 px-2 py-0.5 text-[9.5px] rounded">
                Attack index: {replayIndex === -1 ? details.attacks.length : replayIndex + 1} / {details.attacks.length}
              </span>
            </div>

            {/* Main playback control center buttons */}
            <div className="flex items-center space-x-1.5 bg-black border border-zinc-900 rounded p-1 shadow-inner">
              <button
                onClick={handleStepBackward}
                className="hover:bg-zinc-900/60 p-1.5 rounded text-zinc-450 active:scale-90 transition-colors cursor-pointer"
                title="Previous Generation Attack"
              >
                ◀ Step Back
              </button>

              <button
                onClick={toggleReplay}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                  isReplaying 
                    ? 'bg-red-600 text-white font-black animate-pulse' 
                    : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-350'
                }`}
              >
                {isReplaying ? (
                  <>
                    <Pause className="h-3 w-3 fill-white" />
                    <span>PAUSE SIMULATION</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-zinc-300" />
                    <span>PLAY EVOLUTION REPLAY</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStepForward}
                className="hover:bg-zinc-900/60 p-1.5 rounded text-zinc-455 active:scale-90 transition-colors cursor-pointer"
                title="Next Generation Attack"
              >
                Step Fwd ▶
              </button>
            </div>

            <div className="text-[9.5px] text-zinc-550 truncate max-w-[200px] text-right">
              Timeline: Playback steps mutation sequences sequentially
            </div>
          </div>
        )}

        {/* RESEARCH REPORT GENERATION ENGINE */}
        {details.report && (
          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-850 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-xs text-white uppercase tracking-wider font-sans">ARTA Security Hardening Research Report</span>
              </div>
              
              {/* Report Downloader triggers */}
              <div className="flex items-center space-x-2 font-mono text-[10px]">
                <button
                  onClick={() => handleDownloadReport('json')}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-350 px-2.5 py-1 text-[10px] rounded hover:border-zinc-700 active:scale-95 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON Archive</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('csv')}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-355 px-2.5 py-1 text-[10px] rounded hover:border-zinc-700 active:scale-95 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Download CSV Exploit Logs</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1.5 text-xs font-mono">
              
              {/* Executive Summary block */}
              <div className="md:col-span-2 space-y-3 pr-2.5 border-r border-zinc-900/60 text-zinc-350">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold block">1. Executive Overview Analysis</span>
                  <p className="leading-relaxed text-zinc-400">{details.report.executiveSummary}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold block">2. Chromosomic Attack Evolution Study</span>
                  <p className="leading-relaxed text-zinc-400 font-sans text-[11px] leading-normal">{details.report.attackEvolutionAnalysis}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-red-500 font-bold block">3. Isolated Vulnerability Root Cause Findings</span>
                  <p className="leading-relaxed text-zinc-400">{details.report.rootCauseAnalysis}</p>
                </div>
              </div>

              {/* Stats & recommendations list */}
              <div className="space-y-4 text-zinc-350">
                <div className="space-y-1 bg-black/30 border border-zinc-900 p-3 rounded">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold block">Campaign Summary stats</span>
                  <div className="space-y-1.5 pt-1 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Duration Range:</span>
                      <span className="text-white font-bold">{details.report.campaignStats.durationMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Fuzzer Attacks:</span>
                      <span className="text-white font-bold">{details.report.campaignStats.totalAttacks} runs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Peak Bypass Probability:</span>
                      <span className="text-red-400 font-bold">{details.report.campaignStats.peakSuccessProbability}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold block">Remediation Policy Advice</span>
                  <div className="space-y-1.5 pt-1">
                    {details.report.defenseRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start space-x-1.5 text-[10.5px] text-zinc-400 leading-normal">
                        <span className="text-emerald-500 shrink-0 select-none">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </section>
    </div>
  );
}
