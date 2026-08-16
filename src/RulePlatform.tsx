import { useEffect, useMemo, useRef, useState } from "react";
import { downloadHistory, historyConfigured, listHistory, saveHistory, type HistoryRecord } from "./historyApi";
import {
  NODE_WIDTH,
  OUTPUT_PORT_Y,
  calculateMetrics,
  exampleConnections,
  exampleNodes,
  executeGraph,
  generateDemoSignal,
  inputPorts,
  nodeMeta,
  palette,
  parseTextSignal,
  portOffset,
  summarizeValue,
  type Connection,
  type FlowNode,
  type NodeKind,
  type PaletteItem,
  type RuntimeValue,
  type SourceSignal,
  type SpectrumPoint,
} from "./flowCore";

type CanvasView = { x: number; y: number; scale: number };
type SelectionBox = { left: number; top: number; width: number; height: number };
type SidebarMode = "nodes" | "history";

const INITIAL_VIEW: CanvasView = { x: 48, y: 34, scale: 0.72 };
const MIN_SCALE = 0.28;
const MAX_SCALE = 1.8;

function cloneExampleNodes() {
  return exampleNodes.map((item) => ({ ...item }));
}

function cloneExampleConnections() {
  return exampleConnections.map((item) => ({ ...item }));
}

function TinyWave({ samples }: { samples: number[] }) {
  const values = samples.length ? Array.from({ length: 44 }, (_, index) => samples[Math.floor(index / 43 * (samples.length - 1))]) : [];
  const max = Math.max(1e-8, ...values.map(Math.abs));
  const points = values.map((value, index) => `${index / 43 * 120},${18 - value / max * 14}`).join(" ");
  return <svg className="tiny-wave" viewBox="0 0 120 36" preserveAspectRatio="none"><line x1="0" y1="18" x2="120" y2="18"/>{values.length > 0 && <polyline points={points}/>}</svg>;
}

function DataWave({ samples }: { samples: number[] }) {
  const values = samples.length ? Array.from({ length: 96 }, (_, index) => samples[Math.floor(index / 95 * (samples.length - 1))]) : [];
  const max = Math.max(1e-8, ...values.map(Math.abs));
  const points = values.map((value, index) => `${index / 95 * 196},${36 - value / max * 29}`).join(" ");
  return <svg className="data-chart data-wave" viewBox="0 0 196 72" preserveAspectRatio="none"><line x1="0" y1="36" x2="196" y2="36"/>{values.length > 0 && <polyline points={points}/>}</svg>;
}

function SpectrumChart({ spectra, peaks = [] }: { spectra: SpectrumPoint[][]; peaks?: SpectrumPoint[] }) {
  const spectrum = spectra[0] ?? [];
  const buckets = Array.from({ length: 96 }, (_, index) => {
    const from = Math.floor(index / 96 * spectrum.length);
    const to = Math.max(from + 1, Math.floor((index + 1) / 96 * spectrum.length));
    return spectrum.slice(from, to).reduce((best, point) => point.a > best ? point.a : best, 0);
  });
  const maxAmplitude = Math.max(1e-9, ...buckets, ...peaks.map((point) => point.a));
  const polyline = buckets.map((value, index) => `${index / 95 * 196},${67 - value / maxAmplitude * 60}`).join(" ");
  const maxHz = spectrum[spectrum.length - 1]?.f ?? 1;
  return <svg className="data-chart spectrum-chart" viewBox="0 0 196 72" preserveAspectRatio="none">
    <line x1="0" y1="67" x2="196" y2="67"/>
    {spectrum.length > 0 && <polyline points={polyline}/>} 
    {peaks.slice(0, 24).map((point, index) => <g key={`${point.f}-${index}`}><line className="peak-marker" x1={point.f / maxHz * 196} y1="8" x2={point.f / maxHz * 196} y2="67"/><circle className="peak-dot" cx={point.f / maxHz * 196} cy={67 - point.a / maxAmplitude * 60} r="2.2"/></g>)}
  </svg>;
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
    {samples.length > 0 && <path className="detail-wave-path" d={envelope}/>} 
    <text className="axis-title" x={18} y={height/2} textAnchor="middle" transform={`rotate(-90 18 ${height/2})`}>幅值</text>
    <text className="axis-title" x={left+plotWidth/2} y={height-2} textAnchor="middle">时间</text>
  </svg>;
}

function DetailedSpectrum({ spectra, peaks = [] }: { spectra: SpectrumPoint[][]; peaks?: SpectrumPoint[] }) {
  const spectrum = spectra[0] ?? [];
  const width = 920, height = 340, left = 62, right = 18, top = 20, bottom = 46;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const maxHz = spectrum[spectrum.length - 1]?.f ?? 1;
  const bucketCount = Math.min(Math.max(1, Math.floor(plotWidth)), Math.max(1, spectrum.length));
  const buckets = Array.from({length:bucketCount},(_,index)=>{
    const from=Math.floor(index/bucketCount*spectrum.length),to=Math.max(from+1,Math.floor((index+1)/bucketCount*spectrum.length));
    return spectrum.slice(from,to).reduce((best,point)=>point.a>best?point.a:best,0);
  });
  const maxAmplitude=Math.max(1e-9,...buckets,...peaks.map((point)=>point.a));
  const x=(frequency:number)=>left+frequency/Math.max(1e-9,maxHz)*plotWidth;
  const y=(amplitude:number)=>top+plotHeight-amplitude/maxAmplitude*plotHeight*.94;
  const line=buckets.map((value,index)=>`${left+index/Math.max(1,bucketCount-1)*plotWidth},${y(value)}`).join(" ");
  return <svg className="detail-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
    {Array.from({length:5},(_,index)=>{const gy=top+index/4*plotHeight;return <line className="detail-grid" key={`h${index}`} x1={left} y1={gy} x2={width-right} y2={gy}/>;})}
    {Array.from({length:6},(_,index)=>{const frequency=maxHz*index/5,gx=x(frequency);return <g key={`v${index}`}><line className="detail-grid" x1={gx} y1={top} x2={gx} y2={top+plotHeight}/><text x={gx} y={height-18} textAnchor="middle">{frequency.toFixed(1)}</text></g>;})}
    {spectrum.length>0&&<polyline className="detail-spectrum-path" points={line}/>} 
    {peaks.slice(0,40).map((peak,index)=><g key={`${peak.f}-${index}`}><line className="detail-peak-line" x1={x(peak.f)} y1={top} x2={x(peak.f)} y2={top+plotHeight}/><circle className="detail-peak-dot" cx={x(peak.f)} cy={y(peak.a)} r="4"/><text className="detail-peak-label" x={x(peak.f)+5} y={Math.max(top+10,y(peak.a)-7)}>{peak.f.toFixed(2)} Hz</text></g>)}
    <text className="axis-title" x={18} y={height/2} textAnchor="middle" transform={`rotate(-90 18 ${height/2})`}>幅值</text>
    <text className="axis-title" x={left+plotWidth/2} y={height-2} textAnchor="middle">频率 / Hz</text>
  </svg>;
}

function runtimeSpectra(value?: RuntimeValue) {
  if (value?.type === "spectrum") return [value.data];
  if (value?.type === "spectra") return value.data;
  return [];
}

function resultTone(value?: RuntimeValue) {
  return value?.type === "boolean" ? (value.data ? "pass" : "fail") : "";
}

export default function RulePlatform() {
  const [nodes, setNodes] = useState<FlowNode[]>(cloneExampleNodes);
  const [connections, setConnections] = useState<Connection[]>(cloneExampleConnections);
  const [sourceSignals, setSourceSignals] = useState<Record<string, SourceSignal>>({});
  const [defaultFs, setDefaultFs] = useState(10240);
  const [rpm, setRpm] = useState(1500);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [runResults, setRunResults] = useState<ReturnType<typeof executeGraph> | null>(null);
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
  const connectNodesRef = useRef<(source: string, target: string, targetPort: string) => void>(() => undefined);
  const panRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const selectionRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const viewRef = useRef<CanvasView>(INITIAL_VIEW);
  nodesRef.current = nodes;

  const loadedSourceNodes = nodes.filter((item) => item.kind === "source" && sourceSignals[item.id]?.samples.length);
  const loadedPointCount = loadedSourceNodes.reduce((sum, item) => sum + sourceSignals[item.id].samples.length, 0);
  const calculationKey = useMemo(() => JSON.stringify({
    nodes: nodes.map(({x: _x, y: _y, ...rest}) => rest),
    connections: connections.map(({source,target,targetPort}) => ({source,target,targetPort})),
    signals: Object.entries(sourceSignals).map(([id, signal]) => [id, signal.revision]),
  }), [nodes, connections, sourceSignals]);

  useEffect(() => { setRunResults(null); }, [calculationKey]);

  useEffect(() => {
    if (!historyConfigured) return;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true); setHistoryError("");
      try { setHistoryRecords(await listHistory(historySearch)); }
      catch { setHistoryError("历史数据读取失败，请稍后重试"); }
      finally { setHistoryLoading(false); }
    }, historySearch ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [historySearch, historyRefresh]);

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
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
    const rect = viewport.getBoundingClientRect(), view = viewRef.current;
    return { x: (clientX - rect.left - view.x) / view.scale, y: (clientY - rect.top - view.y) / view.scale };
  }

  function zoomCanvas(targetScale: number, anchorX?: number, anchorY?: number) {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect(), px = anchorX ?? rect.width / 2, py = anchorY ?? rect.height / 2;
    setCanvasView((current) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale));
      const worldX = (px - current.x) / current.scale, worldY = (py - current.y) / current.scale;
      return { x: px - worldX * scale, y: py - worldY * scale, scale };
    });
  }

  function connectNodes(source: string, target: string, targetPort: string) {
    const sourceNode = nodes.find((item) => item.id === source), targetNode = nodes.find((item) => item.id === target);
    if (!sourceNode || !targetNode || source === target) return;
    const port = inputPorts(targetNode).find((item) => item.key === targetPort);
    if (!port) return;
    if (sourceNode.kind === "report" || sourceNode.kind === "display") { notify(`${sourceNode.title}是终端节点，不能继续向后连线`); return; }
    if (targetNode.kind === "report" && sourceNode.kind !== "output") { notify("报告导出只接收诊断结果节点"); return; }
    setConnections((current) => {
      const base = port.multi ? current : current.filter((item) => !(item.target === target && item.targetPort === targetPort));
      return base.some((item) => item.source === source && item.target === target && item.targetPort === targetPort) ? base : [...base, { id: `edge-${Date.now()}-${Math.random().toString(16).slice(2)}`, source, target, targetPort }];
    });
  }
  connectNodesRef.current = connectNodes;

  function updateDraftEdge(sourceId: string, x: number, y: number) {
    const source = nodesRef.current.find((item) => item.id === sourceId), path = draftEdgeRef.current;
    if (!source || !path) return;
    const sx = source.x + NODE_WIDTH, sy = source.y + OUTPUT_PORT_Y;
    path.setAttribute("d", `M${sx},${sy} C${sx + 80},${sy} ${x - 80},${y} ${x},${y}`);
    path.classList.add("active");
  }

  function clearDraftEdge() {
    draftEdgeRef.current?.classList.remove("active");
    canvasViewportRef.current?.classList.remove("interacting");
  }

  useEffect(() => {
    let moveFrame = 0;
    let latestPointer: { x: number; y: number } | null = null;
    const applyMove = () => {
      moveFrame = 0;
      const pointer = latestPointer; latestPointer = null;
      if (!pointer) return;
      if (panRef.current) {
        const {startX,startY,originX,originY}=panRef.current;
        setCanvasView((current)=>({...current,x:originX+pointer.x-startX,y:originY+pointer.y-startY}));
      }
      if (selectionRef.current) {
        selectionRef.current.currentX=pointer.x; selectionRef.current.currentY=pointer.y;
        const viewport=canvasViewportRef.current;
        if (viewport) {
          const vr=viewport.getBoundingClientRect();
          const left=Math.max(vr.left,Math.min(selectionRef.current.startX,pointer.x)),right=Math.min(vr.right,Math.max(selectionRef.current.startX,pointer.x));
          const top=Math.max(vr.top,Math.min(selectionRef.current.startY,pointer.y)),bottom=Math.min(vr.bottom,Math.max(selectionRef.current.startY,pointer.y));
          setSelectionBox({left:left-vr.left,top:top-vr.top,width:Math.max(0,right-left),height:Math.max(0,bottom-top)});
          setSelectedIds(Array.from(viewport.querySelectorAll<HTMLElement>(".flow-node[data-node-id]")).flatMap((element)=>{
            const rect=element.getBoundingClientRect(), hit=rect.left<right&&rect.right>left&&rect.top<bottom&&rect.bottom>top;
            return hit&&element.dataset.nodeId?[element.dataset.nodeId]:[];
          }));
        }
      }
      if (dragRef.current) {
        const point=screenToCanvas(pointer.x,pointer.y), {id,dx,dy}=dragRef.current;
        setNodes((current)=>current.map((item)=>item.id===id?{...item,x:point.x-dx,y:point.y-dy}:item));
      }
      if (linkRef.current) {
        const point=screenToCanvas(pointer.x,pointer.y);
        updateDraftEdge(linkRef.current.source,point.x,point.y);
      }
    };
    const handleMove=(event:PointerEvent)=>{latestPointer={x:event.clientX,y:event.clientY};if(!moveFrame)moveFrame=window.requestAnimationFrame(applyMove);};
    const handleUp=(event:PointerEvent)=>{
      if(moveFrame){window.cancelAnimationFrame(moveFrame);moveFrame=0;}
      latestPointer={x:event.clientX,y:event.clientY};applyMove();
      dragRef.current=null;panRef.current=null;selectionRef.current=null;setIsPanning(false);setSelectionBox(null);
      if(linkRef.current){
        const source=linkRef.current.source, element=document.elementFromPoint(event.clientX,event.clientY) as HTMLElement|null;
        const targetElement=element?.closest("[data-input-node]") as HTMLElement|null;
        const target=targetElement?.dataset.inputNode, port=targetElement?.dataset.inputPort;
        if(target&&port&&target!==source)connectNodesRef.current(source,target,port);
        linkRef.current=null;
      }
      clearDraftEdge();
    };
    window.addEventListener("pointermove",handleMove);window.addEventListener("pointerup",handleUp);
    return()=>{if(moveFrame)window.cancelAnimationFrame(moveFrame);window.removeEventListener("pointermove",handleMove);window.removeEventListener("pointerup",handleUp);};
  },[]);

  useEffect(() => {
    const viewport=canvasViewportRef.current;if(!viewport)return;
    const handleWheel=(event:WheelEvent)=>{if(event.ctrlKey){event.preventDefault();const rect=viewport.getBoundingClientRect(),factor=Math.exp(-event.deltaY*.0015);zoomCanvas(viewRef.current.scale*factor,event.clientX-rect.left,event.clientY-rect.top);}};
    viewport.addEventListener("wheel",handleWheel,{passive:false});return()=>viewport.removeEventListener("wheel",handleWheel);
  },[]);

  useEffect(()=>{
    const remove=(event:KeyboardEvent)=>{
      if(event.key!=="Delete"||!selectedIds.length||previewNodeId)return;
      const target=event.target as HTMLElement|null;if(target?.closest("input,textarea,select,button,[contenteditable='true']"))return;
      event.preventDefault();const ids=new Set(selectedIds);
      setNodes((current)=>current.filter((item)=>!ids.has(item.id)));setConnections((current)=>current.filter((item)=>!ids.has(item.source)&&!ids.has(item.target)));
      setSourceSignals((current)=>Object.fromEntries(Object.entries(current).filter(([id])=>!ids.has(id))));setSelectedIds([]);notify(`已删除 ${ids.size} 个节点`);
    };
    window.addEventListener("keydown",remove);return()=>window.removeEventListener("keydown",remove);
  },[selectedIds,previewNodeId]);

  useEffect(()=>{if(!previewNodeId)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setPreviewNodeId(null);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[previewNodeId]);

  function startNodeDrag(event: React.PointerEvent,id:string) {
    if(event.button!==0)return;const target=event.target as HTMLElement;
    if(target.closest("button,input,label,select,.port,.chart-preview"))return;
    const current=nodes.find((item)=>item.id===id);if(!current)return;
    const point=screenToCanvas(event.clientX,event.clientY);dragRef.current={id,dx:point.x-current.x,dy:point.y-current.y};
    canvasViewportRef.current?.classList.add("interacting");setSelectedIds([id]);
  }

  function startConnection(event:React.PointerEvent,source:string){if(event.button!==0)return;event.preventDefault();event.stopPropagation();const point=screenToCanvas(event.clientX,event.clientY);linkRef.current={source};canvasViewportRef.current?.classList.add("interacting");updateDraftEdge(source,point.x,point.y);}
  function finishConnection(event:React.PointerEvent,target:string,targetPort:string){event.preventDefault();event.stopPropagation();const source=linkRef.current?.source;if(source&&source!==target)connectNodes(source,target,targetPort);linkRef.current=null;clearDraftEdge();}

  function startCanvasInteraction(event:React.PointerEvent<HTMLDivElement>){
    const target=event.target as HTMLElement;
    if(event.button===1){event.preventDefault();const view=viewRef.current;panRef.current={startX:event.clientX,startY:event.clientY,originX:view.x,originY:view.y};setIsPanning(true);return;}
    if(target.closest(".flow-node,.edge-layer path,button,input,select,.canvas-tip"))return;
    if(event.button!==0)return;event.preventDefault();selectionRef.current={startX:event.clientX,startY:event.clientY,currentX:event.clientX,currentY:event.clientY};
    const rect=canvasViewportRef.current?.getBoundingClientRect();setSelectionBox(rect?{left:event.clientX-rect.left,top:event.clientY-rect.top,width:0,height:0}:null);setSelectedIds([]);
  }

  function updateNode(id:string,change:Partial<FlowNode>){setNodes((current)=>current.map((item)=>item.id===id?{...item,...change}:item));}
  function removeNode(id:string){setNodes((current)=>current.filter((item)=>item.id!==id));setConnections((current)=>current.filter((item)=>item.source!==id&&item.target!==id));setSourceSignals((current)=>Object.fromEntries(Object.entries(current).filter(([sourceId])=>sourceId!==id)));setSelectedIds((current)=>current.filter((item)=>item!==id));setPreviewNodeId((current)=>current===id?null:current);}
  function clearCanvas(){setNodes([]);setConnections([]);setSourceSignals({});setSelectedIds([]);setPreviewNodeId(null);linkRef.current=null;clearDraftEdge();notify("画布、连线和节点数据已清空");}
  function restoreExample(){setNodes(cloneExampleNodes());setConnections(cloneExampleConnections());setSourceSignals({});setSelectedIds([]);setPreviewNodeId(null);setCanvasView(INITIAL_VIEW);notify("已恢复轴承自主判别实例，请载入两组波形");}
  function loadExampleData(){
    const now=Date.now();
    setSourceSignals((current)=>({...current,normal:{samples:generateDemoSignal(defaultFs,"normal"),fs:defaultFs,fileName:"正常工况演示.txt",revision:now},fault:{samples:generateDemoSignal(defaultFs,"fault"),fs:defaultFs,fileName:"外圈故障演示.txt",revision:now+1}}));
    notify("已载入正常/故障双工况演示数据，点击运行诊断");
  }

  function handleCanvasDrop(event:React.DragEvent){
    event.preventDefault();const historyId=event.dataTransfer.getData("application/x-vibrule-history");
    if(historyId){const record=historyRecords.find((item)=>item.id===historyId);if(!record)return;const point=screenToCanvas(event.clientX,event.clientY),id=`node-${Date.now()}`;setNodes((current)=>[...current,{id,kind:"source",family:"source",title:"振动波形",x:point.x-NODE_WIDTH/2,y:point.y-OUTPUT_PORT_Y}]);setSelectedIds([id]);void loadHistoryIntoNode(record,id);return;}
    const payload=event.dataTransfer.getData("application/x-vibrule-node");if(!payload)return;
    const item=JSON.parse(payload) as PaletteItem;const point=screenToCanvas(event.clientX,event.clientY),id=`node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNodes((current)=>[...current,{id,kind:item.kind,family:item.family,title:item.title,x:point.x-NODE_WIDTH/2,y:point.y-OUTPUT_PORT_Y,...item.defaults}]);setSelectedIds([id]);
  }

  function handleHistoryDropOnSource(event:React.DragEvent,sourceId:string){const historyId=event.dataTransfer.getData("application/x-vibrule-history");if(!historyId)return;event.preventDefault();event.stopPropagation();const record=historyRecords.find((item)=>item.id===historyId);if(record)void loadHistoryIntoNode(record,sourceId);}

  async function loadFile(sourceId:string,file?:File){if(!file)return;try{const samples=parseTextSignal(await file.text()).slice(0,65536);if(samples.length<64)throw new Error("too short");setSourceSignals((current)=>({...current,[sourceId]:{samples,fs:defaultFs,fileName:file.name,revision:Date.now()}}));notify(`${file.name}：已载入 ${samples.length.toLocaleString()} 点，采样频率 ${defaultFs.toLocaleString()} Hz`);}catch{notify("无法识别文件，请使用单列或“时间,幅值”格式");}}
  function loadDemo(sourceId:string){const current=nodes.find((item)=>item.id===sourceId),role=current?.title.includes("正常")?"normal":"fault";setSourceSignals((values)=>({...values,[sourceId]:{samples:generateDemoSignal(defaultFs,role),fs:defaultFs,fileName:role==="normal"?"正常工况演示.txt":"外圈故障演示.txt",revision:Date.now()}}));notify(`${current?.title??"波形"}演示数据已载入`);}

  function queueHistoryFiles(files:FileList|File[]){const supported=Array.from(files).filter((file)=>/\.(txt|csv)$/i.test(file.name));if(!supported.length){notify("请选择 TXT 或 CSV 波形文件");return;}setPendingHistoryFiles((current)=>{const known=new Set(current.map((file)=>`${file.name}-${file.size}-${file.lastModified}`));return[...current,...supported.filter((file)=>!known.has(`${file.name}-${file.size}-${file.lastModified}`))];});}
  async function importPendingHistory(){
    if(!historyConfigured){notify("历史数据服务尚未配置");return;}if(!pendingHistoryFiles.length){notify("请先拖入或选择波形文件");return;}if(historySampleCount<64||historyMaxFrequency<=0){notify("请检查采样点数和最大分析频率");return;}
    setHistoryImporting(true);let success=0,failed=0;
    for(const file of pendingHistoryFiles){try{const values=parseTextSignal(await file.text());if(values.length<64)throw new Error("too short");await saveHistory(file,{sampleCount:Math.round(historySampleCount),samplingFrequency:historyMaxFrequency*2,rpm,bpfo:0});success++;}catch{failed++;}}
    setHistoryImporting(false);if(success){setPendingHistoryFiles([]);setHistoryRefresh((value)=>value+1);}notify(failed?`导入完成：成功 ${success} 个，失败 ${failed} 个`:`已导入 ${success} 个历史波形`);
  }
  async function loadHistoryIntoNode(record:HistoryRecord,sourceId:string){notify(`正在读取历史数据：${record.file_name}`);try{const samples=parseTextSignal(await downloadHistory(record)).slice(0,Math.min(65536,record.sample_count||65536));if(samples.length<64)throw new Error("too short");setSourceSignals((current)=>({...current,[sourceId]:{samples,fs:record.sampling_frequency||defaultFs,fileName:record.file_name,revision:Date.now(),historyId:record.id}}));notify(`${record.file_name} 已装载，点击运行后计算`);}catch{notify("历史波形读取失败，请检查云端文件是否存在");}}

  function runDiagnosis(){
    if(!loadedSourceNodes.length){notify("请先在波形节点中导入数据或载入实例数据");return;}
    const result=executeGraph(nodes,connections,sourceSignals);setRunResults(result);
    if(result.activeResults.length)notify(`诊断完成：${result.activeResults.map((item)=>item.resultText??item.title).join("、")}`);
    else notify(result.errors.size?`计算完成，但有 ${result.errors.size} 个节点需要检查`:`计算完成，当前没有成立的诊断结果`);
  }

  async function downloadReport(reportId:string){
    if(!runResults){notify("请先运行诊断");return;}
    const connectedIds=new Set(connections.filter((item)=>item.target===reportId).map((item)=>item.source));
    const conclusions=nodes.filter((item)=>connectedIds.has(item.id)&&item.kind==="output"&&runResults.values.get(item.id)?.type==="boolean"&&(runResults.values.get(item.id) as {type:"boolean";data:boolean}).data);
    if(!conclusions.length){notify("当前没有成立的诊断结论");return;}
    try{
      const {Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableCell,TableRow,WidthType}=await import("docx");
      const rows=nodes.filter((item)=>runResults.values.has(item.id)&&item.kind!=="display"&&item.kind!=="report").map((item)=>[item.title,summarizeValue(runResults.values.get(item.id)).primary,summarizeValue(runResults.values.get(item.id)).secondary]).slice(0,120);
      const cell=(text:string,bold=false)=>new TableCell({children:[new Paragraph({children:[new TextRun({text,bold,font:"Microsoft YaHei"})]})]});
      const doc=new Document({sections:[{children:[new Paragraph({text:"VibRule 轴承故障自主判别报告",heading:HeadingLevel.TITLE}),new Paragraph({children:[new TextRun({text:`生成时间：${new Date().toLocaleString("zh-CN",{hour12:false})}`,font:"Microsoft YaHei"})]}),new Paragraph({text:"诊断结论",heading:HeadingLevel.HEADING_1}),...conclusions.map((item)=>new Paragraph({children:[new TextRun({text:item.resultText??item.title,bold:true,color:"B42318",font:"Microsoft YaHei"})]})),new Paragraph({text:"节点计算明细",heading:HeadingLevel.HEADING_1}),new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[cell("节点",true),cell("结果",true),cell("说明",true)]}),...rows.map((row)=>new TableRow({children:row.map((value)=>cell(value))}))]})]}]});
      const blob=await Packer.toBlob(doc),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`VibRule_轴承自主判别_${new Date().toISOString().replace(/[-:]/g,"").slice(0,15).replace("T","_")}.docx`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1500);notify("Word诊断报告已生成");
    }catch{notify("报告生成失败，请重新尝试");}
  }

  const nodeById=new Map(nodes.map((item)=>[item.id,item]));
  const selectedNode=selectedIds.length===1?nodeById.get(selectedIds[0]):undefined;
  const previewNode=previewNodeId?nodeById.get(previewNodeId):undefined;
  const previewValue=previewNode?runResults?.values.get(previewNode.id):undefined;
  const activeText=runResults?.activeResults.map((item)=>item.resultText??item.title).join("、")??"";

  function renderResult(node:FlowNode,value?:RuntimeValue){const summary=summarizeValue(value),error=runResults?.errors.get(node.id);return <div className={`generic-result ${resultTone(value)}`}><strong>{error?"计算失败":summary.primary}</strong><small>{error??summary.secondary}</small></div>;}

  function renderNodeBody(node:FlowNode){
    const value=runResults?.values.get(node.id),summary=summarizeValue(value),source=sourceSignals[node.id];
    if(node.kind==="source")return <div className="node-body source-node-body"><div className="source-wave-preview"><TinyWave samples={source?.samples??[]}/><div><strong>{source?.fileName??"未导入波形"}</strong><small>{source?`${source.samples.length.toLocaleString()} 点 · ${source.fs.toLocaleString()} Hz`:"导入文件或接收历史数据"}</small></div></div><div className="source-node-actions"><label><input type="file" accept=".txt,.csv" onChange={(event)=>{void loadFile(node.id,event.target.files?.[0]);event.currentTarget.value="";}}/><span>＋ 导入波形</span></label><button onClick={()=>loadDemo(node.id)}>演示数据</button></div>{source?.historyId&&<div className="history-linked">☁ 已连接历史数据</div>}</div>;
    if(node.kind==="constant")return <div className="node-body compact-config"><label>名称<input value={node.title} onChange={(event)=>updateNode(node.id,{title:event.target.value})}/></label><div className="split-fields"><label>数值<input type="number" step="any" value={node.numberValue??0} onChange={(event)=>updateNode(node.id,{numberValue:Number(event.target.value)})}/></label><label>单位<input value={node.unit??"—"} onChange={(event)=>updateNode(node.id,{unit:event.target.value})}/></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="math")return <div className="node-body compact-config"><label>运算<select value={node.operation??"/"} onChange={(event)=>updateNode(node.id,{operation:event.target.value as FlowNode["operation"]})}><option value="+">A + B</option><option value="-">A − B</option><option value="*">A × B</option><option value="/">A ÷ B</option><option value="pow">A 的 B 次幂</option></select></label>{renderResult(node,value)}</div>;
    if(node.kind==="round")return <div className="node-body compact-config"><label>方式<select value={node.roundMode??"round"} onChange={(event)=>updateNode(node.id,{roundMode:event.target.value as FlowNode["roundMode"]})}><option value="round">四舍五入</option><option value="floor">向下取整</option><option value="ceil">向上取整</option></select></label>{renderResult(node,value)}</div>;
    if(node.kind==="compare")return <div className="node-body compact-config"><label>比较方式<select value={node.compareOp??">"} onChange={(event)=>updateNode(node.id,{compareOp:event.target.value as FlowNode["compareOp"]})}>{[">","<",">=","<=","=","!="].map((item)=><option key={item} value={item}>A {item.replace(">=","≥").replace("<=","≤")} B</option>)}</select></label>{renderResult(node,value)}</div>;
    if(node.kind==="logic")return <div className="node-body logic-body"><div>{(["AND","OR","NOT"] as const).map((item)=><button key={item} className={node.logic===item?"active":""} onClick={()=>updateNode(node.id,{logic:item})}>{item}</button>)}</div><small className={value?.type==="boolean"&&value.data?"pass":""}>{summary.primary}</small></div>;
    if(node.kind==="metric")return <div className="node-body compact-config"><label>指标<select value={node.metric??"rms"} onChange={(event)=>updateNode(node.id,{metric:event.target.value as FlowNode["metric"]})}><option value="rms">有效值 RMS</option><option value="kurtosis">峭度</option><option value="peak">峰值</option><option value="crest">峰值因子</option></select></label>{renderResult(node,value)}</div>;
    if(node.kind==="metricRatioCompare")return <div className="node-body compact-config"><div className="split-fields"><label>比较指标<select value={node.metric??"rms"} onChange={(event)=>updateNode(node.id,{metric:event.target.value as FlowNode["metric"]})}><option value="rms">有效值 RMS</option><option value="kurtosis">峭度</option><option value="peak">峰值</option><option value="crest">峰值因子</option></select></label><label>判断<select value={node.compareOp??">"} onChange={(event)=>updateNode(node.id,{compareOp:event.target.value as FlowNode["compareOp"]})}>{[">","<",">=","<="].map((item)=><option key={item} value={item}>比值 {item.replace(">=","≥").replace("<=","≤")} 阈值</option>)}</select></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="rotationFrequency")return <div className="node-body compact-config"><div className="split-fields"><label>低频截止Hz<input type="number" min="0" step=".1" value={node.highpassHz??2} onChange={(event)=>updateNode(node.id,{highpassHz:Number(event.target.value)})}/></label><label>容差Hz<input type="number" min=".01" step=".1" value={node.toleranceHz??1.8} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/></label></div><label>验证阶次<input value={node.harmonicOrders??"1,2,3"} onChange={(event)=>updateNode(node.id,{harmonicOrders:event.target.value})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="candidateScreen")return <div className="node-body compact-config"><div className="split-fields"><label>分析上限<input type="number" min="1" step="1" value={node.bandMultiplier??10} onChange={(event)=>updateNode(node.id,{bandMultiplier:Number(event.target.value)})}/><small>× fr</small></label><label>剔除至<input type="number" min="1" step="1" value={node.excludeEndOrder??30} onChange={(event)=>updateNode(node.id,{excludeEndOrder:Number(event.target.value)})}/><small>阶转频</small></label></div><div className="split-fields"><label>剔除容差Hz<input type="number" min=".01" step=".1" value={node.toleranceHz??1.5} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/></label><label>左右频宽Hz<input type="number" min=".1" step=".1" value={node.windowHz??3} onChange={(event)=>updateNode(node.id,{windowHz:Number(event.target.value)})}/></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="differenceBands")return <div className="node-body compact-config"><div className="split-fields"><label>能量窗宽Hz<input type="number" min="1" value={node.windowHz??120} onChange={(event)=>updateNode(node.id,{windowHz:Number(event.target.value)})}/></label><label>滑动步长Hz<input type="number" min=".1" value={node.stepHz??40} onChange={(event)=>updateNode(node.id,{stepHz:Number(event.target.value)})}/></label></div><label>保留频带数量<input type="number" min="1" max="10" value={node.count??3} onChange={(event)=>updateNode(node.id,{count:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="cageSearch")return <div className="node-body compact-config"><div className="split-fields"><label>优先比例<input type="number" min="0" max="1" step=".01" value={node.primaryRatio??.6} onChange={(event)=>updateNode(node.id,{primaryRatio:Number(event.target.value)})}/></label><label>回退比例<input type="number" min="0" max="1" step=".01" value={node.fallbackRatio??.4} onChange={(event)=>updateNode(node.id,{fallbackRatio:Number(event.target.value)})}/></label></div><label>搜索半宽 Hz<input type="number" min=".1" step=".1" value={node.halfWidthHz??2} onChange={(event)=>updateNode(node.id,{halfWidthHz:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="spectrumPresence")return <div className="node-body compact-config"><div className="split-fields"><label>寻峰容差Hz<input type="number" min=".01" step=".1" value={node.toleranceHz??2} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/></label><label>最少命中<input type="number" min="1" value={node.minHits??2} onChange={(event)=>updateNode(node.id,{minHits:Number(event.target.value)})}/></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="integerRelation")return <div className="node-body compact-config"><div className="split-fields"><label>倍数偏差<input type="number" min="0" step=".01" value={node.deviationLimit??.1} onChange={(event)=>updateNode(node.id,{deviationLimit:Number(event.target.value)})}/></label><label>寻峰容差Hz<input type="number" min=".01" step=".1" value={node.toleranceHz??2} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/></label></div><div className="split-fields"><label>最小阶次<input type="number" min="1" value={node.minOrder??6} onChange={(event)=>updateNode(node.id,{minOrder:Number(event.target.value)})}/></label><label>最大阶次<input type="number" min="1" value={node.maxOrder??12} onChange={(event)=>updateNode(node.id,{maxOrder:Number(event.target.value)})}/></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="integrate")return <div className="node-body compact-config"><label>低频截止 Hz<input type="number" min="0" step=".1" value={node.highpassHz??2} onChange={(event)=>updateNode(node.id,{highpassHz:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="peakDetect")return <div className="node-body compact-config"><div className="split-fields"><label>突出度<input type="number" step=".01" min="1" value={node.minProminence??1.15} onChange={(event)=>updateNode(node.id,{minProminence:Number(event.target.value)})}/></label><label>峰距Hz<input type="number" step=".1" min="0" value={node.minDistanceHz??1} onChange={(event)=>updateNode(node.id,{minDistanceHz:Number(event.target.value)})}/></label></div><label>最大峰数<input type="number" min="1" value={node.maxPeaks??80} onChange={(event)=>updateNode(node.id,{maxPeaks:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="harmonicSearch")return <div className="node-body compact-config"><label>验证阶次<input value={node.harmonicOrders??"1,2,3"} onChange={(event)=>updateNode(node.id,{harmonicOrders:event.target.value})}/></label><label>容差 Hz<input type="number" step=".1" value={node.toleranceHz??1.5} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="harmonicSequence")return <div className="node-body compact-config"><div className="split-fields"><label>起始阶<input type="number" min="1" value={node.startOrder??1} onChange={(event)=>updateNode(node.id,{startOrder:Number(event.target.value)})}/></label><label>结束阶<input type="number" min="1" value={node.endOrder??5} onChange={(event)=>updateNode(node.id,{endOrder:Number(event.target.value)})}/></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="frequencyExclude"||node.kind==="frequencyMatch")return <div className="node-body compact-config"><label>默认容差 Hz<input type="number" step=".1" min="0.01" value={node.toleranceHz??2} onChange={(event)=>updateNode(node.id,{toleranceHz:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="localContrast")return <div className="node-body compact-config"><label>默认左右频宽 Hz<input type="number" step=".1" min="0.1" value={node.windowHz??3} onChange={(event)=>updateNode(node.id,{windowHz:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="slidingEnergy")return <div className="node-body compact-config"><div className="split-fields"><label>窗宽Hz<input type="number" value={node.windowHz??120} onChange={(event)=>updateNode(node.id,{windowHz:Number(event.target.value)})}/></label><label>步长Hz<input type="number" value={node.stepHz??40} onChange={(event)=>updateNode(node.id,{stepHz:Number(event.target.value)})}/></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="listSort")return <div className="node-body compact-config"><div className="split-fields"><label>字段<select value={node.sortField??"amplitude"} onChange={(event)=>updateNode(node.id,{sortField:event.target.value as FlowNode["sortField"]})}><option value="frequency">频率</option><option value="amplitude">幅值</option><option value="energyRatio">能量占比</option><option value="value">数值</option></select></label><label>顺序<select value={node.sortDirection??"desc"} onChange={(event)=>updateNode(node.id,{sortDirection:event.target.value as "asc"|"desc"})}><option value="desc">降序</option><option value="asc">升序</option></select></label></div>{renderResult(node,value)}</div>;
    if(node.kind==="topN"||node.kind==="listItem")return <div className="node-body compact-config"><label>{node.kind==="topN"?"数量 N":"序号（从0开始）"}<input type="number" min="0" value={node.kind==="topN"?(node.count??3):(node.index??0)} onChange={(event)=>updateNode(node.id,node.kind==="topN"?{count:Number(event.target.value)}:{index:Number(event.target.value)})}/></label>{renderResult(node,value)}</div>;
    if(node.kind==="minmax")return <div className="node-body compact-config"><div className="split-fields"><label>选取<select value={node.sortDirection??"desc"} onChange={(event)=>updateNode(node.id,{sortDirection:event.target.value as "asc"|"desc"})}><option value="desc">最大</option><option value="asc">最小</option></select></label><label>依据<select value={node.selectField??"value"} onChange={(event)=>updateNode(node.id,{selectField:event.target.value as FlowNode["selectField"]})}><option value="value">数值</option><option value="frequency">频率</option><option value="amplitude">幅值</option><option value="energyRatio">能量占比</option></select></label></div><label>输出字段<select value={node.outputField??node.selectField??"value"} onChange={(event)=>updateNode(node.id,{outputField:event.target.value as FlowNode["outputField"]})}><option value="value">数值</option><option value="frequency">频率</option><option value="amplitude">幅值</option><option value="energyRatio">能量占比</option></select></label>{renderResult(node,value)}</div>;
    if(node.kind==="fieldExtract")return <div className="node-body compact-config"><label>提取字段<select value={node.selectField??"frequency"} onChange={(event)=>updateNode(node.id,{selectField:event.target.value as FlowNode["selectField"]})}><option value="frequency">频率</option><option value="amplitude">幅值</option><option value="energyRatio">能量占比</option></select></label>{renderResult(node,value)}</div>;
    if(node.kind==="output")return <div className={`node-body output-body ${value?.type==="boolean"?(value.data?"fault":"normal"):""}`}><span>{value?.type==="boolean"?(value.data?"!":"—"):"?"}</span><div><input className="result-name-input" value={node.resultText??node.title} onChange={(event)=>updateNode(node.id,{resultText:event.target.value,title:event.target.value})}/><small>{!runResults?"等待运行":value?.type==="boolean"&&value.data?"规则成立":"规则未成立"}</small></div></div>;
    if(node.kind==="report"){const ready=Boolean(runResults&&connections.some((item)=>item.target===node.id));return <div className={`node-body report-body ${ready?"ready":""}`}><div><span>DOCX</span><small>{ready?activeText||"暂无成立结论":"连接诊断结果后导出"}</small></div><button disabled={!ready} onClick={()=>void downloadReport(node.id)}>↓ 下载</button></div>;}
    if(node.kind==="display"){
      const spectra=runtimeSpectra(value),peaks=value?.type==="peaks"?value.data:[];
      return <div className="node-body display-body"><div className="display-controls"><select value={node.displayMode??"auto"} onChange={(event)=>updateNode(node.id,{displayMode:event.target.value as FlowNode["displayMode"]})}><option value="auto">自动</option><option value="waveform">波形</option><option value="spectrum">频谱</option><option value="value">数值</option><option value="list">列表</option></select><span>{summary.secondary}</span><button className="open-preview" disabled={!value} onClick={(event)=>{event.stopPropagation();setPreviewNodeId(node.id);}}>放大</button></div>{value?.type==="waveform"?<button className="chart-preview" onClick={()=>setPreviewNodeId(node.id)}><DataWave samples={value.data.samples}/></button>:spectra.length?<button className="chart-preview" onClick={()=>setPreviewNodeId(node.id)}><SpectrumChart spectra={spectra} peaks={peaks}/></button>:renderResult(node,value)}</div>;
    }
    return <div className="node-body generic-node-body"><div className="node-operation-note">{nodeMeta[node.kind].label}</div>{renderResult(node,value)}</div>;
  }

  return <main className="flow-app">
    <header className="flow-header">
      <div className="flow-brand"><span>∿</span><div><strong>VibRule</strong><small>工业振动规则诊断平台</small></div></div>
      <div className="flow-actions"><span className="data-state"><i className={loadedSourceNodes.length?"ready":""}/>{loadedSourceNodes.length?`${loadedSourceNodes.length} 个波形 · ${loadedPointCount.toLocaleString()} 点`:"实例需要正常/故障两组波形"}</span><button className="ghost-button" onClick={restoreExample}>恢复实例</button><button className="ghost-button example-data-button" onClick={loadExampleData}>载入实例数据</button><button className="ghost-button" onClick={()=>setConnections([])}>清空连线</button><button className="ghost-button clear-canvas-button" onClick={clearCanvas}>清空画布</button><button className="run-button" onClick={runDiagnosis}>▶ 运行诊断</button></div>
    </header>
    <div className="flow-body">
      <aside className="node-palette">
        <div className="palette-head"><h1>{sidebarMode==="nodes"?"节点工具箱":"历史数据"}</h1><p>{sidebarMode==="nodes"?"常用组合优先，基础节点仍可自由搭建":"拖到画布或已有波形节点"}</p></div>
        <div className="sidebar-tabs" role="tablist" aria-label="左侧面板"><button role="tab" aria-selected={sidebarMode==="nodes"} className={sidebarMode==="nodes"?"active":""} onClick={()=>setSidebarMode("nodes")}>节点工具箱</button><button role="tab" aria-selected={sidebarMode==="history"} className={sidebarMode==="history"?"active":""} onClick={()=>setSidebarMode("history")}>历史数据</button></div>
        {sidebarMode==="nodes"&&<><div className="source-import-tip"><span>i</span><div><strong>默认画布已改为精简组合实例</strong><small>组合模块处理固定链路，基础节点保留自由度</small></div></div><div className="quick-params"><label>新波形采样频率<input value={defaultFs} type="number" onChange={(event)=>setDefaultFs(Number(event.target.value)||1)}/><em>Hz</em></label><label>设备转速备注<input value={rpm} type="number" onChange={(event)=>setRpm(Number(event.target.value)||0)}/><em>rpm</em></label></div><div className="palette-scroll classified-palette">{palette.map((group,index)=><details key={group.group} open={index===0}><summary><span>{group.group}</span><b>{group.items.length}</b></summary>{group.items.map((item)=><div className="palette-node" key={`${item.kind}-${item.title}`} draggable onDragStart={(event)=>{event.dataTransfer.effectAllowed="copy";event.dataTransfer.setData("application/x-vibrule-node",JSON.stringify(item));}}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.desc}</small></div><b>⠿</b></div>)}</details>)}</div></>}
        {sidebarMode==="history"&&<div className="history-panel"><section className="history-import-card"><label className={`history-drop-zone ${historyDropActive?"active":""}`} onDragEnter={(event)=>{event.preventDefault();setHistoryDropActive(true);}} onDragOver={(event)=>event.preventDefault()} onDragLeave={(event)=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setHistoryDropActive(false);}} onDrop={(event)=>{event.preventDefault();setHistoryDropActive(false);queueHistoryFiles(event.dataTransfer.files);}}><input type="file" accept=".txt,.csv" multiple onChange={(event)=>{if(event.target.files)queueHistoryFiles(event.target.files);event.currentTarget.value="";}}/><span>＋</span><div><strong>拖入或选择波形文件</strong><small>支持多个 TXT / CSV，共用下方参数</small></div></label>{pendingHistoryFiles.length>0&&<div className="history-file-summary"><span>已选择 {pendingHistoryFiles.length} 个文件</span><button onClick={()=>setPendingHistoryFiles([])} disabled={historyImporting}>清空</button><small>{pendingHistoryFiles.slice(0,3).map((file)=>file.name).join("、")}</small></div>}<div className="history-import-params"><label>采样点数<input type="number" min="64" value={historySampleCount} onChange={(event)=>setHistorySampleCount(Number(event.target.value))}/><em>点</em></label><label>最大分析频率<input type="number" min="1" value={historyMaxFrequency} onChange={(event)=>setHistoryMaxFrequency(Number(event.target.value))}/><em>Hz</em></label></div><button className="history-import-button" onClick={()=>void importPendingHistory()} disabled={historyImporting||!pendingHistoryFiles.length}>{historyImporting?"正在导入…":`确认导入${pendingHistoryFiles.length?`（${pendingHistoryFiles.length}）`:""}`}</button><small className="history-import-note">点击确认前，文件不会进入历史数据</small></section><div className="history-search"><span>⌕</span><input aria-label="搜索历史数据" value={historySearch} onChange={(event)=>setHistorySearch(event.target.value)} placeholder="搜索文件名称"/></div>{!historyConfigured&&<div className="history-state"><span>☁</span><strong>等待连接云端数据库</strong></div>}{historyConfigured&&historyLoading&&<div className="history-state compact"><span>…</span><strong>正在读取历史数据</strong></div>}{historyConfigured&&!historyLoading&&historyError&&<div className="history-state error"><span>!</span><strong>{historyError}</strong><button onClick={()=>setHistoryRefresh((value)=>value+1)}>重新加载</button></div>}{historyConfigured&&!historyLoading&&!historyError&&historyRecords.length>0&&<div className="history-list">{historyRecords.map((record)=><div className="history-row" key={record.id} draggable onDragStart={(event)=>{event.dataTransfer.effectAllowed="copy";event.dataTransfer.setData("application/x-vibrule-history",record.id);}} title="拖到画布或波形节点"><span className="history-wave">∿</span><div><strong>{record.file_name}</strong><small>{record.sample_count.toLocaleString()} 点</small><em>最大分析频率 {(record.sampling_frequency/2).toLocaleString()} Hz</em></div><b>⠿</b></div>)}</div>}</div>}
      </aside>
      <section className="canvas-area">
        <div className="canvas-toolbar"><div className="canvas-title"><span>精简实例：时域初筛 → 转频与候选频率 → 差谱包络 → 保持架搜索 → 内外圈互证</span></div><div className="canvas-tools"><div className="legend"><span><i className="source-dot"/>输入</span><span><i className="feature-dot"/>运算</span><span><i className="condition-dot"/>条件</span><span><i className="output-dot"/>输出</span></div><div className="zoom-control"><button onClick={()=>zoomCanvas(canvasView.scale-.1)}>−</button><button className="zoom-value" onClick={()=>setCanvasView(INITIAL_VIEW)}>{Math.round(canvasView.scale*100)}%</button><button onClick={()=>zoomCanvas(canvasView.scale+.1)}>＋</button><button className="view-reset" onClick={()=>setCanvasView(INITIAL_VIEW)}>复位</button></div></div></div>
        <div className={`canvas-viewport ${isPanning?"panning":""}`} ref={canvasViewportRef} style={{backgroundSize:`${24*canvasView.scale}px ${24*canvasView.scale}px`,backgroundPosition:`${canvasView.x}px ${canvasView.y}px`}} onPointerDown={startCanvasInteraction} onAuxClick={(event)=>event.preventDefault()} onDragOver={(event)=>{event.preventDefault();event.dataTransfer.dropEffect="copy";}} onDrop={handleCanvasDrop}>
          <div className="canvas-plane" style={{transform:`translate(${canvasView.x}px, ${canvasView.y}px) scale(${canvasView.scale})`}}>
            <svg className="edge-layer" width="1" height="1">{connections.map((connection)=>{const source=nodeById.get(connection.source),target=nodeById.get(connection.target);if(!source||!target)return null;const sx=source.x+NODE_WIDTH,sy=source.y+OUTPUT_PORT_Y,tx=target.x,ty=target.y+portOffset(target,connection.targetPort);return <path key={connection.id} d={`M${sx},${sy} C${sx+70},${sy} ${tx-70},${ty} ${tx},${ty}`} onClick={(event)=>{event.stopPropagation();setConnections((current)=>current.filter((item)=>item.id!==connection.id));}}><title>点击删除连线</title></path>;})}<path ref={draftEdgeRef} className="draft-edge"/></svg>
            {nodes.map((node)=>{const ports=inputPorts(node),minHeight=Math.max(110,82+ports.length*23);return <article key={node.id} data-node-id={node.id} className={`flow-node ${node.family} ${selectedIds.includes(node.id)?"selected":""}`} style={{transform:`translate3d(${node.x}px,${node.y}px,0)`,minHeight}} onPointerDown={(event)=>startNodeDrag(event,node.id)} onClick={(event)=>{event.stopPropagation();setSelectedIds([node.id]);}} onDragOver={node.kind==="source"?(event)=>{event.preventDefault();event.dataTransfer.dropEffect="copy";}:undefined} onDrop={node.kind==="source"?(event)=>handleHistoryDropOnSource(event,node.id):undefined}>{ports.map((port)=><span key={port.key}><button className="input-port port" style={{top:portOffset(node,port.key)-7}} data-input-node={node.id} data-input-port={port.key} aria-label={`连接到${node.title}的${port.label}`} onPointerUp={(event)=>finishConnection(event,node.id,port.key)}/><small className="input-port-name" style={{top:portOffset(node,port.key)-7}}>{port.label}{port.multi?"+":""}</small></span>)}{node.kind!=="report"&&node.kind!=="display"&&<button className="output-port port" style={{top:OUTPUT_PORT_Y-7}} aria-label={`从${node.title}开始连线`} onPointerDown={(event)=>startConnection(event,node.id)}/>}<header><span className="node-type-icon">{nodeMeta[node.kind].icon}</span><div><small>{nodeMeta[node.kind].label}</small><strong>{node.title}</strong></div><button className="node-delete" aria-label="删除节点" onClick={()=>removeNode(node.id)}>×</button></header>{renderNodeBody(node)}</article>;})}
          </div>
          {selectionBox&&<div className="selection-marquee" style={selectionBox}>{selectedIds.length>0&&<span>{selectedIds.length} 个节点</span>}</div>}
          <div className="canvas-tip"><b>无限画布</b><span>左键框选 · 滚轮拖动平移 · Ctrl + 滚轮缩放 · Delete 删除节点</span></div>
        </div>
        {selectedIds.length>0&&<div className="selection-chip"><span>已选择</span>{selectedNode?<><b>{selectedNode.title}</b><small>{nodeMeta[selectedNode.kind].label} · Delete 删除</small></>:<><b>{selectedIds.length} 个节点</b><small>按 Delete 批量删除</small></>}</div>}
      </section>
    </div>
    {toast&&<div className="toast">{toast}</div>}
    {previewNode&&previewValue&&<div className="data-modal-backdrop" onPointerDown={(event)=>{if(event.target===event.currentTarget)setPreviewNodeId(null);}}><section className="data-modal" role="dialog" aria-modal="true" onPointerDown={(event)=>event.stopPropagation()}><header className="data-modal-header"><span className="modal-title-icon">{nodeMeta[previewNode.kind].icon}</span><div><span>真实节点计算结果</span><h2>{previewNode.title}</h2><p>{summarizeValue(previewValue).secondary}</p></div><button className="modal-close" onClick={()=>setPreviewNodeId(null)}>×</button></header><div className="detail-chart-panel">{previewValue.type==="waveform"?<DetailedWave samples={previewValue.data.samples} fs={previewValue.data.fs}/>:runtimeSpectra(previewValue).length?<DetailedSpectrum spectra={runtimeSpectra(previewValue)} peaks={previewValue.type==="peaks"?previewValue.data:[]}/>:<div className="modal-value"><span>{previewValue.type}</span><strong>{summarizeValue(previewValue).primary}</strong><small>{summarizeValue(previewValue).secondary}</small></div>}</div>{previewValue.type==="peaks"&&<div className="modal-peak-section"><div className="peak-section-title"><div><span>峰值列表</span><h3>{previewValue.data.length} 个频率结果</h3></div></div><div className="peak-table-wrap"><table><thead><tr><th>#</th><th>频率/Hz</th><th>幅值</th><th>理论频率</th><th>来源频谱</th></tr></thead><tbody>{previewValue.data.slice(0,100).map((peak,index)=><tr key={`${peak.f}-${index}`}><td>{index+1}</td><td><b>{peak.f.toFixed(3)}</b></td><td>{peak.a.toFixed(5)}</td><td>{peak.theoretical?.toFixed(3)??"—"}</td><td>{peak.sourceIndex===undefined?"单频谱":`频谱${peak.sourceIndex+1}`}</td></tr>)}</tbody></table></div></div>}<footer className="modal-note"><span>i</span><p>这里显示的是点击“运行诊断”后，由当前连线链路计算得到的真实中间结果。</p></footer></section></div>}
  </main>;
}
