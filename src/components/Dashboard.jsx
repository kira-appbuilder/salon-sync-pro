import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { auth, subscribeToBookings, getStaff, getInventory, getRevenueData, reportError, submitFeedback } from '../lib/firebase';
import { checkEntitlements, getPlanLimits, canUseFeature, getUpgradeMessage } from '../lib/revenuecat';

const Dashboard = ({ currentLocation, locations, onLocationChange }) => {
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [entitlements, setEntitlements] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [language, setLanguage] = useState('en');

  const text = {
    en: {
      title: "SalonSync Pro",
      subtitle: "美しさを管理する。 Manage Beauty.",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      bookings: "Bookings",
      revenue: "Revenue",
      staff: "Staff",
      inventory: "Inventory",
      customers: "Customers",
      alerts: "Alerts",
      quickActions: "Quick Actions",
      newBooking: "New Booking",
      addStaff: "Add Staff",
      viewReports: "View Reports",
      manageInventory: "Manage Inventory",
      lowStock: "Low Stock Alert",
      upcomingBookings: "Upcoming Bookings",
      recentActivity: "Recent Activity",
      topServices: "Top Services",
      staffSchedule: "Staff Schedule",
      locationOverview: "Location Overview",
      upgrade: "Upgrade Plan",
      feedback: "Feedback",
      errorReport: "Report Issue"
    },
    ja: {
      title: "SalonSync Pro",
      subtitle: "美しさを管理する。",
      today: "今日",
      thisWeek: "今週",
      thisMonth: "今月",
      bookings: "予約",
      revenue: "売上",
      staff: "スタッフ",
      inventory: "在庫",
      customers: "お客様",
      alerts: "アラート",
      quickActions: "クイックアクション",
      newBooking: "新規予約",
      addStaff: "スタッフ追加",
      viewReports: "レポート表示",
      manageInventory: "在庫管理",
      lowStock: "在庫不足アラート",
      upcomingBookings: "近日の予約",
      recentActivity: "最近のアクティビティ",
      topServices: "人気サービス",
      staffSchedule: "スタッフスケジュール",
      locationOverview: "店舗概要",
      upgrade: "プランアップグレード",
      feedback: "フィードバック",
      errorReport: "問題報告"
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check subscription status
        const subs = await checkEntitlements();
        setEntitlements(subs);

        // Load staff data
        const staffData = await getStaff(currentLocation?.id);
        setStaff(staffData);

        // Load inventory data
        if (canUseFeature('inventory_tracking', subs)) {
          const inventoryData = await getInventory(currentLocation?.id);
          setInventory(inventoryData);
        }

        // Load revenue data
        const revenue = await getRevenueData(currentLocation?.id, 30);
        setRevenueData(revenue);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        reportError({
          error: err.message,
          component: 'Dashboard',
          action: 'loadData'
        });
      }
    };

    loadData();

    // Subscribe to real-time bookings
    const unsubscribe = subscribeToBookings(setBookings, currentLocation?.id);
    return () => unsubscribe();
  }, [currentLocation]);

  const handleFeedback = async (message, type = 'general') => {
    try {
      await submitFeedback({ message, type, page: 'dashboard' });
      setShowFeedback(false);
    } catch (err) {
      console.error('Feedback submission error:', err);
    }
  };

  const getBookingStats = () => {
    const today = new Date();
    const todayBookings = bookings.filter(b => 
      format(new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    );
    
    const thisWeek = bookings.filter(b => {
      const bookingDate = new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return bookingDate >= weekStart;
    });

    return {
      today: todayBookings.length,
      week: thisWeek.length,
      total: bookings.length
    };
  };

  const getRevenueStats = () => {
    const completedBookings = revenueData.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    
    return {
      total: totalRevenue,
      average: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
      bookings: completedBookings.length
    };
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= (item.minQuantity || 5));
  };

  const planLimits = getPlanLimits(entitlements);
  const stats = getBookingStats();
  const revenueStats = getRevenueStats();
  const lowStockItems = getLowStockItems();

  if (loading) {
    return (
      <div className="dashboard-container" style={{
        minHeight: '100vh',
        background: '#0b0b0f',
        color: 'rgba(245,240,250,0.92)',
        padding: '48px 24px',
        fontFamily: '\'Zen Kaku Gothic New\', sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '120px 20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(240,116,106,0.2)',
            borderTop: '2px solid #f0746a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={{ opacity: 0.6 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{
      minHeight: '100vh',
      background: '#0b0b0f',
      color: 'rgba(245,240,250,0.92)',
      position: 'relative',
      fontFamily: '\'Zen Kaku Gothic New\', sans-serif'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(ellipse, rgba(240,116,106,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <header style={{ 
          marginBottom: '48px',
          animation: 'fadeInUp 0.6s ease both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '300',
                fontFamily: '\'Cormorant Garamond\', serif',
                margin: '0',
                background: 'linear-gradient(135deg, #f0746a, #f5c87a)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {text[language].title}
              </h1>
              <p style={{
                fontSize: '16px',
                opacity: 0.6,
                margin: '8px 0 0',
                fontStyle: 'italic'
              }}>
                {text[language].subtitle}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
                style={{
                  background: 'rgba(240,116,106,0.1)',
                  border: '0.5px solid rgba(240,116,106,0.35)',
                  borderRadius: '40px',
                  padding: '8px 16px',
                  color: '#f0746a',
                  fontFamily: '\'Space Mono\', monospace',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(240,116,106,0.18)';
                  e.target.style.borderColor = 'rgba(240,116,106,0.6)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(240,116,106,0.1)';
                  e.target.style.borderColor = 'rgba(240,116,106,0.35)';
                }}
              >
                {language === 'en' ? '日本語' : 'English'}
              </button>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(240,116,106,0.06)',
                border: '0.5px solid rgba(240,116,106,0.15)',
                borderRadius: '40px',
                fontSize: '10px',
                fontFamily: '\'Space Mono\', monospace',
                color: 'rgba(240,116,106,0.8)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#f0746a',
                  animation: 'pulse 2s infinite'
                }}></span>
                {planLimits.planName}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
          animation: 'fadeInUp 0.6s ease 0.15s both'
        }}>
          {/* Bookings Card */}
          <div style={{
            background: 'rgba(240,116,106,0.04)',
            border: '0.5px solid rgba(240,116,106,0.18)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2px',
              height: '100%',
              background: 'linear-gradient(to bottom, #f0746a, #f5c87a)',
              opacity: 0.4
            }}></div>
            
            <div style={{
              fontFamily: '\'Space Mono\', monospace',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#f0746a',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: '12px'
            }}>
              {text[language].bookings}
            </div>
            
            <div style={{ fontSize: '32px', fontWeight: '300', marginBottom: '16px' }}>
              {stats.today}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              opacity: 0.6
            }}>
              <span>{text[language].today}: {stats.today}</span>
              <span>{text[language].thisWeek}: {stats.week}</span>
            </div>
          </div>

          {/* Revenue Card */}
          <div style={{
            background: 'rgba(240,116,106,0.04)',
            border: '0.5px solid rgba(240,116,106,0.18)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2px',
              height: '100%',
              background: 'linear-gradient(to bottom, #f5c87a, #f0746a)',
              opacity: 0.4
            }}></div>
            
            <div style={{
              fontFamily: '\'Space Mono\', monospace',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#f5c87a',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: '12px'
            }}>
              {text[language].revenue}
            </div>
            
            <div style={{ fontSize: '32px', fontWeight: '300', marginBottom: '16px' }}>
              ${revenueStats.total.toFixed(0)}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              opacity: 0.6
            }}>
              <span>Avg: ${revenueStats.average.toFixed(0)}</span>
              <span>Bookings: {revenueStats.bookings}</span>
            </div>
          </div>

          {/* Staff Card */}
          <div style={{
            background: 'rgba(240,116,106,0.04)',
            border: '0.5px solid rgba(240,116,106,0.18)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2px',
              height: '100%',
              background: 'linear-gradient(to bottom, #f0746a, #f5c87a)',
              opacity: 0.4
            }}></div>
            
            <div style={{
              fontFamily: '\'Space Mono\', monospace',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#f0746a',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: '12px'
            }}>
              {text[language].staff}
            </div>
            
            <div style={{ fontSize: '32px', fontWeight: '300', marginBottom: '16px' }}>
              {staff.length}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              opacity: 0.6
            }}>
              <span>Active: {staff.filter(s => s.status === 'active').length}</span>
              <span>Available: {staff.filter(s => s.available).length}</span>
            </div>
          </div>

          {/* Inventory Card */}
          <div style={{
            background: 'rgba(240,116,106,0.04)',
            border: '0.5px solid rgba(240,116,106,0.18)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            opacity: canUseFeature('inventory_tracking', entitlements) ? 1 : 0.5
          }}>
            <div style={{
              content: '',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2px',
              height: '100%',
              background: 'linear-gradient(to bottom, #f5c87a, #f0746a)',
              opacity: 0.4
            }}></div>
            
            <div style={{
              fontFamily: '\'Space Mono\', monospace',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#f5c87a',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: '12px'
            }}>
              {text[language].inventory}
            </div>
            
            {canUseFeature('inventory_tracking', entitlements) ? (
              <>
                <div style={{ fontSize: '32px', fontWeight: '300', marginBottom: '16px' }}>
                  {inventory.length}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  opacity: 0.6
                }}>
                  <span>Items: {inventory.length}</span>
                  <span style={{ color: lowStockItems.length > 0 ? '#f0746a' : 'inherit' }}>
                    Low Stock: {lowStockItems.length}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '14px', opacity: 0.6 }}>
                {getUpgradeMessage('inventory_tracking')}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          marginBottom: '48px',
          animation: 'fadeInUp 0.6s ease 0.3s both'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '300',
            fontFamily: '\'Cormorant Garamond\', serif',
            marginBottom: '24px'
          }}>
            {text[language].quickActions}
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {[
              { label: text[language].newBooking, icon: '📅' },
              { label: text[language].addStaff, icon: '👤' },
              { label: text[language].viewReports, icon: '📊' },
              { label: text[language].manageInventory, icon: '📦' }
            ].map((action, index) => (
              <button
                key={index}
                style={{
                  background: 'rgba(240,116,106,0.1)',
                  border: '0.5px solid rgba(240,116,106,0.35)',
                  borderRadius: '40px',
                  padding: '12px 24px',
                  color: '#f0746a',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(240,116,106,0.18)';
                  e.target.style.borderColor = 'rgba(240,116,106,0.6)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(240,116,106,0.1)';
                  e.target.style.borderColor = 'rgba(240,116,106,0.35)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {bookings.length > 0 && (
          <div style={{
            marginBottom: '48px',
            animation: 'fadeInUp 0.6s ease 0.45s both'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '300',
              fontFamily: '\'Cormorant Garamond\', serif',
              marginBottom: '24px'
            }}>
              {text[language].upcomingBookings}
            </h2>
            
            <div style={{
              background: 'rgba(240,116,106,0.04)',
              border: '0.5px solid rgba(240,116,106,0.18)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              {bookings.slice(0, 5).map((booking, index) => (
                <div key={booking.id} style={{
                  padding: '16px 24px',
                  borderBottom: index < 4 ? '0.5px solid rgba(240,116,106,0.08)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {booking.customerName || 'Customer'}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.6 }}>
                      {booking.service} • {booking.duration || '60'}min
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: '\'Space Mono\', monospace',
                      fontSize: '12px',
                      opacity: 0.7
                    }}>
                      {booking.time || '10:00 AM'}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: booking.status === 'confirmed' ? '#9ec4a8' : '#f0746a'
                    }}>
                      ${booking.price || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 0',
          borderTop: '0.5px solid rgba(240,116,106,0.1)',
          animation: 'fadeInUp 0.6s ease 0.6s both'
        }}>
          <div style={{
            fontFamily: '\'Space Mono\', monospace',
            fontSize: '10px',
            letterSpacing: '0.15em',
            opacity: 0.4,
            textTransform: 'uppercase'
          }}>
            {auth.currentUser ? `User: ${auth.currentUser.uid.slice(0, 8)}` : 'Not signed in'}
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setShowFeedback(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(240,116,106,0.6)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {text[language].feedback}
            </button>
            
            <button
              onClick={() => {
                const error = prompt('Describe the issue:');
                if (error) {
                  reportError({ error, page: 'dashboard', userReport: true });
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(240,116,106,0.6)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {text[language].errorReport}
            </button>
          </div>
        </footer>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: '#0b0b0f',
            border: '0.5px solid rgba(240,116,106,0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontFamily: '\'Cormorant Garamond\', serif',
              fontWeight: '300',
              marginBottom: '16px'
            }}>
              Share Your Feedback
            </h3>
            
            <textarea
              placeholder="Tell us what you think..."
              style={{
                width: '100%',
                height: '120px',
                background: 'rgba(240,116,106,0.04)',
                border: '0.5px solid rgba(240,116,106,0.18)',
                borderRadius: '12px',
                padding: '16px',
                color: 'rgba(245,240,250,0.92)',
                fontSize: '14px',
                resize: 'vertical',
                marginBottom: '16px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(240,116,106,0.45)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(240,116,106,0.18)';
              }}
            />
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowFeedback(false)}
                style={{
                  background: 'none',
                  border: '0.5px solid rgba(245,240,250,0.2)',
                  borderRadius: '40px',
                  padding: '10px 20px',
                  color: 'rgba(245,240,250,0.6)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={(e) => {
                  const textarea = e.target.parentElement.parentElement.querySelector('textarea');
                  handleFeedback(textarea.value);
                }}
                style={{
                  background: 'rgba(240,116,106,0.1)',
                  border: '0.5px solid rgba(240,116,106,0.35)',
                  borderRadius: '40px',
                  padding: '10px 20px',
                  color: '#f0746a',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;