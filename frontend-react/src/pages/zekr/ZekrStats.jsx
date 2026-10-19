import { useZekrData } from '@/context/ZekrDataContext'
import StatsTab from '@/components/zekr_app/stats/StatsTab.jsx'

function ZekrStats() {
  const { allAdhkar } = useZekrData()
  return <StatsTab adhkar={allAdhkar} />
}

export default ZekrStats
