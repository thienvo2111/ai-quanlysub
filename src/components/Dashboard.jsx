import React from 'react'

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

function StatusBadge({ expiryDate }) {
  const s = getStatus(expiryDate)
  const map = {
    active: 'bg-green-100 text-green-700',
    expiring: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  }
  const label = { active: 'Active', expiring: 'Sắp hết', expired: 'Hết hạn' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s]}`}>{label[s]}</span>
}

export default function Dashboard({ packages, members }) {
  const totalCost = packages.reduce((s, p) => s + (p.cost || 0), 0)
  const totalRevenue = members.reduce((s, m) => s + (m.paymentAmount || 0), 0)
  const profit = totalRevenue - totalCost
  const activeCount = members.filter(m => getStatus(m.expiryDate) === 'active').length

  const pkgWarnings = packages.filter(p => {
    const d = getDaysLeft(p.expiryDate)
    return d >= 0 && d <= 7
  })
  const pkgExpired = packages.filter(p => getDaysLeft(p.expiryDate) < 0)
  const memWarnings = members.filter(m => {
    const d = getDaysLeft(m.expiryDate)
    return d >= 0 && d <= 7
  })
  const memExpired = members.filter(m => getDaysLeft(m.expiryDate) < 0)

  const hasWarnings = pkgWarnings.length || pkgExpired.length || memWarnings.length || memExpired.length

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
          <p className="text-sm text-red-500 font-medium mb-1">Tổng Chi Phí</p>
          <p className="text-2xl font-bold text-red-600">{formatMoney(totalCost)}</p>
          <p className="text-xs text-gray-400 mt-1">{packages.length} gói đã mua</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
          <p className="text-sm text-green-500 font-medium mb-1">Tổng Doanh Thu</p>
          <p className="text-2xl font-bold text-green-600">{formatMoney(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{members.length} thành viên</p>
        </div>
        <div className={`bg-white rounded-xl p-5 border shadow-sm ${profit >= 0 ? 'border-blue-200' : 'border-red-200'}`}>
          <p className={`text-sm font-medium mb-1 ${profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>Lợi Nhuận</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}{formatMoney(profit)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Doanh thu − Chi phí</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm">
          <p className="text-sm text-purple-500 font-medium mb-1">Thành Viên Active</p>
          <p className="text-2xl font-bold text-purple-600">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-1">/ {members.length} tổng thành viên</p>
        </div>
      </div>

      {/* Warnings */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">Cảnh Báo</h3>
        {!hasWarnings ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
            ✓ Không có cảnh báo nào. Tất cả đang trong hạn.
          </div>
        ) : (
          <div className="space-y-2">
            {pkgExpired.map(p => (
              <div key={p.id} className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex justify-between">
                <span>🔴 Gói <strong>{p.name}</strong> đã hết hạn ({formatDate(p.expiryDate)})</span>
              </div>
            ))}
            {pkgWarnings.map(p => (
              <div key={p.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm flex justify-between">
                <span>⚠️ Gói <strong>{p.name}</strong> sắp hết hạn — còn {getDaysLeft(p.expiryDate)} ngày ({formatDate(p.expiryDate)})</span>
              </div>
            ))}
            {memExpired.map(m => (
              <div key={m.id} className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                🔴 Thành viên <strong>{m.name}</strong> đã hết hạn ({formatDate(m.expiryDate)})
              </div>
            ))}
            {memWarnings.map(m => (
              <div key={m.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
                ⚠️ Thành viên <strong>{m.name}</strong> sắp hết hạn — còn {getDaysLeft(m.expiryDate)} ngày ({formatDate(m.expiryDate)})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members table */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">Danh Sách Thành Viên</h3>
        {members.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Chưa có thành viên nào</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="px-4 py-3 text-left">Email / SĐT</th>
                  <th className="px-4 py-3 text-right">Số Tiền</th>
                  <th className="px-4 py-3 text-center">Ngày Hết Hạn</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.email || m.phone || '—'}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{formatMoney(m.paymentAmount)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(m.expiryDate)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge expiryDate={m.expiryDate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
