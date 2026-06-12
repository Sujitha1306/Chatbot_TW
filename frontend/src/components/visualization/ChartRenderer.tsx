import dynamic from 'next/dynamic'
import { ChartSpec } from '@/types/chat'
import DataTable from './DataTable'

// Plotly must be loaded dynamically because it requires the window object
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

const BRAND_COLORS = ['#28A5A0', '#2C3687', '#61DAD3', '#4A5FAF', '#8BC4C1', '#6B7EC4']

const BASE_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', color: '#1A1A2E', size: 12 },
  margin: { t: 40, r: 20, b: 60, l: 60 },
  height: 380,
  showlegend: true,
  legend: { orientation: 'h' as const, y: -0.25 },
  colorway: BRAND_COLORS,
}

interface Props {
  spec: ChartSpec
  data: Record<string, any>[]
}

export default function ChartRenderer({ spec, data }: Props) {
  if (!data || data.length === 0) return null

  // If table is active, render the DataTable instead of Plotly
  if (spec.active === 'table') {
    return <DataTable data={data} />
  }

  // Get active recommendation settings
  const activeRec = spec.recommendations.find(r => r.type === spec.active)
  const xCol = activeRec?.x || (spec.columns?.categorical?.[0] || Object.keys(data[0])[0])
  const yCol = activeRec?.y || (spec.columns?.numeric?.[0] || Object.keys(data[0])[0])

  const xData = data.map(d => d[xCol])
  const yData = data.map(d => d[yCol])

  let plotData: any[] = []
  let layout = { ...BASE_LAYOUT, title: `${yCol} by ${xCol}` }

  switch (spec.active) {
    case 'bar':
      // Horizontal if > 12 categories
      const isHorizontal = new Set(xData).size > 12
      plotData = [{
        type: 'bar',
        x: isHorizontal ? yData : xData,
        y: isHorizontal ? xData : yData,
        orientation: isHorizontal ? 'h' : 'v',
        marker: { color: BRAND_COLORS[0] }
      }]
      if (isHorizontal) {
        layout.margin.l = 120 // more room for y-axis labels
      }
      break

    case 'pie':
      // Aggregate for pie chart if there are many categories
      const counts: Record<string, number> = {}
      data.forEach(d => {
        const key = String(d[xCol])
        counts[key] = (counts[key] || 0) + Number(d[yCol] || 1)
      })
      
      const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
      const topKeys = sortedKeys.slice(0, 10)
      const otherValue = sortedKeys.slice(10).reduce((sum, key) => sum + counts[key], 0)
      
      const labels = [...topKeys]
      const values = topKeys.map(k => counts[k])
      
      if (otherValue > 0) {
        labels.push('Other')
        values.push(otherValue)
      }

      plotData = [{
        type: 'pie',
        labels: labels,
        values: values,
        hole: 0.4,
        marker: { colors: BRAND_COLORS }
      }]
      break

    case 'line':
      // Sort by X-axis (usually time)
      const sortedData = [...data].sort((a, b) => {
        const valA = a[xCol]
        const valB = b[xCol]
        if (valA === null) return 1
        if (valB === null) return -1
        return String(valA).localeCompare(String(valB))
      })
      plotData = [{
        type: 'scatter',
        mode: 'lines+markers',
        x: sortedData.map(d => d[xCol]),
        y: sortedData.map(d => d[yCol]),
        line: { color: BRAND_COLORS[0], width: 2 },
        marker: { size: 6 }
      }]
      break

    case 'scatter':
      // Optional color by category
      const colorCol = spec.columns?.categorical?.find(c => c !== xCol && c !== yCol)
      
      if (colorCol) {
        const categories = Array.from(new Set(data.map(d => d[colorCol])))
        plotData = categories.map((cat, i) => ({
          type: 'scatter',
          mode: 'markers',
          name: String(cat),
          x: data.filter(d => d[colorCol] === cat).map(d => d[xCol]),
          y: data.filter(d => d[colorCol] === cat).map(d => d[yCol]),
          marker: { color: BRAND_COLORS[i % BRAND_COLORS.length], size: 8 }
        }))
      } else {
        plotData = [{
          type: 'scatter',
          mode: 'markers',
          x: xData,
          y: yData,
          marker: { color: BRAND_COLORS[0], size: 8 }
        }]
      }
      break
      
    default:
      return <div className="p-4 text-red-500">Unsupported chart type: {spec.active}</div>
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Plot
        data={plotData}
        layout={layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  )
}
