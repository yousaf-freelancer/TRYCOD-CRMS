import type { ChartData, ChartDataset, ChartOptions, ChartType } from 'chart.js';
import { formatInrCompact } from '../utils/format.util';

/** Monochrome palette (for neutral / comparison series). */
export const MONO = ['#0a0a0a', '#525252', '#a3a3a3', '#d4d4d4', '#e5e5e5'];

/** Accent colours used in charts. Brand stays black/white; charts get colour for readability. */
export const COLORS = {
  indigo: '#6366f1',
  indigoSoft: '#c7d2fe',
  emerald: '#10b981',
  emeraldSoft: '#a7f3d0',
  amber: '#f59e0b',
  amberSoft: '#fde68a',
  rose: '#f43f5e',
  roseSoft: '#fecdd3',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
} as const;

/** Categorical series order. */
export const SERIES = [COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.sky, COLORS.violet, COLORS.rose, COLORS.teal, COLORS.orange];

/** `#rrggbb` → `rgba(r,g,b,a)` */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const GRID = '#f0f0f0';
const TICK = '#737373';
const FONT = { family: 'Inter, ui-sans-serif, system-ui, sans-serif', size: 11 };

const tooltip = {
  backgroundColor: '#0a0a0a',
  titleColor: '#fff',
  bodyColor: '#e5e5e5',
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
  titleFont: { ...FONT, size: 12, weight: 600 as const },
  bodyFont: FONT,
};

type ValueFormat = 'number' | 'inr' | 'percent';

function formatValue(value: number, format: ValueFormat): string {
  if (format === 'inr') return formatInrCompact(value);
  if (format === 'percent') return `${value}%`;
  return String(value);
}

/** Shared options for line / bar charts. */
export function cartesianOptions(
  format: ValueFormat = 'number',
  opts: {
    stacked?: boolean;
    horizontal?: boolean;
    legend?: boolean;
    min?: number;
    max?: number;
  } = {},
): ChartOptions {
  const valueAxis = {
    beginAtZero: opts.min === undefined,
    min: opts.min,
    max: opts.max,
    stacked: opts.stacked,
    grid: { color: GRID, drawTicks: false },
    border: { display: false },
    ticks: {
      color: TICK,
      font: FONT,
      padding: 8,
      maxTicksLimit: 5,
      callback: (v: string | number) => formatValue(Number(v), format),
    },
  };
  const categoryAxis = {
    stacked: opts.stacked,
    grid: { display: false },
    border: { display: false },
    ticks: { color: TICK, font: FONT, maxRotation: 0, autoSkipPadding: 12 },
  };
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: opts.horizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: opts.legend ?? false,
        position: 'bottom',
        align: 'start',
        labels: {
          color: TICK,
          font: FONT,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 16,
        },
      },
      tooltip: {
        ...tooltip,
        callbacks: {
          label: (ctx) => {
            const raw = opts.horizontal ? ctx.parsed.x : ctx.parsed.y;
            const prefix = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
            return `${prefix}${format === 'inr' ? '₹' + Number(raw).toLocaleString('en-IN') : formatValue(Number(raw), format)}`;
          },
        },
      },
    },
    scales: opts.horizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis },
  } as ChartOptions;
}

export function doughnutOptions(): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: TICK,
          font: FONT,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          padding: 14,
        },
      },
      tooltip,
    },
  } as ChartOptions;
}

export function lineDataset(
  label: string,
  data: number[],
  color: string = COLORS.indigo,
  fill = true,
): ChartDataset {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: fill ? alpha(color, 0.1) : 'transparent',
    fill,
    tension: 0.35,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHoverBackgroundColor: color,
  } as ChartDataset;
}

export function barDataset(
  label: string,
  data: number[],
  color: string | string[] = COLORS.indigo,
): ChartDataset {
  return {
    label,
    data,
    backgroundColor: color,
    hoverBorderColor: '#0a0a0a',
    borderRadius: 6,
    borderSkipped: false as const,
    maxBarThickness: 28,
  } as ChartDataset;
}

export type AppChartData = ChartData<ChartType>;
