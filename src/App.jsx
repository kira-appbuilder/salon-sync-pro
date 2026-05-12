import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './lib/firebase'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { checkEntitlements, initializeRevenueCat } from './lib/revenuecat'
import Dashboard from './components/Dashboard'
import BookingManager from './components/BookingManager'
import StaffScheduler from './components/StaffScheduler'
import InventoryTracker from './components/InventoryTracker'
import CustomerManager from './components/CustomerManager'
import LocationSelector from './components/LocationSelector'

function App() {
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [language, setLanguage] = useState('EN')
  const [showFeedback, setShowFeedback] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // Initialize RevenueCat with user ID
        initializeRevenueCat(user.uid)
        
        try {
          const entitlements = await checkEntitlements()
          setIsPro(entitlements.isPro || entitlements.isStarter || entitlements.isProfessional || entitlements.isEnterprise)
        } catch (error) {
          console.error('Failed to check entitlements:', error)
          setIsPro(false)
        }
      } else {
        // Auto sign-in anonymously
        try {
          await signInAnonymously(auth)
        } catch (error) {
          console.error('Anonymous auth failed:', error)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'EN' ? 'JA' : 'EN')
  }

  const reportError = (error) => {
    console.error('App Error:', error)
    // In production, send to error tracking service
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">{language === 'EN' ? 'Loading SalonSync Pro...' : 'SalonSync Pro を読み込み中...'}</p>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Background glow effects */}
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      {/* Header */}
      <header className="app-header fade-in-1">
        <div className="header-content">
          <div className="brand">
            <h1 className="brand-title">SalonSync Pro</h1>
            <p className="brand-subtitle">
              {language === 'EN' ? 'Multi-location beauty management' : '美容サロンチェーン管理システム'}
            </p>
          </div>
          <div className="header-actions">
            <button className="lang-toggle" onClick={toggleLanguage}>
              {language}
            </button>
            <div className="status-badge">
              <div className="status-dot"></div>
              {isPro ? 'PRO' : 'FREE'}
            </div>
          </div>
        </div>
      </header>

      {/* Location Selector */}
      {!currentLocation && (
        <div className="location-setup fade-in-2">
          <LocationSelector 
            onLocationSelect={setCurrentLocation}
            language={language}
            isPro={isPro}
          />
        </div>
      )}

      {/* Main Navigation */}
      {currentLocation && (
        <nav className="main-nav fade-in-2">
          <div className="nav-content">
            <button 
              className={`nav-pill ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              {language === 'EN' ? 'Dashboard' : 'ダッシュボード'}
            </button>
            <button 
              className={`nav-pill ${activeSection === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveSection('bookings')}
            >
              {language === 'EN' ? 'Bookings' : '予約管理'}
            </button>
            <button 
              className={`nav-pill ${activeSection === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveSection('staff')}
            >
              {language === 'EN' ? 'Staff' : 'スタッフ'}
            </button>
            <button 
              className={`nav-pill ${activeSection === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveSection('inventory')}
            >
              {language === 'EN' ? 'Inventory' : '在庫管理'}
            </button>
            <button 
              className={`nav-pill ${activeSection === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveSection('customers')}
            >
              {language === 'EN' ? 'Customers' : '顧客管理'}
            </button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      {currentLocation && (
        <main className="main-content fade-in-3">
          <div className="content-container">
            {activeSection === 'dashboard' && (
              <Dashboard 
                currentLocation={currentLocation}
                language={language}
                isPro={isPro}
                onError={reportError}
              />
            )}
            {activeSection === 'bookings' && (
              <BookingManager 
                currentLocation={currentLocation}
                language={language}
                isPro={isPro}
                onError={reportError}
              />
            )}
            {activeSection === 'staff' && (
              <StaffScheduler 
                currentLocation={currentLocation}
                language={language}
                isPro={isPro}
                onError={reportError}
              />
            )}
            {activeSection === 'inventory' && (
              <InventoryTracker 
                currentLocation={currentLocation}
                language={language}
                isPro={isPro}
                onError={reportError}
              />
            )}
            {activeSection === 'customers' && (
              <CustomerManager 
                currentLocation={currentLocation}
                language={language}
                isPro={isPro}
                onError={reportError}
              />
            )}
          </div>
        </main>
      )}

      {/* Japanese tagline */}
      <div className="tagline fade-in-4">
        <p className="tagline-text">
          {language === 'EN' ? 'Synchronized beauty. Seamless operations.' : '同期された美。シームレスな運営。'}
        </p>
      </div>

      {/* Feedback widget */}
      <button 
        className="feedback-toggle"
        onClick={() => setShowFeedback(!showFeedback)}
        title={language === 'EN' ? 'Send feedback' : 'フィードバック'}
      >
        💭
      </button>

      {showFeedback && (
        <div className="feedback-modal">
          <div className="feedback-content">
            <div className="feedback-header">
              <span className="feedback-title">
                {language === 'EN' ? 'Send Feedback' : 'フィードバック送信'}
              </span>
              <button 
                className="feedback-close"
                onClick={() => setShowFeedback(false)}
              >
                ×
              </button>
            </div>
            <textarea 
              placeholder={language === 'EN' ? 'Share your thoughts...' : 'ご意見をお聞かせください...'}
              className="feedback-input"
            ></textarea>
            <button className="feedback-submit">
              {language === 'EN' ? 'Send' : '送信'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App