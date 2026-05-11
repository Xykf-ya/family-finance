import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useFinanceStore } from '../../hooks/useFinanceStore'
import { useMemo } from 'react'

const COLORS = ['#4A7C59', '#C4943A', '#8B7E6E', '#6B5C4B']

interface PieData {
  name: string
  value: number
}

export default function AssetPieChart() {
  const profile = useFinanceStore((s) => s.profile)

  const data: PieData[] = useMemo(() => {
    const items: PieData[] = []
    if (profile.assets.houseValue > 0) items.push({ name: '房产', value: profile.assets.houseValue })
    if (profile.assets.savings > 0) items.push({ name: '存款/理财', value: profile.assets.savings })
    if (profile.assets.stockPosition > 0) items.push({ name: '股票', value: profile.assets.stockPosition })
    if (profile.assets.otherFixedAssets > 0) items.push({ name: '其他', value: profile.assets.otherFixedAssets })
    if (items.length === 0) items.push({ name: '暂无数据', value: 1 })
    return items
  }, [profile.assets])

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col items-center">
      <div className="w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={64}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${(Number(v) / 10000).toLocaleString(undefined, { maximumFractionDigits: 2 })}万元`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {d.name} {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
