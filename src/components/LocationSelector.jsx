import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { checkEntitlements } from '../lib/revenuecat';

const LocationSelector = ({ onLocationSelect }) => {
  const [user] = useAuthState(auth);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(localStorage.getItem('selectedLocation') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
    status: 'active'
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const t = {
    en: {
      title: 'Location Management',
      subtitle: '場所を選ぶ。未来を築く。',
      selectLocation: 'Select Location',
      addLocation: 'Add Location',
      locationList: 'Your Locations',
      currentLocation: 'Current Location',
      name: 'Location Name',
      address: 'Address',
      phone: 'Phone',
      manager: 'Manager',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      save: 'Save Location',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      switchTo: 'Switch to',
      noLocations: 'No locations yet',
      addFirstLocation: 'Add your first location to get started',
      unlimitedLocations: 'Unlimited Locations (Pro)',
      locationLimit: 'Location limit reached',
      upgradeToPro: 'Upgrade to Pro for unlimited locations',
      stats: 'Quick Stats',
      totalBookings: 'Today\'s Bookings',
      revenue: 'Revenue',
      staff: 'Staff Online',
      customers: 'Customers'
    },
    ja: {
      title: 'ロケーション管理',
      subtitle: '場所を選ぶ。未来を築く。',
      selectLocation: '場所を選択',
      addLocation: '場所を追加',
      locationList: 'あなたの場所',
      currentLocation: '現在の場所',
      name: '場所名',
      address: '住所',
      phone: '電話番号',
      manager: 'マネージャー',
      status: 'ステータス',
      active: 'アクティブ',
      inactive: '非アクティブ',
      save: '保存',
      cancel: 'キャンセル',
      edit: '編集',
      delete: '削除',
      switchTo: '切り替え',
      noLocations: '場所がまだありません',
      addFirstLocation: '最初の場所を追加して始めましょう',
      unlimitedLocations: '無制限ロケーション（プロ版）',
      locationLimit: 'ロケーション上限に達しました',
      upgradeToPro: '無制限ロケーションのためプロ版にアップグレード',
      stats: 'クイック統計',
      totalBookings: '今日の予約',
      revenue: '売上',
      staff: 'オンラインスタッフ',
      customers: '顧客'
    }
  };

  useEffect(() => {
    const checkPro = async () => {
      const hasEntitlement = await checkEntitlements();
      setIsPro(hasEntitlement);
    };
    checkPro();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'locations'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locationData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(location => location.userId === user.uid);
      setLocations(locationData);
      setIsLoading(false);

      // Auto-select first location if none selected
      if (!selectedLocationId && locationData.length > 0) {
        const firstLocation = locationData[0];
        setSelectedLocationId(firstLocation.id);
        localStorage.setItem('selectedLocation', firstLocation.id);
        if (onLocationSelect) {
          onLocationSelect(firstLocation);
        }
      }
    });

    return () => unsubscribe();
  }, [user, selectedLocationId, onLocationSelect]);

  const addLocation = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Check location limits
    const currentCount = locations.length;
    const maxLocations = isPro ? Infinity : 3;

    if (currentCount >= maxLocations) {
      alert(t[language].locationLimit);
      return;
    }

    try {
      await addDoc(collection(db, 'locations'), {
        ...newLocation,
        userId: user.uid,
        createdAt: new Date(),
        stats: {
          todayBookings: Math.floor(Math.random() * 25),
          revenue: Math.floor(Math.random() * 5000),
          staffOnline: Math.floor(Math.random() * 8),
          totalCustomers: Math.floor(Math.random() * 200)
        }
      });

      setNewLocation({ name: '', address: '', phone: '', manager: '', status: 'active' });
      setIsAddingLocation(false);
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocationId(location.id);
    localStorage.setItem('selectedLocation', location.id);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const deleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteDoc(doc(db, 'locations', locationId));
        if (selectedLocationId === locationId) {
          const remainingLocations = locations.filter(loc => loc.id !== locationId);
          if (remainingLocations.length > 0) {
            selectLocation(remainingLocations[0]);
          } else {
            setSelectedLocationId('');
            localStorage.removeItem('selectedLocation');
          }
        }
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  const canAddLocation = () => {
    if (isPro) return true;
    return locations.length < 3;
  };

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  if (isLoading) {
    return (
      <div className="location-selector loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="location-selector">
      {/* Background Glow */}
      <div className="glow-effect"></div>
      
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <div className="eyebrow">{t[language].subtitle}</div>
          <h2>{t[language].title}</h2>
          <div className="header-actions">
            <button
              className="view-toggle"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
            <button
              className="language-toggle"
              onClick={() => {
                const newLang = language === 'en' ? 'ja' : 'en';
                setLanguage(newLang);
                localStorage.setItem('language', newLang);
              }}
            >
              {language === 'en' ? '日本語' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Location Stats */}
      {selectedLocation && (
        <div className="current-location-section">
          <div className="section-header">
            <div className="eyebrow">{t[language].currentLocation}</div>
            <div className="location-name">{selectedLocation.name}</div>
          </div>
          <div className="location-stats">
            <div className="stat-item">
              <span className="stat-value">{selectedLocation.stats?.todayBookings || 0}</span>
              <span className="stat-label">{t[language].totalBookings}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${selectedLocation.stats?.revenue || 0}</span>
              <span className="stat-label">{t[language].revenue}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{selectedLocation.stats?.staffOnline || 0}</span>
              <span className="stat-label">{t[language].staff}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{selectedLocation.stats?.totalCustomers || 0}</span>
              <span className="stat-label">{t[language].customers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Location Management */}
      <div className="locations-section">
        <div className="section-header">
          <div className="section-title">
            <div className="eyebrow">{t[language].locationList}</div>
            <div className="location-count">{locations.length} {isPro ? '' : '/ 3'}</div>
          </div>
          {canAddLocation() ? (
            <button
              className="pill-button primary"
              onClick={() => setIsAddingLocation(true)}
            >
              {t[language].addLocation}
            </button>
          ) : (
            <div className="upgrade-prompt">
              <div className="lock-badge">🔒 {t[language].locationLimit}</div>
              <button className="pill-button premium">
                {t[language].upgradeToPro}
              </button>
            </div>
          )}
        </div>

        {locations.length === 0 ? (
          <div className="empty-state">
            <h3>{t[language].noLocations}</h3>
            <p>{t[language].addFirstLocation}</p>
            <button
              className="pill-button primary"
              onClick={() => setIsAddingLocation(true)}
            >
              {t[language].addLocation}
            </button>
          </div>
        ) : (
          <div className={`location-grid ${viewMode}`}>
            {locations.map((location, index) => (
              <div
                key={location.id}
                className={`location-card ${selectedLocationId === location.id ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="location-info">
                  <div className="location-header">
                    <h4>{location.name}</h4>
                    <div className="location-meta">
                      <span className={`status-badge ${location.status}`}>
                        {t[language][location.status]}
                      </span>
                    </div>
                  </div>
                  <div className="location-details">
                    <div className="detail-item">
                      <span className="label">{t[language].address}:</span>
                      <span className="value">{location.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">{t[language].manager}:</span>
                      <span className="value">{location.manager}</span>
                    </div>
                    {location.phone && (
                      <div className="detail-item">
                        <span className="label">{t[language].phone}:</span>
                        <span className="value">{location.phone}</span>
                      </div>
                    )}
                  </div>
                  {viewMode === 'grid' && location.stats && (
                    <div className="mini-stats">
                      <div className="mini-stat">
                        <span className="mini-stat-value">{location.stats.todayBookings}</span>
                        <span className="mini-stat-label">bookings</span>
                      </div>
                      <div className="mini-stat">
                        <span className="mini-stat-value">${location.stats.revenue}</span>
                        <span className="mini-stat-label">revenue</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="location-actions">
                  {selectedLocationId !== location.id && (
                    <button
                      className="pill-button small"
                      onClick={() => selectLocation(location)}
                    >
                      {t[language].switchTo}
                    </button>
                  )}
                  {selectedLocationId === location.id && (
                    <span className="current-badge">Current</span>
                  )}
                  <button
                    className="pill-button small outline"
                    onClick={() => deleteLocation(location.id)}
                  >
                    {t[language].delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro Features */}
      {!isPro && (
        <div className="pro-features-section">
          <div className="pro-feature">
            <div className="feature-header">
              <h4>{t[language].unlimitedLocations}</h4>
              <span className="lock-badge">🔒 Pro</span>
            </div>
            <p>Manage unlimited salon locations with advanced analytics and cross-location reporting.</p>
            <button className="pill-button premium">
              {t[language].upgradeToPro}
            </button>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {isAddingLocation && (
        <div className="modal-overlay" onClick={() => setIsAddingLocation(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{t[language].addLocation}</h3>
            <form onSubmit={addLocation}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder={t[language].name}
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder={t[language].address}
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder={t[language].phone}
                  value={newLocation.phone}
                  onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
                />
                <input
                  type="text"
                  placeholder={t[language].manager}
                  value={newLocation.manager}
                  onChange={(e) => setNewLocation({ ...newLocation, manager: e.target.value })}
                  required
                />
                <select
                  value={newLocation.status}
                  onChange={(e) => setNewLocation({ ...newLocation, status: e.target.value })}
                >
                  <option value="active">{t[language].active}</option>
                  <option value="inactive">{t[language].inactive}</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="pill-button outline" onClick={() => setIsAddingLocation(false)}>
                  {t[language].cancel}
                </button>
                <button type="submit" className="pill-button primary">
                  {t[language].save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .location-selector {
          position: relative;
          max-width: 640px;
          margin: 0 auto;
          padding: 48px 24px;
          color: rgba(245, 240, 250, 0.92);
        }

        .location-selector.loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        .glow-effect {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(240, 196, 212, 0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        }

        .header-section {
          text-align: center;
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease both;
        }

        .header-content {
          position: relative;
        }

        .eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          color: rgba(240, 196, 212, 0.7);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .header-section h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin: 0;
          background: linear-gradient(135deg, rgba(245, 240, 250, 0.92), rgba(240, 196, 212, 0.8));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          gap: 8px;
        }

        .view-toggle,
        .language-toggle {
          background: rgba(240, 196, 212, 0.1);
          border: 0.5px solid rgba(240, 196, 212, 0.35);
          border-radius: 40px;
          padding: 8px 16px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: rgba(240, 196, 212, 0.8);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-toggle {
          padding: 8px 12px;
          font-size: 14px;
        }

        .view-toggle:hover,
        .language-toggle:hover {
          background: rgba(240, 196, 212, 0.18);
          transform: translateY(-1px);
        }

        .current-location-section {
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease 0.15s both;
        }

        .section-header {
          margin-bottom: 24px;
        }

        .location-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          color: rgba(245, 240, 250, 0.92);
          margin-top: 8px;
        }

        .location-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          background: rgba(240, 196, 212, 0.04);
          border: 0.5px solid rgba(240, 196, 212, 0.18);
          border-radius: 16px;
          padding: 24px;
        }

        .stat-item {
          text-align: center;
          padding: 16px 8px;
        }

        .stat-value {
          display: block;
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: rgba(240, 196, 212, 0.9);
          margin-bottom: 4px;
        }

        .stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(245, 240, 250, 0.45);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .locations-section {
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        .section-title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
        }

        .location-count {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: rgba(240, 196, 212, 0.8);
          background: rgba(240, 196, 212, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          border: 0.5px solid rgba(240, 196, 212, 0.2);
        }

        .upgrade-prompt {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .lock-badge {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(245, 240, 250, 0.45);
          background: rgba(245, 240, 250, 0.05);
          padding: 4px 8px;
          border-radius: 12px;
          text-align: center;
        }

        .pill-button {
          background: rgba(240, 196, 212, 0.1);
          border: 0.5px solid rgba(240, 196, 212, 0.35);
          border-radius: 40px;
          padding: 12px 28px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: rgba(240, 196, 212, 0.9);
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pill-button:hover {
          background: rgba(240, 196, 212, 0.18);
          border-color: rgba(240, 196, 212, 0.6);
          transform: translateY(-1px);
        }

        .pill-button.primary {
          background: rgba(240, 196, 212, 0.15);
          border-color: rgba(240, 196, 212, 0.5);
        }

        .pill-button.small {
          padding: 8px 16px;
          font-size: 10px;
        }

        .pill-button.outline {
          background: transparent;
          border-color: rgba(245, 240, 250, 0.2);
          color: rgba(245, 240, 250, 0.7);
        }

        .pill-button.premium {
          background: linear-gradient(135deg, rgba(240, 196, 212, 0.2), rgba(201, 168, 224, 0.2));
          border-color: rgba(240, 196, 212, 0.5);
        }

        .location-grid {
          display: grid;
          gap: 16px;
        }

        .location-grid.grid {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }

        .location-grid.list {
          grid-template-columns: 1fr;
        }

        .location-card {
          position: relative;
          background: rgba(240, 196, 212, 0.04);
          border: 0.5px solid rgba(240, 196, 212, 0.18);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s;
          animation: fadeIn 0.4s ease both;
          overflow: hidden;
        }

        .location-card.selected {
          border-color: rgba(240, 196, 212, 0.45);
          background: rgba(240, 196, 212, 0.08);
        }

        .location-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, rgba(240, 196, 212, 0.8), rgba(201, 168, 224, 0.6));
          opacity: 0.4;
        }

        .location-card.selected::before {
          opacity: 0.8;
          width: 3px;
        }

        .location-card:hover {
          border-color: rgba(240, 196, 212, 0.35);
          background: rgba(240, 196, 212, 0.06);
          transform: translateY(-2px);
        }

        .location-info {
          margin-bottom: 16px;
        }

        .location-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .location-header h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          margin: 0;
          color: rgba(245, 240, 250, 0.92);
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
          border: 0.5px solid;
        }

        .status-badge.active {
          background: rgba(170, 220, 120, 0.06);
          border-color: rgba(170, 220, 120, 0.15);
          color: rgba(170, 220, 120, 0.8);
        }

        .status-badge.inactive {
          background: rgba(245, 240, 250, 0.06);
          border-color: rgba(245, 240, 250, 0.15);
          color: rgba(245, 240, 250, 0.45);
        }

        .location-details {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-bottom: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-item .label {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
          margin-right: 12px;
        }

        .detail-item .value {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.92);
          text-align: right;
          flex: 1;
        }

        .mini-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(240, 196, 212, 0.15);
        }

        .mini-stat {
          text-align: center;
        }

        .mini-stat-value {
          display: block;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: rgba(240, 196, 212, 0.9);
        }

        .mini-stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(245, 240, 250, 0.45);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .location-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          align-items: center;
        }

        .current-badge {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240, 196, 212, 0.8);
          background: rgba(240, 196, 212, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          border: 0.5px solid rgba(240, 196, 212, 0.2);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .pro-features-section {
          margin-top: 48px;
          animation: fadeInUp 0.6s ease 0.45s both;
        }

        .pro-feature {
          background: rgba(240, 196, 212, 0.04);
          border: 0.5px dashed rgba(240, 196, 212, 0.18);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          opacity: 0.6;
        }

        .feature-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .feature-header h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          margin: 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .pro-feature p {
          color: rgba(245, 240, 250, 0.7);
          margin: 16px 0;
          line-height: 1.6;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          background: rgba(240, 196, 212, 0.04);
          border: 0.5px dashed rgba(240, 196, 212, 0.18);
          border-radius: 16px;
        }

        .empty-state h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          margin: 0 0 16px 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .empty-state p {
          color: rgba(245, 240, 250, 0.45);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 11, 15, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: rgba(11, 11, 15, 0.95);
          border: 0.5px solid rgba(240, 196, 212, 0.18);
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
          animation: fadeInUp 0.4s ease;
        }

        .modal-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          margin: 0 0 24px 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .form-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-grid input,
        .form-grid select {
          background: rgba(240, 196, 212, 0.04);
          border: 0.5px solid rgba(240, 196, 212, 0.18);
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          color: rgba(245, 240, 250, 0.92);
          transition: all 0.3s;
          font-family: inherit;
        }

        .form-grid input:focus,
        .form-grid select:focus {
          outline: none;
          border-color: rgba(240, 196, 212, 0.45);
          background: rgba(240, 196, 212, 0.06);
        }

        .form-grid input::placeholder {
          color: rgba(245, 240, 250, 0.45);
        }

        .form-grid select {
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(240, 196, 212, 0.2);
          border-top: 2px solid rgba(240, 196, 212, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .location-selector {
            padding: 24px 16px;
          }

          .header-section h2 {
            font-size: 36px;
          }

          .header-actions {
            position: static;
            justify-content: center;
            margin-top: 16px;
          }

          .section-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .upgrade-prompt {
            align-items: flex-start;
          }

          .location-grid.grid {
            grid-template-columns: 1fr;
          }

          .location-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .location-actions {
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .location-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .mini-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LocationSelector;