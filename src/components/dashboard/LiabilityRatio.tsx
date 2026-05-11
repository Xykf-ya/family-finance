import { useMemo } from 'react'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import { useFinanceStore } from '../../hooks/useFinanceStore'
import { assetLiabilityRatio, netWorth } from '../../utils/risk'
import { fmtWanFull } from '../../utils/format'

export default function LiabilityRatio() {
  const profile = useFinanceStore((s) => s.profile)

  const ratio = useMemo(() => assetLiabilityRatio(profile), [profile])
  const nw = useMemo(() => netWorth(profile), [profile])

  return (
    <Card title="负债健康度">
      <ProgressBar
        value={ratio}
        label="资产负债率"
        thresholds={{ safe: 50, warning: 70 }}
      />
      <div className="mt-3 text-xs text-[var(--color-text-muted)]">
        家庭净资产：<span className={`font-semibold ${nw >= 0 ? 'text-[var(--color-safe)]' : 'text-[var(--color-danger)]'}`}>{fmtWanFull(nw)}</span>
      </div>
      {ratio > 70 && (
        <p className="mt-2 text-xs text-[var(--color-danger)]">
          资产负债率超过70%，家庭财务较为脆弱。建议优先降低负债，谨慎增加新的借款。
        </p>
      )}
    </Card>
  )
}
