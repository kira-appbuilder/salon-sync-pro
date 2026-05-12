import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { checkEntitlements } from '../lib/revenuecat';

const CustomerManager = () => {
  const [user] = useAuthState(auth);
  const [customers, setCustomers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(localStorage.getItem('selectedLocation') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    loyaltyPoints: 0,
    totalSpent: 0,
    lastVisit: '',
    notes: ''
  });

  const t = {
    en: {
      title: 'Customer Management',
      subtitle: '顧客の絆を育む。美の記録を刻む。',
      searchPlaceholder: 'Search customers...',
      addCustomer: 'Add Customer',
      customerList: 'Customer Database',
      loyaltyPoints: 'Loyalty Points',
      totalSpent: 'Total Spent',
      lastVisit: 'Last Visit',
      checkIn: 'Check In',
      addPoints: 'Add Points',
      viewDetails: 'View Details',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      notes: 'Notes',
      save: 'Save Customer',
      cancel: 'Cancel',
      checkedIn: 'Checked In',
      noCustomers: 'No customers found',
      premiumFeature: 'Advanced Analytics (Pro)',
      marketingCampaigns: 'Automated Marketing (Pro)',
      unlockPro: 'Unlock Pro Features'
    },
    ja: {
      title: 'カスタマー管理',
      subtitle: '顧客の絆を育む。美の記録を刻む。',
      searchPlaceholder: '顧客を検索...',
      addCustomer: '顧客追加',
      customerList: '顧客データベース',
      loyaltyPoints: 'ポイント',
      totalSpent: '総利用額',
      lastVisit: '最終来店',
      checkIn: 'チェックイン',
      addPoints: 'ポイント追加',
      viewDetails: '詳細表示',
      name: '氏名',
      email: 'メール',
      phone: '電話番号',
      notes: '備考',
      save: '保存',
      cancel: 'キャンセル',
      checkedIn: 'チェックイン済',
      noCustomers: '顧客が見つかりません',
      premiumFeature: '詳細分析（プロ版）',
      marketingCampaigns: '自動マーケティング（プロ版）',
      unlockPro: 'プロ版を解除'
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
    if (!user || !selectedLocation) return;

    const q = query(
      collection(db, 'customers'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(customer => customer.locationId === selectedLocation);
      setCustomers(customerData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedLocation]);

  const addCustomer = async (e) => {
    e.preventDefault();
    if (!user || !selectedLocation) return;

    try {
      await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        locationId: selectedLocation,
        userId: user.uid,
        createdAt: new Date(),
        lastVisit: new Date().toISOString().split('T')[0]
      });

      setNewCustomer({
        name: '', email: '', phone: '', loyaltyPoints: 0,
        totalSpent: 0, lastVisit: '', notes: ''
      });
      setIsAddingCustomer(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const checkInCustomer = async (customerId) => {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        lastVisit: new Date().toISOString().split('T')[0],
        loyaltyPoints: customers.find(c => c.id === customerId)?.loyaltyPoints + 10 || 10
      });
    } catch (error) {
      console.error('Error checking in customer:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedLocation) {
    return (
      <div className="customer-manager">
        <div className="location-required">
          <h3>{t[language].title}</h3>
          <p>Please select a location first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-manager">
      {/* Background Glow */}
      <div className="glow-effect"></div>
      
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <div className="eyebrow">{t[language].subtitle}</div>
          <h2>{t[language].title}</h2>
          <div className="header-actions">
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

      {/* Search and Add */}
      <div className="controls-section">
        <div className="search-container">
          <input
            type="text"
            placeholder={t[language].searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className="pill-button primary"
          onClick={() => setIsAddingCustomer(true)}
        >
          {t[language].addCustomer}
        </button>
      </div>

      {/* Customer List */}
      <div className="customers-section">
        <div className="section-header">
          <div className="eyebrow">{t[language].customerList}</div>
          <div className="customer-count">{filteredCustomers.length}</div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="customer-list">
            {filteredCustomers.length === 0 ? (
              <div className="empty-state">
                <p>{t[language].noCustomers}</p>
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="customer-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="customer-info">
                    <div className="customer-header">
                      <h4>{customer.name}</h4>
                      <div className="customer-meta">
                        <span className="status-badge active">
                          {customer.loyaltyPoints} pts
                        </span>
                      </div>
                    </div>
                    <div className="customer-details">
                      <div className="detail-item">
                        <span className="label">{t[language].email}:</span>
                        <span className="value">{customer.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">{t[language].lastVisit}:</span>
                        <span className="value">{customer.lastVisit}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">{t[language].totalSpent}:</span>
                        <span className="value">${customer.totalSpent}</span>
                      </div>
                    </div>
                  </div>
                  <div className="customer-actions">
                    <button
                      className="pill-button small"
                      onClick={() => checkInCustomer(customer.id)}
                    >
                      {t[language].checkIn}
                    </button>
                    <button
                      className="pill-button small outline"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      {t[language].viewDetails}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Premium Features */}
      <div className="premium-section">
        <div className={`premium-feature ${!isPro ? 'locked' : ''}`}>
          <div className="feature-header">
            <h4>{t[language].premiumFeature}</h4>
            {!isPro && <span className="lock-badge">🔒 Pro</span>}
          </div>
          {isPro ? (
            <div className="analytics-preview">
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-value">127</span>
                  <span className="stat-label">Total Customers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">$2,340</span>
                  <span className="stat-label">Avg. Lifetime Value</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">73%</span>
                  <span className="stat-label">Retention Rate</span>
                </div>
              </div>
            </div>
          ) : (
            <button className="pill-button premium">
              {t[language].unlockPro}
            </button>
          )}
        </div>

        <div className={`premium-feature ${!isPro ? 'locked' : ''}`}>
          <div className="feature-header">
            <h4>{t[language].marketingCampaigns}</h4>
            {!isPro && <span className="lock-badge">🔒 Pro</span>}
          </div>
          {!isPro && (
            <button className="pill-button premium">
              {t[language].unlockPro}
            </button>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="modal-overlay" onClick={() => setIsAddingCustomer(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{t[language].addCustomer}</h3>
            <form onSubmit={addCustomer}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder={t[language].name}
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder={t[language].email}
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder={t[language].phone}
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <textarea
                  placeholder={t[language].notes}
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  rows="3"
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="pill-button outline" onClick={() => setIsAddingCustomer(false)}>
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="customer-detail-header">
              <h3>{selectedCustomer.name}</h3>
              <span className="status-badge active">
                {selectedCustomer.loyaltyPoints} {t[language].loyaltyPoints}
              </span>
            </div>
            <div className="customer-detail-content">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <p><strong>{t[language].email}:</strong> {selectedCustomer.email}</p>
                  <p><strong>{t[language].phone}:</strong> {selectedCustomer.phone}</p>
                </div>
                <div className="detail-section">
                  <h4>Visit History</h4>
                  <p><strong>{t[language].lastVisit}:</strong> {selectedCustomer.lastVisit}</p>
                  <p><strong>{t[language].totalSpent}:</strong> ${selectedCustomer.totalSpent}</p>
                </div>
              </div>
              {selectedCustomer.notes && (
                <div className="detail-section">
                  <h4>{t[language].notes}</h4>
                  <p>{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="pill-button outline" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .customer-manager {
          position: relative;
          max-width: 640px;
          margin: 0 auto;
          padding: 48px 24px;
          color: rgba(245, 240, 250, 0.92);
        }

        .glow-effect {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(240, 122, 106, 0.08) 0%, transparent 70%);
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
          color: rgba(240, 122, 106, 0.7);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .header-section h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin: 0;
          background: linear-gradient(135deg, rgba(245, 240, 250, 0.92), rgba(240, 122, 106, 0.8));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          position: absolute;
          top: 0;
          right: 0;
        }

        .language-toggle {
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 8px 16px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: rgba(240, 122, 106, 0.8);
          cursor: pointer;
          transition: all 0.2s;
        }

        .language-toggle:hover {
          background: rgba(240, 122, 106, 0.18);
          transform: translateY(-1px);
        }

        .controls-section {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          animation: fadeInUp 0.6s ease 0.15s both;
        }

        .search-container {
          flex: 1;
        }

        .search-input {
          width: 100%;
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 16px 20px;
          font-size: 16px;
          color: rgba(245, 240, 250, 0.92);
          transition: all 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(240, 122, 106, 0.45);
          background: rgba(240, 122, 106, 0.06);
        }

        .search-input::placeholder {
          color: rgba(245, 240, 250, 0.45);
        }

        .pill-button {
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 12px 28px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: rgba(240, 122, 106, 0.9);
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .pill-button:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        .pill-button.primary {
          background: rgba(240, 122, 106, 0.15);
          border-color: rgba(240, 122, 106, 0.5);
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
          background: linear-gradient(135deg, rgba(240, 122, 106, 0.2), rgba(240, 196, 212, 0.2));
          border-color: rgba(240, 122, 106, 0.5);
        }

        .customers-section {
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .customer-count {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: rgba(240, 122, 106, 0.8);
          background: rgba(240, 122, 106, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          border: 0.5px solid rgba(240, 122, 106, 0.2);
        }

        .customer-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .customer-card {
          position: relative;
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s;
          animation: fadeIn 0.4s ease both;
          overflow: hidden;
        }

        .customer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, rgba(240, 122, 106, 0.8), rgba(240, 196, 212, 0.6));
          opacity: 0.4;
        }

        .customer-card:hover {
          border-color: rgba(240, 122, 106, 0.35);
          background: rgba(240, 122, 106, 0.06);
          transform: translateY(-2px);
        }

        .customer-info {
          margin-bottom: 16px;
        }

        .customer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .customer-header h4 {
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
          background: rgba(240, 122, 106, 0.06);
          border: 0.5px solid rgba(240, 122, 106, 0.15);
          border-radius: 40px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240, 122, 106, 0.8);
          letter-spacing: 0.1em;
        }

        .customer-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
        }

        .detail-item .label {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
        }

        .detail-item .value {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.92);
        }

        .customer-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .premium-section {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeInUp 0.6s ease 0.45s both;
        }

        .premium-feature {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s;
        }

        .premium-feature.locked {
          opacity: 0.6;
          border-style: dashed;
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .feature-header h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          margin: 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .lock-badge {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(245, 240, 250, 0.45);
          background: rgba(245, 240, 250, 0.05);
          padding: 4px 8px;
          border-radius: 12px;
        }

        .analytics-preview {
          margin-top: 16px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 16px;
          background: rgba(240, 122, 106, 0.06);
          border-radius: 12px;
          border: 0.5px solid rgba(240, 122, 106, 0.15);
        }

        .stat-value {
          display: block;
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          color: rgba(240, 122, 106, 0.9);
          margin-bottom: 4px;
        }

        .stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(245, 240, 250, 0.45);
          letter-spacing: 0.1em;
          text-transform: uppercase;
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
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
          animation: fadeInUp 0.4s ease;
        }

        .modal-content.large {
          max-width: 600px;
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
        .form-grid textarea {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          color: rgba(245, 240, 250, 0.92);
          transition: all 0.3s;
          font-family: inherit;
        }

        .form-grid input:focus,
        .form-grid textarea:focus {
          outline: none;
          border-color: rgba(240, 122, 106, 0.45);
          background: rgba(240, 122, 106, 0.06);
        }

        .form-grid input::placeholder,
        .form-grid textarea::placeholder {
          color: rgba(245, 240, 250, 0.45);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .customer-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(240, 122, 106, 0.15);
        }

        .customer-detail-content {
          margin-bottom: 24px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .detail-section h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          margin: 0 0 12px 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .detail-section p {
          margin: 8px 0;
          color: rgba(245, 240, 250, 0.7);
          line-height: 1.6;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          padding: 48px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(240, 122, 106, 0.2);
          border-top: 2px solid rgba(240, 122, 106, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: rgba(245, 240, 250, 0.45);
        }

        .location-required {
          text-align: center;
          padding: 48px 24px;
        }

        .location-required h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          margin: 0 0 16px 0;
          color: rgba(245, 240, 250, 0.92);
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
          .customer-manager {
            padding: 24px 16px;
          }

          .header-section h2 {
            font-size: 36px;
          }

          .controls-section {
            flex-direction: column;
          }

          .customer-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .customer-details {
            grid-template-columns: 1fr;
          }

          .customer-actions {
            flex-wrap: wrap;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerManager;