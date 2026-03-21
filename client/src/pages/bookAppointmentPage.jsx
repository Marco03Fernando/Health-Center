import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { diagnosticTestService, centerService, slotService, appointmentService } from '../services'

function Stepper({ steps, current }) {
  const total = steps.length
  const percent = total > 1 ? ((current - 1) / (total - 1)) * 100 : 0

  return (
    <div className="w-full py-2 md:py-3">
      <div className="relative mb-3">
        <div className="hidden md:block absolute left-0 right-0 top-5 h-1 bg-primary/10 rounded-full" />
        <div className="hidden md:block absolute left-0 top-5 h-1 bg-primary rounded-full" style={{ width: `${percent}%`, transition: 'width 260ms ease' }} />

        <div className="flex md:flex-row flex-col md:items-center gap-3 md:gap-6 justify-between">
          {steps.map((s, idx) => {
            const stepNum = idx + 1
            const completed = stepNum < current
            const active = stepNum === current
            return (
              <div key={s.label} className="flex-1 flex md:flex-col items-center md:items-center md:justify-center md:text-center px-1 md:px-0">
                <div className="relative flex items-center md:flex-col">
                  <button
                    type="button"
                    className={`flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-full transition-transform duration-150 ${completed ? 'bg-primary text-white' : active ? 'bg-white text-primary ring-4 ring-primary/20 shadow-md' : 'bg-white text-primary/60 border border-primary/30'} hover:scale-105`}
                  >
                    {completed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="font-medium md:text-sm">{stepNum}</span>
                    )}
                  </button>
                  <div className="ml-2 md:ml-0 md:mt-2">
                    <div className={`${active ? 'text-primary font-semibold' : completed ? 'text-gray-700 font-medium' : 'text-primary/60 text-sm'} transition-colors duration-150`}>{s.label}</div>
                    {s.subtitle && <div className="text-xs text-primary/50">{s.subtitle}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MiniCalendar({ slots, onSelectDate }) {
  const [month, setMonth] = useState(new Date())
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const days = [...Array(new Date(month.getFullYear(), month.getMonth()+1,0).getDate()).keys()].map(d=>d+1)

  // Helper to get date string in YYYY-MM-DD format from UTC date
  const getUTCDateString = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }

  const availableDates = new Set(
    slots.filter(s => s.status === 'AVAILABLE').map(s => getUTCDateString(s.slotDate))
  )

  // Helper to convert local date to YYYY-MM-DD
  const localDateToString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-soft">
      <div className="flex justify-between items-center mb-3">
        <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1,1))} className="px-3 py-1 rounded hover:bg-gray-100 text-slate-400 hover:text-blue-600">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <div className="font-semibold text-sm">{month.toLocaleString(undefined,{month:'long', year:'numeric'})}</div>
        <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1,1))} className="px-3 py-1 rounded hover:bg-gray-100 text-slate-400 hover:text-blue-600">
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-sm">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="text-center text-xs text-gray-500">{d}</div>)}
        {Array(start.getDay()).fill(0).map((_,i)=><div key={'pad'+i}></div>)}
        {days.map(d=>{
          const dt = new Date(month.getFullYear(), month.getMonth(), d)
          const ds = localDateToString(dt)
          const isAvail = availableDates.has(ds)
          const past = dt < new Date(new Date().setHours(0,0,0,0))
          return (
            <button key={d} disabled={past || !isAvail} onClick={()=>onSelectDate(dt)} className={`h-10 rounded-lg transition ${past? 'text-gray-300':'hover:bg-primary/10'} ${isAvail? 'bg-white':'bg-gray-100 text-gray-400'}`}>
              <div className="text-center">{d}</div>
              {isAvail && <div className="w-1 h-1 bg-primary rounded-full mx-auto mt-1" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BookAppointmentPage(){
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState([])
  const [centers, setCenters] = useState([])
  const [slots, setSlots] = useState([])

  const [step, setStep] = useState(1)
  const [selectedTest, setSelectedTest] = useState(null)
  const [selectedCenter, setSelectedCenter] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [testsData, centersData] = await Promise.all([
          diagnosticTestService.getAllTests(),
          centerService.getAllCenters()
        ])

        console.log('Fetched Tests:', testsData)
        
        setTests(testsData.data || testsData || [])
        setCenters(centersData.data || centersData || [])
        
        // Set default test selection only
        if (testsData?.data?.length > 0 || testsData?.length > 0) {
          setSelectedTest((testsData.data || testsData)[0]?._id || null)
        }
        // Don't auto-select center - let user choose
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Fetch slots when center is selected
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedCenter) {
        setSlots([])
        return
      }
      
      // Reset date and slot when center changes
      setSelectedDate(null)
      setSelectedSlot(null)
      
      try {
        console.log('Fetching slots for center:', selectedCenter)
        const slotsData = await slotService.getAvailableSlotsByCenter(selectedCenter)
        console.log('Fetched Slots:', slotsData)
        setSlots(slotsData.availableSlots || slotsData.data || slotsData || [])
      } catch (error) {
        console.error('Error fetching slots:', error)
        setSlots([])
      }
    }
    
    fetchSlots()
  }, [selectedCenter])

  async function handleConfirm() {
    try {
      const appointmentData = {
        slotId: selectedSlot,
        diagnosticTestId: selectedTest,
        healthCenter: selectedCenter,
        userId: '69a8f360f87581b07beb8c7d',
      }
      
      const booking = await appointmentService.bookAppointment(appointmentData)
      
      // Refresh slots for the selected center
      if (selectedCenter) {
        const slotsData = await slotService.getAvailableSlotsByCenter(selectedCenter)
        setSlots(slotsData.availableSlots || slotsData.data || slotsData || [])
      }
      
      navigate('/confirm', { state: { bookingId: booking.booking._id || booking.booking.data?._id } })
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  // Helper to get UTC date string in YYYY-MM-DD format
  const getUTCDateString = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }

  // Helper to convert local date to YYYY-MM-DD
  const localDateToString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const availableForDate = selectedDate 
    ? slots.filter(s => {
        return s.center === selectedCenter && 
               getUTCDateString(s.slotDate) === localDateToString(selectedDate) && 
               s.status === 'AVAILABLE'
      })
    : []

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

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-800">Book Appointment</h1>
        </div>
        <div className="mt-10">
          <Stepper
            steps={[{ label: 'Test' }, { label: 'Center' }, { label: 'Slot' }, { label: 'Confirm' }]}
            current={step}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {step===1 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3">Select Test</h2>
              <div className="space-y-3">
                {tests.map(t=> (
                  <label key={t._id} className="flex items-start p-3 border rounded-lg hover:shadow-sm transition">
                    <input type="radio" name="test" checked={selectedTest===t._id} onChange={()=>setSelectedTest(t._id)} className="mr-3 mt-1" />
                    <div className="flex flex-col space-y-2">
                      <div className="font-medium text-gray-800">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.description}</div>
                      <div className="text-sm text-primary/60 font-sans italic">
                        <span className="font-semibold mr-1">Prep:</span>
                        {t.instructions}
                      </div>
                    </div>
                  </label>
                ))}
                <div className="flex justify-end mt-4">
                  <button onClick={()=>setStep(2)} className="px-5 py-2.5 bg-primary text-white rounded-lg shadow hover:opacity-95 transition text-sm">Next</button>
                </div>
              </div>
            </div>
          )}

          {step===2 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3">Select Center</h2>
              <div className="space-y-3">
                {centers.map(c=> (
                  <label key={c._id} className="flex items-start p-3 border rounded-lg hover:shadow-sm transition">
                    <input type="radio" name="center" checked={selectedCenter===c._id} onChange={()=>setSelectedCenter(c._id)} className="mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-800">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.address}</div>
                    </div>
                  </label>
                ))}
                <div className="flex justify-between mt-4">
                  <button onClick={()=>setStep(1)} className="px-5 py-2.5 border rounded-lg text-sm">Back</button>
                  <button 
                    disabled={!selectedCenter} 
                    onClick={()=>setStep(3)} 
                    className="px-5 py-2.5 bg-primary text-white rounded-lg shadow hover:opacity-95 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {step===3 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3">Choose Slot</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <MiniCalendar slots={slots.filter(s=>s.center===selectedCenter)} onSelectDate={(d)=>{setSelectedDate(d); setSelectedSlot(null)}} />
                <div>
                  <h3 className="font-medium mb-2">Available Slots on {selectedDate ? selectedDate.toDateString() : '—'}</h3>
                  <div className="space-y-2">
                    {availableForDate.length===0 && <div className="text-sm text-gray-500">Select a date with availability.</div>}
                    {availableForDate.map(s=> (
                      <div key={s._id} className={`p-3 border rounded-lg flex justify-between items-center transition ${selectedSlot===s._id? 'ring-2 ring-primary/40 bg-primary/5':''}`}>
                        <div>
                          <div className="font-medium">{s.startTime} — {s.endTime}</div>
                          <div className="text-sm text-gray-500">{s.status}</div>
                        </div>
                        <div>
                          <button onClick={()=>setSelectedSlot(s._id)} className="px-3 py-1 border rounded-lg bg-white hover:bg-primary/5 transition">Select</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={()=>setStep(2)} className="px-5 py-2.5 border rounded-lg text-sm">Back</button>
                    <button disabled={!selectedSlot} onClick={()=>setStep(4)} className="px-5 py-2.5 bg-primary text-white rounded-lg shadow disabled:opacity-50 text-sm">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step===4 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3">Confirm Booking</h2>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="space-y-2 max-w-xl mx-auto text-center">
                  <div className="text-xs text-gray-500">Test</div>
                  <div className="font-medium text-sm">{tests.find(t=>t._id===selectedTest)?.name}</div>
                  <div className="text-xs text-gray-500">Center</div>
                  <div className="font-medium text-sm">{centers.find(c=>c._id===selectedCenter)?.name}</div>
                  <div className="text-xs text-gray-500">Date & Time</div>
                  <div className="font-medium text-sm">{selectedDate?.toDateString()} • {slots.find(s=>s._id===selectedSlot)?.startTime}</div>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={()=>setStep(3)} className="px-4 py-2 border rounded-lg">Edit</button>
                <button onClick={handleConfirm} className="px-4 py-2 bg-primary text-white rounded-lg shadow">Confirm</button>
              </div>
            </div>
          )}
        </div>

        <aside className="md:col-span-1">
          <div className="bg-white p-3 rounded-sm shadow-sm text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold mb-1 text-sm">Summary</h3>
              <button onClick={()=>setStep(Math.max(1, step-1))} className="text-xs text-primary hover:underline">Edit</button>
            </div>
            <div className="space-y-1 mt-2 text-xs text-gray-600">
              <div><span className="text-gray-400">Test: </span><span className="font-medium text-gray-800">{tests.find(t=>t._id===selectedTest)?.name || '—'}</span></div>
              <div><span className="text-gray-400">Center: </span><span className="font-medium text-gray-800">{centers.find(c=>c._id===selectedCenter)?.name || '—'}</span></div>
              <div><span className="text-gray-400">Date: </span><span className="font-medium text-gray-800">{selectedDate? selectedDate.toDateString() : '—'}</span></div>
              <div><span className="text-gray-400">Slot: </span><span className="font-medium text-gray-800">{slots.find(s=>s._id===selectedSlot)? `${slots.find(s=>s._id===selectedSlot).startTime}` : '—'}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
