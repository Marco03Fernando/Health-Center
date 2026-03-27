import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { centerService, slotService, appointmentService } from '../services'
import { MapPin, Clock, Activity, Settings, Bell, Calendar, Users, CheckCircle, ChevronRight } from 'lucide-react'

export default function HealthcareCenterAdminDashboardPage() {
  // TODO: replace with session-provided center id
  const centerId = '6994a9e70baa9daea43599d1'
  const navigate = useNavigate()

  const [center, setCenter] = useState(null)
  const [slotSummary, setSlotSummary] = useState({ today: 0, upcoming: 0 })
  const [bookingSummary, setBookingSummary] = useState({ pending: 0 })
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [nextArrival, setNextArrival] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    setLoading(true)
    try {
      const cRes = await centerService.getCenterById(centerId)
      setCenter(cRes.data || cRes)

      // Slots: fetch upcoming and derive today's count
      const sRes = await slotService.getSlotsByType(centerId, 'upcoming')
      const slotsRaw = (sRes.data?.data || sRes.data || sRes) || []
      const arr = Array.isArray(slotsRaw) ? slotsRaw : []
      setSlots(arr)
      const todayISO = new Date().toISOString().slice(0, 10)
      const todayCount = arr.filter(s => (new Date(s.slotDate).toISOString().slice(0, 10)) === todayISO).length
      setSlotSummary({ today: todayCount, upcoming: arr.length })

      // Bookings: fetch and count pending (not confirmed/completed/cancelled)
      const bRes = await appointmentService.getCenterAppointments(centerId)
      const bookingsRaw = (bRes.data?.data || bRes.data || bRes) || []
      const bArr = Array.isArray(bookingsRaw) ? bookingsRaw : []
      setBookings(bArr)
      const pending = bArr.filter(b => !['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(b.appointmentStatus)).length
      setBookingSummary({ pending })

      // compute next arrival (closest upcoming appointment)
      const now = Date.now()

      const parseBookingDateTime = (b) => {
        const slotDateStr = b.appointmentDate || b.slot?.slotDate
        const startTimeStr = (b.slot?.startTime || b.startTime || '').toString().trim()
        if (!slotDateStr) return null

        // If slotDateStr already contains time (ISO), prefer to extract the date
        // part and combine with startTime (if provided), treating everything as UTC.
        const dateOnly = slotDateStr.includes('T') ? slotDateStr.split('T')[0] : slotDateStr
        if (slotDateStr.includes('T') && !startTimeStr) {
          // no separate startTime provided — parse ISO and return as UTC
          const iso = slotDateStr.endsWith('Z') ? slotDateStr : `${slotDateStr}Z`
          const d = new Date(iso)
          if (!isNaN(d)) return d
        }
        const base = new Date(`${dateOnly}T00:00:00Z`)
        if (isNaN(base)) {
          const tryParse = new Date(slotDateStr)
          if (!isNaN(tryParse)) return tryParse
          return null
        }

        if (!startTimeStr) return base

        // 24-hour format HH:mm or HH:mm:ss
        const m24 = startTimeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
        if (m24) {
          const hh = parseInt(m24[1], 10)
          const mm = parseInt(m24[2], 10)
          const ss = m24[3] ? parseInt(m24[3], 10) : 0
          const parts = dateOnly.split('-')
          const y = parseInt(parts[0], 10)
          const mo = parseInt(parts[1], 10) - 1
          const d = parseInt(parts[2], 10)
          return new Date(Date.UTC(y, mo, d, hh, mm, ss))
        }

        // 12-hour format with AM/PM
        const m12 = startTimeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
        if (m12) {
          let hh = parseInt(m12[1], 10)
          const mm = parseInt(m12[2], 10)
          const ap = m12[3].toUpperCase()
          if (ap === 'PM' && hh < 12) hh += 12
          if (ap === 'AM' && hh === 12) hh = 0
          const parts = dateOnly.split('-')
          const y = parseInt(parts[0], 10)
          const mo = parseInt(parts[1], 10) - 1
          const d = parseInt(parts[2], 10)
          return new Date(Date.UTC(y, mo, d, hh, mm, 0))
        }

        // Fallback: try combined ISO-like string with Z (UTC)
        const combinedIso = `${dateOnly}T${startTimeStr}Z`
        const combined = new Date(combinedIso)
        if (!isNaN(combined)) return combined

        return null
      }

      const upcomingAppointments = bArr
        .map(b => {
          const dt = parseBookingDateTime(b)
          if (!dt) return null
          return { booking: b, time: dt }
        })
        .filter(x => x && x.time && x.time.getTime() >= now)
        .sort((a, b) => a.time.getTime() - b.time.getTime())

      setNextArrival(upcomingAppointments.length > 0 ? upcomingAppointments[0] : null)
    } catch (err) {
      console.error('Overview load failed', err)
    } finally {
      setLoading(false)
    }
  }
  
  // compute capacity percentage for today
  const totalTodaySlots = slots.filter(s => (new Date(s.slotDate).toISOString().slice(0,10)) === (new Date().toISOString().slice(0,10))).length
  const bookedToday = bookings.filter(b => {
    const slotDate = b.appointmentDate || b.slot?.slotDate
    return slotDate && (new Date(slotDate).toISOString().slice(0,10)) === (new Date().toISOString().slice(0,10))
  }).length
  const capacityPct = totalTodaySlots > 0 ? Math.round((bookedToday / totalTodaySlots) * 100) : 0

  return (
  <div className="max-w-5xl mx-auto p-4">
    {loading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <div className="text-teal-700 font-medium">Loading dashboard...</div>
        </div>
      </div>
    )}
    {/* 1. Header with Status */}
    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
      <div className="text-left">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">{center?.name || 'Loading...'}</h1>
          {center?.isActive && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
          <span className="flex items-center gap-1"><MapPin size={14}/> {center?.district}, {center?.address}</span>
          <span className="flex items-center gap-1"><Clock size={14}/> {center?.openingTime} - {center?.closingTime}</span>
        </div>
        
      </div>
      
      {/* Quick Settings Icon */}
      <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition">
        <Settings size={20} />
      </button>
    </div>

    {/* 2. Main Action Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 items-stretch">
      {/* Slot Card */}
      <div className="group relative overflow-hidden rounded-3xl p-6 bg-teal-50 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:bg-gradient-to-br hover:from-teal-50 hover:to-teal-100 flex flex-col justify-between h-full min-h-[220px]">
        <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition transform rotate-3 pointer-events-none">
          <Calendar size={64} className="text-teal-800" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-teal-600">Slot Management</h3>
        <p className="mt-4 text-4xl font-extrabold text-gray-900">{slotSummary.today}</p>
        <p className="text-gray-500">Slots scheduled for today</p>
        <div className="mt-6">
          <div className="text-xs text-gray-400">Capacity</div>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-2 overflow-hidden">
            <div className="h-3 bg-teal-600 rounded-full transition-all" style={{ width: `${capacityPct}%` }} />
          </div>
          <div className="text-sm text-teal-700 font-semibold mt-2">{capacityPct}% booked ({bookedToday}/{totalTodaySlots || 0})</div>
        </div>
        <div className="mt-6">
          <button 
            onClick={() => navigate('/admin/slots')}
            className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition shadow-sm flex items-center justify-center gap-2"
          >
            Manage Schedule
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Booking Card */}
      <div className="group relative overflow-hidden rounded-3xl p-6 bg-teal-50 border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:bg-gradient-to-br hover:from-teal-50 hover:to-teal-100 flex flex-col justify-between h-full min-h-[220px]">
        <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition transform rotate-3 pointer-events-none">
          <Users size={64} className="text-teal-800" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-teal-600">Patient Bookings</h3>
        <p className="mt-4 text-4xl font-extrabold text-gray-900">{bookingSummary.pending}</p>
        <p className="text-gray-500">Pending approvals</p>
        <div className="mt-6 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-500" />
          <div className="text-sm text-gray-700">Next Arrival</div>
          <div className="ml-auto text-sm text-gray-500">{nextArrival ? `${nextArrival.booking.user?.name || 'Patient'} — ${new Date(nextArrival.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', timeZone: 'UTC'})}` : 'No upcoming'}</div>
        </div>
        <div className="mt-6">
          <button 
            onClick={() => navigate('/admin/bookings')}
            className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition shadow-sm flex items-center justify-center gap-2"
          >
            Review Bookings
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>

    {/* 3. The "Empty Space Filler": Recent Activity / Agenda */}
    <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2">
          <Activity size={18} className="text-emerald-500"/>
          Daily Overview
        </h4>
        <span className="text-xs text-gray-400 font-medium">Last updated: Just now</span>
      </div>
      
      {/* Simplified Agenda List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
          <span className="text-sm font-medium text-gray-600">Total Upcoming Slots</span>
          <span className="font-bold text-gray-900">{slotSummary.upcoming}</span>
        </div>
        {/* You can map actual recent bookings here */}
        <p className="text-center text-xs text-gray-400 py-2">
          No urgent notifications at this time.
        </p>
      </div>
    </div>
  </div>
)
}

