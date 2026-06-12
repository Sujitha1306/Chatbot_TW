import { BarChart2, PieChart, LineChart, ScatterChart, Table2 } from 'lucide-react'
import { ChartSpec } from '@/types/chat'

const ICONS: Record<string, any> = {
  BarChart2,
  PieChart,
  LineChart,
  ScatterChart,
  Table2,
}

interface Props {
  spec: ChartSpec
  onSpecChange: (spec: ChartSpec) => void
}

export default function ChartSelector({ spec, onSpecChange }: Props) {
  // Safe defaults if columns is undefined
  const allColumns = [
    ...(spec.columns?.categorical || []),
    ...(spec.columns?.numeric || []),
    ...(spec.columns?.date || [])
  ]

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex border-b border-gray-200">
        {spec.recommendations.map((rec) => {
          const Icon = ICONS[rec.icon] || BarChart2
          const isActive = spec.active === rec.type
          return (
            <button
              key={rec.type}
              onClick={() => {
                onSpecChange({
                  ...spec,
                  active: rec.type,
                  recommendations: spec.recommendations.map(r =>
                    r.type === rec.type ? { ...r, active: true } : r
                  ),
                })
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {rec.label}
            </button>
          )
        })}
      </div>

      {spec.active !== 'table' && spec.columns && (
        <div className="flex gap-4 items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">X-Axis:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              value={spec.recommendations.find(r => r.type === spec.active)?.x || ''}
              onChange={(e) => {
                onSpecChange({
                  ...spec,
                  recommendations: spec.recommendations.map(r =>
                    r.type === spec.active ? { ...r, x: e.target.value } : r
                  )
                })
              }}
            >
              <option value="">Select...</option>
              {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Y-Axis:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              value={spec.recommendations.find(r => r.type === spec.active)?.y || ''}
              onChange={(e) => {
                onSpecChange({
                  ...spec,
                  recommendations: spec.recommendations.map(r =>
                    r.type === spec.active ? { ...r, y: e.target.value } : r
                  )
                })
              }}
            >
              <option value="">Select...</option>
              {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
