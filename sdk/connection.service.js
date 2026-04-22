const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const execAsync = promisify(exec);

function parseAddressPort(raw) {
  const value = String(raw || '').trim();
  if (!value) return { address: '', port: 0 };
  const idx = value.lastIndexOf(':');
  if (idx === -1) return { address: value, port: 0 };
  return {
    address: value.slice(0, idx).replace(/^\[|\]$/g, ''),
    port: Number(value.slice(idx + 1)) || 0
  };
}

function parseWindowsNetstat(stdout) {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (!/^(TCP|UDP)\s+/i.test(line)) continue;
    const parts = line.split(/\s+/);
    const protocol = (parts[0] || '').toLowerCase();
    if (protocol === 'tcp' && parts.length >= 5) {
      const local = parseAddressPort(parts[1]);
      const remote = parseAddressPort(parts[2]);
      const state = parts[3];
      const pid = Number(parts[4]) || null;
      out.push({ protocol, local, remote, state, pid });
    } else if (protocol === 'udp' && parts.length >= 4) {
      const local = parseAddressPort(parts[1]);
      const remote = parseAddressPort(parts[2]);
      const pid = Number(parts[3]) || null;
      out.push({ protocol, local, remote, state: '', pid });
    }
  }
  return out;
}

function parseLinuxSs(stdout) {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (/^Netid\s+/i.test(line)) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 5) continue;
    const protocol = (parts[0] || '').toLowerCase();
    const hasState = !/^\d+$/.test(parts[1] || '');
    const state = hasState ? (parts[1] || '') : '';
    const localIndex = hasState ? 4 : 3;
    const remoteIndex = hasState ? 5 : 4;
    const local = parseAddressPort(parts[localIndex]);
    const remote = parseAddressPort(parts[remoteIndex]);
    const joined = parts.join(' ');
    const pidMatch = joined.match(/pid=(\d+)/);
    out.push({ protocol, local, remote, state, pid: pidMatch ? Number(pidMatch[1]) : null });
  }
  return out;
}

async function collectConnections() {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('netstat -ano', { windowsHide: true, maxBuffer: 10 * 1024 * 1024, timeout: 1200 });
      return parseWindowsNetstat(stdout);
    }
    const { stdout } = await execAsync('ss -tunap', { maxBuffer: 10 * 1024 * 1024, timeout: 650, killSignal: 'SIGKILL' });
    return parseLinuxSs(stdout);
  } catch {
    return [];
  }
}

module.exports = {
  parseAddressPort,
  parseWindowsNetstat,
  parseLinuxSs,
  collectConnections
};
