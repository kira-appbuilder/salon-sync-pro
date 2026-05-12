import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkEntitlements } from '../lib/revenuecat';
import { format, addDays, startOfDay } from 'date-fns';

export default function BookingManager({ selectedLocation, user }) {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    service: '',
    date: '',
    time: '',
    staff: '',
    location: selectedLocation
  });
  const [services] = useState([
    'カット & スタイリング',
    'カラーリング',
    'パーマ・縮毛矯正',
    'フェイシャルトリートメント',
    'ネイルケア',
    'マッサージ'
  ]);
  const [staff] = useState([
    'Sakura Tanaka',
    'Yuki Sato',
    'Mika Hayashi',
    'Rei Nakamura'
  ]);
  const [isPremium, setIsPremium] = useState(false);
  const [showNewBookingForm, setShowNewBookingForm] = useState(false);

  useEffect(() => {
    checkEntitlements().then(setIsPremium);
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('locationId', '==', selectedLocation),
      orderBy('dateTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    });

    return () => unsubscribe();
  }, [selectedLocation, user]);

  const handleAddBooking = async (e) => {
    e.preventDefault();
    if (!user || !newBooking.customerName || !newBooking.service) return;

    try {
      const dateTime = new Date(`${newBooking.date}T${newBooking.time}`);
      
      await addDoc(collection(db, 'bookings'), {
        ...newBooking,
        dateTime,
        locationId: selectedLocation,
        userId: user.uid,
        status: 'confirmed',
        createdAt: new Date()
      });

      setNewBooking({
        customerName: '',
        service: '',
        date: '',
        time: '',
        staff: '',
        location: selectedLocation
      });
      setShowNewBookingForm(false);
    } catch (error) {
      console.error('Error adding booking:', error);
    }
  };

  const todayBookings = bookings.filter(booking => 
    startOfDay(booking.dateTime.toDate()).getTime() === startOfDay(new Date()).getTime()
  );

  const upcomingBookings = bookings.filter(booking => 
    booking.dateTime.toDate() > new Date()
  );

  return (
    <div className="booking-manager">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-coral/8 to-transparent pointer-events-none" />
      
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-coral/70 mb-2">Booking Central</div>
          <h1 className="font-serif text-3xl font-light text-primary mb-2">予約管理システム</h1>
          <p className="text-secondary text-lg font-light">Seamless appointment coordination across all locations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in-up animation-delay-150">
          <div className="bg-coral/4 border border-coral/18 rounded-2xl p-6">
            <div className="font-mono text-[10px] uppercase tracking-wider text-coral/70 mb-1">Today</div>
            <div className="text-2xl font-light text-primary">{todayBookings.length}</div>
            <div className="text-sm text-secondary">appointments</div>
          </div>
          <div className="bg-pink/4 border border-pink/18 rounded-2xl p-6">
            <div className="font-mono text-[10px] uppercase tracking-wider text-pink/70 mb-1">Upcoming</div>
            <div className="text-2xl font-light text-primary">{upcomingBookings.length}</div>
            <div className="text-sm text-secondary">this week</div>
          </div>
        </div>

        {/* Add New Booking Button */}
        <div className="mb-8 animate-fade-in-up animation-delay-300">
          <button
            onClick={() => setShowNewBookingForm(!showNewBookingForm)}
            className="pill-button bg-coral/10 border border-coral/35 text-coral hover:bg-coral/18 hover:border-coral/60 transform hover:-translate-y-1 active:scale-98"
          >
            + NEW BOOKING
          </button>
        </div>

        {/* New Booking Form */}
        {showNewBookingForm && (
          <div className="bg-coral/4 border border-coral/18 rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="font-serif text-xl font-light text-primary mb-4">New Appointment</h3>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking({...newBooking, customerName: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Service</label>
                  <select
                    value={newBooking.service}
                    onChange={(e) => setNewBooking({...newBooking, service: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                    required
                  >
                    <option value="">Select service</option>
                    {services.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-2">Date</label>
                  <input
                    type="date"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Time</label>
                  <input
                    type="time"
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Stylist</label>
                  <select
                    value={newBooking.staff}
                    onChange={(e) => setNewBooking({...newBooking, staff: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                  >
                    <option value="">Any available</option>
                    {staff.map(stylist => (
                      <option key={stylist} value={stylist}>{stylist}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="pill-button bg-coral/15 border border-coral/40 text-coral hover:bg-coral/25 hover:border-coral/60"
                >
                  CONFIRM BOOKING
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewBookingForm(false)}
                  className="pill-button bg-surface border border-hint/20 text-secondary hover:bg-surface-hover"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Today's Bookings */}
        {todayBookings.length > 0 && (
          <div className="mb-8 animate-fade-in-up animation-delay-450">
            <div className="flex items-center gap-4 mb-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-coral/70">Today's Schedule</div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-coral/25 to-transparent" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-coral rounded-full animate-pulse" />
                <span className="text-xs text-secondary">Live updates</span>
              </div>
            </div>
            <div className="space-y-3">
              {todayBookings.map((booking, index) => (
                <div key={booking.id} className="booking-card relative overflow-hidden bg-coral/3 border border-coral/15 rounded-xl p-4 hover:bg-coral/5 transition-all group">
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-coral to-pink opacity-40" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary mb-1">{booking.customerName}</h4>
                      <p className="text-sm text-secondary mb-2">{booking.service}</p>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-coral">{format(booking.dateTime.toDate(), 'HH:mm')}</span>
                        {booking.staff && (
                          <span className="text-xs text-secondary">{booking.staff}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="status-badge bg-coral/6 border border-coral/15 text-coral/70">
                        {booking.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Bookings */}
        <div className="animate-fade-in-up animation-delay-600">
          <div className="font-mono text-[10px] uppercase tracking-widest text-pink/70 mb-4">Upcoming Appointments</div>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-secondary">
              <p>No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 10).map((booking, index) => (
                <div key={booking.id} className="booking-card relative overflow-hidden bg-pink/3 border border-pink/15 rounded-xl p-4 hover:bg-pink/5 transition-all group">
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-pink to-coral opacity-40" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary mb-1">{booking.customerName}</h4>
                      <p className="text-sm text-secondary mb-2">{booking.service}</p>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-pink">{format(booking.dateTime.toDate(), 'MMM dd, HH:mm')}</span>
                        {booking.staff && (
                          <span className="text-xs text-secondary">{booking.staff}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="status-badge bg-pink/6 border border-pink/15 text-pink/70">
                        {booking.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Premium Feature Gate */}
        {!isPremium && (
          <div className="mt-8 bg-coral/4 border border-coral/18 rounded-2xl p-6 text-center animate-fade-in-up animation-delay-750">
            <h3 className="font-serif text-lg font-light text-primary mb-2">Advanced Booking Features</h3>
            <p className="text-secondary mb-4">Cross-location booking, automated reminders, and analytics</p>
            <button className="pill-button bg-coral/15 border border-coral/40 text-coral hover:bg-coral/25">
              UPGRADE TO PRO
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .booking-manager {
          max-width: 640px;
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

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 40px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
        }

        .text-primary { color: rgba(245, 240, 250, 0.92); }
        .text-secondary { color: rgba(245, 240, 250, 0.45); }
        .text-hint { color: rgba(245, 240, 250, 0.2); }

        .bg-coral\/4 { background: rgba(240, 122, 106, 0.04); }
        .bg-coral\/6 { background: rgba(240, 122, 106, 0.06); }
        .bg-coral\/8 { background: rgba(240, 122, 106, 0.08); }
        .bg-coral\/10 { background: rgba(240, 122, 106, 0.1); }
        .bg-coral\/15 { background: rgba(240, 122, 106, 0.15); }
        .border-coral\/15 { border-color: rgba(240, 122, 106, 0.15); }
        .border-coral\/18 { border-color: rgba(240, 122, 106, 0.18); }
        .border-coral\/25 { border-color: rgba(240, 122, 106, 0.25); }
        .border-coral\/35 { border-color: rgba(240, 122, 106, 0.35); }
        .border-coral\/40 { border-color: rgba(240, 122, 106, 0.4); }
        .border-coral\/45 { border-color: rgba(240, 122, 106, 0.45); }
        .border-coral\/60 { border-color: rgba(240, 122, 106, 0.6); }
        .text-coral { color: #f07a6a; }
        .text-coral\/70 { color: rgba(240, 122, 106, 0.7); }

        .bg-pink\/3 { background: rgba(240, 196, 212, 0.03); }
        .bg-pink\/4 { background: rgba(240, 196, 212, 0.04); }
        .bg-pink\/5 { background: rgba(240, 196, 212, 0.05); }
        .bg-pink\/6 { background: rgba(240, 196, 212, 0.06); }
        .border-pink\/15 { border-color: rgba(240, 196, 212, 0.15); }
        .border-pink\/18 { border-color: rgba(240, 196, 212, 0.18); }
        .text-pink { color: #f0c4d4; }
        .text-pink\/70 { color: rgba(240, 196, 212, 0.7); }

        .bg-surface { background: rgba(255, 255, 255, 0.03); }
        .bg-surface-hover { background: rgba(255, 255, 255, 0.06); }

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
      `}</style>
    </div>
  );
}