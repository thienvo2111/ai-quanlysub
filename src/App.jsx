import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import PackageManager from './components/PackageManager'
import MemberManager from './components/MemberManager'

const SAMPLE_PACKAGES = [
  { id: '1', name: 'Gemini AI Pro - T6/2026', cost: 480000, purchaseDate: '2026-06-01', expiryDate: '2026-07-01', notes: 'Gói family 5 slot' }
]

const SAMPLE_MEMBERS = [
  { id: '1', name: 'Nguyễn Văn A', email: 'a@gmail.com', phone: '0901234567', paymentAmount: 120000, duration: '1m', startDate: '2026-06-01', expiryDate: '2026-07-01' },
  { id: '2', name: 'Trần Thị B', email: 'b@gmail.com', phone: '0912345678', paymentAmount: 320000, duration: '3m', startDate: '2026-06-15', expiryDate: '2026-09-15' },
  { id: '3', name: 'Lê Văn C', email: 'c@gmail.com', phone: '0923456789', paymentAmount: 100000, duration: '1m', startDate: '2026-05-20', expiryDate: '2026-06-20' }
]

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'packages', label: 'Gói Family' },
  { key: 'members', label: 'Thành Viên' },
]

export default function App() {
  const [packages, setPackages] = useLocalStorage('qlsub_packages', SAMPLE_PACKAGES)
  const [members, setMembers] = useLocalStorage('qlsub_members', SAMPLE_MEMBERS)
  const [activeTab, setActiveTab] = useState('dashboard')

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
            <div className="text-blue-200 text-xs text-right hidden sm:block">
              <p>{packages.length} gói · {members.length} thành viên</p>
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

      {/* Content */}
      <main className="max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard packages={packages} members={members} />
        )}
        {activeTab === 'packages' && (
          <PackageManager packages={packages} setPackages={setPackages} />
        )}
        {activeTab === 'members' && (
          <MemberManager packages={packages} members={members} setMembers={setMembers} />
        )}
      </main>
    </div>
  )
}
