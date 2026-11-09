/**
 * reportDate.util.js
 * Comprehensive date calculation utilities for SOS reports and date-range filtering.
 * Accurately calculates boundaries for Daily, Weekly, Monthly, Yearly, and Custom ranges.
 */

function toTwoDigits(num) {
  return String(num).padStart(2, '0');
}

function formatDateOnly(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${toTwoDigits(d.getMonth() + 1)}-${toTwoDigits(d.getDate())}`;
}

function parseDateInput(input) {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) {
    return new Date(input.getTime());
  }

  const str = String(input).trim();
  // If YYYY-MM-DD format
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getStartOfDay(d) {
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  return res;
}

function getEndOfDay(d) {
  const res = new Date(d);
  res.setHours(23, 59, 59, 999);
  return res;
}

/**
 * Calculates start and end of week (Monday to Sunday) for a given date.
 */
function getWeekRange(d) {
  const target = new Date(d);
  const dayOfWeek = target.getDay(); // 0 is Sunday, 1 is Monday...
  // Calculate distance to previous Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(target);
  monday.setDate(target.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/**
 * Calculates start and end of month for a given year & month (1-12) or date.
 */
function getMonthRange(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1; // 0-indexed
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Calculates start and end of year for a given year.
 */
function getYearRange(year) {
  const y = parseInt(year, 10);
  const start = new Date(y, 0, 1, 0, 0, 0, 0);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Resolves full date range and metadata based on parameters.
 *
 * @param {Object} params
 * @param {string} [params.period] 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
 * @param {string|Date} [params.date] Target date for daily/weekly
 * @param {string|Date} [params.startDate] Start date for custom
 * @param {string|Date} [params.endDate] End date for custom
 * @param {number|string} [params.month] Month (1-12) for monthly
 * @param {number|string} [params.year] Year for monthly/yearly
 * @returns {{ startDate: Date, endDate: Date, period: string, formattedLabel: string, filenameSuffix: string }}
 */
function resolveReportDateRange(params = {}) {
  const now = new Date();
  const period = String(params.period || '').toLowerCase() || 'custom';

  let startDate;
  let endDate;
  let formattedLabel;
  let filenameSuffix;

  switch (period) {
    case 'daily': {
      const targetDate = parseDateInput(params.date || params.startDate) || now;
      startDate = getStartOfDay(targetDate);
      endDate = getEndOfDay(targetDate);
      const dateStr = formatDateOnly(startDate);
      formattedLabel = `Daily Report (${dateStr})`;
      filenameSuffix = `Daily_Report_${dateStr}`;
      break;
    }

    case 'weekly': {
      const targetDate = parseDateInput(params.date || params.startDate) || now;
      const { start, end } = getWeekRange(targetDate);
      startDate = start;
      endDate = end;
      const startStr = formatDateOnly(startDate);
      const endStr = formatDateOnly(endDate);
      formattedLabel = `Weekly Report (${startStr} to ${endStr})`;
      filenameSuffix = `Weekly_Report_${startStr}_to_${endStr}`;
      break;
    }

    case 'monthly': {
      let y = parseInt(params.year, 10);
      let m = parseInt(params.month, 10);

      if (isNaN(y) || isNaN(m)) {
        const targetDate = parseDateInput(params.date || params.startDate) || now;
        y = targetDate.getFullYear();
        m = targetDate.getMonth() + 1;
      }

      const { start, end } = getMonthRange(y, m);
      startDate = start;
      endDate = end;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      formattedLabel = `Monthly Report (${monthNames[m - 1]} ${y})`;
      filenameSuffix = `Monthly_Report_${y}-${toTwoDigits(m)}`;
      break;
    }

    case 'yearly': {
      let y = parseInt(params.year, 10);
      if (isNaN(y)) {
        const targetDate = parseDateInput(params.date || params.startDate) || now;
        y = targetDate.getFullYear();
      }
      const { start, end } = getYearRange(y);
      startDate = start;
      endDate = end;
      formattedLabel = `Yearly Report (${y})`;
      filenameSuffix = `Yearly_Report_${y}`;
      break;
    }

    case 'custom':
    default: {
      const parsedStart = parseDateInput(params.startDate || params.date);
      const parsedEnd = parseDateInput(params.endDate || params.date);

      if (parsedStart && parsedEnd) {
        startDate = getStartOfDay(parsedStart);
        endDate = getEndOfDay(parsedEnd);
        if (startDate > endDate) {
          // Swap if start is after end
          const temp = startDate;
          startDate = getStartOfDay(parsedEnd);
          endDate = getEndOfDay(temp);
        }
      } else if (parsedStart) {
        startDate = getStartOfDay(parsedStart);
        endDate = getEndOfDay(parsedStart);
      } else if (parsedEnd) {
        startDate = getStartOfDay(parsedEnd);
        endDate = getEndOfDay(parsedEnd);
      } else {
        // Default to last 30 days
        endDate = getEndOfDay(now);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDate = getStartOfDay(thirtyDaysAgo);
      }

      const startStr = formatDateOnly(startDate);
      const endStr = formatDateOnly(endDate);
      formattedLabel = startStr === endStr
        ? `Report for ${startStr}`
        : `Report from ${startStr} to ${endStr}`;
      filenameSuffix = startStr === endStr
        ? `Report_${startStr}`
        : `Report_${startStr}_to_${endStr}`;
      break;
    }
  }

  return {
    startDate,
    endDate,
    period,
    formattedLabel,
    filenameSuffix,
    startDateFormatted: formatDateOnly(startDate),
    endDateFormatted: formatDateOnly(endDate),
  };
}

module.exports = {
  formatDateOnly,
  parseDateInput,
  getStartOfDay,
  getEndOfDay,
  getWeekRange,
  getMonthRange,
  getYearRange,
  resolveReportDateRange,
};

