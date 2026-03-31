import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { appointmentService } from '../services'

// Helper to handle status badge colors
const getStatusStyles = (status) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function BookingDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadAppointment()
  }, [id])

  const loadAppointment = async () => {
    try {
      const response = await appointmentService.getAppointmentById(id)
      setAppointment(response.data || response)
    } catch (err) {
      console.error('Failed to load appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-gray-500 mb-4 text-lg">Appointment not found.</p>
        <button onClick={() => navigate('/user')} className="text-blue-600 hover:underline">
          Return to Dashboard
        </button>
      </div>
    )
  }

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return
    }

    try {
      setCancelling(true)
      const response = await appointmentService.cancelAppointment(appointment._id)
      
      if (response.success) {
        alert('Appointment cancelled successfully')
        navigate('/user')
      } else {
        throw new Error(response.message || 'Failed to cancel appointment')
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment. Please try again.')
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Back to Bookings
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Appointment Details</h2>
            <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-semibold">ID: {appointment._id}</p>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getStatusStyles(appointment.appointmentStatus?.toLowerCase())}`}>
            {appointment.appointmentStatus?.toUpperCase()}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Core Info */}
          <div className="space-y-6">
            <section>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Patient Email</label>
              <p className="text-lg font-medium text-gray-800">{appointment.user?.email || 'N/A'}</p>
            </section>

            <section>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Patient Phone</label>
              <p className="text-lg font-medium text-gray-800">{appointment.user?.phone || 'N/A'}</p>
            </section>

            <section>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnostic Test</label>
              <p className="text-lg font-semibold text-blue-600">{appointment.diagnosticTest?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">{appointment.diagnosticTest?.description || ''}</p>
            </section>

            <section>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Health Center</label>
              <p className="text-lg font-medium text-gray-800">{appointment.healthCenter?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{appointment.healthCenter?.address || ''}</p>
              <p className="text-sm text-gray-500">Phone: {appointment.healthCenter?.phone || 'N/A'}</p>
            </section>
          </div>

          {/* Right Column: Date/Time Focus Card */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col justify-center">
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-4">Appointment Schedule</label>
            <div className="flex items-start space-x-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 text-center min-w-[70px]">
                <span className="block text-xs font-bold text-blue-500 uppercase">
                  {appointment.slot?.slotDate ? new Date(appointment.slot.slotDate).toLocaleString('default', { month: 'short', timeZone: 'UTC' }) : '---'}
                </span>
                <span className="block text-2xl font-black text-gray-800">
                  {appointment.slot?.slotDate ? new Date(appointment.slot.slotDate).getUTCDate() : '--'}
                </span>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {appointment.slot?.slotDate ? new Date(appointment.slot.slotDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'UTC'
                  }) : 'Date not set'}
                </p>
                <div className="flex items-center mt-1 text-blue-600 font-medium">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {appointment.slot?.startTime ? `${appointment.slot.startTime} - ${appointment.slot.endTime}` : 'Time not assigned'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-4">
          {appointment.appointmentStatus?.toLowerCase() !== 'cancelled' && (
            <button 
              onClick={handleCancel}
              disabled={cancelling}
              className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
          )}
          <button 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95"
            onClick={() => window.print()}
          >
            Download Slip
          </button>
        </div>
      </div>
    </div>
  )
}