"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  searchable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

interface AdminTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchFields?: string[]
  actions?: ((item: T) => React.ReactNode) | null
  loading?: boolean
}

export function AdminTable<T extends Record<string, any>>({
  data,
  columns,
  searchFields = [],
  actions,
  loading = false
}: AdminTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const getValue = (item: any, path: string): any =>
    path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), item)

  const filteredAndSortedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm && searchFields.length > 0) {
      filtered = data.filter(item =>
        searchFields.some(field => {
          const value = getValue(item, String(field))
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getValue(a, sortBy)
        const bVal = getValue(b, sortBy)

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sortOrder === 'asc' ? -1 : 1
        if (bVal == null) return sortOrder === 'asc' ? 1 : -1

        // Handle string comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        // Handle number comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        }

        // Fallback to string comparison
        const aStr = String(aVal)
        const bStr = String(bVal)
        return sortOrder === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr)
      })
    }

    return filtered
  }, [data, searchTerm, searchFields, sortBy, sortOrder])

  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key)
    if (!column?.sortable) return

    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return null
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#D0E4F0] rounded-xl p-8 text-center">
        <div className="text-[#5B8FB9]">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Search input */}
      {searchFields.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-[#D0E4F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#D0E4F0] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F4F7FB]">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`text-left text-[#1B4F72] px-4 py-3 text-sm font-medium ${column.className || ''} ${
                    column.sortable ? 'cursor-pointer hover:bg-[#EBF3FB] select-none' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="text-right text-[#1B4F72] px-4 py-3 text-sm font-medium">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((item, index) => (
              <tr key={item.id || index} className="border-t border-[#EBF3FB] hover:bg-[#F4F7FB]">
                {columns.map((column) => {
                  const value = getValue(item, String(column.key))
                  return (
                    <td key={String(column.key)} className={`px-4 py-3 ${column.className || ''}`}>
                      {column.render
                        ? column.render(value, item)
                        : value?.toString() || '—'
                      }
                    </td>
                  )
                })}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedData.length === 0 && (
          <div className="p-8 text-center text-[#5B8FB9]">
            {searchTerm ? 'Aucun résultat trouvé' : 'Aucune donnée disponible'}
          </div>
        )}
      </div>
    </div>
  )
}