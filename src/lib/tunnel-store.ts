/**
 * 平台隧道 - 请求/响应的内存存储
 * 用于 tunnel invoke（买方请求）与 tunnel client（卖方轮询+回传）之间的衔接
 */
export type PendingRequest = {
  requestId: string;
  body: unknown;
  resolve: (response: unknown) => void;
  reject: (err: Error) => void;
  createdAt: number;
};

const pendingByRequestId = new Map<string, PendingRequest>();
const queueByAgentId = new Map<string, Array<{ requestId: string; body: unknown }>>();

const REQUEST_TTL_MS = 90 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [rid, p] of pendingByRequestId) {
    if (now - p.createdAt > REQUEST_TTL_MS) {
      pendingByRequestId.delete(rid);
      p.reject(new Error("request_timeout"));
    }
  }
}
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 10000);
}

export function enqueueTunnelRequest(agentId: string, requestId: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const entry: PendingRequest = { requestId, body, resolve, reject, createdAt: Date.now() };
    pendingByRequestId.set(requestId, entry);
    let q = queueByAgentId.get(agentId);
    if (!q) {
      q = [];
      queueByAgentId.set(agentId, q);
    }
    q.push({ requestId, body });
  });
}

export function pollTunnelRequest(agentId: string): { requestId: string; body: unknown } | null {
  const q = queueByAgentId.get(agentId);
  if (!q || q.length === 0) return null;
  const item = q.shift()!;
  if (q.length === 0) queueByAgentId.delete(agentId);
  return item;
}

export function respondTunnelRequest(requestId: string, response: unknown): boolean {
  const entry = pendingByRequestId.get(requestId);
  if (!entry) return false;
  pendingByRequestId.delete(requestId);
  entry.resolve(response);
  return true;
}
