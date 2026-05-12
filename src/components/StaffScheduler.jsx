import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkEntitlements } from '../lib/revenuecat';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function StaffScheduler({ selectedLocation, user }) {
  const [schedules, setSchedules] = useState([]);
  const [staff, setStaff] = useState([
    { id: 'staff1', name: 'Sakura Tanaka', role: 'Senior Stylist', avatar: '🌸' },
    { id: 'staff2', name: 'Yuki Sato', role: 'Color Specialist', avatar: '❄️' },
    { id: 'staff3', name: 'Mika Hayashi', role: 'Nail Artist', avatar: '💅' },
    { id: 'staff4', name: 'Rei Nakamura', role: 'Massage Therapist', avatar: '🌿' }
  ]);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    staffId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    location: selectedLocation,
    available: true
  });
  const [isPremium, setIsPremium] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  useEffect(() => {
    checkEntitlements().then(setIsPremium);
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'schedules'),
      where('locationId', '==', selectedLocation)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(schedulesData);
    });

    return () => unsubscribe();
  }, [selectedLocation, user]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!user || !newSchedule.staffId || !newSchedule.date) return;

    try {
      await addDoc(collection(db, 'schedules'), {
        ...newSchedule,
        date: new Date(newSchedule.date),
        locationId: selectedLocation,
        userId: user.uid,
        createdAt: new Date()
      });

      setNewSchedule({
        staffId: '',
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        location: selectedLocation,
        available: true
      });
      setShowScheduleForm(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const toggleAvailability = async (scheduleId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'schedules', scheduleId), {
        available: !currentStatus
      });
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const getScheduleForDay = (staffId, date) => {
    return schedules.find(schedule => 
      schedule.staffId === staffId && 
      isSameDay(schedule.date.toDate(), date)
    );
  };

  const getStaffWorkingToday = () => {
    const today = new Date();
    return staff.filter(member => {
      const schedule = getScheduleForDay(member.id, today);
      return schedule && schedule.available;
    });
  };

  return (
    <div className="staff-scheduler">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-pink/8 to-transparent pointer-events-none" />
      
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-pink/70 mb-2">Workforce Management</div>
          <h1 className="font-serif text-3xl font-light text-primary mb-2">スタッフシフト管理</h1>
          <p className="text-secondary text-lg font-light">Cross-location scheduling and availability tracking</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in-up animation-delay-150">
          <div className="bg-pink/4 border border-pink/18 rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-pink/70 mb-1">Active Staff</div>
            <div className="text-xl font-light text-primary">{staff.length}</div>
          </div>
          <div className="bg-coral/4 border border-coral/18 rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-coral/70 mb-1">Working Today</div>
            <div className="text-xl font-light text-primary">{getStaffWorkingToday().length}</div>
          </div>
          <div className="bg-pink/4 border border-pink/18 rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-pink/70 mb-1">Total Hours</div>
            <div className="text-xl font-light text-primary">{schedules.length * 8}</div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up animation-delay-300">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="pill-button bg-surface border border-hint/20 text-secondary hover:bg-surface-hover"
          >
            ← PREV WEEK
          </button>
          <div className="text-center">
            <h3 className="font-serif text-lg font-light text-primary">
              {format(currentWeek, 'MMM dd')} - {format(addDays(currentWeek, 6), 'MMM dd, yyyy')}
            </h3>
          </div>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="pill-button bg-surface border border-hint/20 text-secondary hover:bg-surface-hover"
          >
            NEXT WEEK →
          </button>
        </div>

        {/* Add Schedule Button */}
        <div className="mb-6 animate-fade-in-up animation-delay-450">
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="pill-button bg-pink/10 border border-pink/35 text-pink hover:bg-pink/18 hover:border-pink/60 transform hover:-translate-y-1"
          >
            + ADD SCHEDULE
          </button>
        </div>

        {/* Schedule Form */}
        {showScheduleForm && (
          <div className="bg-pink/4 border border-pink/18 rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="font-serif text-xl font-light text-primary mb-4">Add Staff Schedule</h3>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-2">Staff Member</label>
                  <select
                    value={newSchedule.staffId}
                    onChange={(e) => setNewSchedule({...newSchedule, staffId: e.target.value})}
                    className="w-full bg-pink/6 border border-pink/25 rounded-xl px-4 py-3 text-primary focus:border-pink/45 focus:bg-pink/8 transition-all"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Date</label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-pink/6 border border-pink/25 rounded-xl px-4 py-3 text-primary focus:border-pink/45 focus:bg-pink/8 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                    className="w-full bg-pink/6 border border-pink/25 rounded-xl px-4 py-3 text-primary focus:border-pink/45 focus:bg-pink/8 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">End Time</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                    className="w-full bg-pink/6 border border-pink/25 rounded-xl px-4 py-3 text-primary focus:border-pink/45 focus:bg-pink/8 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="pill-button bg-pink/15 border border-pink/40 text-pink hover:bg-pink/25 hover:border-pink/60"
                >
                  ADD SCHEDULE
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="pill-button bg-surface border border-hint/20 text-secondary hover:bg-surface-hover"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Grid */}
        <div className="schedule-grid bg-surface border border-hint/10 rounded-2xl overflow-hidden animate-fade-in-up animation-delay-600">
          <div className="grid grid-cols-8 bg-pink/3">
            <div className="p-4 border-b border-hint/10">
              <span className="font-mono text-xs uppercase tracking-wider text-pink/70">Staff</span>
            </div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="p-4 border-b border-l border-hint/10 text-center">
                <div className="font-mono text-xs uppercase tracking-wider text-secondary">
                  {format(day, 'EEE')}
                </div>
                <div className="text-sm text-primary mt-1">
                  {format(day, 'MMM dd')}
                </div>
              </div>
            ))}
          </div>

          {staff.map(member => (
            <div key={member.id} className="grid grid-cols-8 border-b border-hint/5 last:border-b-0">
              <div className="p-4 border-r border-hint/10">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{member.avatar}</span>
                  <div>
                    <div className="font-medium text-primary text-sm">{member.name}</div>
                    <div className="font-mono text-xs text-secondary uppercase tracking-wider">{member.role}</div>
                  </div>
                </div>
              </div>
              {weekDays.map(day => {
                const schedule = getScheduleForDay(member.id, day);
                return (
                  <div key={`${member.id}-${day.toISOString()}`} className="p-3 border-l border-hint/10">
                    {schedule ? (
                      <div 
                        className={`schedule-cell p-2 rounded-lg text-xs cursor-pointer transition-all ${
                          schedule.available 
                            ? 'bg-coral/10 border border-coral/20 text-coral hover:bg-coral/15' 
                            : 'bg-hint/5 border border-hint/10 text-hint'
                        }`}
                        onClick={() => toggleAvailability(schedule.id, schedule.available)}
                      >
                        <div className="font-mono text-[10px] uppercase tracking-wider mb-1">
                          {schedule.available ? 'AVAILABLE' : 'OFF'}
                        </div>
                        <div className="text-[10px]">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-hint/30 text-xs py-2">
                        —
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Staff List - Today's Working */}
        <div className="mt-8 animate-fade-in-up animation-delay-750">
          <div className="font-mono text-[10px] uppercase tracking-widest text-coral/70 mb-4">Working Today</div>
          {getStaffWorkingToday().length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <p>No staff scheduled for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {getStaffWorkingToday().map(member => {
                const schedule = getScheduleForDay(member.id, new Date());
                return (
                  <div key={member.id} className="staff-card relative overflow-hidden bg-coral/3 border border-coral/15 rounded-xl p-4">
                    <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-coral to-pink opacity-40" />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{member.avatar}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-primary">{member.name}</h4>
                        <p className="text-sm text-secondary mb-1">{member.role}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-coral rounded-full animate-pulse" />
                          <span className="font-mono text-xs text-coral">
                            {schedule?.startTime} - {schedule?.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Premium Feature Gate */}
        {!isPremium && (
          <div className="mt-8 bg-pink/4 border border-pink/18 rounded-2xl p-6 text-center animate-fade-in-up animation-delay-900">
            <h3 className="font-serif text-lg font-light text-primary mb-2">Advanced Scheduling Features</h3>
            <p className="text-secondary mb-4">Cross-location transfers, automatic shift optimization, and labor cost analytics</p>
            <button className="pill-button bg-pink/15 border border-pink/40 text-pink hover:bg-pink/25">
              UPGRADE TO PRO
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .staff-scheduler {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 24px;
          position: relative;
        }

        .pill-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 28px;
          border-radius: 40px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .schedule-grid {
          border: 1px solid rgba(245, 240, 250, 0.1);
        }

        .schedule-cell {
          min-height: 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .staff-card {
          transition: all 0.3s ease;
        }

        .staff-card:hover {
          transform: translateY(-2px);
          background: rgba(240, 122, 106, 0.05);
        }

        .text-primary { color: rgba(245, 240, 250, 0.92); }
        .text-secondary { color: rgba(245, 240, 250, 0.45); }
        .text-hint { color: rgba(245, 240, 250, 0.2); }

        .bg-pink\/3 { background: rgba(240, 196, 212, 0.03); }
        .bg-pink\/4 { background: rgba(240, 196, 212, 0.04); }
        .bg-pink\/5 { background: rgba(240, 196, 212, 0.05); }
        .bg-pink\/6 { background: rgba(240, 196, 212, 0.06); }
        .bg-pink\/8 { background: rgba(240, 196, 212, 0.08); }
        .bg-pink\/10 { background: rgba(240, 196, 212, 0.1); }
        .bg-pink\/15 { background: rgba(240, 196, 212, 0.15); }
        .bg-pink\/18 { background: rgba(240, 196, 212, 0.18); }
        .bg-pink\/25 { background: rgba(240, 196, 212, 0.25); }
        .border-pink\/15 { border-color: rgba(240, 196, 212, 0.15); }
        .border-pink\/18 { border-color: rgba(240, 196, 212, 0.18); }
        .border-pink\/20 { border-color: rgba(240, 196, 212, 0.2); }
        .border-pink\/25 { border-color: rgba(240, 196, 212, 0.25); }
        .border-pink\/35 { border-color: rgba(240, 196, 212, 0.35); }
        .border-pink\/40 { border-color: rgba(240, 196, 212, 0.4); }
        .border-pink\/45 { border-color: rgba(240, 196, 212, 0.45); }
        .border-pink\/60 { border-color: rgba(240, 196, 212, 0.6); }
        .text-pink { color: #f0c4d4; }
        .text-pink\/70 { color: rgba(240, 196, 212, 0.7); }

        .bg-coral\/3 { background: rgba(240, 122, 106, 0.03); }
        .bg-coral\/4 { background: rgba(240, 122, 106, 0.04); }
        .bg-coral\/5 { background: rgba(240, 122, 106, 0.05); }
        .bg-coral\/10 { background: rgba(240, 122, 106, 0.1); }
        .bg-coral\/15 { background: rgba(240, 122, 106, 0.15); }
        .border-coral\/15 { border-color: rgba(240, 122, 106, 0.15); }
        .border-coral\/18 { border-color: rgba(240, 122, 106, 0.18); }
        .border-coral\/20 { border-color: rgba(240, 122, 106, 0.2); }
        .text-coral { color: #f07a6a; }
        .text-coral\/70 { color: rgba(240, 122, 106, 0.7); }

        .bg-surface { background: rgba(255, 255, 255, 0.03); }
        .bg-surface-hover { background: rgba(255, 255, 255, 0.06); }
        .border-hint\/5 { border-color: rgba(245, 240, 250, 0.05); }
        .border-hint\/10 { border-color: rgba(245, 240, 250, 0.1); }
        .border-hint\/20 { border-color: rgba(245, 240, 250, 0.2); }
        .bg-hint\/5 { background: rgba(245, 240, 250, 0.05); }
        .text-hint\/30 { color: rgba(245, 240, 250, 0.15); }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease both;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease both;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        .animation-delay-150 { animation-delay: 0.15s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-450 { animation-delay: 0.45s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-750 { animation-delay: 0.75s; }
        .animation-delay-900 { animation-delay: 0.9s; }
      `}</style>
    </div>
  );
}