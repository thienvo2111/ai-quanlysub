import React, { useState, useEffect } from 'react'
import Modal from './Modal'

function toInputDate(str) {
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const parts = str.split('/')
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }
  const d = new Date(str)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

function calcExpiryDate(startDate, duration) {
  const d = new Date(startDate)
  if (duration === '1y') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    const m = parseInt(duration)
    if (!isNaN(m)) d.setMonth(d.getMonth() + m)
  }
  return d.toISOString().split('T')[0]
}

function durationLabel(dur) {
  if (dur === '1y') return '1 năm'
  const m = parseInt(dur)
  return !isNaN(m) ? `${m} tháng` : dur
}

// Decompose stored duration back to form state
function parseDuration(dur) {
  if (['1m', '3m', '6m', '1y'].includes(dur)) return { duration: dur, customMonths: 2 }
  const m = parseInt(dur)
  if (!isNaN(m)) return { duration: 'custom', customMonths: m }
  return { duration: '1m', customMonths: 2 }
}

// Returns the duration key to store (e.g. 'custom' + 2 → '2m')
function effectiveDuration(duration, customMonths) {
  return duration === 'custom' ? `${customMonths || 1}m` : duration
}

function getDaysLeft(expiryDate) {
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}
function getStatus(expiryDate) {
  const d = getDaysLeft(expiryDate)
  if (d < 0) return 'expired'
  if (d <= 7) return 'expiring'
  return 'active'
}
function formatMoney(n) { return (n || 0).toLocaleString('vi-VN') + ' ₫' }
function formatDate(s) { return s ? new Date(s).toLocaleDateString('vi-VN') : '—' }

const DURATION_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }
const today = new Date().toISOString().split('T')[0]
const EMPTY_FORM = { name: '', email: '', phone: '', paymentAmount: '', duration: '1m', customMonths: 2, startDate: today, packageId: '' }
const EMPTY_RENEW = { paymentAmount: '', duration: '1m', customMonths: 2, startDate: today }

function StatusBadge({ expiryDate }) {
  const s = getStatus(expiryDate)
  const cls = { active: 'bg-green-100 text-green-700', expiring: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700' }
  const label = { active: 'Active', expiring: 'Sắp hết', expired: 'Hết hạn' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls[s]}`}>{label[s]}</span>
}

function usePricePerMonth() {
  const [price, setPrice] = useState(() => {
    const saved = localStorage.getItem('qlsub_price_per_month')
    return saved ? Number(saved) : 175000
  })
  useEffect(() => { localStorage.setItem('qlsub_price_per_month', price) }, [price])
  return [price, setPrice]
}

function DurationSelect({ value, customMonths, onChange, onCustomMonthsChange }) {
  return (
    <div className="space-y-2">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="1m">1 tháng</option>
        <option value="3m">3 tháng</option>
        <option value="6m">6 tháng</option>
        <option value="1y">1 năm</option>
        <option value="custom">Tùy chỉnh...</option>
      </select>
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="number" min="1" max="24" value={customMonths}
            onChange={e => onCustomMonthsChange(Number(e.target.value) || 1)}
            className="w-20 border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">tháng</span>
        </div>
      )}
    </div>
  )
}

export default function MemberManager({ packages, members, setMembers }) {
  const [pricePerMonth, setPricePerMonth] = usePricePerMonth()
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState(pricePerMonth)

  const [modalOpen, setModalOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [renewTarget, setRenewTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [renewForm, setRenewForm] = useState(EMPTY_RENEW)
  const [filter, setFilter] = useState('all')

  const formEffDur = effectiveDuration(form.duration, form.customMonths)
  const renewEffDur = effectiveDuration(renewForm.duration, renewForm.customMonths)
  const derivedExpiry = calcExpiryDate(form.startDate || today, formEffDur)
  const renewExpiry = calcExpiryDate(renewForm.startDate || today, renewEffDur)

  // Auto-calculate amount when duration/customMonths changes in add/edit form
  useEffect(() => {
    const months = form.duration === 'custom'
      ? (form.customMonths || 1)
      : (DURATION_MONTHS[form.duration] || 1)
    setForm(f => ({ ...f, paymentAmount: pricePerMonth * months }))
  }, [form.duration, form.customMonths, pricePerMonth])

  // Auto-calculate amount when duration/customMonths changes in renew form
  useEffect(() => {
    const months = renewForm.duration === 'custom'
      ? (renewForm.customMonths || 1)
      : (DURATION_MONTHS[renewForm.duration] || 1)
    setRenewForm(f => ({ ...f, paymentAmount: pricePerMonth * months }))
  }, [renewForm.duration, renewForm.customMonths, pricePerMonth])

  function openAdd() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, paymentAmount: pricePerMonth * 1 })
    setModalOpen(true)
  }

  function openEdit(m) {
    setEditId(m.id)
    const { duration, customMonths } = parseDuration(m.duration)
    setForm({ name: m.name, email: '', phone: '', paymentAmount: m.paymentAmount, duration, customMonths, startDate: toInputDate(m.startDate), packageId: m.packageId || '' })
    setModalOpen(true)
  }

  function openRenew(m) {
    setRenewTarget(m)
    setRenewForm({ paymentAmount: pricePerMonth * 1, duration: '1m', customMonths: 2, startDate: today })
    setRenewOpen(true)
  }

  function closeModal() { setModalOpen(false); setForm(EMPTY_FORM); setEditId(null) }
  function closeRenew() { setRenewOpen(false); setRenewTarget(null); setRenewForm(EMPTY_RENEW) }

  function handleSave(e) {
    e.preventDefault()
    if (!form.name || !form.paymentAmount || !form.startDate) return
    const dur = effectiveDuration(form.duration, form.customMonths)
    const expiryDate = calcExpiryDate(form.startDate, dur)
    if (editId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== editId) return m
        return {
          ...m,
          name: form.name,
          email: form.email || m.email || '',
          phone: form.phone || m.phone || '',
          paymentAmount: Number(form.paymentAmount),
          duration: dur,
          startDate: form.startDate,
          expiryDate,
          packageId: form.packageId || m.packageId || '',
        }
      }))
    } else {
      setMembers(prev => [...prev, {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        paymentAmount: Number(form.paymentAmount),
        duration: dur,
        startDate: form.startDate,
        expiryDate,
        packageId: form.packageId || '',
      }])
    }
    closeModal()
  }

  function handleRenew(e) {
    e.preventDefault()
    if (!renewForm.paymentAmount || !renewForm.startDate) return
    const dur = effectiveDuration(renewForm.duration, renewForm.customMonths)
    const expiryDate = calcExpiryDate(renewForm.startDate, dur)
    setMembers(prev => prev.map(m => m.id === renewTarget.id
      ? { ...m, startDate: renewForm.startDate, duration: dur, expiryDate, paymentAmount: m.paymentAmount + Number(renewForm.paymentAmount) }
      : m))
    closeRenew()
  }

  function handleDelete(id) {
    if (window.confirm('Xác nhận xóa thành viên này?')) {
      setMembers(prev => prev.filter(m => m.id !== id))
    }
  }

  function savePrice() {
    const v = Number(priceInput)
    if (v > 0) setPricePerMonth(v)
    setEditingPrice(false)
  }

  const filtered = filter === 'all' ? members : members.filter(m => getStatus(m.expiryDate) === filter)
  const totalRevenue = members.reduce((s, m) => s + (m.paymentAmount || 0), 0)

  const filterBtns = [
    { key: 'all', label: 'Tất Cả' },
    { key: 'active', label: 'Active' },
    { key: 'expiring', label: 'Sắp Hết' },
    { key: 'expired', label: 'Hết Hạn' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản Lý Thành Viên</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tổng doanh thu: <span className="text-green-600 font-semibold">{formatMoney(totalRevenue)}</span></p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >+ Thêm Thành Viên</button>
      </div>

      {/* Price config */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-blue-700 font-medium">Giá gốc / tháng:</span>
        {editingPrice ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              className="border border-blue-300 rounded-lg px-3 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={e => { if (e.key === 'Enter') savePrice(); if (e.key === 'Escape') setEditingPrice(false) }}
              autoFocus
            />
            <button onClick={savePrice} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700">Lưu</button>
            <button onClick={() => setEditingPrice(false)} className="text-gray-500 hover:text-gray-700 text-xs">Hủy</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-blue-800 font-bold">{formatMoney(pricePerMonth)}</span>
            <button
              onClick={() => { setPriceInput(pricePerMonth); setEditingPrice(true) }}
              className="text-blue-500 hover:text-blue-700 text-xs underline"
            >Chỉnh sửa</button>
          </div>
        )}
        <span className="text-xs text-blue-400 ml-auto hidden sm:block">
          3 tháng = {formatMoney(pricePerMonth * 3)} · 6 tháng = {formatMoney(pricePerMonth * 6)} · 1 năm = {formatMoney(pricePerMonth * 12)}
        </span>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterBtns.map(b => (
          <button
            key={b.key}
            onClick={() => setFilter(b.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === b.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{b.label} ({b.key === 'all' ? members.length : members.filter(m => getStatus(m.expiryDate) === b.key).length})</button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p>{filter === 'all' ? 'Chưa có thành viên nào.' : 'Không có thành viên nào trong nhóm này.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
                <th className="px-4 py-3 text-left">STT</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Email / SĐT</th>
                <th className="px-4 py-3 text-left">Gói Family</th>
                <th className="px-4 py-3 text-right">Số Tiền</th>
                <th className="px-4 py-3 text-center">Thời Hạn</th>
                <th className="px-4 py-3 text-center">Ngày BD</th>
                <th className="px-4 py-3 text-center">Ngày HH</th>
                <th className="px-4 py-3 text-center">Còn Lại</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const days = getDaysLeft(m.expiryDate)
                return (
                  <tr key={m.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.email || m.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {packages.find(p => p.id === m.packageId)?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatMoney(m.paymentAmount)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{durationLabel(m.duration)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(m.startDate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(m.expiryDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium text-xs ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {days < 0 ? `−${Math.abs(days)} ngày` : `${days} ngày`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge expiryDate={m.expiryDate} /></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => openEdit(m)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium transition-colors">Sửa</button>
                        <button onClick={() => openRenew(m)} className="bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium transition-colors">Gia Hạn</button>
                        <button onClick={() => handleDelete(m.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium transition-colors">Xóa</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editId ? 'Sửa Thành Viên' : 'Thêm Thành Viên'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nguyễn Văn A" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder={editId ? '(giữ nguyên nếu bỏ trống)' : 'example@gmail.com'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder={editId ? '(giữ nguyên nếu bỏ trống)' : '0901234567'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gói Family</label>
            <select value={form.packageId} onChange={e => setForm(f => ({ ...f, packageId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Chưa gán gói —</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.ownerEmail ? ` (${p.ownerEmail})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn <span className="text-red-500">*</span></label>
              <DurationSelect
                value={form.duration}
                customMonths={form.customMonths}
                onChange={v => setForm(f => ({ ...f, duration: v }))}
                onCustomMonthsChange={v => setForm(f => ({ ...f, customMonths: v }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền thanh toán (₫) <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2 text-xs">tự tính · có thể điều chỉnh</span>
            </label>
            <input type="number" value={form.paymentAmount}
              onChange={e => setForm(f => ({ ...f, paymentAmount: e.target.value }))}
              required min="0"
              className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn (tự tính)</label>
            <input type="text" value={formatDate(derivedExpiry)} readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              {editId ? 'Cập Nhật' : 'Thêm Thành Viên'}
            </button>
            <button type="button" onClick={closeModal}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">Hủy</button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal isOpen={renewOpen} onClose={closeRenew} title={`Gia Hạn: ${renewTarget?.name || ''}`}>
        <form onSubmit={handleRenew} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn gia hạn</label>
              <DurationSelect
                value={renewForm.duration}
                customMonths={renewForm.customMonths}
                onChange={v => setRenewForm(f => ({ ...f, duration: v }))}
                onCustomMonthsChange={v => setRenewForm(f => ({ ...f, customMonths: v }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu mới</label>
              <input type="date" value={renewForm.startDate} onChange={e => setRenewForm(f => ({ ...f, startDate: e.target.value }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền gia hạn (₫)
              <span className="text-gray-400 font-normal ml-2 text-xs">tự tính · có thể điều chỉnh</span>
            </label>
            <input type="number" value={renewForm.paymentAmount}
              onChange={e => setRenewForm(f => ({ ...f, paymentAmount: e.target.value }))}
              required min="0"
              className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn mới (tự tính)</label>
            <input type="text" value={formatDate(renewExpiry)} readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Gia Hạn</button>
            <button type="button" onClick={closeRenew}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">Hủy</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
