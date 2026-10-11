import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { LEVEL_META, LEVEL_ORDER } from '../lib/triageMeta.js'

export default function WaitTimeChart({ data }) {
  const rows = LEVEL_ORDER.map((key) => ({
    key,
    level: LEVEL_META[key].label,
    minutes: data[key] ?? 0,
  }))
  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="level" />
          <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
          <Tooltip formatter={(value) => [`${value} min`, 'Avg wait']} cursor={{ fill: 'rgba(0,0,0,0.06)' }} />
          <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
            {rows.map((row) => (
              <Cell key={row.key} fill={LEVEL_META[row.key].hex} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}