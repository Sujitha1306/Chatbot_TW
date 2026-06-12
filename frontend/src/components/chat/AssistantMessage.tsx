import { useState, useEffect } from 'react'
import { Message, ChartSpec } from '@/types/chat'
import { BarChart2, Activity, ChevronDown, ChevronUp, Download } from 'lucide-react'
import ChartSelector from '../visualization/ChartSelector'
import ChartRenderer from '../visualization/ChartRenderer'
import SQLPanel from '../visualization/SQLPanel'
import { useChatStore } from '@/store/chat'

interface Props {
  message: Message
  originalQuestion: string
  onFollowup: (q: string) => void
}

export default function AssistantMessage({ message, originalQuestion, onFollowup }: Props) {
  const [activePanel, setActivePanel] = useState<'chart' | 'sql' | null>(null)
  const [localSpec, setLocalSpec] = useState<ChartSpec | undefined>(message.chartSpec)
  const [exportOpen, setExportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Sync chart spec when message updates from stream
  useEffect(() => {
    if (message.chartSpec) {
      // Only sync if we haven't manually changed the local spec's active tab
      setLocalSpec(prev => {
        if (!prev) return message.chartSpec
        // Preserve user's local selections if they exist, but update recommendations and data from backend
        return {
          ...message.chartSpec,
          active: prev.active,
          recommendations: prev.recommendations.map(pr => {
            const newRec = message.chartSpec!.recommendations.find(nr => nr.type === pr.type)
            return {
              ...pr,
              label: newRec?.label || pr.label,
              icon: newRec?.icon || pr.icon,
            }
          })
        }
      })
    }
  }, [message.chartSpec])

  const togglePanel = (panel: 'chart' | 'sql') => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  const exportQuery = async (format: 'csv' | 'excel' | 'pdf') => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tw_token') : null;
      const res = await fetch(`http://127.0.0.1:8000/export/${format}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ question: originalQuestion }),
      })
      
      if (!res.ok) throw new Error(`Export failed: ${res.statusText}`)
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trackerwave_export.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
      setExportOpen(false)
    }
  }

  return (
    <div className="flex gap-4 mb-6 w-full">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-navy flex items-center justify-center text-brand-light font-bold text-xl shadow-sm border border-brand-primary/20">
        ◈
      </div>
      
      <div className="flex-1 space-y-3 min-w-0 relative">
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
        {(message.sql || message.data || localSpec) && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {localSpec && message.data && (
              <button 
                onClick={() => togglePanel('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${activePanel === 'chart' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <BarChart2 size={16} /> Visualization {activePanel === 'chart' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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

            {/* Export Menu */}
            {message.data && message.data.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setExportOpen(!exportOpen)}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download size={16} /> {isExporting ? 'Exporting...' : 'Export'} <ChevronDown size={14} />
                </button>
                
                {exportOpen && !isExporting && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    <button 
                      onClick={() => exportQuery('csv')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-surface hover:text-brand-primary"
                    >
                      Download CSV
                    </button>
                    <button 
                      onClick={() => exportQuery('excel')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-surface hover:text-brand-primary"
                    >
                      Download Excel
                    </button>
                    <button 
                      onClick={() => exportQuery('pdf')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-surface hover:text-brand-primary"
                    >
                      Download PDF Report
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Panel Content */}
        {activePanel === 'sql' && message.sql && (
          <SQLPanel sql={message.sql} />
        )}

        {activePanel === 'chart' && localSpec && message.data && (
          <div className="bg-white rounded-lg border border-gray-200 mt-2 p-4">
            <ChartSelector spec={localSpec} onSpecChange={setLocalSpec} />
            <ChartRenderer spec={localSpec} data={message.data} />
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
