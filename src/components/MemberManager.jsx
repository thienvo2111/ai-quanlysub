import React, { useState } from 'react'
import Modal from './Modal'

function calcExpiryDate(startDate, duration) {
  const d = new Date(startDate)
  if (duration === '1m') d.setMonth(d.getMonth() + 1)
  else if (duration === '3m') d.setMonth(d.getMonth() + 3)
  else if (duration === '6m') d.setMonth(d.getMonth() + 6)
  else if (duration === '1y') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
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

const DURATION_LABELS = { '1m': '1 tháng', '3m': '3 tháng', '6m': '6 tháng', '1y': '1 năm' }
const EMPTY_FORM = { name: '', email: '', phone: '', paymentAmount: '', duration: '1m', startDate: new Date().toISOString().split('T')[0] }
const EMPTY_RENEW = { paymentAmount: '', duration: '1m', startDate: new Date().toISOString().split('T')[0] }

function StatusBadge({ expiryDate }) {
  const s = getStatus(expiryDate)
  const map = { active: 'bg-green-100 text-green-700', expiring: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700' }
  const label = { active: 'Active', expiring: 'Sắp hết', expired: 'Hết hạn' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s]}`}>{label[s]}</span>
}

export default function MemberManager({ packages, members, setMembers }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [renewTarget, setRenewTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [renewForm, setRenewForm] = useState(EMPTY_RENEW)
  const [filter, setFilter] = useState('all')

  const today = new Date().toISOString().split('T')[0]
  const derivedExpiry = calcExpiryDate(form.startDate || today, form.duration)
  const renewExpiry = calcExpiryDate(renewForm.startDate || today, renewForm.duration)

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(m) {
    setEditId(m.id)
    setForm({ name: m.name, email: m.email || '', phone: m.phone || '', paymentAmount: m.paymentAmount, duration: m.duration, startDate: m.startDate })
    setModalOpen(true)
  }

  function openRenew(m) {
    setRenewTarget(m)
    setRenewForm({ paymentAmount: '', duration: '1m', startDate: today })
    setRenewOpen(true)
  }

  function closeModal() { setModalOpen(false); setForm(EMPTY_FORM); setEditId(null) }
  function closeRenew() { setRenewOpen(false); setRenewTarget(null); setRenewForm(EMPTY_RENEW) }

  function handleSave(e) {
    e.preventDefault()
    if (!form.name || !form.paymentAmount || !form.startDate) return
    const expiryDate = calcExpiryDate(form.startDate, form.duration)
    if (editId) {
      setMembers(prev => prev.map(m => m.id === editId
        ? { ...m, ...form, paymentAmount: Number(form.paymentAmount), expiryDate }
        : m))
    } else {
      setMembers(prev => [...prev, { id: Date.now().toString(), ...form, paymentAmount: Number(form.paymentAmount), expiryDate }])
    }
    closeModal()
  }

  function handleRenew(e) {
    e.preventDefault()
    if (!renewForm.paymentAmount || !renewForm.startDate) return
    const expiryDate = calcExpiryDate(renewForm.startDate, renewForm.duration)
    setMembers(prev => prev.map(m => m.id === renewTarget.id
      ? { ...m, startDate: renewForm.startDate, duration: renewForm.duration, expiryDate, paymentAmount: m.paymentAmount + Number(renewForm.paymentAmount) }
      : m))
    closeRenew()
  }

  function handleDelete(id) {
    if (window.confirm('Xác nhận xóa thành viên này?')) {
      setMembers(prev => prev.filter(m => m.id !== id))
    }
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
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản Lý Thành Viên</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tổng doanh thu: <span className="text-green-600 font-semibold">{formatMoney(totalRevenue)}</span></p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >+ Thêm Thành Viên</button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterBtns.map(b => (
          <button
            key={b.key}
            onClick={() => setFilter(b.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === b.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{b.label} {b.key === 'all' ? `(${members.length})` : `(${members.filter(m => getStatus(m.expiryDate) === b.key).length})`}</button>
        ))}
      </div>

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
                    <td className="px-4 py-3 text-gray-500">{m.email || m.phone || '—'}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatMoney(m.paymentAmount)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{DURATION_LABELS[m.duration] || m.duration}</td>
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
                placeholder="example@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thanh toán (₫) <span className="text-red-500">*</span></label>
            <input type="number" value={form.paymentAmount} onChange={e => setForm(f => ({ ...f, paymentAmount: e.target.value }))}
              placeholder="120000" required min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn <span className="text-red-500">*</span></label>
              <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="1m">1 tháng</option>
                <option value="3m">3 tháng</option>
                <option value="6m">6 tháng</option>
                <option value="1y">1 năm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
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
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">Hủy</button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal isOpen={renewOpen} onClose={closeRenew} title={`Gia Hạn: ${renewTarget?.name || ''}`}>
        {renewTarget && (
          <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p>Hết hạn hiện tại: <strong className="text-red-500">{formatDate(renewTarget.expiryDate)}</strong></p>
            <p>Tổng đã trả: <strong className="text-green-600">{formatMoney(renewTarget.paymentAmount)}</strong></p>
          </div>
        )}
        <form onSubmit={handleRenew} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền gia hạn (₫) <span className="text-red-500">*</span></label>
            <input type="number" value={renewForm.paymentAmount} onChange={e => setRenewForm(f => ({ ...f, paymentAmount: e.target.value }))}
              placeholder="120000" required min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn mới <span className="text-red-500">*</span></label>
              <select value={renewForm.duration} onChange={e => setRenewForm(f => ({ ...f, duration: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="1m">1 tháng</option>
                <option value="3m">3 tháng</option>
                <option value="6m">6 tháng</option>
                <option value="1y">1 năm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input type="date" value={renewForm.startDate} onChange={e => setRenewForm(f => ({ ...f, startDate: e.target.value }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn mới (tự tính)</label>
            <input type="text" value={formatDate(renewExpiry)} readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-green-50 text-green-700 font-medium" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Xác Nhận Gia Hạn</button>
            <button type="button" onClick={closeRenew} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">Hủy</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
