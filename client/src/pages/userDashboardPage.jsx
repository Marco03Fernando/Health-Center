import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { appointmentService, diagnosticTestService, centerService, slotService } from '../services'

const statusColor = {
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}

export default function UserDashboardPage(){
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    loadAppointments()
  },[])

  const userId = "69a8f360f87581b07beb8c7d" // TODO: Get from auth context
  const loadAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentService.getAppointmentsByUser(userId)
      const appointmentsData = response.data || response
      setAppointments(appointmentsData)
    } catch (err) {
      setError('Failed to load appointments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading appointments...</div>
  }

  const total = appointments.length
  const upcoming = appointments.filter(b=>b.appointmentStatus==='CONFIRMED' || b.appointmentStatus==='PENDING').length
  const completed = appointments.filter(b=>b.appointmentStatus==='COMPLETED').length
  const cancelled = appointments.filter(b=>b.appointmentStatus==='CANCELLED').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">My Appointments</h1>
        <div>
          <button onClick={()=>navigate('/')} className="px-4 py-2 bg-primary text-white rounded-lg shadow flex items-center">
            <CalendarPlus size={16} strokeWidth={2} className="mr-2 text-slate-100" />
            New Booking
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card"><div className="text-sm text-gray-500">Total</div><div className="text-xl font-semibold">{total}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Upcoming</div><div className="text-xl font-semibold">{upcoming}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Completed</div><div className="text-xl font-semibold">{completed}</div></div>
        <div className="card"><div className="text-sm text-gray-500">Cancelled</div><div className="text-xl font-semibold">{cancelled}</div></div>
      </div>

      <div className="space-y-4">
        {appointments.map(apt=>{
          return (
            <div key={apt._id} className="card flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm ${statusColor[apt.appointmentStatus]||'bg-gray-100'}`}>
                    {apt.appointmentStatus?.toUpperCase()}
                  </div>
                  <div className="font-semibold text-gray-800">
                    {apt.diagnosticTest?.name || 'test name here'}
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  • {apt.slot?.slotDate ? new Date(apt.slot.slotDate).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Date TBD'}
                </div>
                
              </div>
              <div className="space-y-2">
                <Link to={`/booking/${apt._id}`} className="px-3 py-2 border rounded-lg hover:bg-primary/10">Details</Link>
              </div>
            </div>
          )
        })}
        {appointments.length===0 && <div className="text-gray-500">No appointments found.</div>}
      </div>
    </div>
  )
}
