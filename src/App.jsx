import React, { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import PackageManager from './components/PackageManager'
import MemberManager from './components/MemberManager'
import { api } from './api'

const SAMPLE_PACKAGES = [
  { id: '1', name: 'Gemini AI Pro - T6/2026', cost: 480000, purchaseDate: '2026-06-01', expiryDate: '2026-07-01', notes: 'Gói family 5 slot' }
]
const SAMPLE_MEMBERS = [
  { id: '1', name: 'Nguyễn Văn A', email: 'a@gmail.com', phone: '0901234567', paymentAmount: 120000, duration: '1m', startDate: '2026-06-01', expiryDate: '2026-07-01' },
  { id: '2', name: 'Trần Thị B', email: 'b@gmail.com', phone: '0912345678', paymentAmount: 320000, duration: '3m', startDate: '2026-06-15', expiryDate: '2026-09-15' },
  { id: '3', name: 'Lê Văn C', email: 'c@gmail.com', phone: '0923456789', paymentAmount: 100000, duration: '1m', startDate: '2026-05-20', expiryDate: '2026-06-20' }
]

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'packages', label: 'Gói Family' },
  { key: 'members', label: 'Thành Viên' },
]

const HAS_API = !!import.meta.env.VITE_APPS_SCRIPT_URL

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

export default function App() {
  const [packages, setPackagesState] = useLocalStorage('qlsub_packages', SAMPLE_PACKAGES)
  const [members, setMembersState] = useLocalStorage('qlsub_members', SAMPLE_MEMBERS)
  const [loading, setLoading] = useState(HAS_API)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Load from Sheets on mount
  useEffect(() => {
    if (!HAS_API) return
    setLoading(true)
    Promise.all([api.getPackages(), api.getMembers()])
      .then(([pkgs, mems]) => {
        if (pkgs.length > 0) setPackagesState(pkgs.map(p => ({ ...p, cost: Number(p.cost) })))
        if (mems.length > 0) setMembersState(mems.map(m => ({ ...m, paymentAmount: Number(m.paymentAmount) })))
        setError(null)
      })
      .catch(() => setError('Không thể kết nối Google Sheets. Đang dùng dữ liệu cục bộ.'))
      .finally(() => setLoading(false))
  }, [])

  const setPackages = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(packages) : updater
    setPackagesState(next)
    if (!HAS_API) return
    setSaving(true)
    try { await api.savePackages(next) }
    catch { setError('Lưu thất bại. Dữ liệu chỉ lưu cục bộ.') }
    finally { setSaving(false) }
  }, [packages])

  const setMembers = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(members) : updater
    setMembersState(next)
    if (!HAS_API) return
    setSaving(true)
    try { await api.saveMembers(next) }
    catch { setError('Lưu thất bại. Dữ liệu chỉ lưu cục bộ.') }
    finally { setSaving(false) }
  }, [members])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Quản Lý Gói AI Family</h1>
                <p className="text-blue-200 text-xs">Gemini AI Pro · Chia sẻ nhóm</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-blue-200 text-xs flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-blue-200 border-t-white rounded-full animate-spin"></span>
                  Đang lưu...
                </span>
              )}
              {!HAS_API && (
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium">
                  Chế độ cục bộ
                </span>
              )}
              <div className="text-blue-200 text-xs text-right hidden sm:block">
                <p>{packages.length} gói · {members.length} thành viên</p>
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 pb-3">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-white text-blue-600'
                    : 'text-blue-100 hover:text-white hover:bg-blue-500'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex justify-between items-center">
          <p className="text-yellow-700 text-sm">⚠️ {error}</p>
          <button onClick={() => setError(null)} className="text-yellow-500 hover:text-yellow-700 text-lg leading-none">×</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm">Đang tải dữ liệu từ Google Sheets...</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard packages={packages} members={members} />}
          {activeTab === 'packages' && <PackageManager packages={packages} setPackages={setPackages} members={members} />}
          {activeTab === 'members' && <MemberManager packages={packages} members={members} setMembers={setMembers} />}
        </main>
      )}
    </div>
  )
}
