'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export type MetricSeries = {
  metric: string;
  label: string;
  data: { date: string; value: number }[];
};

const metricLabels: Record<string, string> = {
  navstevnost: 'Návštěvnost webu',
  konverze: 'Konverze',
  leady: 'Leady z reklam',
  roi: 'ROI',
  custom: 'Vlastní metrika',
};

export default function MetricsCharts({ series }: { series: MetricSeries[] }) {
  if (series.length === 0) {
    return null;
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {series.map((s) => (
        <div key={s.metric + s.label} className="bg-coffee p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-4">
            {metricLabels[s.metric] ?? s.metric}
            {s.label && s.metric === 'custom' ? ` · ${s.label}` : null}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#3A2D22" strokeDasharray="2 4" />
                <XAxis
                  dataKey="date"
                  stroke="#8B7B65"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#8B7B65"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: '#241B14',
                    border: '1px solid #3A2D22',
                    borderRadius: 0,
                    color: '#D8DDE5',
                  }}
                  labelStyle={{ color: '#8B7B65', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#C9986A"
                  strokeWidth={2}
                  dot={{ fill: '#C9986A', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
