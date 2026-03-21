import React, { useEffect, useState } from 'react'
import { centerService, appointmentService } from '../services'

// Stronger, more visible styles for status pills and dots
const statusStyles = {
  CONFIRMED: { pill: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600' },
  CANCELLED: { pill: 'bg-rose-100 text-rose-800', dot: 'bg-rose-600' },
  PENDING: { pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-600' },
  COMPLETED: { pill: 'bg-sky-100 text-sky-800', dot: 'bg-sky-600' },
}

export default function BookingManagementPage() {
  const centerId = '6994a9e70baa9daea43599d1'

  const [center, setCenter] = useState(null)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  useEffect(() => {
    loadCenterData()
    loadBookings()
  }, [])

  const loadCenterData = async () => {
    try {
      const response = await centerService.getCenterById(centerId)
      setCenter(response.data || response)
    } catch (err) {
      console.error('Failed to load center data', err)
    }
  }

  const loadBookings = async (params = {}) => {
    try {
      setBookingsLoading(true)
      const response = await appointmentService.getCenterAppointments(centerId, params)
      const data = response.data?.data || response.data || response
      setBookings(Array.isArray(data) ? data : (data || []))
    } catch (err) {
      console.error('Failed to load bookings', err)
      setBookings([])
    } finally {
      setBookingsLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (booking, status) => {
    // If admin is changing from CONFIRMED -> CANCELLED, warn that an email will be sent
    const current = (booking.appointmentStatus || '').toUpperCase();
    if (status === 'CANCELLED' && current === 'CONFIRMED') {
      const ok = confirm('Are you sure? An email will be sent to the person who created the booking informing them of the cancellation.');
      if (!ok) return
    } else {
      if (!confirm(`Change status to ${status}?`)) return
    }

    try {
      await appointmentService.updateAppointment(booking._id, { status })
      alert('Booking updated')
      loadBookings()
    } catch (err) {
      console.error('Failed to update booking', err)
      alert('Failed to update booking')
    }
  }

  // Custom in-file popover select state (no new files)
  const [openStatusFor, setOpenStatusFor] = useState(null)
  const popoverRef = React.useRef(null)

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!popoverRef.current) return
      if (!popoverRef.current.contains(e.target)) setOpenStatusFor(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Booking Management</h1>
      </div>

      {center && (
        <div className="card mb-4">
          <h2 className="text-lg font-semibold">Managing: {center.name}</h2>
          {center.location && <p className="text-sm text-gray-500 mt-1">{center.location}</p>}
        </div>
      )}

      {bookingsLoading ? (
        <div className="text-gray-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-sm text-gray-500">No bookings found.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            bookings.reduce((acc, b) => {
              const dt = new Date(b.appointmentDate || b.slot?.slotDate || Date.now())
              const key = dt.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
              if (!acc[key]) acc[key] = []
              acc[key].push(b)
              return acc
            }, {})
          ).map(([date, bookingsForDate]) => (
            <section key={date}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">{date}</h3>
                <span className="text-sm text-gray-500">{bookingsForDate.length} booking{bookingsForDate.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3">
                {bookingsForDate.map(b => (
                  <div key={b._id} className="card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm font-semibold">{b.slot?.startTime || '—'} — {b.slot?.endTime || '—'}</div>
                        <div className="text-xs text-gray-600">{b.user?.name || b.user?.email || 'Patient'}</div>
                        <div className="text-xs text-gray-500">ID: {b._id}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {(() => {
                        const current = (b.appointmentStatus || '').toUpperCase() || 'PENDING'
                        // Determine available options depending on current status
                        let options = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
                        if (current === 'CONFIRMED') options = ['COMPLETED', 'CANCELLED']
                        if (current === 'CANCELLED') options = [] // disabled

                        const disabled = options.length === 0

                        return (
                          <div className="relative" ref={openStatusFor === b._id ? popoverRef : null}>
                            <button
                              type="button"
                              onClick={() => { if (!disabled) setOpenStatusFor(openStatusFor === b._id ? null : b._id) }}
                              disabled={disabled}
                              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${statusStyles[current] ? statusStyles[current].pill : 'bg-gray-50 text-gray-700'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className={`inline-block w-2 h-2 rounded-full ${statusStyles[current] ? statusStyles[current].dot : 'bg-gray-500'}`} />
                              <span className="truncate">{current}</span>
                              {!disabled && (
                                <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>

                            {openStatusFor === b._id && !disabled && (
                              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-100 rounded-lg shadow-lg z-50">
                                <ul className="max-h-56 overflow-auto" role="listbox">
                                  {options.map(s => (
                                    <li
                                      key={s}
                                      role="option"
                                      onClick={() => { setOpenStatusFor(null); handleUpdateBookingStatus(b, s) }}
                                      className={`cursor-pointer px-3 py-2 text-sm ${s === current ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className={`inline-block w-2 h-2 rounded-full ${statusStyles[s] ? statusStyles[s].dot : 'bg-gray-500'}`} />
                                        <span>{s}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
