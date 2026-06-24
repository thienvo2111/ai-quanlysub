import React, { useState } from 'react'
import Modal from './Modal'

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

// Chuẩn hóa mọi định dạng ngày về YYYY-MM-DD cho <input type="date">
function toInputDate(str) {
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  // Xử lý DD/MM/YYYY (định dạng Việt Nam hoặc từ Google Sheets)
  const parts = str.split('/')
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }
  // Fallback: parse rồi convert
  const d = new Date(str)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

const EMPTY_FORM = { name: '', ownerEmail: '', cost: '', purchaseDate: '', expiryDate: '', notes: '' }

function StatusBadge({ expiryDate }) {
  const s = getStatus(expiryDate)
  const map = {
    active: 'bg-green-100 text-green-700',
    expiring: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  }
  const label = { active: 'Còn hạn', expiring: 'Sắp hết', expired: 'Hết hạn' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s]}`}>{label[s]}</span>
}

export default function PackageManager({ packages, setPackages, members = [] }) {
  function getMemberCount(pkgId) {
    // active members (not expired)
    return members.filter(m => getDaysLeft(m.expiryDate) >= 0).length
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(pkg) {
    setEditId(pkg.id)
    setForm({
      name: pkg.name,
      ownerEmail: pkg.ownerEmail || '',
      cost: pkg.cost || '',
      purchaseDate: toInputDate(pkg.purchaseDate),
      expiryDate: toInputDate(pkg.expiryDate),
      notes: pkg.notes || '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setEditId(null)
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.name || !form.cost || !form.purchaseDate || !form.expiryDate) return
    if (editId) {
      setPackages(prev => prev.map(p => p.id === editId ? { ...p, ...form, cost: Number(form.cost) } : p))
    } else {
      setPackages(prev => [...prev, { id: Date.now().toString(), ...form, cost: Number(form.cost) }])
    }
    closeModal()
  }

  function handleDelete(id) {
    if (window.confirm('Xác nhận xóa gói này?')) {
      setPackages(prev => prev.filter(p => p.id !== id))
    }
  }

  const totalCost = packages.reduce((s, p) => s + (p.cost || 0), 0)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản Lý Gói Family</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tổng chi phí: <span className="text-red-600 font-semibold">{formatMoney(totalCost)}</span></p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Thêm Gói Mới
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>Chưa có gói nào. Thêm gói đầu tiên!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
                <th className="px-4 py-3 text-left">STT</th>
                <th className="px-4 py-3 text-left">Tên Gói</th>
                <th className="px-4 py-3 text-left">Email Chủ</th>
                <th className="px-4 py-3 text-right">Chi Phí</th>
                <th className="px-4 py-3 text-center">Ngày Mua</th>
                <th className="px-4 py-3 text-center">Ngày Hết Hạn</th>
                <th className="px-4 py-3 text-center">Còn Lại</th>
                <th className="px-4 py-3 text-center">Thành Viên</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-center">Ghi Chú</th>
                <th className="px-4 py-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, i) => {
                const days = getDaysLeft(pkg.expiryDate)
                return (
                  <tr key={pkg.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{pkg.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{pkg.ownerEmail || '—'}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatMoney(pkg.cost)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(pkg.purchaseDate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(pkg.expiryDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {days < 0 ? `Quá hạn ${Math.abs(days)} ngày` : `${days} ngày`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        👥 {getMemberCount(pkg.id)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge expiryDate={pkg.expiryDate} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{pkg.notes || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openEdit(pkg)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-medium transition-colors"
                        >Sửa</button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-medium transition-colors"
                        >Xóa</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editId ? 'Sửa Gói' : 'Thêm Gói Mới'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên gói <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Gemini AI Pro - T7/2026"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email tài khoản chủ</label>
            <input
              type="email"
              value={form.ownerEmail}
              onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))}
              placeholder="owner@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí (₫) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={form.cost}
              onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
              placeholder="480000"
              required
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mua <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="VD: Gói family 5 slot"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >{editId ? 'Cập Nhật' : 'Thêm Gói'}</button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
            >Hủy</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
