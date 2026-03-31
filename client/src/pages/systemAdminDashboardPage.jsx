import React, { useEffect, useState } from 'react'
import { centerService, slotService } from '../services'

export default function SystemAdminDashboardPage(){
  const [centers, setCenters] = useState([])
  const [slots, setSlots] = useState([])
  const [centerFilter, setCenterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    loadData()
  },[])

  const loadData = async () => {
    try {
      setLoading(true)
      const centersResponse = await centerService.getAllCenters()
      const slotsResponse = await slotService.getAllSlots()
      setCenters(centersResponse.data || centersResponse)
      setSlots(slotsResponse.data || slotsResponse)
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = slots.filter(s=>{
    if (centerFilter && s.centerId !== centerFilter && s.centerId?._id !== centerFilter) return false
    if (statusFilter === 'booked' && !s.isBooked) return false
    if (statusFilter === 'available' && (s.isBooked || !s.isActive)) return false
    if (statusFilter === 'inactive' && s.isActive) return false
    return true
  })

  const summary = {
    total: slots.length,
    available: slots.filter(s=>!s.isBooked && s.isActive).length,
    booked: slots.filter(s=>s.isBooked).length,
    inactive: slots.filter(s=>!s.isActive).length,
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">System Admin - Overview</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500">Total Slots</div><div className="text-xl font-semibold">{summary.total}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Available</div><div className="text-xl font-semibold">{summary.available}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Booked</div><div className="text-xl font-semibold">{summary.booked}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Inactive</div><div className="text-xl font-semibold">{summary.inactive}</div></div>
      </div>

      <div className="card mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Center</label>
            <select value={centerFilter} onChange={e=>setCenterFilter(e.target.value)} className="w-full border p-2 rounded-lg">
              <option value="">All</option>
              {centers.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full border p-2 rounded-lg">
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">All Slots ({filtered.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="p-3">Center</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=> {
                const centerName = typeof s.centerId === 'object' ? s.centerId?.name : centers.find(c=>c._id===s.centerId)?.name
                const doctorName = typeof s.doctorId === 'object' ? s.doctorId?.name : 'Doctor'
                const status = s.isBooked ? 'Booked' : s.isActive ? 'Available' : 'Inactive'
                return (
                  <tr key={s._id} className="border-t">
                    <td className="p-3">{centerName || 'N/A'}</td>
                    <td className="p-3">{doctorName}</td>
                    <td className="p-3">{new Date(s.date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="p-3">{s.startTime} — {s.endTime}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        s.isBooked ? 'bg-blue-100 text-blue-800' : s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
