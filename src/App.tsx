import { useEffect, useMemo, useRef, useState } from "react";
import { downloadHistory, historyConfigured, listHistory, saveHistory, type HistoryRecord } from "./historyApi";

type SpectrumPoint = { f: number; a: number };
type MetricKey = "rms" | "peak" | "kurtosis" | "crest" | "bpfo";
type NodeType = "source" | "feature" | "peakSearch" | "condition" | "logic" | "display" | "output" | "report";
type SearchMode = "energy" | "harmonic";
type DisplayMode = "auto" | "waveform" | "spectrum" | "value";
type FlowNode = {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  metric?: MetricKey;
  operator?: ">" | "<";
  threshold?: number;
  logic?: "AND" | "OR";
  displayMode?: DisplayMode;
  searchMode?: SearchMode;
  searchMinHz?: number;
  searchMaxHz?: number;
  energyRatio?: number;
  harmonicCount?: number;
  toleranceHz?: number;
};
type Connection = { id: string; source: string; target: string };
type CanvasView = { x: number; y: number; scale: number };
type SelectionBox = { left: number; top: number; width: number; height: number };
type PeakResult = SpectrumPoint & { order?: number; theoretical?: number };
type PeakSearchResult = { peaks: PeakResult[]; energyPercent: number; bandPointCount: number };
type SourceSignal = { fileName: string; samples: number[]; revision: number; historyId?: string };
type SidebarMode = "nodes" | "history";
type MetricSet = Record<MetricKey, number>;
type RunResults = {
  sourceIdByNode: Map<string, string>;
  metricsBySource: Map<string, MetricSet>;
  spectrumByNode: Map<string, SpectrumPoint[]>;
  valueByNode: Map<string, number>;
  peakResultsByNode: Map<string, PeakSearchResult>;
  nodePass: Map<string, boolean>;
};

const NODE_WIDTH = 220;
const PORT_Y = 49;
const INITIAL_VIEW: CanvasView = { x: 48, y: 30, scale: 0.82 };
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.8;

const metricInfo: Record<MetricKey, { label: string; unit: string }> = {
  rms: { label: "有效值", unit: "信号单位" },
  peak: { label: "峰值", unit: "信号单位" },
  kurtosis: { label: "峭度", unit: "—" },
  crest: { label: "峰值因子", unit: "—" },
  bpfo: { label: "BPFO 幅值", unit: "信号单位" },
};

const starterNodes: FlowNode[] = [
  { id: "wave", type: "source", title: "振动波形", x: 40, y: 260 },
  { id: "fft", type: "feature", title: "FFT 频谱", metric: "bpfo", x: 320, y: 100 },
  { id: "rms", type: "feature", title: "有效值计算", metric: "rms", x: 320, y: 390 },
  { id: "c-bpfo", type: "condition", title: "外圈频率判断", metric: "bpfo", operator: ">", threshold: 0.08, x: 600, y: 90 },
  { id: "c-rms", type: "condition", title: "振动强度判断", metric: "rms", operator: ">", threshold: 0.2, x: 600, y: 390 },
  { id: "and", type: "logic", title: "全部满足", logic: "AND", x: 880, y: 245 },
  { id: "result", type: "output", title: "诊断结果", x: 1160, y: 245 },
  { id: "report", type: "report", title: "报告导出", x: 1440, y: 245 },
];

const starterConnections: Connection[] = [
  { id: "e1", source: "wave", target: "fft" },
  { id: "e2", source: "wave", target: "rms" },
  { id: "e3", source: "fft", target: "c-bpfo" },
  { id: "e4", source: "rms", target: "c-rms" },
  { id: "e5", source: "c-bpfo", target: "and" },
  { id: "e6", source: "c-rms", target: "and" },
  { id: "e7", source: "and", target: "result" },
  { id: "e8", source: "result", target: "report" },
];

const palette = [
  { group: "数据输入", items: [
    { type: "source" as NodeType, title: "振动波形", icon: "∿", desc: "TXT / CSV" },
  ]},
  { group: "信号处理", items: [
    { type: "feature" as NodeType, title: "有效值计算", metric: "rms" as MetricKey, icon: "R", desc: "RMS" },
    { type: "feature" as NodeType, title: "FFT 频谱", metric: "bpfo" as MetricKey, icon: "F", desc: "频率幅值" },
    { type: "feature" as NodeType, title: "峭度计算", metric: "kurtosis" as MetricKey, icon: "K", desc: "冲击指标" },
    { type: "feature" as NodeType, title: "峰值计算", metric: "peak" as MetricKey, icon: "P", desc: "最大幅值" },
    { type: "peakSearch" as NodeType, title: "峰值搜索", icon: "⌃", desc: "能量 / 倍频" },
  ]},
  { group: "条件与逻辑", items: [
    { type: "condition" as NodeType, title: "阈值判断", metric: "rms" as MetricKey, icon: "?", desc: "大于 / 小于" },
    { type: "logic" as NodeType, title: "全部满足", logic: "AND" as const, icon: "&", desc: "AND" },
    { type: "logic" as NodeType, title: "任一满足", logic: "OR" as const, icon: "≥1", desc: "OR" },
  ]},
  { group: "诊断输出", items: [
    { type: "display" as NodeType, title: "数据显示", icon: "▥", desc: "波形 / 频谱" },
    { type: "output" as NodeType, title: "诊断结果", icon: "!", desc: "故障结论" },
    { type: "report" as NodeType, title: "报告导出", icon: "W", desc: "下载 Word" },
  ]},
];

function largestPowerOfTwo(value: number) {
  return 2 ** Math.floor(Math.log2(Math.max(2, value)));
}

function calculateSpectrum(input: number[], fs: number): SpectrumPoint[] {
  const size = Math.min(16384, largestPowerOfTwo(input.length));
  const source = input.slice(-size);
  const mean = source.reduce((sum, value) => sum + value, 0) / size;
  const real = source.map((value, index) => (value - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1))));
  const imag = new Array(size).fill(0);
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [real[i], real[j]] = [real[j], real[i]]; [imag[i], imag[j]] = [imag[j], imag[i]]; }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const wr0 = Math.cos(angle);
    const wi0 = Math.sin(angle);
    for (let i = 0; i < size; i += length) {
      let wr = 1, wi = 0;
      for (let j = 0; j < length / 2; j++) {
        const even = i + j, odd = even + length / 2;
        const or = real[odd] * wr - imag[odd] * wi;
        const oi = real[odd] * wi + imag[odd] * wr;
        const er = real[even], ei = imag[even];
        real[even] = er + or; imag[even] = ei + oi;
        real[odd] = er - or; imag[odd] = ei - oi;
        const next = wr * wr0 - wi * wi0;
        wi = wr * wi0 + wi * wr0; wr = next;
      }
    }
  }
  return real.slice(0, size / 2).map((value, index) => ({ f: index * fs / size, a: 4 / size * Math.hypot(value, imag[index]) }));
}

function parseTextSignal(text: string): number[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length > 3) return lines.flatMap((line) => {
    const values = line.split(/[,;\t\s]+/).map(Number).filter(Number.isFinite);
    return values.length ? [values[values.length - 1]] : [];
  });
  return text.split(/[,;\t\s]+/).map(Number).filter(Number.isFinite);
}

function generateDemo(fs: number, rpm: number, bpfo: number) {
  const interval = Math.max(2, Math.round(fs / bpfo));
  return Array.from({ length: 8192 }, (_, index) => {
    const time = index / fs;
    const local = (index % interval) / fs;
    const impact = local < .006 ? 1.25 * Math.exp(-520 * local) * Math.sin(2 * Math.PI * 1800 * local) : 0;
    return impact + .045 * Math.sin(2 * Math.PI * rpm / 60 * time) + .12 * Math.sin(2 * Math.PI * bpfo * time) + .014 * Math.sin(index * 1.731);
  });
}

function calculateMetricsForSignal(samples: number[], spectrum: SpectrumPoint[], fs: number, bpfo: number): MetricSet {
  if (!samples.length) return { rms: 0, peak: 0, kurtosis: 0, crest: 0, bpfo: 0 };
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const centered = samples.map((value) => value - mean);
  const squareMean = centered.reduce((sum, value) => sum + value * value, 0) / centered.length;
  const rms = Math.sqrt(squareMean);
  const peak = Math.max(...centered.map(Math.abs));
  const fourth = centered.reduce((sum, value) => sum + value ** 4, 0) / centered.length;
  const resolution = fs / Math.max(2, spectrum.length * 2);
  const band = spectrum.filter((point) => Math.abs(point.f - bpfo) <= Math.max(2 * resolution, 1));
  return { rms, peak, kurtosis: squareMean ? fourth / squareMean ** 2 : 0, crest: rms ? peak / rms : 0, bpfo: Math.max(0, ...band.map((point) => point.a)) };
}

function searchSpectrumPeaks(points: SpectrumPoint[], node: FlowNode, baseFrequency: number): PeakSearchResult {
  if (!points.length) return { peaks: [], energyPercent: 0, bandPointCount: 0 };
  const nyquist = points[points.length - 1]?.f ?? 0;
  const rawMin = Math.max(0, node.searchMinHz ?? 0);
  const rawMax = Math.min(nyquist, node.searchMaxHz ?? Math.min(1000, nyquist));
  const minHz = Math.min(rawMin, rawMax);
  const maxHz = Math.max(rawMin, rawMax);
  const band = points.filter((point) => point.f >= minHz && point.f <= maxHz);
  if (!band.length) return { peaks: [], energyPercent: 0, bandPointCount: 0 };

  let localPeaks = band.filter((point, index) => {
    if (index === 0 || index === band.length - 1) return false;
    return point.a > band[index - 1].a && point.a >= band[index + 1].a;
  });
  if (!localPeaks.length) localPeaks = [band.reduce((best, point) => point.a > best.a ? point : best, band[0])];
  const localEnergy = localPeaks.reduce((sum, point) => sum + point.a ** 2, 0);

  if ((node.searchMode ?? "energy") === "harmonic") {
    const count = Math.max(1, Math.min(20, Math.round(node.harmonicCount ?? 3)));
    const tolerance = Math.max(0.1, node.toleranceHz ?? 3);
    const peaks: PeakResult[] = [];
    for (let order = 1; order <= count; order++) {
      const theoretical = baseFrequency * order;
      if (theoretical < minHz || theoretical > maxHz) continue;
      const window = band.filter((point) => Math.abs(point.f - theoretical) <= tolerance);
      if (!window.length) continue;
      const best = window.reduce((current, point) => point.a > current.a ? point : current, window[0]);
      peaks.push({ ...best, order, theoretical });
    }
    const selectedEnergy = peaks.reduce((sum, point) => sum + point.a ** 2, 0);
    return { peaks, energyPercent: localEnergy ? selectedEnergy / localEnergy * 100 : 0, bandPointCount: band.length };
  }

  const limit = Math.max(1, Math.min(100, node.energyRatio ?? 80)) / 100;
  const sorted = [...localPeaks].sort((a, b) => b.a - a.a);
  const selected: PeakResult[] = [];
  let accumulated = 0;
  for (const point of sorted) {
    const next = accumulated + point.a ** 2;
    if (selected.length && localEnergy && next / localEnergy > limit) break;
    selected.push(point);
    accumulated = next;
  }
  return { peaks: selected, energyPercent: localEnergy ? accumulated / localEnergy * 100 : 0, bandPointCount: band.length };
}

function DataWave({ samples }: { samples: number[] }) {
  const values = samples.length ? Array.from({ length: 96 }, (_, index) => samples[Math.floor(index / 95 * (samples.length - 1))]) : [];
  const max = Math.max(1e-8, ...values.map(Math.abs));
  const points = values.map((value, index) => `${index / 95 * 196},${36 - value / max * 29}`).join(" ");
  return <svg className="data-chart data-wave" viewBox="0 0 196 72" preserveAspectRatio="none"><line x1="0" y1="36" x2="196" y2="36"/>{values.length > 0 && <polyline points={points}/>}</svg>;
}

function SpectrumChart({ spectrum, minHz = 0, maxHz, peaks = [] }: { spectrum: SpectrumPoint[]; minHz?: number; maxHz?: number; peaks?: PeakResult[] }) {
  const endHz = maxHz ?? spectrum[spectrum.length - 1]?.f ?? 0;
  const startHz = Math.min(minHz, endHz);
  const band = spectrum.filter((point) => point.f >= startHz && point.f <= endHz);
  const buckets = Array.from({ length: 96 }, (_, index) => {
    const from = Math.floor(index / 96 * band.length);
    const to = Math.max(from + 1, Math.floor((index + 1) / 96 * band.length));
    return band.slice(from, to).reduce((best, point) => point.a > best ? point.a : best, 0);
  });
  const maxAmplitude = Math.max(1e-9, ...buckets, ...peaks.map((point) => point.a));
  const polyline = buckets.map((value, index) => `${index / 95 * 196},${67 - value / maxAmplitude * 60}`).join(" ");
  const span = Math.max(1e-9, endHz - startHz);
  return <svg className="data-chart spectrum-chart" viewBox="0 0 196 72" preserveAspectRatio="none">
    <line x1="0" y1="67" x2="196" y2="67"/>
    {band.length > 0 && <polyline points={polyline}/>} 
    {peaks.slice(0, 20).map((point, index) => <g key={`${point.f}-${index}`}><line className="peak-marker" x1={(point.f-startHz)/span*196} y1="8" x2={(point.f-startHz)/span*196} y2="67"/><circle className="peak-dot" cx={(point.f-startHz)/span*196} cy={67-point.a/maxAmplitude*60} r="2.3"/></g>)}
  </svg>;
}

function inferDisplayMode(node: FlowNode, inputNode?: FlowNode): Exclude<DisplayMode, "auto"> {
  if (node.displayMode && node.displayMode !== "auto") return node.displayMode;
  if (inputNode?.type === "source") return "waveform";
  if (inputNode?.type === "peakSearch" || (inputNode?.type === "feature" && inputNode.title.includes("FFT"))) return "spectrum";
  return "value";
}

function DetailedWave({ samples, fs }: { samples: number[]; fs: number }) {
  const width = 920, height = 340, left = 62, right = 18, top = 20, bottom = 46;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const maxAbs = Math.max(1e-9, samples.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0));
  const bucketCount = Math.min(Math.max(1, Math.floor(plotWidth)), Math.max(1, samples.length));
  const y = (value: number) => top + plotHeight / 2 - value / maxAbs * plotHeight * .46;
  const envelope = Array.from({ length: bucketCount }, (_, index) => {
    const from = Math.floor(index / bucketCount * samples.length);
    const to = Math.max(from + 1, Math.floor((index + 1) / bucketCount * samples.length));
    let min = 0, max = 0;
    for (let i = from; i < Math.min(to, samples.length); i++) { min = Math.min(min, samples[i]); max = Math.max(max, samples[i]); }
    const x = left + index / Math.max(1, bucketCount - 1) * plotWidth;
    return `M${x.toFixed(2)},${y(max).toFixed(2)} L${x.toFixed(2)},${y(min).toFixed(2)}`;
  }).join(" ");
  const duration = samples.length / Math.max(1, fs);
  return <svg className="detail-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
    {Array.from({length:5},(_,index)=>{const gy=top+index/4*plotHeight;return <line className="detail-grid" key={`h${index}`} x1={left} y1={gy} x2={width-right} y2={gy}/>;})}
    {Array.from({length:6},(_,index)=>{const gx=left+index/5*plotWidth;return <g key={`v${index}`}><line className="detail-grid" x1={gx} y1={top} x2={gx} y2={top+plotHeight}/><text x={gx} y={height-18} textAnchor="middle">{(duration*index/5).toFixed(3)} s</text></g>;})}
    <line className="detail-axis" x1={left} y1={y(0)} x2={width-right} y2={y(0)}/>
    <text x={left-10} y={top+8} textAnchor="end">{maxAbs.toFixed(3)}</text><text x={left-10} y={y(0)+4} textAnchor="end">0</text><text x={left-10} y={top+plotHeight} textAnchor="end">-{maxAbs.toFixed(3)}</text>
    {samples.length > 0 && <path className="detail-wave-path" d={envelope}/>} 
    <text className="axis-title" x={18} y={height/2} textAnchor="middle" transform={`rotate(-90 18 ${height/2})`}>幅值</text>
    <text className="axis-title" x={left+plotWidth/2} y={height-2} textAnchor="middle">时间</text>
  </svg>;
}

function DetailedSpectrum({ spectrum, minHz, maxHz, peaks = [] }: { spectrum: SpectrumPoint[]; minHz: number; maxHz: number; peaks?: PeakResult[] }) {
  const width = 920, height = 340, left = 62, right = 18, top = 20, bottom = 46;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const start = Math.min(minHz, maxHz), end = Math.max(minHz, maxHz);
  const band = spectrum.filter((point)=>point.f>=start&&point.f<=end);
  const bucketCount = Math.min(Math.max(1, Math.floor(plotWidth)), Math.max(1, band.length));
  const buckets = Array.from({length:bucketCount},(_,index)=>{
    const from=Math.floor(index/bucketCount*band.length),to=Math.max(from+1,Math.floor((index+1)/bucketCount*band.length));
    return band.slice(from,to).reduce((best,point)=>point.a>best?point.a:best,0);
  });
  const maxAmplitude=Math.max(1e-9,...buckets,...peaks.map((point)=>point.a));
  const x=(frequency:number)=>left+(frequency-start)/Math.max(1e-9,end-start)*plotWidth;
  const y=(amplitude:number)=>top+plotHeight-amplitude/maxAmplitude*plotHeight*.94;
  const line=buckets.map((value,index)=>`${left+index/Math.max(1,bucketCount-1)*plotWidth},${y(value)}`).join(" ");
  return <svg className="detail-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
    {Array.from({length:5},(_,index)=>{const gy=top+index/4*plotHeight;return <g key={`h${index}`}><line className="detail-grid" x1={left} y1={gy} x2={width-right} y2={gy}/><text x={left-10} y={gy+4} textAnchor="end">{(maxAmplitude*(1-index/4)).toFixed(3)}</text></g>;})}
    {Array.from({length:6},(_,index)=>{const frequency=start+(end-start)*index/5,gx=x(frequency);return <g key={`v${index}`}><line className="detail-grid" x1={gx} y1={top} x2={gx} y2={top+plotHeight}/><text x={gx} y={height-18} textAnchor="middle">{frequency.toFixed(1)}</text></g>;})}
    {band.length>0&&<polyline className="detail-spectrum-path" points={line}/>} 
    {peaks.slice(0,40).map((peak,index)=><g key={`${peak.f}-${index}`}><line className="detail-peak-line" x1={x(peak.f)} y1={top} x2={x(peak.f)} y2={top+plotHeight}/><circle className="detail-peak-dot" cx={x(peak.f)} cy={y(peak.a)} r="4"/><text className="detail-peak-label" x={x(peak.f)+5} y={Math.max(top+10,y(peak.a)-7)}>{peak.order?`${peak.order}× `:""}{peak.f.toFixed(2)} Hz</text></g>)}
    <text className="axis-title" x={18} y={height/2} textAnchor="middle" transform={`rotate(-90 18 ${height/2})`}>幅值</text>
    <text className="axis-title" x={left+plotWidth/2} y={height-2} textAnchor="middle">频率 / Hz</text>
  </svg>;
}

function TinyWave({ samples }: { samples: number[] }) {
  const values = samples.length ? Array.from({ length: 44 }, (_, i) => samples[Math.floor(i / 43 * (samples.length - 1))]) : [];
  const max = Math.max(1e-8, ...values.map(Math.abs));
  const points = values.map((value, index) => `${index / 43 * 120},${18 - value / max * 14}`).join(" ");
  return <svg className="tiny-wave" viewBox="0 0 120 36" preserveAspectRatio="none"><line x1="0" y1="18" x2="120" y2="18"/>{values.length > 0 && <polyline points={points}/>}</svg>;
}

export default function Home() {
  const [nodes, setNodes] = useState<FlowNode[]>(starterNodes);
  const [connections, setConnections] = useState<Connection[]>(starterConnections);
  const [sourceSignals, setSourceSignals] = useState<Record<string, SourceSignal>>({});
  const [fs, setFs] = useState(12800);
  const [rpm, setRpm] = useState(1485);
  const [bpfo, setBpfo] = useState(148.2);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<{ fault: boolean; matched: number; total: number } | null>(null);
  const [runResults, setRunResults] = useState<RunResults | null>(null);
  const [toast, setToast] = useState("");
  const [canvasView, setCanvasViewState] = useState<CanvasView>(INITIAL_VIEW);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("nodes");
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [pendingHistoryFiles, setPendingHistoryFiles] = useState<File[]>([]);
  const [historySampleCount, setHistorySampleCount] = useState(4096);
  const [historyMaxFrequency, setHistoryMaxFrequency] = useState(6400);
  const [historyImporting, setHistoryImporting] = useState(false);
  const [historyDropActive, setHistoryDropActive] = useState(false);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const draftEdgeRef = useRef<SVGPathElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const linkRef = useRef<{ source: string } | null>(null);
  const nodesRef = useRef(nodes);
  const connectNodesRef = useRef<(source: string, target: string) => void>(() => undefined);
  const panRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const selectionRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const viewRef = useRef<CanvasView>(INITIAL_VIEW);
  nodesRef.current = nodes;

  const loadedSourceNodes = nodes.filter((node) => node.type === "source" && sourceSignals[node.id]?.samples.length);
  const loadedPointCount = loadedSourceNodes.reduce((sum, node) => sum + sourceSignals[node.id].samples.length, 0);
  const calculationKey = useMemo(() => JSON.stringify({
    fs, rpm, bpfo,
    nodes: nodes.map(({id,type,metric,operator,threshold,logic,searchMode,searchMinHz,searchMaxHz,energyRatio,harmonicCount,toleranceHz}) => ({id,type,metric,operator,threshold,logic,searchMode,searchMinHz,searchMaxHz,energyRatio,harmonicCount,toleranceHz})),
    connections: connections.map(({source,target}) => ({source,target})),
    signals: Object.entries(sourceSignals).map(([id, signal]) => [id, signal.revision]),
  }), [nodes, connections, sourceSignals, fs, rpm, bpfo]);

  useEffect(() => {
    setRunResults(null);
    setDiagnosis(null);
  }, [calculationKey]);

  useEffect(() => {
    if (!historyConfigured) return;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        setHistoryRecords(await listHistory(historySearch));
      } catch {
        setHistoryError("历史数据读取失败，请稍后重试");
      } finally {
        setHistoryLoading(false);
      }
    }, historySearch ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [historySearch, historyRefresh]);

  function connectNodes(source: string, target: string) {
    const sourceNode = nodes.find((node) => node.id === source);
    const targetNode = nodes.find((node) => node.id === target);
    if (!sourceNode || !targetNode || source === target) return;
    if (sourceNode.type === "report" || sourceNode.type === "display") { notify(`${sourceNode.title}是终端节点，不能继续向后连线`); return; }
    if (targetNode.type === "source") { notify("振动波形是数据起点，不能接收上游连线"); return; }
    if (targetNode.type === "report" && sourceNode.type !== "output") { notify("报告导出只能连接在诊断结果后面"); return; }
    if (targetNode.type === "peakSearch" && !(sourceNode.type === "feature" && sourceNode.title.includes("FFT"))) { notify("峰值搜索的输入必须连接 FFT 频谱节点"); return; }
    if (targetNode.type === "display" && !["source", "feature", "peakSearch"].includes(sourceNode.type)) { notify("数据显示只接收波形、频谱或计算数据"); return; }
    setConnections((current) => {
      const singleInput = ["feature", "condition", "peakSearch", "display", "report"].includes(targetNode.type);
      const base = singleInput ? current.filter((edge) => edge.target !== target) : current;
      return base.some((edge) => edge.source === source && edge.target === target) ? base : [...base, { id: `edge-${Date.now()}`, source, target }];
    });
    setDiagnosis(null);
  }
  connectNodesRef.current = connectNodes;

  function updateDraftEdge(sourceId: string, x: number, y: number) {
    const source = nodesRef.current.find((node) => node.id === sourceId);
    const path = draftEdgeRef.current;
    if (!source || !path) return;
    const sx = source.x + NODE_WIDTH;
    const sy = source.y + PORT_Y;
    path.setAttribute("d", `M${sx},${sy} C${sx + 80},${sy} ${x - 80},${y} ${x},${y}`);
    path.classList.add("active");
  }

  function clearDraftEdge() {
    draftEdgeRef.current?.classList.remove("active");
    canvasViewportRef.current?.classList.remove("interacting");
  }

  function setCanvasView(next: CanvasView | ((current: CanvasView) => CanvasView)) {
    setCanvasViewState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      viewRef.current = resolved;
      return resolved;
    });
  }

  function screenToCanvas(clientX: number, clientY: number) {
    const viewport = canvasViewportRef.current;
    if (!viewport) return { x: 0, y: 0 };
    const rect = viewport.getBoundingClientRect();
    const view = viewRef.current;
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale,
    };
  }

  function zoomCanvas(targetScale: number, anchorX?: number, anchorY?: number) {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const px = anchorX ?? rect.width / 2;
    const py = anchorY ?? rect.height / 2;
    setCanvasView((current) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale));
      const worldX = (px - current.x) / current.scale;
      const worldY = (py - current.y) / current.scale;
      return { x: px - worldX * scale, y: py - worldY * scale, scale };
    });
  }

  useEffect(() => {
    let moveFrame = 0;
    let latestPointer: { x: number; y: number } | null = null;

    const applyPointerMove = () => {
      moveFrame = 0;
      const pointer = latestPointer;
      latestPointer = null;
      if (!pointer) return;
      const { x: clientX, y: clientY } = pointer;
      if (panRef.current) {
        const { startX, startY, originX, originY } = panRef.current;
        setCanvasView((current) => ({ ...current, x: originX + clientX - startX, y: originY + clientY - startY }));
      }
      if (selectionRef.current) {
        selectionRef.current.currentX = clientX;
        selectionRef.current.currentY = clientY;
        const viewport = canvasViewportRef.current;
        if (viewport) {
          const viewportRect = viewport.getBoundingClientRect();
          const left = Math.max(viewportRect.left, Math.min(selectionRef.current.startX, clientX));
          const right = Math.min(viewportRect.right, Math.max(selectionRef.current.startX, clientX));
          const top = Math.max(viewportRect.top, Math.min(selectionRef.current.startY, clientY));
          const bottom = Math.min(viewportRect.bottom, Math.max(selectionRef.current.startY, clientY));
          setSelectionBox({ left: left - viewportRect.left, top: top - viewportRect.top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) });
          const selected = Array.from(viewport.querySelectorAll<HTMLElement>(".flow-node[data-node-id]")).flatMap((element) => {
            const rect = element.getBoundingClientRect();
            const intersects = rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top;
            return intersects && element.dataset.nodeId ? [element.dataset.nodeId] : [];
          });
          setSelectedIds(selected);
        }
      }
      if (dragRef.current) {
        const { id, dx, dy } = dragRef.current;
        const point = screenToCanvas(clientX, clientY);
        const x = point.x - dx;
        const y = point.y - dy;
        setNodes((current) => current.map((node) => node.id === id ? { ...node, x, y } : node));
      }
      if (linkRef.current) {
        const point = screenToCanvas(clientX, clientY);
        updateDraftEdge(linkRef.current.source, point.x, point.y);
      }
    };

    const handleMove = (event: PointerEvent) => {
      latestPointer = { x: event.clientX, y: event.clientY };
      if (!moveFrame) moveFrame = window.requestAnimationFrame(applyPointerMove);
    };

    const handleUp = (event: PointerEvent) => {
      if (moveFrame) {
        window.cancelAnimationFrame(moveFrame);
        moveFrame = 0;
      }
      latestPointer = { x: event.clientX, y: event.clientY };
      applyPointerMove();
      dragRef.current = null;
      panRef.current = null;
      selectionRef.current = null;
      setIsPanning(false);
      setSelectionBox(null);
      if (linkRef.current) {
        const source = linkRef.current.source;
        const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const targetElement = element?.closest("[data-input-node]") as HTMLElement | null;
        const target = targetElement?.dataset.inputNode;
        if (target && target !== source) connectNodesRef.current(source, target);
        linkRef.current = null;
      }
      clearDraftEdge();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      if (moveFrame) window.cancelAnimationFrame(moveFrame);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const factor = Math.exp(-event.deltaY * 0.0015);
        zoomCanvas(viewRef.current.scale * factor, event.clientX - rect.left, event.clientY - rect.top);
      }
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!previewNodeId) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewNodeId(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewNodeId]);

  useEffect(() => {
    const deleteSelectedNodes = (event: KeyboardEvent) => {
      if (event.key !== "Delete" || !selectedIds.length || previewNodeId) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input,textarea,select,button,[contenteditable='true']")) return;
      event.preventDefault();
      const ids = new Set(selectedIds);
      setNodes((current) => current.filter((node) => !ids.has(node.id)));
      setConnections((current) => current.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)));
      setSourceSignals((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !ids.has(id))));
      setSelectedIds([]);
      setDiagnosis(null);
      notify(`已删除 ${ids.size} 个节点`);
    };
    window.addEventListener("keydown", deleteSelectedNodes);
    return () => window.removeEventListener("keydown", deleteSelectedNodes);
  }, [selectedIds, previewNodeId]);

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(""), 2300);
  }

  function queueHistoryFiles(files: FileList | File[]) {
    const supported = Array.from(files).filter((file) => /\.(txt|csv)$/i.test(file.name));
    if (!supported.length) {
      notify("请选择 TXT 或 CSV 波形文件");
      return;
    }
    setPendingHistoryFiles((current) => {
      const known = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      return [...current, ...supported.filter((file) => !known.has(`${file.name}-${file.size}-${file.lastModified}`))];
    });
  }

  async function importPendingHistory() {
    if (!historyConfigured) { notify("历史数据服务尚未配置"); return; }
    if (!pendingHistoryFiles.length) { notify("请先拖入或选择波形文件"); return; }
    if (!Number.isFinite(historySampleCount) || historySampleCount < 64) { notify("采样点数不能小于 64"); return; }
    if (!Number.isFinite(historyMaxFrequency) || historyMaxFrequency <= 0) { notify("请输入正确的最大分析频率"); return; }

    setHistoryImporting(true);
    let success = 0;
    let failed = 0;
    for (let index = 0; index < pendingHistoryFiles.length; index++) {
      const file = pendingHistoryFiles[index];
      notify(`正在导入 ${index + 1}/${pendingHistoryFiles.length}：${file.name}`);
      try {
        const values = parseTextSignal(await file.text());
        if (values.length < 64) throw new Error("too short");
        await saveHistory(file, {
          sampleCount: Math.round(historySampleCount),
          samplingFrequency: historyMaxFrequency * 2,
          rpm,
          bpfo,
        });
        success++;
      } catch {
        failed++;
      }
    }
    setHistoryImporting(false);
    if (success) {
      setPendingHistoryFiles([]);
      setHistoryRefresh((value) => value + 1);
    }
    notify(failed ? `导入完成：成功 ${success} 个，失败 ${failed} 个` : `已导入 ${success} 个历史波形`);
  }

  async function loadFile(sourceId: string, file?: File) {
    if (!file) return;
    try {
      const values = parseTextSignal(await file.text()).slice(0, 65536);
      if (values.length < 64) throw new Error("too short");
      setSourceSignals((current) => ({ ...current, [sourceId]: { fileName: file.name, samples: values, revision: Date.now() } }));
      setDiagnosis(null); setRunResults(null);
      notify(`${file.name}：已载入 ${values.length.toLocaleString()} 个数据点，不会自动保存到历史库`);
    } catch { notify("无法识别文件，请使用单列或“时间,幅值”格式"); }
  }

  function loadDemo(sourceId: string) {
    const samples = generateDemo(fs, rpm, bpfo);
    setSourceSignals((current) => ({ ...current, [sourceId]: { fileName: `轴承外圈故障演示-${sourceId.slice(-4)}.txt`, samples, revision: Date.now() } }));
    setDiagnosis(null); setRunResults(null); notify("演示波形已载入当前节点");
  }

  async function loadHistoryIntoNode(record: HistoryRecord, sourceId: string) {
    notify(`正在读取历史数据：${record.file_name}`);
    try {
      const values = parseTextSignal(await downloadHistory(record)).slice(0, Math.min(65536, record.sample_count || 65536));
      if (values.length < 64) throw new Error("too short");
      setSourceSignals((current) => ({
        ...current,
        [sourceId]: { fileName: record.file_name, samples: values, revision: Date.now(), historyId: record.id },
      }));
      setFs(record.sampling_frequency || fs);
      setRpm(record.rpm ?? rpm);
      setBpfo(record.bpfo ?? bpfo);
      setDiagnosis(null);
      setRunResults(null);
      notify(`${record.file_name} 已装载到振动波形节点，点击运行后计算`);
    } catch {
      notify("历史波形读取失败，请检查云端文件是否存在");
    }
  }

  function startNodeDrag(event: React.PointerEvent, id: string) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button,input,label,select,.port,.chart-preview")) return;
    const node = nodes.find((item) => item.id === id);
    if (!node) return;
    const point = screenToCanvas(event.clientX, event.clientY);
    dragRef.current = { id, dx: point.x - node.x, dy: point.y - node.y };
    canvasViewportRef.current?.classList.add("interacting");
    setSelectedIds([id]);
  }

  function startCanvasInteraction(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (event.button === 1) {
      event.preventDefault();
      const view = viewRef.current;
      panRef.current = { startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y };
      setIsPanning(true);
      return;
    }
    if (target.closest(".flow-node,.edge-layer path,button,input,select,.canvas-tip")) return;
    if (event.button !== 0) return;
    event.preventDefault();
    selectionRef.current = { startX: event.clientX, startY: event.clientY, currentX: event.clientX, currentY: event.clientY };
    const viewport = canvasViewportRef.current;
    const rect = viewport?.getBoundingClientRect();
    setSelectionBox(rect ? { left: event.clientX - rect.left, top: event.clientY - rect.top, width: 0, height: 0 } : null);
    setSelectedIds([]);
  }

  function startConnection(event: React.PointerEvent, source: string) {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const point = screenToCanvas(event.clientX, event.clientY);
    linkRef.current = { source };
    canvasViewportRef.current?.classList.add("interacting");
    updateDraftEdge(source, point.x, point.y);
  }

  function finishConnection(event: React.PointerEvent, target: string) {
    event.preventDefault(); event.stopPropagation();
    const source = linkRef.current?.source;
    if (source && source !== target) connectNodes(source, target);
    linkRef.current = null;
    clearDraftEdge();
  }

  function handleCanvasDrop(event: React.DragEvent) {
    event.preventDefault();
    const historyId = event.dataTransfer.getData("application/x-vibrule-history");
    if (historyId) {
      const record = historyRecords.find((item) => item.id === historyId);
      if (!record || !canvasViewportRef.current) return;
      const point = screenToCanvas(event.clientX, event.clientY);
      const id = `node-${Date.now()}`;
      setNodes((current) => [...current, { id, type: "source", title: "振动波形", x: point.x - NODE_WIDTH / 2, y: point.y - PORT_Y }]);
      setSelectedIds([id]);
      setDiagnosis(null);
      void loadHistoryIntoNode(record, id);
      return;
    }
    const payload = event.dataTransfer.getData("application/x-vibrule-node");
    if (!payload) return;
    const item = JSON.parse(payload) as { type: NodeType; title: string; metric?: MetricKey; logic?: "AND" | "OR" };
    if (!canvasViewportRef.current) return;
    const point = screenToCanvas(event.clientX, event.clientY);
    const id = `node-${Date.now()}`;
    const specialDefaults: Partial<FlowNode> = item.type === "peakSearch"
      ? { searchMode: "energy", searchMinHz: 0, searchMaxHz: Math.min(1000, fs / 2), energyRatio: 80, harmonicCount: 3, toleranceHz: 3 }
      : item.type === "display" ? { displayMode: "auto" } : {};
    setNodes((current) => [...current, { id, type: item.type, title: item.title, metric: item.metric, logic: item.logic, operator: ">", threshold: item.metric === "kurtosis" ? 3.5 : .2, x: point.x - NODE_WIDTH / 2, y: point.y - PORT_Y, ...specialDefaults }]);
    setSelectedIds([id]); setDiagnosis(null);
  }

  function handleHistoryDropOnSource(event: React.DragEvent, sourceId: string) {
    const historyId = event.dataTransfer.getData("application/x-vibrule-history");
    if (!historyId) return;
    event.preventDefault();
    event.stopPropagation();
    const record = historyRecords.find((item) => item.id === historyId);
    if (record) void loadHistoryIntoNode(record, sourceId);
  }

  function updateNode(id: string, change: Partial<FlowNode>) {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, ...change } : node));
    setDiagnosis(null);
  }

  function removeNode(id: string) {
    setNodes((current) => current.filter((node) => node.id !== id));
    setConnections((current) => current.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id)); setDiagnosis(null);
    setSourceSignals((current) => Object.fromEntries(Object.entries(current).filter(([sourceId]) => sourceId !== id)));
    setPreviewNodeId((current) => current === id ? null : current);
  }

  function clearCanvas() {
    setNodes([]);
    setConnections([]);
    setSourceSignals({});
    setSelectedIds([]);
    linkRef.current = null;
    clearDraftEdge();
    setDiagnosis(null);
    setRunResults(null);
    setPreviewNodeId(null);
    notify("画布与节点波形已清空");
  }

  function evaluateNode(id: string): boolean {
    return runResults?.nodePass.get(id) ?? false;
  }

  function conditionIdsUpstream(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [];
    visited.add(id);
    const node = nodes.find((item) => item.id === id);
    if (!node) return [];
    if (node.type === "condition") return [id];
    return connections.filter((edge) => edge.target === id).flatMap((edge) => conditionIdsUpstream(edge.source, visited));
  }

  function sourceIdsUpstream(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [];
    visited.add(id);
    const node = nodes.find((item) => item.id === id);
    if (!node) return [];
    if (node.type === "source") return sourceSignals[id]?.samples.length ? [id] : [];
    return connections.filter((edge) => edge.target === id).flatMap((edge) => sourceIdsUpstream(edge.source, visited));
  }

  function nodeIdsUpstream(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [];
    visited.add(id);
    return [id, ...connections.filter((edge) => edge.target === id).flatMap((edge) => nodeIdsUpstream(edge.source, visited))];
  }

  function connectedOutputForReport(reportId: string) {
    const outputId = connections.find((edge) => edge.target === reportId)?.source;
    return nodes.find((node) => node.id === outputId && node.type === "output");
  }

  async function downloadReport(reportId: string) {
    const output = connectedOutputForReport(reportId);
    if (!output) { notify("请先把报告导出连接到诊断结果节点"); return; }
    if (!diagnosis || !runResults) { notify("请先运行诊断，再导出报告"); return; }

    const conditionIds = [...new Set(conditionIdsUpstream(output.id))];
    const conditions = conditionIds.map((id) => nodes.find((node) => node.id === id)).filter((node): node is FlowNode => Boolean(node));
    const matched = conditions.filter((node) => evaluateNode(node.id)).length;
    const fault = evaluateNode(output.id);
    const conclusion = fault ? "疑似轴承外圈故障" : "未触发故障规则";
    const generatedAt = new Date();
    const generatedText = generatedAt.toLocaleString("zh-CN", { hour12: false });
    const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = await import("docx");
    const relevantNodeIds = new Set(nodeIdsUpstream(output.id));
    const reportSourceIds = [...new Set(sourceIdsUpstream(output.id))];
    const reportSignals = reportSourceIds.map((id) => ({ id, signal: sourceSignals[id] })).filter((item): item is {id:string;signal:SourceSignal} => Boolean(item.signal));
    const metricRows = nodes.filter((node) => relevantNodeIds.has(node.id) && node.type === "feature" && node.metric && runResults.valueByNode.has(node.id)).map((node) => {
      const key = node.metric!;
      const sourceId = runResults.sourceIdByNode.get(node.id);
      return [`${node.title}${sourceId ? `（${sourceSignals[sourceId]?.fileName ?? sourceId}）` : ""}`, runResults.valueByNode.get(node.id)!.toFixed(key === "kurtosis" || key === "crest" ? 2 : 3), metricInfo[key].unit];
    });
    const conditionRows = conditions.map((node) => {
      const key = node.metric ?? "rms";
      return [node.title, metricInfo[key].label, (runResults.valueByNode.get(node.id) ?? 0).toFixed(3), `${node.operator === ">" ? "大于" : "小于"} ${node.threshold ?? 0}`, evaluateNode(node.id) ? "满足" : "未满足"];
    });
    const makeCell = (text: string, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Microsoft YaHei" })] })] });
    const makeTable = (rows: string[][]) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map((row, rowIndex) => new TableRow({ children: row.map((value) => makeCell(value, rowIndex === 0)) })),
    });

    const report = new Document({ sections: [{ children: [
      new Paragraph({ text: "振动信号故障诊断报告", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `诊断结论：${conclusion}`, bold: true, size: 30, color: fault ? "C62828" : "167D56", font: "Microsoft YaHei" })] }),
      new Paragraph({ text: `规则结果：满足 ${matched}/${conditions.length} 个条件` }),
      new Paragraph({ text: "一、数据与设备参数", heading: HeadingLevel.HEADING_1 }),
      makeTable([
        ["项目", "内容"],
        ...reportSignals.flatMap((item, index) => [[`数据文件 ${index + 1}`, item.signal.fileName], [`采样点数 ${index + 1}`, item.signal.samples.length.toLocaleString()]]),
        ["采样频率", `${fs} Hz`],
        ["设备转速", `${rpm} rpm`],
        ["轴承外圈故障频率 BPFO", `${bpfo} Hz`],
        ["报告生成时间", generatedText],
      ]),
      new Paragraph({ text: "二、特征指标", heading: HeadingLevel.HEADING_1 }),
      makeTable([["指标节点（数据源）", "计算值", "单位"], ...(metricRows.length ? metricRows : [["无已计算特征", "—", "—"]])]),
      new Paragraph({ text: "三、诊断规则明细", heading: HeadingLevel.HEADING_1 }),
      makeTable([["条件节点", "指标", "当前值", "判断规则", "结果"], ...conditionRows]),
      new Paragraph({ text: "四、诊断结论", heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun({ text: conclusion, bold: true, font: "Microsoft YaHei" })] }),
      new Paragraph({ text: fault ? "当前信号同时满足所连接的故障判据，建议结合设备工况、包络谱及现场检查进一步确认轴承外圈状态。" : "当前信号未同时满足所连接的故障判据，建议持续监测趋势，并结合设备工况复核阈值设置。" }),
      new Paragraph({ text: "说明：本报告由 VibRule 低代码振动诊断平台依据当前画布连线、各波形节点数据和运行时参数自动生成。", spacing: { before: 320 } }),
    ] }] });

    try {
      const blob = await Packer.toBlob(report);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = (reportSignals[0]?.signal.fileName ?? "多波形诊断").replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) || "振动信号";
      const stamp = generatedAt.toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "_");
      link.href = url; link.download = `VibRule_${baseName}_${stamp}.docx`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      notify("Word 诊断报告已生成");
    } catch {
      notify("报告生成失败，请重新尝试");
    }
  }

  function runDiagnosis() {
    if (!loadedSourceNodes.length) { notify("请在振动波形节点中导入波形或载入演示数据"); return; }
    const outputs = nodes.filter((node) => node.type === "output");
    const conditionIds = [...new Set(outputs.flatMap((node) => conditionIdsUpstream(node.id)))];

    const sourceIdByNode = new Map<string, string>();
    const metricsBySource = new Map<string, MetricSet>();
    const spectrumBySource = new Map<string, SpectrumPoint[]>();
    const spectrumByNode = new Map<string, SpectrumPoint[]>();
    const valueByNode = new Map<string, number>();
    const peakResultsByNode = new Map<string, PeakSearchResult>();
    const nodePass = new Map<string, boolean>();
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    const resolveSource = (nodeId: string, visiting = new Set<string>()): string | undefined => {
      const cached = sourceIdByNode.get(nodeId);
      if (cached) return cached;
      if (visiting.has(nodeId)) return undefined;
      const node = nodeMap.get(nodeId);
      if (!node) return undefined;
      if (node.type === "source") {
        if (!sourceSignals[nodeId]?.samples.length) return undefined;
        sourceIdByNode.set(nodeId, nodeId);
        return nodeId;
      }
      const next = new Set(visiting).add(nodeId);
      for (const edge of connections.filter((item) => item.target === nodeId)) {
        const sourceId = resolveSource(edge.source, next);
        if (sourceId) { sourceIdByNode.set(nodeId, sourceId); return sourceId; }
      }
      return undefined;
    };
    const getSpectrum = (sourceId: string) => {
      if (!spectrumBySource.has(sourceId)) {
        const samples = sourceSignals[sourceId]?.samples ?? [];
        spectrumBySource.set(sourceId, samples.length >= 64 ? calculateSpectrum(samples, fs) : []);
      }
      return spectrumBySource.get(sourceId) ?? [];
    };
    const getMetrics = (sourceId: string) => {
      if (!metricsBySource.has(sourceId)) metricsBySource.set(sourceId, calculateMetricsForSignal(sourceSignals[sourceId]?.samples ?? [], getSpectrum(sourceId), fs, bpfo));
      return metricsBySource.get(sourceId)!;
    };

    nodes.forEach((node) => {
      const sourceId = resolveSource(node.id);
      if (!sourceId) return;
      if (node.type === "feature" && node.metric) {
        const spectrum = getSpectrum(sourceId);
        if (node.title.includes("FFT")) spectrumByNode.set(node.id, spectrum);
        valueByNode.set(node.id, getMetrics(sourceId)[node.metric]);
      }
      if (node.type === "peakSearch") {
        const spectrum = getSpectrum(sourceId);
        spectrumByNode.set(node.id, spectrum);
        peakResultsByNode.set(node.id, searchSpectrumPeaks(spectrum, node, bpfo));
      }
      if (node.type === "display") {
        const inputId = connections.find((edge) => edge.target === node.id)?.source;
        const inputNode = inputId ? nodeMap.get(inputId) : undefined;
        if (inputId && inferDisplayMode(node, inputNode) === "spectrum") spectrumByNode.set(inputId, getSpectrum(sourceId));
      }
      if (node.type === "condition" && node.metric && node.operator && node.threshold !== undefined) {
        const value = getMetrics(sourceId)[node.metric];
        valueByNode.set(node.id, value);
        nodePass.set(node.id, node.operator === ">" ? value > node.threshold : value < node.threshold);
      }
    });

    const evaluate = (id: string, visiting = new Set<string>()): boolean => {
      if (nodePass.has(id)) return nodePass.get(id)!;
      if (visiting.has(id)) return false;
      const node = nodeMap.get(id);
      if (!node) return false;
      const incoming = connections.filter((edge) => edge.target === id).map((edge) => edge.source);
      const next = new Set(visiting).add(id);
      let pass = Boolean(resolveSource(id));
      if (node.type === "logic") pass = incoming.length > 0 && (node.logic === "OR" ? incoming.some((source) => evaluate(source, next)) : incoming.every((source) => evaluate(source, next)));
      if (node.type === "output") pass = incoming.length > 0 && incoming.every((source) => evaluate(source, next));
      nodePass.set(id, pass);
      return pass;
    };
    outputs.forEach((node) => evaluate(node.id));
    setRunResults({ sourceIdByNode, metricsBySource, spectrumByNode, valueByNode, peakResultsByNode, nodePass });
    const canDiagnose = outputs.length > 0 && conditionIds.length > 0 && conditionIds.some((id) => resolveSource(id));
    if (canDiagnose) {
      const matched = conditionIds.filter((id) => evaluate(id)).length;
      setDiagnosis({ fault: outputs.some((node) => evaluate(node.id)), matched, total: conditionIds.length });
      notify(`诊断完成，已计算 ${metricsBySource.size} 个波形数据流`);
    } else {
      setDiagnosis(null);
      notify(metricsBySource.size || spectrumByNode.size ? "数据流计算完成；连接条件和诊断结果后可生成结论" : "未发现连接到计算控件的有效波形");
    }
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const selectedNodes = nodes.filter((node) => selectedIds.includes(node.id));
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : undefined;
  const resultText = diagnosis ? (diagnosis.fault ? "疑似轴承外圈故障" : "未触发故障规则") : "等待运行";
  const previewNode = previewNodeId ? nodeById.get(previewNodeId) : undefined;
  const previewInputId = previewNode ? connections.find((edge) => edge.target === previewNode.id)?.source : undefined;
  const previewInputNode = previewInputId ? nodeById.get(previewInputId) : undefined;
  const previewMode = previewNode ? inferDisplayMode(previewNode, previewInputNode) : "waveform";
  const previewSourceId = previewInputNode ? (previewInputNode.type === "source" ? previewInputNode.id : runResults?.sourceIdByNode.get(previewInputNode.id)) : undefined;
  const previewSignal = previewSourceId ? sourceSignals[previewSourceId] : undefined;
  const previewSamples = previewSignal?.samples ?? [];
  const previewMetrics = previewSourceId ? runResults?.metricsBySource.get(previewSourceId) : undefined;
  const previewSpectrum = previewInputNode ? runResults?.spectrumByNode.get(previewInputNode.id) ?? [] : [];
  const previewValue = previewInputNode ? runResults?.valueByNode.get(previewInputNode.id) : undefined;
  const previewSearchResult = previewInputNode?.type === "peakSearch" ? runResults?.peakResultsByNode.get(previewInputNode.id) : undefined;
  const previewMinHz = previewInputNode?.type === "peakSearch" ? previewInputNode.searchMinHz ?? 0 : 0;
  const previewMaxHz = previewInputNode?.type === "peakSearch" ? previewInputNode.searchMaxHz ?? fs / 2 : fs / 2;
  const previewSpectrumBand = previewSpectrum.filter((point) => point.f >= Math.min(previewMinHz, previewMaxHz) && point.f <= Math.max(previewMinHz, previewMaxHz));
  const previewSpectrumMax = previewSpectrumBand.reduce((best, point) => point.a > best.a ? point : best, { f: 0, a: 0 });
  const spectrumResolution = previewSpectrum.length > 1 ? previewSpectrum[1].f - previewSpectrum[0].f : 0;
  const previewSignalRange = previewSamples.length ? previewSamples.reduce((range, value) => ({ min: Math.min(range.min, value), max: Math.max(range.max, value) }), { min: previewSamples[0], max: previewSamples[0] }) : { min: 0, max: 0 };

  return <main className="flow-app">
    <header className="flow-header">
      <div className="flow-brand"><span>∿</span><div><strong>VibRule</strong><small>工业振动规则诊断平台</small></div></div>
      <div className="flow-actions">
        <span className="data-state"><i className={loadedSourceNodes.length ? "ready" : ""}/>{loadedSourceNodes.length ? `${loadedSourceNodes.length} 个波形节点 · 共 ${loadedPointCount.toLocaleString()} 点` : "请在波形节点中导入数据"}</span>
        <button className="ghost-button" onClick={() => {setNodes(starterNodes);setConnections(starterConnections);setSelectedIds([]);setDiagnosis(null);setRunResults(null);setPreviewNodeId(null);setCanvasView(INITIAL_VIEW);}}>恢复示例</button>
        <button className="ghost-button" onClick={() => {setConnections([]);setDiagnosis(null);}}>清空连线</button>
        <button className="ghost-button clear-canvas-button" onClick={clearCanvas}>清空画布</button>
        <button className="run-button" onClick={runDiagnosis}>▶ 运行诊断</button>
      </div>
    </header>

    <div className="flow-body">
      <aside className="node-palette">
        <div className="palette-head"><h1>{sidebarMode === "nodes" ? "节点工具箱" : "历史数据"}</h1><p>{sidebarMode === "nodes" ? "拖到右侧画布中使用" : "拖到画布或已有波形节点"}</p></div>
        <div className="sidebar-tabs" role="tablist" aria-label="左侧面板">
          <button role="tab" aria-selected={sidebarMode === "nodes"} className={sidebarMode === "nodes" ? "active" : ""} onClick={() => setSidebarMode("nodes")}>节点工具箱</button>
          <button role="tab" aria-selected={sidebarMode === "history"} className={sidebarMode === "history" ? "active" : ""} onClick={() => setSidebarMode("history")}>历史数据</button>
        </div>
        {sidebarMode === "nodes" && <><div className="source-import-tip"><span>1</span><div><strong>先拖入“振动波形”</strong><small>每个波形节点可独立导入一个 TXT / CSV 文件</small></div></div><div className="quick-params"><label>采样频率<input value={fs} type="number" onChange={(event) => {setFs(Number(event.target.value)||1);setDiagnosis(null);}}/><em>Hz</em></label><label>设备转速<input value={rpm} type="number" onChange={(event) => setRpm(Number(event.target.value)||0)}/><em>rpm</em></label></div></>}
        {sidebarMode === "nodes" ? <div className="palette-scroll">{palette.map((group) => <section key={group.group}><h2>{group.group}</h2>{group.items.map((item) => <div className="palette-node" key={`${item.type}-${item.title}`} draggable onDragStart={(event) => {event.dataTransfer.effectAllowed="copy";event.dataTransfer.setData("application/x-vibrule-node",JSON.stringify(item));}}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.desc}</small></div><b>⠿</b></div>)}</section>)}</div> : <div className="history-panel">
          <section className="history-import-card">
            <label className={`history-drop-zone ${historyDropActive ? "active" : ""}`} onDragEnter={(event)=>{event.preventDefault();setHistoryDropActive(true);}} onDragOver={(event)=>event.preventDefault()} onDragLeave={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setHistoryDropActive(false);}} onDrop={(event)=>{event.preventDefault();setHistoryDropActive(false);queueHistoryFiles(event.dataTransfer.files);}}>
              <input type="file" accept=".txt,.csv" multiple onChange={(event)=>{if(event.target.files)queueHistoryFiles(event.target.files);event.currentTarget.value="";}}/>
              <span>＋</span><div><strong>拖入或选择波形文件</strong><small>支持多个 TXT / CSV，共用下方参数</small></div>
            </label>
            {pendingHistoryFiles.length > 0 && <div className="history-file-summary"><span>已选择 {pendingHistoryFiles.length} 个文件</span><button onClick={()=>setPendingHistoryFiles([])} disabled={historyImporting}>清空</button><small>{pendingHistoryFiles.slice(0,3).map((file)=>file.name).join("、")}{pendingHistoryFiles.length>3?` 等 ${pendingHistoryFiles.length} 个`:""}</small></div>}
            <div className="history-import-params"><label>采样点数<input aria-label="历史数据采样点数" type="number" min="64" step="1" value={historySampleCount} onChange={(event)=>setHistorySampleCount(Number(event.target.value))}/><em>点</em></label><label>最大分析频率<input aria-label="历史数据最大分析频率" type="number" min="1" step="1" value={historyMaxFrequency} onChange={(event)=>setHistoryMaxFrequency(Number(event.target.value))}/><em>Hz</em></label></div>
            <button className="history-import-button" onClick={importPendingHistory} disabled={historyImporting || !pendingHistoryFiles.length}>{historyImporting ? "正在导入…" : `确认导入${pendingHistoryFiles.length ? `（${pendingHistoryFiles.length}）` : ""}`}</button>
            <small className="history-import-note">点击确认前，文件不会进入历史数据</small>
          </section>
          <div className="history-search"><span>⌕</span><input aria-label="搜索历史数据" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="搜索文件名称"/></div>
          {!historyConfigured && <div className="history-state"><span>☁</span><strong>等待连接云端数据库</strong><small>完成 Supabase 配置后，导入的真实波形会自动出现在这里。</small></div>}
          {historyConfigured && historyLoading && <div className="history-state compact"><span>…</span><strong>正在读取历史数据</strong></div>}
          {historyConfigured && !historyLoading && historyError && <div className="history-state error"><span>!</span><strong>{historyError}</strong><button onClick={() => setHistoryRefresh((value) => value + 1)}>重新加载</button></div>}
          {historyConfigured && !historyLoading && !historyError && !historyRecords.length && <div className="history-state"><span>∿</span><strong>{historySearch ? "没有匹配的数据" : "暂无历史数据"}</strong><small>{historySearch ? "换一个文件名关键词试试" : "从上方选择文件并确认导入"}</small></div>}
          {historyConfigured && !historyLoading && !historyError && historyRecords.length > 0 && <div className="history-list">{historyRecords.map((record) => <div className="history-row" key={record.id} draggable onDragStart={(event) => {event.dataTransfer.effectAllowed="copy";event.dataTransfer.setData("application/x-vibrule-history",record.id);}} title="拖到画布空白处或已有振动波形节点">
            <span className="history-wave">∿</span><div><strong>{record.file_name}</strong><small>{new Date(record.created_at).toLocaleString("zh-CN", {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false})} · {record.sample_count.toLocaleString()} 点</small><em>最大分析频率 {(record.sampling_frequency / 2).toLocaleString()} Hz</em></div><b>⠿</b>
          </div>)}</div>}
        </div>}
      </aside>

      <section className="canvas-area">
        <div className="canvas-toolbar">
          <div className="canvas-title"><span>左键拖动框选节点 · 按住滚轮平移画布 · 拖动端口自由连线</span></div>
          <div className="canvas-tools">
            <div className="legend"><span><i className="source-dot"/>数据</span><span><i className="feature-dot"/>计算</span><span><i className="condition-dot"/>条件</span><span><i className="output-dot"/>输出</span><span><i className="report-dot"/>报告</span></div>
            <div className="zoom-control"><button aria-label="缩小画布" onClick={() => zoomCanvas(canvasView.scale - .1)}>−</button><button className="zoom-value" onClick={() => setCanvasView(INITIAL_VIEW)}>{Math.round(canvasView.scale * 100)}%</button><button aria-label="放大画布" onClick={() => zoomCanvas(canvasView.scale + .1)}>＋</button><button className="view-reset" onClick={() => setCanvasView(INITIAL_VIEW)}>复位</button></div>
          </div>
        </div>
        <div
          className={`canvas-viewport ${isPanning ? "panning" : ""}`}
          ref={canvasViewportRef}
          style={{ backgroundSize: `${24 * canvasView.scale}px ${24 * canvasView.scale}px`, backgroundPosition: `${canvasView.x}px ${canvasView.y}px` }}
          onPointerDown={startCanvasInteraction}
          onAuxClick={(event)=>event.preventDefault()}
          onDragOver={(event) => {event.preventDefault();event.dataTransfer.dropEffect="copy";}}
          onDrop={handleCanvasDrop}
        >
          <div className="canvas-plane" style={{ transform: `translate(${canvasView.x}px, ${canvasView.y}px) scale(${canvasView.scale})` }}>
            <svg className="edge-layer" width="1" height="1">
              {connections.map((edge) => {
                const source = nodeById.get(edge.source), target = nodeById.get(edge.target);
                if (!source || !target) return null;
                const sx = source.x + NODE_WIDTH, sy = source.y + PORT_Y, tx = target.x, ty = target.y + PORT_Y;
                return <path key={edge.id} d={`M${sx},${sy} C${sx+80},${sy} ${tx-80},${ty} ${tx},${ty}`} onClick={(event) => {event.stopPropagation();setConnections((current)=>current.filter((item)=>item.id!==edge.id));setDiagnosis(null);}}><title>点击删除连线</title></path>;
              })}
              <path ref={draftEdgeRef} className="draft-edge"/>
            </svg>
            {nodes.map((node) => <article key={node.id} data-node-id={node.id} className={`flow-node ${node.type} ${selectedIds.includes(node.id)?"selected":""}`} style={{transform:`translate3d(${node.x}px,${node.y}px,0)`}} onPointerDown={(event)=>startNodeDrag(event,node.id)} onClick={(event)=>{event.stopPropagation();setSelectedIds([node.id]);}} onDragOver={node.type === "source" ? (event) => {event.preventDefault();event.dataTransfer.dropEffect="copy";} : undefined} onDrop={node.type === "source" ? (event) => handleHistoryDropOnSource(event,node.id) : undefined}>
              <button className="input-port port" data-input-node={node.id} aria-label={`连接到${node.title}`} onPointerUp={(event)=>finishConnection(event,node.id)}/>
              {node.type !== "report" && node.type !== "display" && <button className="output-port port" aria-label={`从${node.title}开始连线`} onPointerDown={(event)=>startConnection(event,node.id)}/>} 
              <header><span className="node-type-icon">{node.type==="source"?"∿":node.type==="feature"?"ƒ":node.type==="peakSearch"?"⌃":node.type==="condition"?"?":node.type==="logic"?(node.logic==="AND"?"&":"≥1"):node.type==="display"?"▥":node.type==="report"?"W":"!"}</span><div><small>{node.type==="source"?"数据输入":node.type==="feature"?"信号处理":node.type==="peakSearch"?"频谱分析":node.type==="condition"?"条件判断":node.type==="logic"?"逻辑组合":node.type==="display"?"数据显示":node.type==="report"?"报告输出":"诊断输出"}</small><strong>{node.title}</strong></div><button className="node-delete" aria-label="删除节点" onClick={()=>removeNode(node.id)}>×</button></header>
              {node.type === "source" && (()=>{const signal=sourceSignals[node.id];const calculated=Boolean(runResults&&(runResults.metricsBySource.has(node.id)||runResults.spectrumByNode.has(node.id)));return <div className="node-body source-node-body"><div className="source-wave-preview"><TinyWave samples={signal?.samples??[]}/><div><strong>{signal?.fileName??"未导入波形"}</strong><small>{signal?`${signal.samples.length.toLocaleString()} 点 · ${calculated?"已完成计算":"待运行计算"}`:"可导入文件或接收历史数据"}</small></div></div><div className="source-node-actions"><label><input type="file" accept=".txt,.csv" onChange={(event)=>{loadFile(node.id,event.target.files?.[0]);event.currentTarget.value="";}}/><span>＋ 导入波形</span></label><button onClick={()=>loadDemo(node.id)}>演示数据</button></div>{signal?.historyId&&<div className="history-linked">☁ 已连接历史数据</div>}</div>;})()}
              {node.type === "feature" && node.metric && (()=>{const linked=connections.some((edge)=>edge.target===node.id);const value=runResults?.valueByNode.get(node.id);return <div className="node-body value-body"><span>{metricInfo[node.metric].label}</span><strong>{value===undefined?"—":value.toFixed(node.metric==="kurtosis"||node.metric==="crest"?2:3)}</strong><small>{!linked?"等待连接":!runResults?"点击运行诊断":value===undefined?"上游无波形":metricInfo[node.metric].unit}</small></div>;})()}
              {node.type === "peakSearch" && (() => {
                const linked = connections.some((edge) => edge.target === node.id);
                const result = runResults?.peakResultsByNode.get(node.id);
                return <div className="node-body peak-search-body">
                  <label className="field-label">搜索频段 <span>Hz</span></label>
                  <div className="range-fields"><input aria-label="搜索起始频率" type="number" min="0" value={node.searchMinHz ?? 0} onChange={(event)=>updateNode(node.id,{searchMinHz:Number(event.target.value)})}/><b>—</b><input aria-label="搜索结束频率" type="number" min="0" value={node.searchMaxHz ?? Math.min(1000,fs/2)} onChange={(event)=>updateNode(node.id,{searchMaxHz:Number(event.target.value)})}/></div>
                  <label className="field-label mode-label">搜索方式<select value={node.searchMode ?? "energy"} onChange={(event)=>updateNode(node.id,{searchMode:event.target.value as SearchMode})}><option value="energy">能量占比</option><option value="harmonic">倍频搜索</option></select></label>
                  {(node.searchMode ?? "energy") === "energy" ? <div className="energy-settings"><label>累计能量上限</label><div><input aria-label="累计能量上限" type="number" min="1" max="100" value={node.energyRatio ?? 80} onChange={(event)=>updateNode(node.id,{energyRatio:Number(event.target.value)})}/><span>%</span></div><small>峰值按幅值降序累加，不超过该占比</small></div> : <div className="harmonic-settings"><div className="theory-base"><span>理论基频</span><b>{bpfo.toFixed(2)} Hz · BPFO</b></div><div className="harmonic-fields"><label>搜索到<input aria-label="搜索倍频数" type="number" min="1" max="20" value={node.harmonicCount ?? 3} onChange={(event)=>updateNode(node.id,{harmonicCount:Number(event.target.value)})}/><span>倍频</span></label><label>左右容差<input aria-label="倍频搜索容差" type="number" min="0.1" step="0.1" value={node.toleranceHz ?? 3} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/><span>Hz</span></label></div></div>}
                  <div className={`peak-results ${result?"ready":""}`}><div><span>{!linked?"请连接 FFT 频谱":!runResults?"等待运行诊断":!result?"上游没有有效波形":`${result.peaks.length} 个峰值`}</span>{result&&<small>{node.searchMode==="harmonic"?"理论频率附近最大峰":"已选峰值能量 "+result.energyPercent.toFixed(1)+"%"}</small>}</div>{result&&<strong>{result.peaks[0]?`${result.peaks[0].f.toFixed(2)} Hz` : "无结果"}</strong>}</div>
                  {result&&result.peaks.length>0&&<div className="peak-list">{result.peaks.slice(0,4).map((peak,index)=><span key={`${peak.f}-${index}`}><b>{peak.order?`${peak.order}×`:`#${index+1}`}</b>{peak.f.toFixed(2)} Hz<em>{peak.a.toFixed(3)}</em></span>)}</div>}
                </div>;
              })()}
              {node.type === "condition" && (()=>{const linked=connections.some((edge)=>edge.target===node.id);const value=runResults?.valueByNode.get(node.id);const pass=runResults?.nodePass.get(node.id);return <div className="node-body condition-body"><select value={node.metric} onChange={(event)=>updateNode(node.id,{metric:event.target.value as MetricKey})}>{Object.entries(metricInfo).map(([key,info])=><option value={key} key={key}>{info.label}</option>)}</select><div><select value={node.operator} onChange={(event)=>updateNode(node.id,{operator:event.target.value as ">"|"<"})}><option value=">">大于</option><option value="<">小于</option></select><input value={node.threshold} type="number" step="0.01" onChange={(event)=>updateNode(node.id,{threshold:Number(event.target.value)})}/></div><small className={pass?"pass":""}>{!linked?"等待连接数据":!runResults?"等待运行诊断":value===undefined?"上游没有有效波形":`当前 ${value.toFixed(3)} · ${pass?"满足":"未满足"}`}</small></div>;})()}
              {node.type === "logic" && <div className="node-body logic-body"><div><button className={node.logic==="AND"?"active":""} onClick={()=>updateNode(node.id,{logic:"AND",title:"全部满足"})}>AND</button><button className={node.logic==="OR"?"active":""} onClick={()=>updateNode(node.id,{logic:"OR",title:"任一满足"})}>OR</button></div><small>{runResults&&runResults.nodePass.has(node.id)?(runResults.nodePass.get(node.id)?"计算满足":"计算未满足"):`${connections.filter((edge)=>edge.target===node.id).length} 个输入`}</small></div>}
              {node.type === "display" && (() => {
                const inputId = connections.find((edge)=>edge.target===node.id)?.source;
                const inputNode = inputId ? nodeById.get(inputId) : undefined;
                const mode = inferDisplayMode(node, inputNode);
                const sourceId = inputNode ? (inputNode.type==="source"?inputNode.id:runResults?.sourceIdByNode.get(inputNode.id)) : undefined;
                const signal = sourceId ? sourceSignals[sourceId] : undefined;
                const displaySamples = signal?.samples ?? [];
                const displaySpectrum = inputNode ? runResults?.spectrumByNode.get(inputNode.id) ?? [] : [];
                const searchResult = inputNode?.type==="peakSearch" ? runResults?.peakResultsByNode.get(inputNode.id) : undefined;
                const minHz = inputNode?.type==="peakSearch" ? inputNode.searchMinHz ?? 0 : 0;
                const maxHz = inputNode?.type==="peakSearch" ? inputNode.searchMaxHz ?? fs/2 : fs/2;
                const metric = inputNode?.metric;
                const value = inputNode ? runResults?.valueByNode.get(inputNode.id) : undefined;
                const ready = mode==="waveform" ? Boolean(signal&&(inputNode?.type==="source"||runResults)) : mode==="spectrum" ? Boolean(runResults&&displaySpectrum.length) : Boolean(runResults&&value!==undefined);
                const openPreview = (event: React.MouseEvent) => { event.stopPropagation(); setPreviewNodeId(node.id); };
                return <div className="node-body display-body">
                  <div className="display-controls"><select aria-label="显示数据类型" value={node.displayMode ?? "auto"} onChange={(event)=>updateNode(node.id,{displayMode:event.target.value as DisplayMode})}><option value="auto">自动识别</option><option value="waveform">波形</option><option value="spectrum">频谱</option><option value="value">数值</option></select><span>{inputNode?`来源：${inputNode.title}`:"等待连接数据"}</span><button className="open-preview" disabled={!ready} onClick={openPreview}>放大</button></div>
                  {inputNode&&mode==="waveform"&&ready&&<button type="button" className="chart-preview" onClick={openPreview}><DataWave samples={displaySamples}/><div className="chart-axis"><span>0 s</span><b>点击查看真实数据</b><span>{(displaySamples.length/fs).toFixed(2)} s</span></div></button>}
                  {inputNode&&mode==="spectrum"&&ready&&<button type="button" className="chart-preview" onClick={openPreview}><SpectrumChart spectrum={displaySpectrum} minHz={minHz} maxHz={maxHz} peaks={searchResult?.peaks}/><div className="chart-axis"><span>{minHz.toFixed(0)} Hz</span><b>{searchResult?.peaks.length?`${searchResult.peaks.length} 个峰值已标记`:"点击查看真实频谱"}</b><span>{maxHz.toFixed(0)} Hz</span></div></button>}
                  {inputNode&&mode==="value"&&ready&&<button type="button" className="chart-preview" onClick={openPreview}><div className="display-value"><span>{metric?metricInfo[metric].label:"数据值"}</span><strong>{value===undefined?"—":value.toFixed(metric==="kurtosis"||metric==="crest"?2:3)}</strong><small>{value===undefined?"等待运行诊断":metric?metricInfo[metric].unit:"当前输入无标量值"}</small></div></button>}
                  {inputNode&&!ready&&<div className="display-empty"><span>▶</span><p>{!signal?"请先在对应波形节点中导入数据":"点击右上角运行诊断后显示"}</p></div>}
                  {!inputNode&&<div className="display-empty"><span>▥</span><p>连接波形、FFT 频谱或峰值搜索节点</p></div>}
                </div>;
              })()}
              {node.type === "output" && <div className={`node-body output-body ${diagnosis?(diagnosis.fault?"fault":"normal"):""}`}><span>{diagnosis?(diagnosis.fault?"!":"✓"):"?"}</span><div><strong>{resultText}</strong><small>{diagnosis?`满足 ${diagnosis.matched}/${diagnosis.total} 个条件`:"点击右上角运行"}</small></div></div>}
              {node.type === "report" && (() => { const output=connectedOutputForReport(node.id); const ready=Boolean(output&&diagnosis); return <div className={`node-body report-body ${ready?"ready":""}`}><div><span>DOCX</span><small>{!output?"请连接诊断结果":diagnosis?"报告内容已就绪":"运行诊断后下载"}</small></div><button disabled={!ready} onClick={()=>downloadReport(node.id)}>↓ 下载 Word</button></div>; })()}
            </article>)}
          </div>
          {selectionBox&&<div className="selection-marquee" style={selectionBox}>{selectedIds.length>0&&<span>{selectedIds.length} 个节点</span>}</div>}
          <div className="canvas-tip"><b>无限画布</b><span>左键框选 · 滚轮拖动平移 · Ctrl + 滚轮缩放 · Delete 删除节点</span></div>
        </div>
        {selectedIds.length>0 && <div className="selection-chip"><span>已选择</span>{selectedNode?<><b>{selectedNode.title}</b><small>位置 {Math.round(selectedNode.x)}, {Math.round(selectedNode.y)} · Delete 删除</small></>:<><b>{selectedIds.length} 个节点</b><small>按 Delete 批量删除</small></>}</div>}
      </section>
    </div>
    {toast && <div className="toast">{toast}</div>}
    {previewNode && previewInputNode && <div className="data-modal-backdrop" onPointerDown={(event)=>{if(event.target===event.currentTarget)setPreviewNodeId(null);}}>
      <section className="data-modal" role="dialog" aria-modal="true" aria-label="接入数据详情" onPointerDown={(event)=>event.stopPropagation()}>
        <header className="data-modal-header">
          <div className="modal-title-icon">{previewMode==="waveform"?"∿":previewMode==="spectrum"?"⌁":"#"}</div>
          <div>
            <span>接入数据详情</span>
            <h2>{previewMode==="waveform"?"真实波形数据":previewMode==="spectrum"?"真实频谱数据":"真实计算数据"}</h2>
            <p>{previewSignal?.fileName??"未导入波形"} · 来源节点：{previewInputNode.title}</p>
          </div>
          <button className="modal-close" aria-label="关闭数据详情" onClick={()=>setPreviewNodeId(null)}>×</button>
        </header>

        <div className="modal-data-summary">
          <span className="modal-badge live"><i/>当前接入数据</span>
          <span className="modal-badge">采样频率 {fs.toLocaleString()} Hz</span>
          <span className="modal-badge">{previewSamples.length.toLocaleString()} 个原始采样点</span>
          {previewMode==="spectrum"&&<span className="modal-badge">频段 {Math.min(previewMinHz,previewMaxHz).toFixed(1)}–{Math.max(previewMinHz,previewMaxHz).toFixed(1)} Hz</span>}
        </div>

        <div className="detail-chart-panel">
          {!previewSamples.length&&<div className="modal-empty"><span>∿</span><strong>等待真实数据</strong><p>请在对应的振动波形节点中导入 TXT / CSV 或载入演示数据。</p></div>}
          {previewSamples.length>0&&previewMode==="waveform"&&<DetailedWave samples={previewSamples} fs={fs}/>} 
          {previewSamples.length>0&&previewMode==="spectrum"&&<DetailedSpectrum spectrum={previewSpectrum} minHz={previewMinHz} maxHz={previewMaxHz} peaks={previewSearchResult?.peaks}/>} 
          {previewSamples.length>0&&previewMode==="value"&&<div className="modal-value"><span>{previewInputNode.metric?metricInfo[previewInputNode.metric].label:"当前计算值"}</span><strong>{previewValue===undefined?"—":previewValue.toFixed(previewInputNode.metric==="kurtosis"||previewInputNode.metric==="crest"?3:4)}</strong><small>{previewValue===undefined?"等待运行诊断":previewInputNode.metric?metricInfo[previewInputNode.metric].unit:"当前输入没有可展示的标量值"}</small></div>}
        </div>

        {previewMode==="waveform"&&<div className="data-stats-grid">
          <div><span>采样点数</span><strong>{previewSamples.length.toLocaleString()}</strong><small>points</small></div>
          <div><span>采样时长</span><strong>{(previewSamples.length/Math.max(1,fs)).toFixed(4)}</strong><small>s</small></div>
          <div><span>最小幅值</span><strong>{previewSignalRange.min.toFixed(4)}</strong><small>signal</small></div>
          <div><span>最大幅值</span><strong>{previewSignalRange.max.toFixed(4)}</strong><small>signal</small></div>
          <div><span>有效值 RMS</span><strong>{previewMetrics?previewMetrics.rms.toFixed(4):"—"}</strong><small>{previewMetrics?"signal":"运行后计算"}</small></div>
          <div><span>峰值</span><strong>{previewMetrics?previewMetrics.peak.toFixed(4):"—"}</strong><small>{previewMetrics?"signal":"运行后计算"}</small></div>
        </div>}

        {previewMode==="spectrum"&&<div className="data-stats-grid">
          <div><span>频谱点数</span><strong>{previewSpectrumBand.length.toLocaleString()}</strong><small>bins</small></div>
          <div><span>频率分辨率</span><strong>{spectrumResolution.toFixed(4)}</strong><small>Hz</small></div>
          <div><span>分析频段</span><strong>{Math.min(previewMinHz,previewMaxHz).toFixed(1)}–{Math.max(previewMinHz,previewMaxHz).toFixed(1)}</strong><small>Hz</small></div>
          <div><span>最大峰频率</span><strong>{previewSpectrumMax.f.toFixed(2)}</strong><small>Hz</small></div>
          <div><span>最大峰幅值</span><strong>{previewSpectrumMax.a.toFixed(4)}</strong><small>amplitude</small></div>
          <div><span>已搜索峰值</span><strong>{previewSearchResult?.peaks.length ?? 0}</strong><small>peaks</small></div>
        </div>}

        {previewMode==="value"&&previewInputNode.metric&&<div className="data-stats-grid value-stats">
          <div><span>指标名称</span><strong>{metricInfo[previewInputNode.metric].label}</strong><small>{previewInputNode.title}</small></div>
          <div><span>当前计算值</span><strong>{previewValue===undefined?"—":previewValue.toFixed(5)}</strong><small>{metricInfo[previewInputNode.metric].unit}</small></div>
          <div><span>输入采样点</span><strong>{previewSamples.length.toLocaleString()}</strong><small>points</small></div>
        </div>}

        {previewSearchResult&&previewSearchResult.peaks.length>0&&<section className="modal-peak-section">
          <div className="peak-section-title"><div><span>峰值搜索明细</span><h3>{previewSearchResult.peaks.length} 个真实频谱峰值</h3></div><small>搜索峰值能量占比 {previewSearchResult.energyPercent.toFixed(1)}%</small></div>
          <div className="peak-table-wrap"><table><thead><tr><th>序号</th>{previewSearchResult.peaks.some((peak)=>peak.theoretical!==undefined)&&<th>理论频率</th>}<th>搜索频率</th>{previewSearchResult.peaks.some((peak)=>peak.theoretical!==undefined)&&<th>偏差</th>}<th>峰值幅值</th></tr></thead><tbody>{previewSearchResult.peaks.slice(0,40).map((peak,index)=><tr key={`${peak.f}-${index}`}><td>{peak.order?`${peak.order} 倍频`:`#${index+1}`}</td>{peak.theoretical!==undefined&&<td>{peak.theoretical.toFixed(2)} Hz</td>}<td><b>{peak.f.toFixed(3)} Hz</b></td>{peak.theoretical!==undefined&&<td>{(peak.f-peak.theoretical).toFixed(3)} Hz</td>}<td>{peak.a.toFixed(5)}</td></tr>)}</tbody></table></div>
        </section>}

        <footer className="modal-note"><span>i</span><p>图形来自当前连接链路中“{previewSignal?.fileName??"未导入波形"}”的真实数据。波形大图使用全部 {previewSamples.length.toLocaleString()} 个采样点；FFT、特征与峰值只在点击“运行诊断”后更新。</p></footer>
      </section>
    </div>}
  </main>;
}
