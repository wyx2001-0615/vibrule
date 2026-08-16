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
  | { type: "boolean"; data: boolean }
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
  display: { icon: "▥", label: "数据显示" },
  output: { icon: "!", label: "诊断输出" },
  report: { icon: "W", label: "报告输出" },
};

export const palette: { group: string; items: PaletteItem[] }[] = [
  { group: "数据输入", items: [
    { kind: "source", family: "source", title: "振动波形", icon: "∿", desc: "TXT / CSV" },
    { kind: "constant", family: "math", title: "常数值", icon: "C", desc: "名称 / 数值 / 单位", defaults: { numberValue: 1, unit: "—" } },
  ] },
  { group: "指标计算", items: [
    { kind: "metric", family: "metric", title: "有效值计算", icon: "R", desc: "RMS", defaults: { metric: "rms" } },
    { kind: "metric", family: "metric", title: "峭度计算", icon: "K", desc: "冲击指标", defaults: { metric: "kurtosis" } },
    { kind: "metric", family: "metric", title: "峰值计算", icon: "P", desc: "最大绝对幅值", defaults: { metric: "peak" } },
    { kind: "metric", family: "metric", title: "峰值因子", icon: "CF", desc: "峰值 / RMS", defaults: { metric: "crest" } },
  ] },
  { group: "数学运算", items: [
    { kind: "math", family: "math", title: "数学运算", icon: "±", desc: "+ − × ÷ 幂", defaults: { operation: "/" } },
    { kind: "absolute", family: "math", title: "绝对值", icon: "|x|", desc: "数值 / 列表 / 频谱" },
    { kind: "round", family: "math", title: "取整", icon: "≈", desc: "四舍五入 / 向上 / 向下", defaults: { roundMode: "round" } },
  ] },
  { group: "条件与流程", items: [
    { kind: "compare", family: "condition", title: "数值比较", icon: ">", desc: "A 与 B 比较", defaults: { compareOp: ">" } },
    { kind: "logic", family: "condition", title: "逻辑组合", icon: "&", desc: "AND / OR / NOT", defaults: { logic: "AND" } },
    { kind: "gate", family: "condition", title: "条件门", icon: "G", desc: "条件满足才传递数据" },
    { kind: "select", family: "condition", title: "条件选择", icon: "S", desc: "条件决定 A / B" },
  ] },
  { group: "信号处理", items: [
    { kind: "integrate", family: "signal", title: "时域积分", icon: "∫", desc: "加速度转速度", defaults: { highpassHz: 2 } },
    { kind: "bandpass", family: "signal", title: "带通滤波", icon: "BP", desc: "波形 × 频带" },
    { kind: "hilbert", family: "signal", title: "希尔伯特包络", icon: "H", desc: "输出包络信号" },
    { kind: "fft", family: "signal", title: "FFT 频谱", icon: "F", desc: "单边幅值谱" },
  ] },
  { group: "频谱分析", items: [
    { kind: "alignSpectrum", family: "spectrum", title: "频谱对齐", icon: "≋", desc: "统一频率分辨率" },
    { kind: "bandSlice", family: "spectrum", title: "频段截取", icon: "[ ]", desc: "按范围提取频谱" },
    { kind: "peakDetect", family: "spectrum", title: "局部峰值检测", icon: "⌃", desc: "突出度 / 峰间距", defaults: { minProminence: 1.15, minDistanceHz: 1, maxPeaks: 80 } },
    { kind: "harmonicSearch", family: "spectrum", title: "谐波关系搜索", icon: "1×", desc: "连续倍频峰组", defaults: { harmonicOrders: "1,2,3", toleranceHz: 1.5 } },
    { kind: "harmonicSequence", family: "spectrum", title: "倍频序列", icon: "n×", desc: "生成 1×…N×", defaults: { startOrder: 1, endOrder: 5 } },
    { kind: "frequencyExclude", family: "spectrum", title: "频率剔除", icon: "⊘", desc: "按频率列表去除峰值", defaults: { toleranceHz: 1.5 } },
    { kind: "totalEnergy", family: "spectrum", title: "频谱总能量", icon: "E", desc: "ΣA²" },
    { kind: "peakEnergyRatio", family: "spectrum", title: "峰值能量占比", icon: "%", desc: "单峰能量 / 总能量" },
    { kind: "localContrast", family: "spectrum", title: "局部背景对比", icon: "Δ", desc: "峰值 / 左右均值", defaults: { windowHz: 3 } },
    { kind: "slidingEnergy", family: "spectrum", title: "滑动频带能量", icon: "▰", desc: "生成能量曲线", defaults: { windowHz: 120, stepHz: 40 } },
    { kind: "bandConstruct", family: "spectrum", title: "频带构造", icon: "↔", desc: "中心频率 ± 带宽" },
    { kind: "frequencyMatch", family: "spectrum", title: "频率匹配", icon: "◎", desc: "理论频率附近寻峰", defaults: { toleranceHz: 2 } },
  ] },
  { group: "列表处理", items: [
    { kind: "listCount", family: "list", title: "列表计数", icon: "#", desc: "数量 / True数量" },
    { kind: "listFilter", family: "list", title: "列表筛选", icon: "⌁", desc: "按布尔掩码保留" },
    { kind: "listSort", family: "list", title: "列表排序", icon: "⇅", desc: "频率 / 幅值 / 能量", defaults: { sortDirection: "desc", sortField: "amplitude" } },
    { kind: "topN", family: "list", title: "前 N 项", icon: "N", desc: "取列表前若干项", defaults: { count: 3 } },
    { kind: "minmax", family: "list", title: "最值选择", icon: "↕", desc: "最大 / 最小", defaults: { sortDirection: "desc", selectField: "value", outputField: "value" } },
    { kind: "listItem", family: "list", title: "列表取项", icon: "[i]", desc: "读取指定序号", defaults: { index: 0 } },
    { kind: "listMerge", family: "list", title: "列表合并", icon: "∪", desc: "合并多个数值或列表" },
    { kind: "fieldExtract", family: "list", title: "字段提取", icon: ".f", desc: "提取频率 / 幅值", defaults: { selectField: "frequency" } },
  ] },
  { group: "诊断输出", items: [
    { kind: "display", family: "display", title: "数据显示", icon: "▥", desc: "波形 / 频谱 / 列表", defaults: { displayMode: "auto" } },
    { kind: "output", family: "output", title: "诊断结果", icon: "!", desc: "可编辑结论", defaults: { resultText: "规则条件成立" } },
    { kind: "report", family: "report", title: "报告导出", icon: "W", desc: "下载 Word" },
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
  node("normal", "source", "source", "正常工况波形", 0, 40),
  node("fault", "source", "source", "疑似故障波形", 0, 270),
  node("rms-n", "metric", "metric", "正常 RMS", 270, 0, { metric: "rms" }),
  node("rms-f", "metric", "metric", "故障 RMS", 270, 150, { metric: "rms" }),
  node("rms-ratio", "math", "math", "RMS 比值 a", 520, 70, { operation: "/" }),
  node("th-a", "constant", "math", "阈值 th_a", 520, 245, { numberValue: 1.2, unit: "—" }),
  node("cmp-a", "compare", "condition", "a > th_a", 770, 105, { compareOp: ">" }),
  node("kurt-n", "metric", "metric", "正常峭度", 270, 340, { metric: "kurtosis" }),
  node("kurt-f", "metric", "metric", "故障峭度", 270, 490, { metric: "kurtosis" }),
  node("kurt-ratio", "math", "math", "峭度比值 b", 520, 410, { operation: "/" }),
  node("th-b", "constant", "math", "阈值 th_b", 520, 585, { numberValue: 1.25, unit: "—" }),
  node("cmp-b", "compare", "condition", "b > th_b", 770, 445, { compareOp: ">" }),
  node("initial-and", "logic", "condition", "时域条件均满足", 1020, 275, { logic: "AND" }),
  node("fault-gate", "gate", "condition", "时域初筛条件门", 1270, 275),

  node("integrate", "integrate", "signal", "加速度转速度", 0, 790, { highpassHz: 2 }),
  node("fft-vel", "fft", "signal", "速度频谱", 250, 790),
  node("peaks-vel", "peakDetect", "spectrum", "速度谱峰值", 500, 790, { minProminence: 1.18, minDistanceHz: 2, maxPeaks: 60 }),
  node("harmonic-groups", "harmonicSearch", "spectrum", "1×2×3×谐波组", 750, 790, { harmonicOrders: "1,2,3", toleranceHz: 1.8 }),
  node("fr", "listItem", "list", "转频 fr", 1000, 790, { index: 0, unit: "Hz" }),

  node("fft-fault", "fft", "signal", "故障原始频谱", 0, 1130),
  node("zero", "constant", "math", "频段下限 0", 250, 1000, { numberValue: 0, unit: "Hz" }),
  node("ten", "constant", "math", "上限倍数 10", 250, 1130, { numberValue: 10, unit: "×" }),
  node("ten-fr", "math", "math", "10 × fr", 500, 1050, { operation: "*" }),
  node("fault-band", "bandSlice", "spectrum", "截取 0～10fr", 750, 1110),
  node("peaks-fault", "peakDetect", "spectrum", "候选局部峰值", 1000, 1110, { minProminence: 1.12, minDistanceHz: 1, maxPeaks: 120 }),
  node("shaft-harmonics", "harmonicSequence", "spectrum", "1～30倍转频", 750, 1310, { startOrder: 1, endOrder: 30 }),
  node("tol-shaft", "constant", "math", "转频剔除容差", 1000, 1310, { numberValue: 1.5, unit: "Hz" }),
  node("exclude-shaft", "frequencyExclude", "spectrum", "剔除转频倍频", 1250, 1160, { toleranceHz: 1.5 }),
  node("total-energy", "totalEnergy", "spectrum", "0～10fr总能量", 1000, 1480),
  node("energy-ratio", "peakEnergyRatio", "spectrum", "单峰能量占比", 1500, 1080),
  node("th-c", "constant", "math", "阈值 th_c", 1500, 1280, { numberValue: 0.003, unit: "比例" }),
  node("cmp-c", "compare", "condition", "能量占比 > th_c", 1750, 1110, { compareOp: ">" }),
  node("three-hz", "constant", "math", "左右频宽", 1500, 1460, { numberValue: 3, unit: "Hz" }),
  node("contrast", "localContrast", "spectrum", "左右 3Hz 背景对比", 1750, 1390, { windowHz: 3 }),
  node("th-e", "constant", "math", "阈值 th_e", 1750, 1580, { numberValue: 1.35, unit: "倍" }),
  node("cmp-e", "compare", "condition", "局部对比 > th_e", 2000, 1400, { compareOp: ">" }),
  node("candidate-mask", "logic", "condition", "候选条件 AND", 2250, 1230, { logic: "AND" }),
  node("f-list", "listFilter", "list", "候选频率 F_list", 2500, 1230),

  node("fft-normal", "fft", "signal", "正常原始频谱", 0, 1780),
  node("align", "alignSpectrum", "spectrum", "正常/故障频谱对齐", 250, 1730),
  node("aligned-normal", "listItem", "list", "对齐正常频谱", 500, 1660, { index: 0 }),
  node("aligned-fault", "listItem", "list", "对齐故障频谱", 500, 1830, { index: 1 }),
  node("subtract-spectrum", "math", "math", "故障谱 − 正常谱", 750, 1730, { operation: "-" }),
  node("diff-spectrum", "absolute", "math", "差谱绝对值", 1000, 1730),
  node("band-window", "constant", "math", "能量窗宽", 1000, 1910, { numberValue: 120, unit: "Hz" }),
  node("band-step", "constant", "math", "滑动步长", 1000, 2040, { numberValue: 40, unit: "Hz" }),
  node("sliding-energy", "slidingEnergy", "spectrum", "差谱滑动能量", 1250, 1770, { windowHz: 120, stepHz: 40 }),
  node("energy-bands", "peakDetect", "spectrum", "能量频带峰值", 1500, 1770, { minProminence: 1.05, minDistanceHz: 80, maxPeaks: 12 }),
  node("sort-bands", "listSort", "list", "频带能量降序", 1750, 1770, { sortDirection: "desc", sortField: "amplitude" }),
  node("top3", "topN", "list", "最高 3 个频带", 2000, 1770, { count: 3 }),
  node("top-count", "constant", "math", "频带数量上限", 2000, 1940, { numberValue: 3, unit: "个" }),
  node("band-centers", "fieldExtract", "list", "提取中心频率", 2250, 1770, { selectField: "frequency" }),
  node("demod-width", "constant", "math", "解调半带宽 d", 2250, 1940, { numberValue: 120, unit: "Hz" }),
  node("band-list", "bandConstruct", "spectrum", "解调频带 Band_List", 2500, 1770),

  node("bandpass", "bandpass", "signal", "多频带带通滤波", 0, 2240),
  node("envelope", "hilbert", "signal", "希尔伯特包络", 250, 2240),
  node("fft-envelope", "fft", "signal", "多频段包络谱", 500, 2240),
  node("c06", "constant", "math", "系数 0.6", 750, 2110, { numberValue: 0.6, unit: "×fr" }),
  node("fr06", "math", "math", "0.6 × fr", 1000, 2110, { operation: "*" }),
  node("two-hz", "constant", "math", "搜索半宽 2Hz", 1000, 2270, { numberValue: 2, unit: "Hz" }),
  node("band06", "bandConstruct", "spectrum", "0.6fr ± 2Hz", 1250, 2110),
  node("slice06", "bandSlice", "spectrum", "0.6fr 包络频段", 1500, 2110),
  node("peak06", "peakDetect", "spectrum", "0.6fr 显著峰", 1750, 2110, { minProminence: 1.08, minDistanceHz: 0.5, maxPeaks: 20 }),
  node("count06", "listCount", "list", "0.6fr 峰数量", 2000, 2040),
  node("zero-count", "constant", "math", "常数 0", 2000, 2200, { numberValue: 0, unit: "个" }),
  node("has06", "compare", "condition", "0.6fr 是否有峰", 2250, 2080, { compareOp: ">" }),
  node("best06", "minmax", "list", "0.6fr 最大峰频率", 2000, 2330, { sortDirection: "desc", selectField: "amplitude", outputField: "frequency" }),
  node("c04", "constant", "math", "系数 0.4", 750, 2470, { numberValue: 0.4, unit: "×fr" }),
  node("fr04", "math", "math", "0.4 × fr", 1000, 2470, { operation: "*" }),
  node("band04", "bandConstruct", "spectrum", "0.4fr ± 2Hz", 1250, 2470),
  node("slice04", "bandSlice", "spectrum", "0.4fr 包络频段", 1500, 2470),
  node("peak04", "peakDetect", "spectrum", "0.4fr 显著峰", 1750, 2470, { minProminence: 1.08, minDistanceHz: 0.5, maxPeaks: 20 }),
  node("best04", "minmax", "list", "0.4fr 最大峰频率", 2000, 2470, { sortDirection: "desc", selectField: "amplitude", outputField: "frequency" }),
  node("fc-out-06", "math", "math", "fr − fc_in", 2250, 2330, { operation: "-" }),
  node("fc-in-04", "math", "math", "fr − fc_out", 2250, 2470, { operation: "-" }),
  node("fc-in", "select", "condition", "保持架对内频率 fc_in", 2500, 2240),
  node("fc-out", "select", "condition", "保持架对外频率 fc_out", 2500, 2440),
  node("fc-targets", "listMerge", "list", "fc_in / fc_out 列表", 2750, 2340),
  node("cross-match", "frequencyMatch", "spectrum", "跨频段保持架验证", 3000, 2340, { toleranceHz: 2 }),
  node("cross-count", "listCount", "list", "跨频段命中数量", 3250, 2340),
  node("min-hits", "constant", "math", "最少命中次数", 3250, 2510, { numberValue: 2, unit: "个" }),
  node("cross-ok", "compare", "condition", "跨频段验证通过", 3500, 2380, { compareOp: ">=" }),

  node("candidate-frequencies", "fieldExtract", "list", "提取候选频率", 0, 2860, { selectField: "frequency" }),
  node("ratio-out", "math", "math", "候选频率 ÷ fc_out", 250, 2760, { operation: "/" }),
  node("round-out", "round", "math", "外圈候选整数 n", 500, 2760, { roundMode: "round" }),
  node("delta-out", "math", "math", "外圈倍数偏差", 750, 2760, { operation: "-" }),
  node("abs-out", "absolute", "math", "外圈偏差绝对值", 1000, 2760),
  node("tol01", "constant", "math", "偏差限值 0.1", 1000, 2920, { numberValue: 0.1, unit: "—" }),
  node("cmp-out", "compare", "condition", "外圈倍数偏差合格", 1250, 2790, { compareOp: "<=" }),
  node("outer-candidates", "listFilter", "list", "外圈匹配候选", 1500, 2760),
  node("outer-count", "listCount", "list", "外圈候选数量", 1750, 2760),
  node("outer-has", "compare", "condition", "存在外圈候选", 2000, 2760, { compareOp: ">" }),
  node("matched-n-out", "listFilter", "list", "外圈匹配 n", 1500, 2940),
  node("theory-inner", "math", "math", "理论内圈频率", 1750, 2940, { operation: "*" }),
  node("match-inner-theory", "frequencyMatch", "spectrum", "反向验证理论内圈", 2000, 2940, { toleranceHz: 2 }),
  node("inner-proof-count", "listCount", "list", "内圈互证峰数量", 2250, 2940),
  node("inner-proof-ok", "compare", "condition", "内圈互证存在", 2500, 2940, { compareOp: ">" }),
  node("outer-and", "logic", "condition", "外圈双向一致性", 2750, 2820, { logic: "AND" }),

  node("ratio-in", "math", "math", "候选频率 ÷ fc_in", 250, 3200, { operation: "/" }),
  node("round-in", "round", "math", "内圈候选整数 n", 500, 3200, { roundMode: "round" }),
  node("delta-in", "math", "math", "内圈倍数偏差", 750, 3200, { operation: "-" }),
  node("abs-in", "absolute", "math", "内圈偏差绝对值", 1000, 3200),
  node("cmp-in", "compare", "condition", "内圈倍数偏差合格", 1250, 3200, { compareOp: "<=" }),
  node("inner-candidates", "listFilter", "list", "内圈匹配候选", 1500, 3200),
  node("inner-count", "listCount", "list", "内圈候选数量", 1750, 3200),
  node("inner-has", "compare", "condition", "存在内圈候选", 2000, 3200, { compareOp: ">" }),
  node("matched-n-in", "listFilter", "list", "内圈匹配 n", 1500, 3380),
  node("theory-outer", "math", "math", "理论外圈频率", 1750, 3380, { operation: "*" }),
  node("match-outer-theory", "frequencyMatch", "spectrum", "反向验证理论外圈", 2000, 3380, { toleranceHz: 2 }),
  node("outer-proof-count", "listCount", "list", "外圈互证峰数量", 2250, 3380),
  node("outer-proof-ok", "compare", "condition", "外圈互证存在", 2500, 3380, { compareOp: ">" }),
  node("inner-and", "logic", "condition", "内圈双向一致性", 2750, 3260, { logic: "AND" }),
  node("any-fault", "logic", "condition", "任一内外圈匹配", 3000, 3040, { logic: "OR" }),
  node("not-fault", "logic", "condition", "无内外圈匹配", 3250, 3040, { logic: "NOT" }),
  node("outer-result", "output", "output", "轴承外圈故障", 3250, 2760, { resultText: "轴承外圈故障" }),
  node("inner-result", "output", "output", "轴承内圈故障", 3250, 3260, { resultText: "轴承内圈故障" }),
  node("normal-result", "output", "output", "非轴承内外圈故障", 3500, 3040, { resultText: "不属于轴承内/外圈故障" }),
  node("report", "report", "report", "诊断报告导出", 3750, 3040),
  node("n-min", "constant", "math", "滚动体数量下限", 0, 3620, { numberValue: 6, unit: "个" }),
  node("n-max", "constant", "math", "滚动体数量上限", 0, 3760, { numberValue: 12, unit: "个" }),
  node("n-out-min", "compare", "condition", "外圈 n ≥ 下限", 250, 3540, { compareOp: ">=" }),
  node("n-out-max", "compare", "condition", "外圈 n ≤ 上限", 250, 3710, { compareOp: "<=" }),
  node("n-out-range", "logic", "condition", "外圈 n 范围合格", 500, 3620, { logic: "AND" }),
  node("outer-mask", "logic", "condition", "外圈偏差与范围", 750, 3620, { logic: "AND" }),
  node("n-in-min", "compare", "condition", "内圈 n ≥ 下限", 1000, 3540, { compareOp: ">=" }),
  node("n-in-max", "compare", "condition", "内圈 n ≤ 上限", 1000, 3710, { compareOp: "<=" }),
  node("n-in-range", "logic", "condition", "内圈 n 范围合格", 1250, 3620, { logic: "AND" }),
  node("inner-mask", "logic", "condition", "内圈偏差与范围", 1500, 3620, { logic: "AND" }),
  node("display-diff", "display", "display", "差谱显示", 1250, 1940, { displayMode: "spectrum" }),
  node("display-env", "display", "display", "包络谱显示", 750, 2340, { displayMode: "spectrum" }),
  node("display-candidates", "display", "display", "候选频率显示", 2750, 1230, { displayMode: "list" }),
];

export const exampleConnections: Connection[] = [
  edge("normal", "rms-n"), edge("fault", "rms-f"), edge("rms-f", "rms-ratio", "a"), edge("rms-n", "rms-ratio", "b"), edge("rms-ratio", "cmp-a", "a"), edge("th-a", "cmp-a", "b"),
  edge("normal", "kurt-n"), edge("fault", "kurt-f"), edge("kurt-f", "kurt-ratio", "a"), edge("kurt-n", "kurt-ratio", "b"), edge("kurt-ratio", "cmp-b", "a"), edge("th-b", "cmp-b", "b"),
  edge("cmp-a", "initial-and", "items"), edge("cmp-b", "initial-and", "items"), edge("fault", "fault-gate", "data"), edge("initial-and", "fault-gate", "condition"),
  edge("fault-gate", "integrate"), edge("integrate", "fft-vel"), edge("fft-vel", "peaks-vel", "spectrum"), edge("peaks-vel", "harmonic-groups", "peaks"), edge("harmonic-groups", "fr"),
  edge("fault-gate", "fft-fault"), edge("fr", "ten-fr", "a"), edge("ten", "ten-fr", "b"), edge("fft-fault", "fault-band", "spectrum"), edge("zero", "fault-band", "min"), edge("ten-fr", "fault-band", "max"), edge("fault-band", "peaks-fault", "spectrum"),
  edge("fr", "shaft-harmonics", "base"), edge("peaks-fault", "exclude-shaft", "peaks"), edge("shaft-harmonics", "exclude-shaft", "frequencies"), edge("tol-shaft", "exclude-shaft", "tolerance"), edge("fault-band", "total-energy"),
  edge("exclude-shaft", "energy-ratio", "peaks"), edge("total-energy", "energy-ratio", "energy"), edge("energy-ratio", "cmp-c", "a"), edge("th-c", "cmp-c", "b"), edge("fault-band", "contrast", "spectrum"), edge("exclude-shaft", "contrast", "peaks"), edge("three-hz", "contrast", "width"), edge("contrast", "cmp-e", "a"), edge("th-e", "cmp-e", "b"), edge("cmp-c", "candidate-mask", "items"), edge("cmp-e", "candidate-mask", "items"), edge("exclude-shaft", "f-list", "list"), edge("candidate-mask", "f-list", "mask"), edge("f-list", "display-candidates"),
  edge("normal", "fft-normal"), edge("fft-normal", "align", "a"), edge("fft-fault", "align", "b"), edge("align", "aligned-normal"), edge("align", "aligned-fault"), edge("aligned-fault", "subtract-spectrum", "a"), edge("aligned-normal", "subtract-spectrum", "b"), edge("subtract-spectrum", "diff-spectrum"), edge("diff-spectrum", "sliding-energy", "spectrum"), edge("band-window", "sliding-energy", "window"), edge("band-step", "sliding-energy", "step"), edge("sliding-energy", "energy-bands", "spectrum"), edge("energy-bands", "sort-bands"), edge("sort-bands", "top3", "input"), edge("top-count", "top3", "n"), edge("top3", "band-centers"), edge("band-centers", "band-list", "centers"), edge("demod-width", "band-list", "width"), edge("diff-spectrum", "display-diff"),
  edge("fault-gate", "bandpass", "waveform"), edge("band-list", "bandpass", "bands"), edge("bandpass", "envelope"), edge("envelope", "fft-envelope"), edge("fft-envelope", "display-env"),
  edge("fr", "fr06", "a"), edge("c06", "fr06", "b"), edge("fr06", "band06", "centers"), edge("two-hz", "band06", "width"), edge("fft-envelope", "slice06", "spectrum"), edge("band06", "slice06", "bands"), edge("slice06", "peak06", "spectrum"), edge("peak06", "count06"), edge("count06", "has06", "a"), edge("zero-count", "has06", "b"), edge("peak06", "best06"),
  edge("fr", "fr04", "a"), edge("c04", "fr04", "b"), edge("fr04", "band04", "centers"), edge("two-hz", "band04", "width"), edge("fft-envelope", "slice04", "spectrum"), edge("band04", "slice04", "bands"), edge("slice04", "peak04", "spectrum"), edge("peak04", "best04"),
  edge("fr", "fc-out-06", "a"), edge("best06", "fc-out-06", "b"), edge("fr", "fc-in-04", "a"), edge("best04", "fc-in-04", "b"),
  edge("has06", "fc-in", "condition"), edge("best06", "fc-in", "a"), edge("fc-in-04", "fc-in", "b"), edge("has06", "fc-out", "condition"), edge("fc-out-06", "fc-out", "a"), edge("best04", "fc-out", "b"),
  edge("fc-in", "fc-targets", "items"), edge("fc-out", "fc-targets", "items"), edge("fft-envelope", "cross-match", "spectrum"), edge("fc-targets", "cross-match", "targets"), edge("two-hz", "cross-match", "tolerance"), edge("cross-match", "cross-count"), edge("cross-count", "cross-ok", "a"), edge("min-hits", "cross-ok", "b"),
  edge("f-list", "candidate-frequencies"), edge("candidate-frequencies", "ratio-out", "a"), edge("fc-out", "ratio-out", "b"), edge("ratio-out", "round-out"), edge("ratio-out", "delta-out", "a"), edge("round-out", "delta-out", "b"), edge("delta-out", "abs-out"), edge("abs-out", "cmp-out", "a"), edge("tol01", "cmp-out", "b"), edge("round-out", "n-out-min", "a"), edge("n-min", "n-out-min", "b"), edge("round-out", "n-out-max", "a"), edge("n-max", "n-out-max", "b"), edge("n-out-min", "n-out-range", "items"), edge("n-out-max", "n-out-range", "items"), edge("cmp-out", "outer-mask", "items"), edge("n-out-range", "outer-mask", "items"), edge("f-list", "outer-candidates", "list"), edge("outer-mask", "outer-candidates", "mask"), edge("outer-candidates", "outer-count"), edge("outer-count", "outer-has", "a"), edge("zero-count", "outer-has", "b"), edge("round-out", "matched-n-out", "list"), edge("outer-mask", "matched-n-out", "mask"), edge("matched-n-out", "theory-inner", "a"), edge("fc-in", "theory-inner", "b"), edge("fft-envelope", "match-inner-theory", "spectrum"), edge("theory-inner", "match-inner-theory", "targets"), edge("two-hz", "match-inner-theory", "tolerance"), edge("match-inner-theory", "inner-proof-count"), edge("inner-proof-count", "inner-proof-ok", "a"), edge("zero-count", "inner-proof-ok", "b"), edge("outer-has", "outer-and", "items"), edge("inner-proof-ok", "outer-and", "items"), edge("cross-ok", "outer-and", "items"),
  edge("candidate-frequencies", "ratio-in", "a"), edge("fc-in", "ratio-in", "b"), edge("ratio-in", "round-in"), edge("ratio-in", "delta-in", "a"), edge("round-in", "delta-in", "b"), edge("delta-in", "abs-in"), edge("abs-in", "cmp-in", "a"), edge("tol01", "cmp-in", "b"), edge("round-in", "n-in-min", "a"), edge("n-min", "n-in-min", "b"), edge("round-in", "n-in-max", "a"), edge("n-max", "n-in-max", "b"), edge("n-in-min", "n-in-range", "items"), edge("n-in-max", "n-in-range", "items"), edge("cmp-in", "inner-mask", "items"), edge("n-in-range", "inner-mask", "items"), edge("f-list", "inner-candidates", "list"), edge("inner-mask", "inner-candidates", "mask"), edge("inner-candidates", "inner-count"), edge("inner-count", "inner-has", "a"), edge("zero-count", "inner-has", "b"), edge("round-in", "matched-n-in", "list"), edge("inner-mask", "matched-n-in", "mask"), edge("matched-n-in", "theory-outer", "a"), edge("fc-out", "theory-outer", "b"), edge("fft-envelope", "match-outer-theory", "spectrum"), edge("theory-outer", "match-outer-theory", "targets"), edge("two-hz", "match-outer-theory", "tolerance"), edge("match-outer-theory", "outer-proof-count"), edge("outer-proof-count", "outer-proof-ok", "a"), edge("zero-count", "outer-proof-ok", "b"), edge("inner-has", "inner-and", "items"), edge("outer-proof-ok", "inner-and", "items"), edge("cross-ok", "inner-and", "items"),
  edge("outer-and", "any-fault", "items"), edge("inner-and", "any-fault", "items"), edge("any-fault", "not-fault", "items"), edge("outer-and", "outer-result"), edge("inner-and", "inner-result"), edge("not-fault", "normal-result"), edge("outer-result", "report", "results"), edge("inner-result", "report", "results"), edge("normal-result", "report", "results"),
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
          if (value?.type === "numbers" && value.data[index] !== undefined) result = { type: "number", data: value.data[index] };
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
          result = { type: "peaks", data: matches };
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
  if (value.type === "boolean") return { primary: value.data ? "满足" : "不满足", secondary: "布尔结果" };
  if (value.type === "waveform") return { primary: `${value.data.samples.length.toLocaleString()} 点`, secondary: `${value.data.fs.toLocaleString()} Hz` };
  if (value.type === "spectrum") return { primary: `${value.data.length.toLocaleString()} 线`, secondary: value.data.length ? `0–${value.data[value.data.length - 1].f.toFixed(0)} Hz` : "空频谱" };
  if (value.type === "numbers") return { primary: `${value.data.length} 项`, secondary: value.data.slice(0, 3).map((item) => item.toFixed(2)).join("、") || "空列表" };
  if (value.type === "booleans") return { primary: `${value.data.filter(Boolean).length}/${value.data.length}`, secondary: "条件满足" };
  if (value.type === "peaks") return { primary: `${value.data.length} 个峰`, secondary: value.data.slice(0, 2).map((item) => `${item.f.toFixed(2)}Hz`).join("、") || "无峰值" };
  if (value.type === "bands") return { primary: `${value.data.length} 个频带`, secondary: value.data.slice(0, 2).map((item) => `${item.min.toFixed(0)}–${item.max.toFixed(0)}Hz`).join("、") || "空频带" };
  if (value.type === "waveforms") return { primary: `${value.data.length} 条波形`, secondary: `${value.data[0]?.samples.length.toLocaleString() ?? 0} 点/条` };
  return { primary: `${value.data.length} 条频谱`, secondary: value.data[0]?.length ? `${value.data[0].length.toLocaleString()} 线/条` : "空频谱" };
}
