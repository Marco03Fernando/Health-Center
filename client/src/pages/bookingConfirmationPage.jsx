import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { appointmentService } from '../services'

export default function BookingConfirmationPage(){
  const { state } = useLocation()
  const bookingId = state?.bookingId
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      loadAppointment()
    }
  }, [bookingId])

  const loadAppointment = async () => {
    try {
      const response = await appointmentService.getAppointmentById(bookingId)
      setAppointment(response.data || response)
    } catch (err) {
      console.error('Failed to load appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (!appointment) return <div className="text-gray-500">No booking found.</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center p-8">
        <div className="text-primary text-4xl">✓</div>
        <h2 className="text-2xl font-semibold mt-2 text-gray-800">Booking Confirmed</h2>
        <p className="text-gray-600 mt-2">Your appointment has been confirmed.</p>

        <div className="mt-6 p-4 bg-white border rounded text-left">
          <div className="font-medium text-gray-800">Doctor: {appointment.doctorId?.name || 'TBD'}</div>
          <div className="text-sm text-gray-600">{appointment.centerId?.name || 'Center'} • {appointment.centerId?.address || 'Address'}</div>
          <div className="mt-2">{appointment.slotId?.date ? `${new Date(appointment.slotId.date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} • ${appointment.slotId.startTime} — ${appointment.slotId.endTime}` : 'Date TBD'}</div>
          <div className="text-xs text-gray-400 mt-2">Booking ID: {appointment._id}</div>
        </div>

        <div className="mt-6 flex justify-center space-x-3">
          <Link to="/user" className="px-4 py-2 bg-primary text-white rounded-lg shadow">View Booking</Link>
          <Link to="/" className="px-4 py-2 border rounded-lg">Book Again</Link>
        </div>
      </div>
    </div>
  )
}
