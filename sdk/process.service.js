const si = require('systeminformation');

const nameCache = new Map();
const MAX_CACHE_SIZE = 5000;
const PROCESS_MAP_TTL_MS = 5000;
let cachedProcessMap = new Map();
let cachedProcessMapAt = 0;
let pendingProcessMap = null;

function pruneCache() {
  if (nameCache.size > MAX_CACHE_SIZE) {
    const firstKey = nameCache.keys().next().value;
    nameCache.delete(firstKey);
  }
}

async function getProcessMap() {
  if (Date.now() - cachedProcessMapAt < PROCESS_MAP_TTL_MS) return cachedProcessMap;
  if (pendingProcessMap) return pendingProcessMap;
  
  pendingProcessMap = (async () => {
    try {
      const procs = await si.processes();
      const map = new Map();
      for (const p of procs.list) {
        map.set(p.pid, p.name);
      }
      cachedProcessMap = map;
      cachedProcessMapAt = Date.now();
      return map;
    } catch {
      return cachedProcessMap || new Map();
    } finally {
      pendingProcessMap = null;
    }
  })();

  return pendingProcessMap;
}

async function getProcessMapUncached() {
  try {
    const procs = await si.processes();
    const map = new Map();
    for (const p of procs.list) {
      map.set(p.pid, p.name);
    }
    return map;
  } catch {
    return new Map();
  }
}

function resolveProcessName(pid, processMap) {
  if (pid === null || pid === undefined) return 'System';
  if (processMap && processMap.has(pid)) {
    const name = processMap.get(pid);
    const displayName = `${name} (PID ${pid})`;
    nameCache.set(pid, displayName);
    pruneCache();
    return displayName;
  }
  if (nameCache.has(pid)) return nameCache.get(pid);
  return `PID ${pid}`;
}

async function safeResolveProcess(pid) {
  // Fallback for direct calls if needed, but prefer resolveProcessName in loops
  if (nameCache.has(pid)) return nameCache.get(pid);
  return `PID ${pid}`;
}

module.exports = {
  getProcessMap,
  getProcessMapUncached,
  resolveProcessName,
  safeResolveProcess
};
