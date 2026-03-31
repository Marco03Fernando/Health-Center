import React, { useEffect, useState, useMemo } from 'react'
import { centerService, slotService } from '../services'
import { ToggleRight, Trash2, Eye } from 'lucide-react'

export default function SlotManagementPage() {
  const centerId = '6994a9e70baa9daea43599d1'

  const [center, setCenter] = useState(null)
  const [days, setDays] = useState(3)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [slotMinutes, setSlotMinutes] = useState(30)
  const endDate = useMemo(() => {
    try {
      const d = new Date(startDate)
      d.setDate(d.getDate() + Math.max(0, days - 1))
      return d.toISOString().slice(0, 10)
    } catch (e) {
      return startDate
    }
  }, [startDate, days])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Slot state
  const [activeTab, setActiveTab] = useState('upcoming')
  const [upcomingSlots, setUpcomingSlots] = useState([])
  const [expiredSlots, setExpiredSlots] = useState([])
  const [tabLoading, setTabLoading] = useState(false)
  const [viewingSlot, setViewingSlot] = useState(null)

  useEffect(() => {
    loadCenterData()
    loadSlotsByType('upcoming')
  }, [])

  const loadCenterData = async () => {
    try {
      const response = await centerService.getCenterById(centerId)
      setCenter(response.data || response)
    } catch (err) {
      setError('Failed to load center data')
      console.error(err)
    }
  }

  const loadSlotsByType = async (type) => {
    try {
      setTabLoading(true)
      const response = await slotService.getSlotsByType(centerId, type)
      const slotsData = response.data?.data || response.data || []
      const arr = Array.isArray(slotsData) ? slotsData : []
      if (type === 'upcoming') setUpcomingSlots(arr)
      else setExpiredSlots(arr)
    } catch (err) {
      setError(`Failed to load ${type} slots`)
      console.error(err)
    } finally {
      setTabLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    loadSlotsByType(tab)
  }

  const handleDeleteExpiredUnbooked = async (date) => {
    const msg = date
      ? `Delete all expired unbooked slots for ${date}?`
      : 'Delete ALL expired unbooked slots? This cannot be undone.'
    if (!confirm(msg)) return
    try {
      setTabLoading(true)
      const response = await slotService.deleteExpiredUnbookedSlots(centerId, date)
      const deletedCount = response?.data?.deletedCount ?? response?.deletedCount ?? 0
      alert(`Deleted ${deletedCount} expired unbooked slot(s).`)
      loadSlotsByType('expired')
    } catch (err) {
      alert('Failed to delete expired slots: ' + (err.response?.data?.message || err.message))
      console.error(err)
    } finally {
      setTabLoading(false)
    }
  }

  const handleDeleteUpcomingUnbooked = async (date) => {
    if (!date) return
    if (!confirm(`Delete all upcoming unbooked slots for ${date}?`)) return
    try {
      setTabLoading(true)
      const response = await slotService.deleteUpcomingUnbookedSlots(centerId, date)
      const data = response?.data || response
      const deleted = data.deletedCount ?? 0
      const failed = data.failed ?? []

      let msg = `Deleted ${deleted} upcoming unbooked slot(s).`
      if (failed.length > 0) {
        msg += '\nFailed to delete the following slots (booked or already past):\n'
        msg += failed.map(f => `${f.startTime} (${f.reason})`).join('\n')
      }

      alert(msg)
      loadSlotsByType('upcoming')
    } catch (err) {
      alert('Failed to delete upcoming slots: ' + (err.response?.data?.message || err.message))
      console.error(err)
    } finally {
      setTabLoading(false)
    }
  }

  async function generateSlots() {
    try {
      setLoading(true)
      await slotService.generateSlots({
        healthCenterId: centerId,
        startDateStr: startDate,
        numberOfDays: days,
        slotMinutes: slotMinutes,
      })
      setActiveTab('upcoming')
      loadSlotsByType('upcoming')
      alert('Slots created successfully')
    } catch (err) {
      setError('Failed to create slots: ' + (err.response?.data?.message || err.message))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this slot?')) return
    try {
      await slotService.deleteSlot(id)
      loadSlotsByType(activeTab)
    } catch (err) {
      alert('Failed to delete slot: ' + (err.response?.data?.message || err.message))
      console.error(err)
    }
  }

  async function toggleStatus(slot) {
    try {
      const newStatus = slot.status === 'AVAILABLE' ? 'CANCELLED' : 'AVAILABLE'
      await slotService.updateSlot(slot._id, { status: newStatus })
      loadSlotsByType(activeTab)
    } catch (err) {
      alert('Failed to update slot')
      console.error(err)
    }
  }

  const groupByDate = (slotsArr) => {
    const grouped = slotsArr.reduce((acc, s) => {
      const key = new Date(s.slotDate).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
      if (!acc[key]) acc[key] = []
      acc[key].push(s)
      return acc
    }, {})
    return Object.entries(grouped).sort((a, b) => new Date(a[0]) - new Date(b[0]))
  }

  const toISODate = (slotDate) => new Date(slotDate).toISOString().split('T')[0]

  const currentSlots = activeTab === 'upcoming' ? upcomingSlots : expiredSlots

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Slot Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {center && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900">Managing: {center.name}</h2>
          {center.location && <p className="text-sm text-blue-700 mt-1">{center.location}</p>}
        </div>
      )}

      <div className="card mb-6">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded-lg" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Number of Days (1-14)</label>
            <input type="number" min={1} max={14} value={days} onChange={e => setDays(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Slot Minutes</label>
            <input type="number" min={1} max={240} value={slotMinutes} onChange={e => setSlotMinutes(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-end mt-4">
          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input type="date" value={endDate} disabled className="w-full border p-2 rounded-lg bg-gray-50 disabled:opacity-80" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Opening Time</label>
            <input type="text" value={center?.openingTime || center?.openingHour || center?.openTime || '—'} disabled className="w-full border p-2 rounded-lg bg-gray-50 disabled:opacity-80" />
          </div>

          <div>
            <label className="text-sm text-gray-600">Closing Time</label>
            <input type="text" value={center?.closingTime || center?.closingHour || center?.closeTime || '—'} disabled className="w-full border p-2 rounded-lg bg-gray-50 disabled:opacity-80" />
          </div>
        </div>

        <div className="mt-4">
          <button onClick={generateSlots} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg shadow disabled:opacity-50">{loading ? 'Creating...' : 'Generate Slots'}</button>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b mb-4">
          <button onClick={() => handleTabChange('upcoming')} className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'upcoming' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Upcoming Slots
            {upcomingSlots.length > 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{upcomingSlots.length}</span>}
          </button>

          <button onClick={() => handleTabChange('expired')} className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'expired' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Expired Slots
            {expiredSlots.length > 0 && <span className="ml-2 text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">{expiredSlots.length}</span>}
          </button>
        </div>

        {activeTab === 'expired' && expiredSlots.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button onClick={() => handleDeleteExpiredUnbooked(null)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition">Delete All Expired Unbooked Slots</button>
          </div>
        )}

        {tabLoading ? (
          <div className="text-gray-500">Loading slots...</div>
        ) : currentSlots.length === 0 ? (
          <div className="text-sm text-gray-500">No {activeTab} slots found.</div>
        ) : (
          <div className="space-y-6">
            {groupByDate(currentSlots).map(([date, slotsForDate]) => {
              const isoDate = toISODate(slotsForDate[0].slotDate)
              return (
                <section key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-medium">{date}</h3>
                      {activeTab === 'expired' && <button onClick={() => handleDeleteExpiredUnbooked(isoDate)} className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition" title="Delete all unbooked expired slots for this date">Delete Unbooked for This Date</button>}
                      {activeTab === 'upcoming' && <button onClick={() => handleDeleteUpcomingUnbooked(isoDate)} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded hover:bg-yellow-100 transition" title="Delete all unbooked upcoming slots for this date">Delete Unbooked for This Date</button>}
                    </div>
                    <span className="text-sm text-gray-500">{slotsForDate.length} slot{slotsForDate.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {slotsForDate.map(s => {
                      const isAvailable = s.status === 'AVAILABLE'
                      const isBooked = s.status === 'BOOKED'
                      const statusBadgeClasses = isAvailable ? 'bg-green-100 text-green-800' : isBooked ? 'bg-blue-100 text-blue-800' : s.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                      const statusBadgeLabel = isAvailable ? 'Available' : isBooked ? 'Booked' : 'Cancelled'
                      return (
                        <div key={s._id} className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition ${activeTab === 'expired' ? 'border-red-100 bg-red-50/30' : ''}`}>
                          <div>
                            <div className="text-sm font-semibold">{s.startTime} — {s.endTime}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.center?.name || center?.name || 'Health Center'}</div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {activeTab === 'expired' && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">Expired</span>}
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClasses}`}>{statusBadgeLabel}</span>
                            {activeTab === 'upcoming' && !isBooked && <button onClick={() => toggleStatus(s)} title="Toggle status" className="p-2 rounded-md hover:bg-gray-100 text-slate-400 hover:text-blue-600"><ToggleRight size={16} strokeWidth={2} /></button>}
                            {isBooked && <button onClick={() => setViewingSlot(s)} title="View booking" className="p-2 rounded-md hover:bg-gray-100 text-slate-400 hover:text-blue-600"><Eye size={16} strokeWidth={2} /></button>}
                            {activeTab === 'upcoming' && <button onClick={() => handleDelete(s._id)} title="Delete slot" className="p-2 rounded-md hover:bg-gray-100 text-red-600 disabled:opacity-40" disabled={isBooked}><Trash2 size={16} strokeWidth={2} /></button>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>

      {/* Booking details modal */}
      {viewingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setViewingSlot(null)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6 z-10">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <button onClick={() => setViewingSlot(null)} className="text-sm text-gray-500">Close</button>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>Slot:</strong> {viewingSlot.startTime} — {viewingSlot.endTime} on {new Date(viewingSlot.slotDate).toLocaleDateString()}</div>
              <div><strong>Center:</strong> {viewingSlot.center?.name || center?.name}</div>
              <div><strong>Status:</strong> {viewingSlot.status}</div>
              <div><strong>Booked By:</strong> {viewingSlot.bookedBy?.name || viewingSlot.bookedBy?.fullName || viewingSlot.bookedBy?.email || (viewingSlot.bookedBy?._id ? viewingSlot.bookedBy._id : '—')}</div>
              <div><strong>Appointment ID:</strong> {viewingSlot.appoinment?._id || viewingSlot.appoinment || '—'}</div>
              <div><strong>Appointment Status:</strong> {viewingSlot.appoinment?.appointmentStatus || '—'}</div>
              <div><strong>Appointment Date:</strong> {viewingSlot.appoinment?.appointmentDate ? new Date(viewingSlot.appoinment.appointmentDate).toLocaleString() : '—'}</div>
              <div><strong>Diagnostic Test:</strong> {viewingSlot.appoinment?.diagnosticTest || '—'}</div>
            </div>
          </div>
        </div>
      )}
      )
    </>
  )
}
