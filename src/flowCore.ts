export type SpectrumPoint = { f: number; a: number };
export type PeakPoint = SpectrumPoint & {
  sourceIndex?: number;
  theoretical?: number;
  order?: number;
  prominence?: number;
  energyRatio?: number;
};
export type FrequencyBand = { min: number; max: number; center: number };

export type WaveformData = {
  samples: number[];
  fs: number;
  fileName: string;
};

export type SourceSignal = WaveformData & {
  revision: number;
  historyId?: string;
};

export type ValueType =
  | "number"
  | "boolean"
  | "waveform"
  | "spectrum"
  | "numbers"
  | "booleans"
  | "peaks"
  | "bands"
  | "waveforms"
  | "spectra";

export type RuntimeValue =
  | { type: "number"; data: number; unit?: string }
  | { type: "boolean"; data: boolean; value?: number; detail?: string }
  | { type: "waveform"; data: WaveformData }
  | { type: "spectrum"; data: SpectrumPoint[] }
  | { type: "numbers"; data: number[]; unit?: string }
  | { type: "booleans"; data: boolean[] }
  | { type: "peaks"; data: PeakPoint[] }
  | { type: "bands"; data: FrequencyBand[] }
  | { type: "waveforms"; data: WaveformData[] }
  | { type: "spectra"; data: SpectrumPoint[][] };

export type NodeKind =
  | "source"
  | "metric"
  | "fft"
  | "constant"
  | "math"
  | "absolute"
  | "round"
  | "compare"
  | "logic"
  | "gate"
  | "select"
  | "listCount"
  | "listFilter"
  | "listSort"
  | "topN"
  | "minmax"
  | "listItem"
  | "listMerge"
  | "fieldExtract"
  | "integrate"
  | "alignSpectrum"
  | "bandSlice"
  | "bandpass"
  | "hilbert"
  | "peakDetect"
  | "harmonicSearch"
  | "harmonicSequence"
  | "frequencyExclude"
  | "totalEnergy"
  | "peakEnergyRatio"
  | "localContrast"
  | "slidingEnergy"
  | "bandConstruct"
  | "frequencyMatch"
  | "metricRatioCompare"
  | "rotationFrequency"
  | "candidateScreen"
  | "differenceBands"
  | "envelopeSpectrum"
  | "cageSearch"
  | "spectrumPresence"
  | "integerRelation"
  | "display"
  | "output"
  | "report";

export type NodeFamily = "source" | "metric" | "math" | "condition" | "signal" | "spectrum" | "list" | "display" | "output" | "report";

export type FlowNode = {
  id: string;
  kind: NodeKind;
  family: NodeFamily;
  title: string;
  x: number;
  y: number;
  samplingFrequency?: number;
  rpm?: number;
  metric?: "rms" | "peak" | "kurtosis" | "crest";
  numberValue?: number;
  unit?: string;
  operation?: "+" | "-" | "*" | "/" | "pow";
  compareOp?: ">" | "<" | ">=" | "<=" | "=" | "!=";
  logic?: "AND" | "OR" | "NOT";
  roundMode?: "round" | "floor" | "ceil";
  sortDirection?: "asc" | "desc";
  sortField?: "value" | "frequency" | "amplitude" | "energyRatio";
  selectField?: "value" | "frequency" | "amplitude" | "energyRatio";
  outputField?: "value" | "frequency" | "amplitude" | "energyRatio";
  index?: number;
  count?: number;
  minProminence?: number;
  minDistanceHz?: number;
  maxPeaks?: number;
  harmonicOrders?: string;
  toleranceHz?: number;
  startOrder?: number;
  endOrder?: number;
  windowHz?: number;
  stepHz?: number;
  highpassHz?: number;
  bandMultiplier?: number;
  excludeEndOrder?: number;
  halfWidthHz?: number;
  primaryRatio?: number;
  fallbackRatio?: number;
  minHits?: number;
  minOrder?: number;
  maxOrder?: number;
  deviationLimit?: number;
  displayMode?: "auto" | "waveform" | "spectrum" | "value" | "list";
  resultText?: string;
};

export type Connection = { id: string; source: string; target: string; targetPort: string };
export type InputPort = { key: string; label: string; multi?: boolean; optional?: boolean };

export type PaletteItem = {
  kind: NodeKind;
  family: NodeFamily;
  title: string;
  icon: string;
  desc: string;
  defaults?: Partial<FlowNode>;
};

export const NODE_WIDTH = 220;
export const OUTPUT_PORT_Y = 27;

export const nodeMeta: Record<NodeKind, { icon: string; label: string }> = {
  source: { icon: "∿", label: "数据输入" },
  metric: { icon: "M", label: "指标计算" },
  fft: { icon: "F", label: "频谱变换" },
  constant: { icon: "C", label: "常数工具" },
  math: { icon: "±", label: "数学运算" },
  absolute: { icon: "|x|", label: "数学运算" },
  round: { icon: "≈", label: "数学运算" },
  compare: { icon: ">", label: "条件判断" },
  logic: { icon: "&", label: "逻辑组合" },
  gate: { icon: "G", label: "流程控制" },
  select: { icon: "S", label: "流程控制" },
  listCount: { icon: "#", label: "列表处理" },
  listFilter: { icon: "⌁", label: "列表处理" },
  listSort: { icon: "⇅", label: "列表处理" },
  topN: { icon: "N", label: "列表处理" },
  minmax: { icon: "↕", label: "列表处理" },
  listItem: { icon: "[i]", label: "列表处理" },
  listMerge: { icon: "∪", label: "列表处理" },
  fieldExtract: { icon: ".f", label: "列表处理" },
  integrate: { icon: "∫", label: "信号处理" },
  alignSpectrum: { icon: "≋", label: "频谱分析" },
  bandSlice: { icon: "[ ]", label: "频谱分析" },
  bandpass: { icon: "BP", label: "信号处理" },
  hilbert: { icon: "H", label: "信号处理" },
  peakDetect: { icon: "⌃", label: "频谱分析" },
  harmonicSearch: { icon: "1×", label: "频谱分析" },
  harmonicSequence: { icon: "n×", label: "频谱分析" },
  frequencyExclude: { icon: "⊘", label: "频谱分析" },
  totalEnergy: { icon: "E", label: "频谱分析" },
  peakEnergyRatio: { icon: "%", label: "频谱分析" },
  localContrast: { icon: "Δ", label: "频谱分析" },
  slidingEnergy: { icon: "▰", label: "频谱分析" },
  bandConstruct: { icon: "↔", label: "频谱分析" },
  frequencyMatch: { icon: "◎", label: "频谱分析" },
  metricRatioCompare: { icon: "R⇄", label: "组合模块" },
  rotationFrequency: { icon: "fr", label: "组合模块" },
  candidateScreen: { icon: "F?", label: "组合模块" },
  differenceBands: { icon: "ΔB", label: "组合模块" },
  envelopeSpectrum: { icon: "ENV", label: "组合模块" },
  cageSearch: { icon: "fc", label: "组合模块" },
  spectrumPresence: { icon: "✓f", label: "组合模块" },
  integerRelation: { icon: "n×", label: "组合模块" },
  display: { icon: "▥", label: "数据显示" },
  output: { icon: "!", label: "诊断输出" },
  report: { icon: "W", label: "报告输出" },
};

export const palette: { group: string; items: PaletteItem[] }[] = [
  { group: "基础节点", items: [
    { kind: "source", family: "source", title: "波形导入", icon: "∿", desc: "导入 TXT / CSV 振动数据", defaults: { samplingFrequency: 10240, rpm: 1500 } },
    { kind: "display", family: "display", title: "波形展示", icon: "▥", desc: "查看波形或频谱数据", defaults: { displayMode: "auto" } },
    { kind: "fft", family: "signal", title: "FFT 节点", icon: "F", desc: "计算单边幅值频谱" },
    { kind: "math", family: "math", title: "加减法运算", icon: "±", desc: "两个输入相加或相减", defaults: { operation: "+" } },
  ] },
];

export function inputPorts(node: FlowNode): InputPort[] {
  switch (node.kind) {
    case "source": case "constant": return [];
    case "metric": case "fft": case "absolute": case "round": case "integrate": case "hilbert": case "totalEnergy": case "listCount": case "listSort": case "minmax": case "listItem": case "fieldExtract": case "display": case "output": return [{ key: "input", label: "输入" }];
    case "math": return [{ key: "a", label: "A" }, { key: "b", label: "B" }];
    case "compare": return [{ key: "a", label: "A" }, { key: "b", label: "B" }];
    case "logic": return [{ key: "items", label: "条件", multi: true }];
    case "gate": return [{ key: "data", label: "数据" }, { key: "condition", label: "条件" }];
    case "select": return [{ key: "condition", label: "条件" }, { key: "a", label: "A" }, { key: "b", label: "B" }];
    case "listFilter": return [{ key: "list", label: "列表" }, { key: "mask", label: "掩码" }];
    case "topN": return [{ key: "input", label: "列表" }, { key: "n", label: "N", optional: true }];
    case "listMerge": return [{ key: "items", label: "项目", multi: true }];
    case "alignSpectrum": return [{ key: "a", label: "频谱A" }, { key: "b", label: "频谱B" }];
    case "bandSlice": return [{ key: "spectrum", label: "频谱" }, { key: "min", label: "下限", optional: true }, { key: "max", label: "上限", optional: true }, { key: "bands", label: "频带", optional: true }];
    case "bandpass": return [{ key: "waveform", label: "波形" }, { key: "bands", label: "频带" }];
    case "peakDetect": return [{ key: "spectrum", label: "频谱" }];
    case "harmonicSearch": return [{ key: "peaks", label: "峰值" }];
    case "harmonicSequence": return [{ key: "base", label: "基频" }];
    case "frequencyExclude": return [{ key: "peaks", label: "峰值" }, { key: "frequencies", label: "剔除频率" }, { key: "tolerance", label: "容差", optional: true }];
    case "peakEnergyRatio": return [{ key: "peaks", label: "峰值" }, { key: "energy", label: "总能量" }];
    case "localContrast": return [{ key: "spectrum", label: "频谱" }, { key: "peaks", label: "峰值" }, { key: "width", label: "左右Hz", optional: true }];
    case "slidingEnergy": return [{ key: "spectrum", label: "频谱" }, { key: "window", label: "窗宽", optional: true }, { key: "step", label: "步长", optional: true }];
    case "bandConstruct": return [{ key: "centers", label: "中心" }, { key: "width", label: "半带宽" }];
    case "frequencyMatch": return [{ key: "spectrum", label: "频谱" }, { key: "targets", label: "目标" }, { key: "tolerance", label: "容差", optional: true }];
    case "report": return [{ key: "results", label: "结论", multi: true }];
    case "metricRatioCompare": return [{ key: "normal", label: "正常" }, { key: "fault", label: "故障" }, { key: "threshold", label: "阈值" }];
    case "rotationFrequency": return [{ key: "waveform", label: "波形" }];
    case "candidateScreen": return [{ key: "spectrum", label: "频谱" }, { key: "fr", label: "转频" }, { key: "energyThreshold", label: "能量阈值" }, { key: "contrastThreshold", label: "对比阈值" }];
    case "differenceBands": return [{ key: "normalSpectrum", label: "正常谱" }, { key: "faultSpectrum", label: "故障谱" }, { key: "halfWidth", label: "半带宽", optional: true }];
    case "envelopeSpectrum": return [{ key: "waveform", label: "波形" }, { key: "bands", label: "频带" }];
    case "cageSearch": return [{ key: "spectra", label: "包络谱" }, { key: "fr", label: "转频" }];
    case "spectrumPresence": return [{ key: "spectra", label: "频谱" }, { key: "targets", label: "目标频率" }, { key: "minHits", label: "最少命中", optional: true }];
    case "integerRelation": return [{ key: "candidates", label: "候选" }, { key: "base", label: "基频" }, { key: "pairedBase", label: "互证基频" }, { key: "spectra", label: "互证频谱" }, { key: "cross", label: "跨频带" }];
  }
}

export function portOffset(node: FlowNode, portKey: string) {
  const ports = inputPorts(node);
  const index = Math.max(0, ports.findIndex((port) => port.key === portKey));
  return 67 + index * 23;
}

function node(id: string, kind: NodeKind, family: NodeFamily, title: string, x: number, y: number, extra: Partial<FlowNode> = {}): FlowNode {
  return { id, kind, family, title, x, y, ...extra };
}

function edge(source: string, target: string, targetPort = "input"): Connection {
  return { id: `e-${source}-${target}-${targetPort}`, source, target, targetPort };
}

export const exampleNodes: FlowNode[] = [
  node("normal", "source", "source", "正常工况波形", 0, 80, { samplingFrequency: 10240, rpm: 1500 }),
  node("fault", "source", "source", "疑似故障波形", 0, 360, { samplingFrequency: 10240, rpm: 1500 }),
  node("th-a", "constant", "math", "阈值 th_a", 270, 40, { numberValue: 1.2, unit: "—" }),
  node("rms-check", "metricRatioCompare", "metric", "RMS 比值初筛", 540, 80, { metric: "rms", compareOp: ">" }),
  node("th-b", "constant", "math", "阈值 th_b", 270, 470, { numberValue: 1.25, unit: "—" }),
  node("kurt-check", "metricRatioCompare", "metric", "峭度比值初筛", 540, 360, { metric: "kurtosis", compareOp: ">" }),
  node("initial-and", "logic", "condition", "时域条件均满足", 810, 240, { logic: "AND" }),
  node("fault-gate", "gate", "condition", "时域初筛条件门", 1080, 240),

  node("fr", "rotationFrequency", "signal", "转频 fr", 1360, 40, { highpassHz: 2, minProminence: 1.18, minDistanceHz: 2, maxPeaks: 60, harmonicOrders: "1,2,3", toleranceHz: 1.8 }),
  node("fft-fault", "fft", "signal", "故障原始频谱", 1360, 350),
  node("th-c", "constant", "math", "阈值 th_c", 1360, 600, { numberValue: 0.003, unit: "比例" }),
  node("th-e", "constant", "math", "阈值 th_e", 1360, 760, { numberValue: 1.35, unit: "倍" }),
  node("f-list", "candidateScreen", "spectrum", "候选故障频率 F_list", 1640, 400, { bandMultiplier: 10, excludeEndOrder: 30, minProminence: 1.12, minDistanceHz: 1, maxPeaks: 120, toleranceHz: 1.5, windowHz: 3 }),
  node("display-candidates", "display", "display", "候选频率显示", 1910, 480, { displayMode: "list" }),

  node("fft-normal", "fft", "signal", "正常原始频谱", 1360, 980),
  node("demod-width", "constant", "math", "解调半带宽 d", 1640, 1160, { numberValue: 120, unit: "Hz" }),
  node("band-list", "differenceBands", "spectrum", "差谱高能解调频带", 1910, 920, { windowHz: 120, stepHz: 40, count: 3, halfWidthHz: 120, minProminence: 1.05, minDistanceHz: 80, maxPeaks: 12 }),
  node("fft-envelope", "envelopeSpectrum", "signal", "多频带包络谱", 2180, 900),
  node("display-env", "display", "display", "包络谱显示", 2450, 1100, { displayMode: "spectrum" }),
  node("cage", "cageSearch", "spectrum", "保持架频率搜索", 2450, 780, { primaryRatio: 0.6, fallbackRatio: 0.4, halfWidthHz: 2, minProminence: 1.08, minDistanceHz: 0.5, maxPeaks: 20 }),
  node("fc-in", "listItem", "list", "保持架对内频率 fc_in", 2720, 680, { index: 0, unit: "Hz" }),
  node("fc-out", "listItem", "list", "保持架对外频率 fc_out", 2720, 900, { index: 1, unit: "Hz" }),
  node("fc-targets", "listMerge", "list", "fc_in / fc_out", 2990, 730),
  node("cross-ok", "spectrumPresence", "condition", "跨频带保持架验证", 3260, 730, { toleranceHz: 2, minHits: 2 }),

  node("outer-match", "integerRelation", "condition", "外圈整数倍双向互证", 2990, 1110, { deviationLimit: 0.1, minOrder: 6, maxOrder: 12, toleranceHz: 2 }),
  node("inner-match", "integerRelation", "condition", "内圈整数倍双向互证", 3260, 1110, { deviationLimit: 0.1, minOrder: 6, maxOrder: 12, toleranceHz: 2 }),
  node("any-fault", "logic", "condition", "任一内外圈匹配", 3530, 1090, { logic: "OR" }),
  node("not-fault", "logic", "condition", "无内外圈匹配", 3800, 1090, { logic: "NOT" }),
  node("outer-result", "output", "output", "轴承外圈故障", 3530, 1360, { resultText: "轴承外圈故障" }),
  node("inner-result", "output", "output", "轴承内圈故障", 3800, 1360, { resultText: "轴承内圈故障" }),
  node("normal-result", "output", "output", "非轴承内外圈故障", 4070, 1090, { resultText: "不属于轴承内/外圈故障" }),
  node("report", "report", "report", "诊断报告导出", 4340, 1200),
];

export const exampleConnections: Connection[] = [
  edge("normal", "rms-check", "normal"), edge("fault", "rms-check", "fault"), edge("th-a", "rms-check", "threshold"),
  edge("normal", "kurt-check", "normal"), edge("fault", "kurt-check", "fault"), edge("th-b", "kurt-check", "threshold"),
  edge("rms-check", "initial-and", "items"), edge("kurt-check", "initial-and", "items"), edge("fault", "fault-gate", "data"), edge("initial-and", "fault-gate", "condition"),
  edge("fault-gate", "fr", "waveform"), edge("fault-gate", "fft-fault"), edge("fault-gate", "fft-envelope", "waveform"),
  edge("fft-fault", "f-list", "spectrum"), edge("fr", "f-list", "fr"), edge("th-c", "f-list", "energyThreshold"), edge("th-e", "f-list", "contrastThreshold"), edge("f-list", "display-candidates"),
  edge("normal", "fft-normal"), edge("fft-normal", "band-list", "normalSpectrum"), edge("fft-fault", "band-list", "faultSpectrum"), edge("demod-width", "band-list", "halfWidth"),
  edge("band-list", "fft-envelope", "bands"), edge("fft-envelope", "display-env"), edge("fft-envelope", "cage", "spectra"), edge("fr", "cage", "fr"),
  edge("cage", "fc-in"), edge("cage", "fc-out"), edge("fc-in", "fc-targets", "items"), edge("fc-out", "fc-targets", "items"),
  edge("fft-envelope", "cross-ok", "spectra"), edge("fc-targets", "cross-ok", "targets"),
  edge("f-list", "outer-match", "candidates"), edge("fc-out", "outer-match", "base"), edge("fc-in", "outer-match", "pairedBase"), edge("fft-envelope", "outer-match", "spectra"), edge("cross-ok", "outer-match", "cross"),
  edge("f-list", "inner-match", "candidates"), edge("fc-in", "inner-match", "base"), edge("fc-out", "inner-match", "pairedBase"), edge("fft-envelope", "inner-match", "spectra"), edge("cross-ok", "inner-match", "cross"),
  edge("outer-match", "any-fault", "items"), edge("inner-match", "any-fault", "items"), edge("any-fault", "not-fault", "items"),
  edge("outer-match", "outer-result"), edge("inner-match", "inner-result"), edge("not-fault", "normal-result"),
  edge("outer-result", "report", "results"), edge("inner-result", "report", "results"), edge("normal-result", "report", "results"),
];

function largestPowerOfTwo(value: number) {
  return 2 ** Math.floor(Math.log2(Math.max(2, value)));
}

function fftComplex(real: number[], imag: number[], inverse = false) {
  const size = real.length;
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [real[i], real[j]] = [real[j], real[i]]; [imag[i], imag[j]] = [imag[j], imag[i]]; }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (inverse ? 2 : -2) * Math.PI / length;
    const wr0 = Math.cos(angle), wi0 = Math.sin(angle);
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
  if (inverse) for (let i = 0; i < size; i++) { real[i] /= size; imag[i] /= size; }
}

export function calculateSpectrum(input: number[], fs: number): SpectrumPoint[] {
  const size = Math.min(16384, largestPowerOfTwo(input.length));
  const source = input.slice(-size);
  const mean = source.reduce((sum, value) => sum + value, 0) / Math.max(1, size);
  const real = source.map((value, index) => (value - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / Math.max(1, size - 1))));
  const imag = new Array(size).fill(0);
  fftComplex(real, imag);
  return real.slice(0, size / 2).map((value, index) => ({ f: index * fs / size, a: 4 / size * Math.hypot(value, imag[index]) }));
}

export function calculateMetrics(samples: number[]) {
  if (!samples.length) return { rms: 0, peak: 0, kurtosis: 0, crest: 0 };
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const centered = samples.map((value) => value - mean);
  const squareMean = centered.reduce((sum, value) => sum + value * value, 0) / centered.length;
  const rms = Math.sqrt(squareMean);
  const peak = Math.max(...centered.map(Math.abs));
  const fourth = centered.reduce((sum, value) => sum + value ** 4, 0) / centered.length;
  return { rms, peak, kurtosis: squareMean ? fourth / squareMean ** 2 : 0, crest: rms ? peak / rms : 0 };
}

export function parseTextSignal(text: string): number[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length > 3) return lines.flatMap((line) => {
    const values = line.split(/[,;\t\s]+/).map(Number).filter(Number.isFinite);
    return values.length ? [values[values.length - 1]] : [];
  });
  return text.split(/[,;\t\s]+/).map(Number).filter(Number.isFinite);
}

export function generateDemoSignal(fs: number, role: "normal" | "fault") {
  const length = 16384;
  const fr = 25;
  const fcOut = fr * 0.4;
  const bpfo = fcOut * 8;
  return Array.from({ length }, (_, index) => {
    const t = index / fs;
    const base = 0.055 * Math.sin(2 * Math.PI * fr * t) + 0.018 * Math.sin(2 * Math.PI * 2 * fr * t) + 0.012 * Math.sin(2 * Math.PI * 3 * fr * t);
    const deterministicNoise = 0.012 * Math.sin(index * 1.731) + 0.008 * Math.sin(index * 0.419);
    if (role === "normal") return base * 0.72 + deterministicNoise;
    const impactPhase = (t * bpfo) % 1;
    const impact = impactPhase < 0.13 ? 0.9 * Math.exp(-34 * impactPhase) * Math.sin(2 * Math.PI * 1600 * t) : 0;
    const cage = 0.003 * Math.sin(2 * Math.PI * fcOut * t) + 0.002 * Math.sin(2 * Math.PI * (fr - fcOut) * t);
    const faultTone = 0.12 * Math.sin(2 * Math.PI * bpfo * t) + 0.055 * Math.sin(2 * Math.PI * 2 * bpfo * t);
    const modulation = 1 + 0.35 * Math.sin(2 * Math.PI * fcOut * t) + 0.42 * Math.sin(2 * Math.PI * (fr - fcOut) * t);
    return base * 1.25 + cage + faultTone + impact * modulation + deterministicNoise;
  });
}

function integrateWaveform(wave: WaveformData, highpassHz: number): WaveformData {
  const mean = wave.samples.reduce((sum, value) => sum + value, 0) / Math.max(1, wave.samples.length);
  const integrated = new Array<number>(wave.samples.length).fill(0);
  const dt = 1 / Math.max(1, wave.fs);
  for (let i = 1; i < wave.samples.length; i++) integrated[i] = integrated[i - 1] + ((wave.samples[i - 1] - mean) + (wave.samples[i] - mean)) * 0.5 * dt;
  if (highpassHz > 0) {
    const rc = 1 / (2 * Math.PI * highpassHz), alpha = rc / (rc + dt);
    let previousInput = integrated[0], previousOutput = 0;
    for (let i = 1; i < integrated.length; i++) {
      const output = alpha * (previousOutput + integrated[i] - previousInput);
      previousInput = integrated[i]; previousOutput = output; integrated[i] = output;
    }
  }
  return { ...wave, samples: integrated, fileName: `${wave.fileName} · 积分` };
}

function biquad(samples: number[], fs: number, frequency: number, highpass: boolean) {
  const f = Math.min(fs * 0.495, Math.max(0.05, frequency));
  const omega = 2 * Math.PI * f / fs, cos = Math.cos(omega), sin = Math.sin(omega), alpha = sin / (2 * Math.SQRT1_2);
  const b0 = highpass ? (1 + cos) / 2 : (1 - cos) / 2;
  const b1 = highpass ? -(1 + cos) : 1 - cos;
  const b2 = b0, a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
  const out = new Array(samples.length).fill(0);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = b0 / a0 * x0 + b1 / a0 * x1 + b2 / a0 * x2 - a1 / a0 * y1 - a2 / a0 * y2;
    out[i] = y0; x2 = x1; x1 = x0; y2 = y1; y1 = y0;
  }
  return out;
}

function bandpassWave(wave: WaveformData, band: FrequencyBand): WaveformData {
  const low = Math.max(0.1, band.min), high = Math.min(wave.fs / 2 * 0.98, band.max);
  const filtered = biquad(biquad(wave.samples, wave.fs, low, true), wave.fs, Math.max(low + 0.1, high), false);
  return { ...wave, samples: filtered, fileName: `${wave.fileName} · ${low.toFixed(1)}-${high.toFixed(1)}Hz` };
}

function envelopeWave(wave: WaveformData): WaveformData {
  const size = largestPowerOfTwo(wave.samples.length);
  const source = wave.samples.slice(0, size);
  const real = [...source], imag = new Array(size).fill(0);
  fftComplex(real, imag);
  for (let i = 1; i < size; i++) {
    const multiplier = i < size / 2 ? 2 : i === size / 2 ? 1 : 0;
    real[i] *= multiplier; imag[i] *= multiplier;
  }
  fftComplex(real, imag, true);
  const envelope = real.map((value, index) => Math.hypot(value, imag[index]));
  const mean = envelope.reduce((sum, value) => sum + value, 0) / envelope.length;
  return { ...wave, samples: envelope.map((value) => value - mean), fileName: `${wave.fileName} · 包络` };
}

function interpolate(points: SpectrumPoint[], frequency: number) {
  if (!points.length || frequency < points[0].f || frequency > points[points.length - 1].f) return 0;
  const resolution = points[1]?.f - points[0]?.f || 1;
  const index = Math.max(0, Math.min(points.length - 2, Math.floor((frequency - points[0].f) / resolution)));
  const left = points[index], right = points[index + 1] ?? left;
  const ratio = right.f === left.f ? 0 : (frequency - left.f) / (right.f - left.f);
  return left.a + (right.a - left.a) * ratio;
}

function alignSpectrumPair(a: SpectrumPoint[], b: SpectrumPoint[]) {
  if (!a.length || !b.length) return [[], []] as SpectrumPoint[][];
  const resolution = Math.max(a[1]?.f - a[0]?.f || 1, b[1]?.f - b[0]?.f || 1);
  const end = Math.min(a[a.length - 1].f, b[b.length - 1].f);
  const count = Math.floor(end / resolution) + 1;
  const frequencies = Array.from({ length: count }, (_, index) => index * resolution);
  return [frequencies.map((f) => ({ f, a: interpolate(a, f) })), frequencies.map((f) => ({ f, a: interpolate(b, f) }))];
}

function detectPeaks(spectrum: SpectrumPoint[], node: FlowNode, sourceIndex?: number) {
  if (spectrum.length < 3) return [];
  const prominenceRatio = Math.max(1, node.minProminence ?? 1.1);
  const distance = Math.max(0, node.minDistanceHz ?? 0);
  const candidates: PeakPoint[] = [];
  for (let i = 2; i < spectrum.length - 2; i++) {
    const point = spectrum[i];
    if (point.a <= spectrum[i - 1].a || point.a < spectrum[i + 1].a) continue;
    const left = Math.min(spectrum[i - 1].a, spectrum[i - 2].a), right = Math.min(spectrum[i + 1].a, spectrum[i + 2].a);
    const background = Math.max(1e-12, (left + right) / 2);
    if (point.a / background < prominenceRatio) continue;
    candidates.push({ ...point, sourceIndex, prominence: point.a / background });
  }
  const selected: PeakPoint[] = [];
  for (const peak of candidates.sort((a, b) => b.a - a.a)) {
    if (selected.some((item) => Math.abs(item.f - peak.f) < distance && item.sourceIndex === peak.sourceIndex)) continue;
    selected.push(peak);
    if (selected.length >= (node.maxPeaks ?? 80)) break;
  }
  return selected.sort((a, b) => (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0) || a.f - b.f);
}

function numbers(value?: RuntimeValue): number[] {
  if (!value) return [];
  if (value.type === "number") return [value.data];
  if (value.type === "numbers") return value.data;
  if (value.type === "peaks") return value.data.map((item) => item.f);
  return [];
}

function booleanValue(value?: RuntimeValue) {
  if (!value) return false;
  if (value.type === "boolean") return value.data;
  if (value.type === "booleans") return value.data.some(Boolean);
  return false;
}

function binaryNumber(operation: FlowNode["operation"], a: number, b: number) {
  if (operation === "+") return a + b;
  if (operation === "-") return a - b;
  if (operation === "*") return a * b;
  if (operation === "pow") return a ** b;
  return Math.abs(b) < 1e-15 ? Number.NaN : a / b;
}

function mathValue(operation: FlowNode["operation"], a?: RuntimeValue, b?: RuntimeValue): RuntimeValue | undefined {
  if (!a || !b) return undefined;
  if (a.type === "spectrum" && b.type === "spectrum") {
    const [aa, bb] = alignSpectrumPair(a.data, b.data);
    return { type: "spectrum", data: aa.map((point, index) => ({ f: point.f, a: binaryNumber(operation, point.a, bb[index]?.a ?? 0) })) };
  }
  const left = numbers(a), right = numbers(b);
  if (!left.length || !right.length) return undefined;
  if (left.length === 1 && right.length === 1) return { type: "number", data: binaryNumber(operation, left[0], right[0]) };
  const size = Math.max(left.length, right.length);
  return { type: "numbers", data: Array.from({ length: size }, (_, index) => binaryNumber(operation, left[left.length === 1 ? 0 : index] ?? Number.NaN, right[right.length === 1 ? 0 : index] ?? Number.NaN)) };
}

function compareNumber(operator: FlowNode["compareOp"], a: number, b: number) {
  if (operator === ">") return a > b;
  if (operator === "<") return a < b;
  if (operator === ">=") return a >= b;
  if (operator === "<=") return a <= b;
  if (operator === "!=") return a !== b;
  return a === b;
}

function compareValue(operator: FlowNode["compareOp"], a?: RuntimeValue, b?: RuntimeValue): RuntimeValue | undefined {
  if (!a || !b) return undefined;
  const left = numbers(a), right = numbers(b);
  if (!left.length || !right.length) return undefined;
  if (left.length === 1 && right.length === 1) return { type: "boolean", data: compareNumber(operator, left[0], right[0]) };
  const size = Math.max(left.length, right.length);
  return { type: "booleans", data: Array.from({ length: size }, (_, index) => compareNumber(operator, left[left.length === 1 ? 0 : index] ?? Number.NaN, right[right.length === 1 ? 0 : index] ?? Number.NaN)) };
}

function mapNumeric(value: RuntimeValue | undefined, mapper: (value: number) => number): RuntimeValue | undefined {
  if (!value) return undefined;
  if (value.type === "number") return { ...value, data: mapper(value.data) };
  if (value.type === "numbers") return { ...value, data: value.data.map(mapper) };
  if (value.type === "spectrum") return { type: "spectrum", data: value.data.map((point) => ({ ...point, a: mapper(point.a) })) };
  return undefined;
}

function listLength(value?: RuntimeValue) {
  if (!value) return 0;
  if (["numbers", "booleans", "peaks", "bands", "waveforms", "spectra"].includes(value.type)) return (value as { data: unknown[] }).data.length;
  return 1;
}

function filterList(value: RuntimeValue | undefined, maskValue: RuntimeValue | undefined): RuntimeValue | undefined {
  if (!value || maskValue?.type !== "booleans") return undefined;
  const mask = maskValue.data;
  if (value.type === "numbers") return { type: "numbers", data: value.data.filter((_, index) => mask[index]) };
  if (value.type === "peaks") return { type: "peaks", data: value.data.filter((_, index) => mask[index]) };
  if (value.type === "bands") return { type: "bands", data: value.data.filter((_, index) => mask[index]) };
  if (value.type === "spectra") return { type: "spectra", data: value.data.filter((_, index) => mask[index]) };
  if (value.type === "waveforms") return { type: "waveforms", data: value.data.filter((_, index) => mask[index]) };
  return undefined;
}

function spectrumList(value?: RuntimeValue) {
  if (value?.type === "spectrum") return [value.data];
  if (value?.type === "spectra") return value.data;
  return [];
}

function waveformList(value?: RuntimeValue) {
  if (value?.type === "waveform") return [value.data];
  if (value?.type === "waveforms") return value.data;
  return [];
}

function harmonicBases(peaks: PeakPoint[], current: FlowNode) {
  const orders = (current.harmonicOrders ?? "1,2,3").split(",").map(Number).filter((item) => Number.isFinite(item) && item > 0);
  const tolerance = Math.max(0.01, current.toleranceHz ?? 1.5);
  const candidates = peaks.filter((peak) => peak.f > 1).map((base) => {
    const matches = orders.map((order) => peaks.find((peak) => Math.abs(peak.f - base.f * order) <= tolerance)).filter(Boolean) as PeakPoint[];
    return { base: base.f, matches: matches.length, score: matches.reduce((sum, peak) => sum + peak.a, 0) };
  }).filter((item) => item.matches === orders.length).sort((a, b) => b.score - a.score);
  return candidates.filter((item, index, all) => all.findIndex((candidate) => Math.abs(candidate.base - item.base) <= tolerance) === index).slice(0, 20).map((item) => item.base);
}

function matchSpectrumFrequencies(spectra: SpectrumPoint[][], targets: number[], tolerance: number) {
  const matches: PeakPoint[] = [];
  spectra.forEach((spectrum, sourceIndex) => targets.forEach((target, order) => {
    const window = spectrum.filter((point) => Math.abs(point.f - target) <= tolerance);
    if (!window.length) return;
    const best = window.reduce((selected, point) => point.a > selected.a ? point : selected, window[0]);
    const baselineWindow = spectrum.filter((point) => Math.abs(point.f - target) <= tolerance * 3 && Math.abs(point.f - target) > tolerance);
    const baseline = baselineWindow.reduce((sum, point) => sum + point.a, 0) / Math.max(1, baselineWindow.length);
    if (best.a < Math.max(1e-12, baseline) * 1.05) return;
    matches.push({ ...best, theoretical: target, sourceIndex, order: order + 1 });
  }));
  return matches;
}

function slidingEnergyCurve(spectrum: SpectrumPoint[], windowHz: number, stepHz: number) {
  if (!spectrum.length) return [];
  const resolution = spectrum[1]?.f - spectrum[0]?.f || 1;
  const windowPoints = Math.max(1, Math.round(windowHz / resolution)), stepPoints = Math.max(1, Math.round(stepHz / resolution));
  const prefix = [0];
  spectrum.forEach((point) => prefix.push(prefix[prefix.length - 1] + point.a ** 2));
  const curve: SpectrumPoint[] = [];
  for (let start = 0; start < spectrum.length; start += stepPoints) {
    const end = Math.min(spectrum.length, start + windowPoints);
    curve.push({ f: (spectrum[start].f + spectrum[Math.max(start, end - 1)].f) / 2, a: prefix[end] - prefix[start] });
  }
  return curve;
}

export type ExecutionResult = {
  values: Map<string, RuntimeValue>;
  errors: Map<string, string>;
  activeResults: FlowNode[];
};

export function executeGraph(nodes: FlowNode[], connections: Connection[], sourceSignals: Record<string, SourceSignal>): ExecutionResult {
  const nodeMap = new Map(nodes.map((item) => [item.id, item]));
  const values = new Map<string, RuntimeValue>();
  const errors = new Map<string, string>();
  const visiting = new Set<string>();

  const evaluate = (id: string): RuntimeValue | undefined => {
    if (values.has(id)) return values.get(id);
    if (visiting.has(id)) { errors.set(id, "检测到循环连线"); return undefined; }
    const current = nodeMap.get(id);
    if (!current) return undefined;
    visiting.add(id);
    const incoming = (port: string) => connections.filter((item) => item.target === id && item.targetPort === port).map((item) => evaluate(item.source)).filter((item): item is RuntimeValue => Boolean(item));
    const one = (port: string) => incoming(port)[0];
    let result: RuntimeValue | undefined;

    try {
      switch (current.kind) {
        case "source": {
          const source = sourceSignals[id];
          if (source?.samples.length) result = { type: "waveform", data: source };
          break;
        }
        case "constant": result = { type: "number", data: current.numberValue ?? 0, unit: current.unit }; break;
        case "metric": {
          const waves = waveformList(one("input"));
          const metric = current.metric ?? "rms";
          const calculated = waves.map((wave) => calculateMetrics(wave.samples)[metric]);
          if (calculated.length === 1) result = { type: "number", data: calculated[0] };
          else if (calculated.length) result = { type: "numbers", data: calculated };
          break;
        }
        case "fft": {
          const waves = waveformList(one("input"));
          const spectra = waves.map((wave) => calculateSpectrum(wave.samples, wave.fs));
          if (spectra.length === 1) result = { type: "spectrum", data: spectra[0] };
          else if (spectra.length) result = { type: "spectra", data: spectra };
          break;
        }
        case "math": result = mathValue(current.operation ?? "/", one("a"), one("b")); break;
        case "absolute": result = mapNumeric(one("input"), Math.abs); break;
        case "round": {
          const fn = current.roundMode === "floor" ? Math.floor : current.roundMode === "ceil" ? Math.ceil : Math.round;
          result = mapNumeric(one("input"), fn);
          break;
        }
        case "compare": result = compareValue(current.compareOp ?? ">", one("a"), one("b")); break;
        case "logic": {
          const all = incoming("items");
          const lists = all.filter((item) => item.type === "booleans") as Extract<RuntimeValue, { type: "booleans" }>[];
          if (lists.length) {
            const size = Math.max(...lists.map((item) => item.data.length));
            const bools = all.filter((item) => item.type === "boolean").map((item) => (item as Extract<RuntimeValue, {type:"boolean"}>).data);
            result = { type: "booleans", data: Array.from({ length: size }, (_, index) => {
              const row = [...bools, ...lists.map((item) => item.data[index] ?? false)];
              if (current.logic === "OR") return row.some(Boolean);
              if (current.logic === "NOT") return !row[0];
              return row.length > 0 && row.every(Boolean);
            }) };
          } else {
            const row = all.map(booleanValue);
            result = { type: "boolean", data: current.logic === "OR" ? row.some(Boolean) : current.logic === "NOT" ? !row[0] : row.length > 0 && row.every(Boolean) };
          }
          break;
        }
        case "gate": if (booleanValue(one("condition"))) result = one("data"); break;
        case "select": result = booleanValue(one("condition")) ? one("a") : one("b"); break;
        case "listCount": {
          const value = one("input");
          result = { type: "number", data: value?.type === "booleans" ? value.data.filter(Boolean).length : listLength(value) };
          break;
        }
        case "listFilter": result = filterList(one("list"), one("mask")); break;
        case "listSort": {
          const value = one("input");
          const direction = current.sortDirection === "asc" ? 1 : -1;
          if (value?.type === "numbers") result = { type: "numbers", data: [...value.data].sort((a, b) => direction * (a - b)) };
          if (value?.type === "peaks") {
            const field = current.sortField ?? "amplitude";
            const read = (item: PeakPoint) => field === "frequency" ? item.f : field === "energyRatio" ? item.energyRatio ?? 0 : item.a;
            result = { type: "peaks", data: [...value.data].sort((a, b) => direction * (read(a) - read(b))) };
          }
          break;
        }
        case "topN": {
          const value = one("input"), count = Math.max(0, Math.round(numbers(one("n"))[0] ?? current.count ?? 3));
          if (value?.type === "numbers") result = { type: "numbers", data: value.data.slice(0, count) };
          if (value?.type === "peaks") result = { type: "peaks", data: value.data.slice(0, count) };
          if (value?.type === "bands") result = { type: "bands", data: value.data.slice(0, count) };
          break;
        }
        case "minmax": {
          const value = one("input"), direction = current.sortDirection === "asc" ? 1 : -1;
          if (value?.type === "numbers" && value.data.length) result = { type: "number", data: [...value.data].sort((a, b) => direction * (a - b))[0] };
          if (value?.type === "peaks" && value.data.length) {
            const selectField = current.selectField ?? "amplitude";
            const read = (item: PeakPoint, field: FlowNode["selectField"]) => field === "frequency" ? item.f : field === "energyRatio" ? item.energyRatio ?? 0 : item.a;
            const selected = [...value.data].sort((a, b) => direction * (read(a, selectField) - read(b, selectField)))[0];
            result = { type: "number", data: read(selected, current.outputField ?? selectField) };
          }
          break;
        }
        case "listItem": {
          const value = one("input"), index = Math.max(0, Math.round(current.index ?? 0));
          if (value?.type === "numbers" && value.data[index] !== undefined) result = { type: "number", data: value.data[index], unit: value.unit };
          if (value?.type === "spectra" && value.data[index]) result = { type: "spectrum", data: value.data[index] };
          if (value?.type === "waveforms" && value.data[index]) result = { type: "waveform", data: value.data[index] };
          if (value?.type === "peaks" && value.data[index]) result = { type: "number", data: value.data[index].f };
          break;
        }
        case "listMerge": {
          const merged = incoming("items").flatMap(numbers);
          result = { type: "numbers", data: merged };
          break;
        }
        case "fieldExtract": {
          const value = one("input");
          if (value?.type === "peaks") {
            const field = current.selectField ?? "frequency";
            result = { type: "numbers", data: value.data.map((item) => field === "amplitude" ? item.a : field === "energyRatio" ? item.energyRatio ?? 0 : item.f) };
          }
          if (value?.type === "bands") result = { type: "numbers", data: value.data.map((item) => item.center) };
          break;
        }
        case "integrate": {
          const waves = waveformList(one("input")).map((wave) => integrateWaveform(wave, current.highpassHz ?? 2));
          if (waves.length === 1) result = { type: "waveform", data: waves[0] }; else if (waves.length) result = { type: "waveforms", data: waves };
          break;
        }
        case "alignSpectrum": {
          const a = spectrumList(one("a"))[0], b = spectrumList(one("b"))[0];
          if (a && b) result = { type: "spectra", data: alignSpectrumPair(a, b) };
          break;
        }
        case "bandSlice": {
          const spectra = spectrumList(one("spectrum"));
          const bandValue = one("bands");
          const bands = bandValue?.type === "bands" ? bandValue.data : [{ min: numbers(one("min"))[0] ?? 0, max: numbers(one("max"))[0] ?? Number.POSITIVE_INFINITY, center: 0 }];
          const sliced = spectra.flatMap((spectrum) => bands.map((band) => spectrum.filter((point) => point.f >= band.min && point.f <= band.max)));
          if (sliced.length === 1) result = { type: "spectrum", data: sliced[0] }; else if (sliced.length) result = { type: "spectra", data: sliced };
          break;
        }
        case "bandpass": {
          const waves = waveformList(one("waveform")), bandValue = one("bands");
          const bands = bandValue?.type === "bands" ? bandValue.data : [];
          const filtered = waves.flatMap((wave) => bands.map((band) => bandpassWave(wave, band)));
          if (filtered.length === 1) result = { type: "waveform", data: filtered[0] }; else if (filtered.length) result = { type: "waveforms", data: filtered };
          break;
        }
        case "hilbert": {
          const waves = waveformList(one("input")).map(envelopeWave);
          if (waves.length === 1) result = { type: "waveform", data: waves[0] }; else if (waves.length) result = { type: "waveforms", data: waves };
          break;
        }
        case "peakDetect": {
          const spectra = spectrumList(one("spectrum"));
          const peaks = spectra.flatMap((spectrum, index) => detectPeaks(spectrum, current, spectra.length > 1 ? index : undefined));
          result = { type: "peaks", data: peaks };
          break;
        }
        case "harmonicSearch": {
          const value = one("peaks");
          if (value?.type === "peaks") {
            const orders = (current.harmonicOrders ?? "1,2,3").split(",").map(Number).filter((item) => Number.isFinite(item) && item > 0);
            const tolerance = Math.max(0.01, current.toleranceHz ?? 1.5);
            const candidates = value.data.filter((peak) => peak.f > 1).map((base) => {
              const matches = orders.map((order) => value.data.find((peak) => Math.abs(peak.f - base.f * order) <= tolerance)).filter(Boolean) as PeakPoint[];
              return { base: base.f, matches: matches.length, score: matches.reduce((sum, peak) => sum + peak.a, 0) };
            }).filter((item) => item.matches === orders.length).sort((a, b) => b.score - a.score);
            const unique = candidates.filter((item, index, all) => all.findIndex((candidate) => Math.abs(candidate.base - item.base) <= tolerance) === index).slice(0, 20);
            result = { type: "numbers", data: unique.map((item) => item.base) };
          }
          break;
        }
        case "harmonicSequence": {
          const bases = numbers(one("base"));
          const start = Math.max(1, Math.round(current.startOrder ?? 1)), end = Math.max(start, Math.round(current.endOrder ?? 5));
          result = { type: "numbers", data: bases.flatMap((base) => Array.from({ length: end - start + 1 }, (_, index) => base * (start + index))) };
          break;
        }
        case "frequencyExclude": {
          const peaks = one("peaks"), excluded = numbers(one("frequencies")), tolerance = numbers(one("tolerance"))[0] ?? current.toleranceHz ?? 1.5;
          if (peaks?.type === "peaks") result = { type: "peaks", data: peaks.data.filter((peak) => !excluded.some((frequency) => Math.abs(peak.f - frequency) <= tolerance)) };
          break;
        }
        case "totalEnergy": {
          const spectra = spectrumList(one("input"));
          const energies = spectra.map((spectrum) => spectrum.reduce((sum, point) => sum + point.a ** 2, 0));
          if (energies.length === 1) result = { type: "number", data: energies[0] }; else if (energies.length) result = { type: "numbers", data: energies };
          break;
        }
        case "peakEnergyRatio": {
          const peaks = one("peaks"), energy = numbers(one("energy"))[0] ?? 0;
          if (peaks?.type === "peaks") result = { type: "numbers", data: peaks.data.map((peak) => energy ? peak.a ** 2 / energy : 0) };
          break;
        }
        case "localContrast": {
          const spectrum = spectrumList(one("spectrum"))[0], peaks = one("peaks"), width = numbers(one("width"))[0] ?? current.windowHz ?? 3;
          if (spectrum && peaks?.type === "peaks") {
            const resolution = spectrum[1]?.f - spectrum[0]?.f || 1;
            result = { type: "numbers", data: peaks.data.map((peak) => {
              const local = spectrum.filter((point) => Math.abs(point.f - peak.f) <= width && Math.abs(point.f - peak.f) > resolution * 1.5);
              const background = local.reduce((sum, point) => sum + point.a, 0) / Math.max(1, local.length);
              return peak.a / Math.max(1e-12, background);
            }) };
          }
          break;
        }
        case "slidingEnergy": {
          const spectrum = spectrumList(one("spectrum"))[0];
          if (spectrum?.length) {
            const windowHz = Math.max(1, numbers(one("window"))[0] ?? current.windowHz ?? 120), stepHz = Math.max(0.1, numbers(one("step"))[0] ?? current.stepHz ?? 40);
            const resolution = spectrum[1]?.f - spectrum[0]?.f || 1;
            const windowPoints = Math.max(1, Math.round(windowHz / resolution)), stepPoints = Math.max(1, Math.round(stepHz / resolution));
            const prefix = [0];
            spectrum.forEach((point) => prefix.push(prefix[prefix.length - 1] + point.a ** 2));
            const curve: SpectrumPoint[] = [];
            for (let start = 0; start < spectrum.length; start += stepPoints) {
              const end = Math.min(spectrum.length, start + windowPoints);
              curve.push({ f: (spectrum[start].f + spectrum[Math.max(start, end - 1)].f) / 2, a: prefix[end] - prefix[start] });
            }
            result = { type: "spectrum", data: curve };
          }
          break;
        }
        case "bandConstruct": {
          const centers = numbers(one("centers")), width = Math.abs(numbers(one("width"))[0] ?? 0);
          result = { type: "bands", data: centers.map((center) => ({ center, min: Math.max(0, center - width), max: center + width })) };
          break;
        }
        case "frequencyMatch": {
          const spectra = spectrumList(one("spectrum")), targets = numbers(one("targets")), tolerance = Math.max(0.01, numbers(one("tolerance"))[0] ?? current.toleranceHz ?? 2);
          result = { type: "peaks", data: matchSpectrumFrequencies(spectra, targets, tolerance) };
          break;
        }
        case "metricRatioCompare": {
          const normal = waveformList(one("normal"))[0], fault = waveformList(one("fault"))[0], threshold = numbers(one("threshold"))[0] ?? 0;
          if (normal && fault) {
            const metric = current.metric ?? "rms";
            const normalValue = calculateMetrics(normal.samples)[metric], faultValue = calculateMetrics(fault.samples)[metric];
            const ratio = Math.abs(normalValue) < 1e-15 ? Number.NaN : faultValue / normalValue;
            result = { type: "boolean", data: compareNumber(current.compareOp ?? ">", ratio, threshold), value: ratio, detail: `比值 ${Number.isFinite(ratio) ? ratio.toFixed(4) : "无效"}` };
          }
          break;
        }
        case "rotationFrequency": {
          const wave = waveformList(one("waveform"))[0];
          if (wave) {
            const velocity = integrateWaveform(wave, current.highpassHz ?? 2);
            const spectrum = calculateSpectrum(velocity.samples, velocity.fs);
            const bases = harmonicBases(detectPeaks(spectrum, current), current);
            if (bases.length) result = { type: "number", data: bases[0], unit: "Hz" };
          }
          break;
        }
        case "candidateScreen": {
          const spectrum = spectrumList(one("spectrum"))[0], fr = numbers(one("fr"))[0];
          if (spectrum && Number.isFinite(fr) && fr > 0) {
            const upper = fr * Math.max(1, current.bandMultiplier ?? 10);
            const band = spectrum.filter((point) => point.f >= 0 && point.f <= upper);
            const excluded = Array.from({ length: Math.max(1, Math.round(current.excludeEndOrder ?? 30)) }, (_, index) => fr * (index + 1));
            const tolerance = Math.max(0.01, current.toleranceHz ?? 1.5);
            const peaks = detectPeaks(band, current).filter((peak) => !excluded.some((frequency) => Math.abs(peak.f - frequency) <= tolerance));
            const totalEnergy = band.reduce((sum, point) => sum + point.a ** 2, 0);
            const energyThreshold = numbers(one("energyThreshold"))[0] ?? 0.003;
            const contrastThreshold = numbers(one("contrastThreshold"))[0] ?? 1.35;
            const width = Math.max(0.1, current.windowHz ?? 3), resolution = band[1]?.f - band[0]?.f || 1;
            const selected = peaks.flatMap((peak) => {
              const energyRatio = totalEnergy ? peak.a ** 2 / totalEnergy : 0;
              const local = band.filter((point) => Math.abs(point.f - peak.f) <= width && Math.abs(point.f - peak.f) > resolution * 1.5);
              const background = local.reduce((sum, point) => sum + point.a, 0) / Math.max(1, local.length);
              const contrast = peak.a / Math.max(1e-12, background);
              return energyRatio > energyThreshold && contrast > contrastThreshold ? [{ ...peak, energyRatio, prominence: contrast }] : [];
            });
            result = { type: "peaks", data: selected };
          }
          break;
        }
        case "differenceBands": {
          const normal = spectrumList(one("normalSpectrum"))[0], fault = spectrumList(one("faultSpectrum"))[0];
          if (normal && fault) {
            const [alignedNormal, alignedFault] = alignSpectrumPair(normal, fault);
            const difference = alignedFault.map((point, index) => ({ f: point.f, a: Math.abs(point.a - (alignedNormal[index]?.a ?? 0)) }));
            const curve = slidingEnergyCurve(difference, Math.max(1, current.windowHz ?? 120), Math.max(0.1, current.stepHz ?? 40));
            const centers = detectPeaks(curve, current).sort((a, b) => b.a - a.a).slice(0, Math.max(1, Math.round(current.count ?? 3)));
            const halfWidth = Math.abs(numbers(one("halfWidth"))[0] ?? current.halfWidthHz ?? 120);
            result = { type: "bands", data: centers.map((peak) => ({ center: peak.f, min: Math.max(0, peak.f - halfWidth), max: peak.f + halfWidth })) };
          }
          break;
        }
        case "envelopeSpectrum": {
          const wave = waveformList(one("waveform"))[0], bandValue = one("bands");
          if (wave && bandValue?.type === "bands") {
            const spectra = bandValue.data.map((band) => {
              const envelope = envelopeWave(bandpassWave(wave, band));
              return calculateSpectrum(envelope.samples, envelope.fs);
            });
            if (spectra.length === 1) result = { type: "spectrum", data: spectra[0] };
            else if (spectra.length) result = { type: "spectra", data: spectra };
          }
          break;
        }
        case "cageSearch": {
          const spectra = spectrumList(one("spectra")), fr = numbers(one("fr"))[0];
          if (spectra.length && Number.isFinite(fr) && fr > 0) {
            const halfWidth = Math.max(0.1, current.halfWidthHz ?? 2);
            const findBest = (ratio: number) => {
              const center = fr * ratio;
              const peaks = spectra.flatMap((spectrum, sourceIndex) => detectPeaks(spectrum.filter((point) => Math.abs(point.f - center) <= halfWidth), current, sourceIndex));
              return peaks.sort((a, b) => b.a - a.a)[0]?.f;
            };
            const primary = findBest(current.primaryRatio ?? 0.6);
            if (primary !== undefined) result = { type: "numbers", data: [primary, fr - primary], unit: "Hz" };
            else {
              const fallback = findBest(current.fallbackRatio ?? 0.4);
              if (fallback !== undefined) result = { type: "numbers", data: [fr - fallback, fallback], unit: "Hz" };
            }
          }
          break;
        }
        case "spectrumPresence": {
          const spectra = spectrumList(one("spectra")), targets = numbers(one("targets"));
          const tolerance = Math.max(0.01, current.toleranceHz ?? 2), required = Math.max(1, Math.round(numbers(one("minHits"))[0] ?? current.minHits ?? 2));
          const count = matchSpectrumFrequencies(spectra, targets, tolerance).length;
          result = { type: "boolean", data: count >= required, value: count, detail: `命中 ${count}/${required}` };
          break;
        }
        case "integerRelation": {
          const candidates = numbers(one("candidates")), base = numbers(one("base"))[0], pairedBase = numbers(one("pairedBase"))[0], spectra = spectrumList(one("spectra"));
          const cross = booleanValue(one("cross")), deviation = Math.max(0, current.deviationLimit ?? 0.1), minOrder = Math.max(1, Math.round(current.minOrder ?? 6)), maxOrder = Math.max(minOrder, Math.round(current.maxOrder ?? 12)), tolerance = Math.max(0.01, current.toleranceHz ?? 2);
          let matched = 0;
          if (cross && Number.isFinite(base) && base > 0 && Number.isFinite(pairedBase) && pairedBase > 0) {
            for (const frequency of candidates) {
              const ratio = frequency / base, order = Math.round(ratio);
              if (Math.abs(ratio - order) > deviation || order < minOrder || order > maxOrder) continue;
              if (matchSpectrumFrequencies(spectra, [order * pairedBase], tolerance).length) matched++;
            }
          }
          result = { type: "boolean", data: matched > 0, value: matched, detail: matched ? `匹配 ${matched} 个候选` : "无匹配候选" };
          break;
        }
        case "display": result = one("input"); break;
        case "output": result = { type: "boolean", data: booleanValue(one("input")) }; break;
        case "report": result = { type: "boolean", data: incoming("results").some(booleanValue) }; break;
      }
    } catch (error) {
      errors.set(id, error instanceof Error ? error.message : "计算失败");
    }
    visiting.delete(id);
    if (result) values.set(id, result);
    return result;
  };

  nodes.forEach((item) => evaluate(item.id));
  const activeResults = nodes.filter((item) => item.kind === "output" && booleanValue(values.get(item.id)));
  return { values, errors, activeResults };
}

export function summarizeValue(value?: RuntimeValue) {
  if (!value) return { primary: "—", secondary: "等待上游数据" };
  if (value.type === "number") return { primary: Number.isFinite(value.data) ? value.data.toFixed(Math.abs(value.data) >= 100 ? 1 : 4) : "无效", secondary: value.unit ?? "数值" };
  if (value.type === "boolean") return { primary: value.data ? "满足" : "不满足", secondary: value.detail ?? "布尔结果" };
  if (value.type === "waveform") return { primary: `${value.data.samples.length.toLocaleString()} 点`, secondary: `${value.data.fs.toLocaleString()} Hz` };
  if (value.type === "spectrum") return { primary: `${value.data.length.toLocaleString()} 线`, secondary: value.data.length ? `0–${value.data[value.data.length - 1].f.toFixed(0)} Hz` : "空频谱" };
  if (value.type === "numbers") return { primary: `${value.data.length} 项`, secondary: value.data.slice(0, 3).map((item) => item.toFixed(2)).join("、") || "空列表" };
  if (value.type === "booleans") return { primary: `${value.data.filter(Boolean).length}/${value.data.length}`, secondary: "条件满足" };
  if (value.type === "peaks") return { primary: `${value.data.length} 个峰`, secondary: value.data.slice(0, 2).map((item) => `${item.f.toFixed(2)}Hz`).join("、") || "无峰值" };
  if (value.type === "bands") return { primary: `${value.data.length} 个频带`, secondary: value.data.slice(0, 2).map((item) => `${item.min.toFixed(0)}–${item.max.toFixed(0)}Hz`).join("、") || "空频带" };
  if (value.type === "waveforms") return { primary: `${value.data.length} 条波形`, secondary: `${value.data[0]?.samples.length.toLocaleString() ?? 0} 点/条` };
  return { primary: `${value.data.length} 条频谱`, secondary: value.data[0]?.length ? `${value.data[0].length.toLocaleString()} 线/条` : "空频谱" };
}
