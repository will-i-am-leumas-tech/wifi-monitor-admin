const { stableSort } = require('./utils');
const { DEFAULT_PAGE_SIZE } = require('./constants');

function applyInspectFilters(rows, filters = {}) {
  return rows.filter((row) => {
    if (filters.host) {
      const hostNeedle = String(filters.host).toLowerCase();
      const hostHaystack = [
        row.host,
        row.hostDisplay,
        row.hostDetail,
        row.hostRaw,
        row.hostUrl,
        row.domain,
        row.destinationAddress,
        row.sourceAddress
      ].join(' ').toLowerCase();
      if (!hostHaystack.includes(hostNeedle)) return false;
    }
    if (filters.program && !String(row.program || '').toLowerCase().includes(String(filters.program).toLowerCase())) return false;
    if (filters.service && !String(row.service || '').toLowerCase().includes(String(filters.service).toLowerCase())) return false;
    if (filters.protocol && String(row.protocol || '').toLowerCase() !== String(filters.protocol).toLowerCase()) return false;
    if (filters.country && !String(row.country || '').toLowerCase().includes(String(filters.country).toLowerCase())) return false;
    return true;
  });
}

function sortRows(rows, sortBy = 'bytes', order = 'desc') {
  const dir = String(order).toLowerCase() === 'asc' ? 1 : -1;
  return stableSort(rows, (a, b) => {
    const left = a[sortBy] ?? '';
    const right = b[sortBy] ?? '';
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * dir;
    return String(left).localeCompare(String(right)) * dir;
  });
}

function paginate(rows, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const cleanPage = Math.max(1, Number(page || 1));
  const cleanPageSize = Math.max(1, Number(pageSize || DEFAULT_PAGE_SIZE));
  const start = (cleanPage - 1) * cleanPageSize;
  return {
    total: rows.length,
    page: cleanPage,
    pageSize: cleanPageSize,
    rows: rows.slice(start, start + cleanPageSize)
  };
}

module.exports = {
  applyInspectFilters,
  sortRows,
  paginate
};
