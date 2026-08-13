export type HistoryRecord = {
  id: string;
  file_name: string;
  storage_path: string;
  sample_count: number;
  sampling_frequency: number;
  rpm: number;
  bpfo: number;
  created_at: string;
};

type HistoryMetadata = {
  sampleCount: number;
  samplingFrequency: number;
  rpm: number;
  bpfo: number;
};

const projectUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const bucket = "vibration-waveforms";

export const historyConfigured = Boolean(projectUrl && anonKey);

function headers(extra?: HeadersInit): HeadersInit {
  return {
    apikey: anonKey ?? "",
    Authorization: `Bearer ${anonKey ?? ""}`,
    ...extra,
  };
}

async function checked(response: Response) {
  if (response.ok) return response;
  const message = await response.text().catch(() => "");
  throw new Error(message || `历史数据服务请求失败（${response.status}）`);
}

export async function listHistory(search = ""): Promise<HistoryRecord[]> {
  if (!historyConfigured) return [];
  const query = new URLSearchParams({
    select: "id,file_name,storage_path,sample_count,sampling_frequency,rpm,bpfo,created_at",
    order: "created_at.desc",
    limit: "100",
  });
  if (search.trim()) query.set("file_name", `ilike.*${search.trim().replace(/[*,]/g, "")}*`);
  const response = await checked(await fetch(`${projectUrl}/rest/v1/vibration_history?${query}`, { headers: headers() }));
  return response.json();
}

export async function saveHistory(file: File, metadata: HistoryMetadata): Promise<HistoryRecord> {
  if (!historyConfigured) throw new Error("历史数据服务尚未配置");
  const extension = file.name.split(".").pop()?.toLowerCase() === "csv" ? "csv" : "txt";
  const safeName = file.name.replace(/[^\w\u4e00-\u9fff.-]+/g, "-").slice(-80);
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName || `waveform.${extension}`}`;
  await checked(await fetch(`${projectUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: "POST",
    headers: headers({ "Content-Type": file.type || "text/plain;charset=utf-8", "x-upsert": "false" }),
    body: file,
  }));

  try {
    const response = await checked(await fetch(`${projectUrl}/rest/v1/vibration_history`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({
        file_name: file.name,
        storage_path: path,
        sample_count: metadata.sampleCount,
        sampling_frequency: metadata.samplingFrequency,
        rpm: metadata.rpm,
        bpfo: metadata.bpfo,
      }),
    }));
    const records = await response.json() as HistoryRecord[];
    if (!records[0]) throw new Error("历史记录写入失败");
    return records[0];
  } catch (error) {
    await fetch(`${projectUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`, { method: "DELETE", headers: headers() }).catch(() => undefined);
    throw error;
  }
}

export async function downloadHistory(record: HistoryRecord): Promise<string> {
  if (!historyConfigured) throw new Error("历史数据服务尚未配置");
  const response = await checked(await fetch(`${projectUrl}/storage/v1/object/${bucket}/${encodeURI(record.storage_path)}`, { headers: headers() }));
  return response.text();
}
