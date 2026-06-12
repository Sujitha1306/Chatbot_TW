import { useState, useMemo } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'

interface Props {
  data: Record<string, any>[]
}

export default function DataTable({ data }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDesc, setSortDesc] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const ROWS_PER_PAGE = 25

  const columns = useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }, [data])

  const filteredAndSortedData = useMemo(() => {
    if (!data) return []
    let result = [...data]
    
    // Filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(q))
      )
    }

    // Sort
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol]
        const valB = b[sortCol]
        if (valA === valB) return 0
        if (valA === null || valA === undefined) return sortDesc ? 1 : -1
        if (valB === null || valB === undefined) return sortDesc ? -1 : 1
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDesc ? valB - valA : valA - valB
        }
        return sortDesc 
          ? String(valB).localeCompare(String(valA)) 
          : String(valA).localeCompare(String(valB))
      })
    }
    
    return result
  }, [data, search, sortCol, sortDesc])

  const totalPages = Math.ceil(filteredAndSortedData.length / ROWS_PER_PAGE)
  const currentData = filteredAndSortedData.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDesc) {
        setSortCol(null)
      } else {
        setSortDesc(true)
      }
    } else {
      setSortCol(col)
      setSortDesc(false)
    }
  }

  if (!data || data.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No data available</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-gray-700">
          📋 Results <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 ml-2">{filteredAndSortedData.length} rows</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary w-64"
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 shadow-sm z-10">
              <tr>
                {columns.map(col => (
                  <th 
                    key={col} 
                    className="px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {col}
                      <ArrowUpDown className={`h-3 w-3 ${sortCol === col ? 'text-brand-primary' : 'text-gray-400'}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-[#F0FDFB]' : 'bg-white'} hover:bg-gray-50`}>
                  {columns.map(col => (
                    <td key={col} className={`px-4 py-2 ${typeof row[col] === 'number' ? 'text-right' : ''}`}>
                      {row[col] !== null ? String(row[col]) : <span className="text-gray-400 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 bg-white border border-gray-300 rounded disabled:opacity-50"
          >
            ← Prev
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1 bg-white border border-gray-300 rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
