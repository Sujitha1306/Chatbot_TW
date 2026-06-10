import { useState } from 'react'
import { Message } from '@/types/chat'
import { BarChart2, Activity, Database, ChevronDown, ChevronUp, Check, Download } from 'lucide-react'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

export default function AssistantMessage({ message, onFollowup }: { message: Message, onFollowup: (q: string) => void }) {
  const [activePanel, setActivePanel] = useState<'chart' | 'data' | 'sql' | null>(null)

  const togglePanel = (panel: 'chart' | 'data' | 'sql') => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  return (
    <div className="flex gap-4 mb-6 w-full">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-navy flex items-center justify-center text-brand-light font-bold text-xl shadow-sm border border-brand-primary/20">
        ◈
      </div>
      
      <div className="flex-1 space-y-3 min-w-0">
        {/* Status Bar */}
        {(message.status !== 'pending' || message.domain) && (
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-primary/20 text-brand-navy px-3 py-1.5 rounded-lg text-xs font-medium">
            {message.domain === 'asset' ? <Activity size={14} /> : <BarChart2 size={14} />}
            <span className="capitalize">{message.domain || 'Analytics'}</span>
            {message.rowCount !== undefined && (
              <>
                <span className="text-brand-primary/40">•</span>
                <span>{message.rowCount} rows processed</span>
              </>
            )}
          </div>
        )}

        {/* Typing indicator */}
        {message.status === 'pending' && !message.content && (
          <div className="flex gap-1 items-center h-6 px-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Main Content */}
        {message.content && (
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            {message.content}
          </div>
        )}

        {/* Collapsible Panels */}
        {(message.sql || message.data || message.chartSpec) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {message.chartSpec && (
              <button 
                onClick={() => togglePanel('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${activePanel === 'chart' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <BarChart2 size={16} /> Chart {activePanel === 'chart' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            
            {message.data && (
              <button 
                onClick={() => togglePanel('data')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${activePanel === 'data' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <Database size={16} /> Data {activePanel === 'data' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            {message.sql && (
              <button 
                onClick={() => togglePanel('sql')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${activePanel === 'sql' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                SQL {activePanel === 'sql' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        )}

        {/* Panel Content */}
        {activePanel === 'sql' && message.sql && (
          <div className="bg-gray-900 rounded-lg p-4 mt-2 overflow-x-auto border border-gray-800">
            <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">{message.sql}</pre>
          </div>
        )}

        {activePanel === 'data' && message.data && message.data.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-2 overflow-hidden">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(message.data[0]).map(key => (
                      <th key={key} className="px-4 py-3 font-medium border-b border-gray-200 whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {message.data.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-4 py-2.5 whitespace-nowrap text-gray-700">
                          {val === null ? <span className="text-gray-400 italic">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {message.data.length > 100 && (
              <div className="bg-gray-50 p-2 text-center text-xs text-gray-500 border-t border-gray-200">
                Showing 100 of {message.data.length} rows
              </div>
            )}
          </div>
        )}

        {activePanel === 'chart' && message.chartSpec && message.data && (
          <div className="bg-white rounded-lg border border-gray-200 mt-2 p-4 min-h-[300px] flex items-center justify-center">
            <Plot
              data={[{
                type: message.chartSpec.active as any,
                x: message.data.map((d: any) => d[message.chartSpec!.recommendations[0]?.x] || d[Object.keys(d)[0]]),
                y: message.data.map((d: any) => d[message.chartSpec!.recommendations[0]?.y] || d[Object.keys(d)[1]]),
                marker: { color: '#28A5A0' },
              }]}
              layout={{ 
                autosize: true, 
                margin: { t: 20, r: 20, l: 40, b: 40 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { family: 'Inter, sans-serif' }
              }}
              useResizeHandler={true}
              className="w-full h-[400px]"
              config={{ displayModeBar: false, responsive: true }}
            />
          </div>
        )}

        {/* Follow-ups */}
        {message.followups && message.followups.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-2">
            {message.followups.map((f, i) => (
              <button
                key={i}
                onClick={() => onFollowup(f)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-surface hover:bg-brand-light/20 text-brand-navy border border-brand-primary/20 text-xs font-medium transition-colors"
              >
                <span className="text-brand-primary">💡</span> {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
