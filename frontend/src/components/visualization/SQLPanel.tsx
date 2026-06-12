import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface Props {
  sql: string
}

export default function SQLPanel({ sql }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  if (!sql) return null

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-transparent"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          SQL Query
          <span className="text-xs font-normal text-amber-600 ml-2 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
            ⚠ AI-generated — verify before production use
          </span>
        </div>
        
        {isOpen && (
          <div 
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 rounded bg-white border border-gray-200"
          >
            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="p-4 bg-gray-50 overflow-x-auto">
          <pre className="text-xs font-mono text-gray-800 m-0">
            <code>{sql}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
