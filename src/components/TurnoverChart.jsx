import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function TurnoverChart({ wards, data }) {
  const rows = wards.map((ward) => ({
    ward: ward.name,
    stays: data[ward.id] ?? 0,
  }))
  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="ward" />
          <YAxis label={{ value: 'Stays per bed', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
          <Tooltip formatter={(value) => [`${value}`, 'Stays per bed']} cursor={{ fill: 'rgba(0,0,0,0.06)' }} />
          <Bar dataKey="stays" radius={[4, 4, 0, 0]}>
            {rows.map((row, i) => (
              <Cell key={row.ward} fill={['#60a5fa', '#34d399', '#f59e0b', '#a78bfa'][i % 4]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}