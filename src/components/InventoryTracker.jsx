import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkEntitlements } from '../lib/revenuecat';

export default function InventoryTracker({ selectedLocation, user }) {
  const [inventory, setInventory] = useState([]);
  const [categories] = useState([
    'ヘアケア', 'スキンケア', 'ネイル用品', 'カラー剤', 'ツール・機器', '消耗品'
  ]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: 0,
    minimumStock: 10,
    maxStock: 100,
    unit: '個',
    supplier: '',
    cost: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPremium, setIsPremium] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkEntitlements().then(setIsPremium);
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'inventory'),
      where('locationId', '==', selectedLocation)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(inventoryData);
    });

    return () => unsubscribe();
  }, [selectedLocation, user]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!user || !newItem.name) return;

    try {
      await addDoc(collection(db, 'inventory'), {
        ...newItem,
        locationId: selectedLocation,
        userId: user.uid,
        lastUpdated: new Date(),
        createdAt: new Date()
      });

      setNewItem({
        name: '',
        category: '',
        currentStock: 0,
        minimumStock: 10,
        maxStock: 100,
        unit: '個',
        supplier: '',
        cost: 0
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateStock = async (itemId, newStock) => {
    try {
      await updateDoc(doc(db, 'inventory', itemId), {
        currentStock: newStock,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const getStockStatus = (item) => {
    const { currentStock, minimumStock, maxStock } = item;
    if (currentStock <= minimumStock) return 'low';
    if (currentStock >= maxStock * 0.8) return 'high';
    return 'normal';
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockItems = inventory.filter(item => getStockStatus(item) === 'low');
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);

  return (
    <div className="inventory-tracker">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-coral/8 to-transparent pointer-events-none" />
      
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-coral/70 mb-2">Inventory Control</div>
          <h1 className="font-serif text-3xl font-light text-primary mb-2">在庫管理システム</h1>
          <p className="text-secondary text-lg font-light">Real-time inventory tracking with automated alerts</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in-up animation-delay-150">
          <div className="bg-coral/4 border border-coral/18 rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-coral/70 mb-1">Total Items</div>
            <div className="text-xl font-light text-primary">{inventory.length}</div>
          </div>
          <div className="bg-pink/4 border border-pink/18 rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-pink/70 mb-1">Low Stock</div>
            <div className="text-xl font-light text-primary flex items-center gap-2">
              {lowStockItems.length}
              {lowStockItems.length > 0 && (
                <div className="w-2 h-2 bg-coral rounded-full animate-pulse" />
              )}
            </div>
          </div>
          <div className="bg-coral/4 border border-coral/18 rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-coral/70 mb-1">Total Value</div>
            <div className="text-xl font-light text-primary">¥{totalValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 animate-fade-in-up animation-delay-300">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="pill-button bg-coral/10 border border-coral/35 text-coral hover:bg-coral/18 hover:border-coral/60 transform hover:-translate-y-1"
          >
            + ADD ITEM
          </button>
          
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-surface border border-hint/20 rounded-xl text-primary placeholder-hint focus:border-coral/45 focus:bg-coral/4 transition-all"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-surface border border-hint/20 rounded-xl text-primary focus:border-coral/45 focus:bg-coral/4 transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="bg-coral/4 border border-coral/18 rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="font-serif text-xl font-light text-primary mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-2">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-2">Current Stock</label>
                  <input
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Min Stock</label>
                  <input
                    type="number"
                    value={newItem.minimumStock}
                    onChange={(e) => setNewItem({...newItem, minimumStock: parseInt(e.target.value) || 0})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                  >
                    <option value="個">個</option>
                    <option value="本">本</option>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                    <option value="セット">セット</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-2">Cost (¥)</label>
                  <input
                    type="number"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({...newItem, cost: parseFloat(e.target.value) || 0})}
                    className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-secondary mb-2">Supplier</label>
                <input
                  type="text"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                  className="w-full bg-coral/6 border border-coral/25 rounded-xl px-4 py-3 text-primary focus:border-coral/45 focus:bg-coral/8 transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="pill-button bg-coral/15 border border-coral/40 text-coral hover:bg-coral/25 hover:border-coral/60"
                >
                  ADD ITEM
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="pill-button bg-surface border border-hint/20 text-secondary hover:bg-surface-hover"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="mb-8 animate-fade-in-up animation-delay-450">
            <div className="flex items-center gap-4 mb-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-coral/70">Low Stock Alerts</div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-coral/25 to-transparent" />
              <div className="w-2 h-2 bg-coral rounded-full animate-pulse" />
            </div>
            <div className="grid gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="alert-card relative overflow-hidden bg-coral/8 border border-coral/25 rounded-xl p-4">
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-coral opacity-60" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary mb-1">{item.name}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-secondary">{item.category}</span>
                        <span className="font-mono text-xs text-coral">
                          {item.currentStock} / {item.minimumStock} {item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="status-badge bg-coral/15 border border-coral/30 text-coral">
                        LOW STOCK
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory List */}
        <div className="animate-fade-in-up animation-delay-600">
          <div className="font-mono text-[10px] uppercase tracking-widest text-pink/70 mb-4">Inventory Items</div>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-secondary">
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredInventory.map(item => {
                const stockStatus = getStockStatus(item);
                return (
                  <div key={item.id} className="item-card relative overflow-hidden bg-pink/3 border border-pink/15 rounded-xl p-4 hover:bg-pink/5 transition-all group">
                    <div className={`absolute left-0 top-0 w-0.5 h-full opacity-40 ${
                      stockStatus === 'low' ? 'bg-coral' :
                      stockStatus === 'high' ? 'bg-pink' :
                      'bg-gradient-to-b from-pink to-coral'
                    }`} />
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-primary mb-1">{item.name}</h4>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-secondary">{item.category}</span>
                          {item.supplier && (
                            <span className="font-mono text-xs text-hint uppercase tracking-wider">{item.supplier}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-pink">
                            Stock: {item.currentStock} {item.unit}
                          </span>
                          <span className="text-xs text-secondary">
                            Min: {item.minimumStock} {item.unit}
                          </span>
                          <span className="text-xs text-secondary">
                            ¥{item.cost.toLocaleString()} each
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStock(item.id, Math.max(0, item.currentStock - 1))}
                            className="w-8 h-8 rounded-lg bg-coral/10 border border-coral/25 text-coral hover:bg-coral/15 transition-all flex items-center justify-center"
                          >
                            −
                          </button>
                          <button
                            onClick={() => updateStock(item.id, item.currentStock + 1)}
                            className="w-8 h-8 rounded-lg bg-pink/10 border border-pink/25 text-pink hover:bg-pink/15 transition-all flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className={`status-badge ${
                          stockStatus === 'low' ? 'bg-coral/15 border-coral/30 text-coral' :
                          stockStatus === 'high' ? 'bg-pink/15 border-pink/30 text-pink' :
                          'bg-hint/5 border-hint/15 text-hint'
                        }`}>
                          {stockStatus === 'low' ? 'LOW' : stockStatus === 'high' ? 'FULL' : 'OK'}
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
          <div className="mt-8 bg-pink/4 border border-pink/18 rounded-2xl p-6 text-center animate-fade-in-up animation-delay-750">
            <h3 className="font-serif text-lg font-light text-primary mb-2">Advanced Inventory Features</h3>
            <p className="text-secondary mb-4">Automatic reordering, supplier integration, and detailed analytics</p>
            <button className="pill-button bg-pink/15 border border-pink/40 text-pink hover:bg-pink/25">
              UPGRADE TO PRO
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .inventory-tracker {
          max-width: 720px;
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

        .item-card, .alert-card {
          transition: all 0.3s ease;
        }

        .item-card:hover {
          transform: translateY(-1px);
        }

        .text-primary { color: rgba(245, 240, 250, 0.92); }
        .text-secondary { color: rgba(245, 240, 250, 0.45); }
        .text-hint { color: rgba(245, 240, 250, 0.2); }
        .placeholder-hint::placeholder { color: rgba(245, 240, 250, 0.2); }

        .bg-coral\/3 { background: rgba(240, 122, 106, 0.03); }
        .bg-coral\/4 { background: rgba(240, 122, 106, 0.04); }
        .bg-coral\/6 { background: rgba(240, 122, 106, 0.06); }
        .bg-coral\/8 { background: rgba(240, 122, 106, 0.08); }
        .bg-coral\/10 { background: rgba(240, 122, 106, 0.1); }
        .bg-coral\/15 { background: rgba(240, 122, 106, 0.15); }
        .bg-coral\/18 { background: rgba(240, 122, 106, 0.18); }
        .bg-coral\/25 { background: rgba(240, 122, 106, 0.25); }
        .border-coral\/15 { border-color: rgba(240, 122, 106, 0.15); }
        .border-coral\/18 { border-color: rgba(240, 122, 106, 0.18); }
        .border-coral\/25 { border-color: rgba(240, 122, 106, 0.25); }
        .border-coral\/30 { border-color: rgba(240, 122, 106, 0.3); }
        .border-coral\/35 { border-color: rgba(240, 122, 106, 0.35); }
        .border-coral\/40 { border-color: rgba(240, 122, 106, 0.4); }
        .border-coral\/45 { border-color: rgba(240, 122, 106, 0.45); }
        .border-coral\/60 { border-color: rgba(240, 122, 106, 0.6); }
        .text-coral { color: #f07a6a; }
        .text-coral\/70 { color: rgba(240, 122, 106, 0.7); }
        .bg-coral { background: #f07a6a; }

        .bg-pink\/3 { background: rgba(240, 196, 212, 0.03); }
        .bg-pink\/4 { background: rgba(240, 196, 212, 0.04); }
        .bg-pink\/5 { background: rgba(240, 196, 212, 0.05); }
        .bg-pink\/10 { background: rgba(240, 196, 212, 0.1); }
        .bg-pink\/15 { background: rgba(240, 196, 212, 0.15); }
        .bg-pink\/18 { background: rgba(240, 196, 212, 0.18); }
        .bg-pink\/25 { background: rgba(240, 196, 212, 0.25); }
        .border-pink\/15 { border-color: rgba(240, 196, 212, 0.15); }
        .border-pink\/18 { border-color: rgba(240, 196, 212, 0.18); }
        .border-pink\/25 { border-color: rgba(240, 196, 212, 0.25); }
        .border-pink\/30 { border-color: rgba(240, 196, 212, 0.3); }
        .border-pink\/40 { border-color: rgba(240, 196, 212, 0.4); }
        .text-pink { color: #f0c4d4; }
        .text-pink\/70 { color: rgba(240, 196, 212, 0.7); }
        .bg-pink { background: #f0c4d4; }

        .bg-surface { background: rgba(255, 255, 255, 0.03); }
        .bg-surface-hover { background: rgba(255, 255, 255, 0.06); }
        .border-hint\/15 { border-color: rgba(245, 240, 250, 0.15); }
        .border-hint\/20 { border-color: rgba(245, 240, 250, 0.2); }
        .bg-hint\/5 { background: rgba(245, 240, 250, 0.05); }

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