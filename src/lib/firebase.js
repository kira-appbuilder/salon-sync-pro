import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Validate configuration
const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('YOUR_');
if (!isConfigured) {
  console.warn('Firebase configuration incomplete. Please set environment variables or update config.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const signInUser = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Booking functions
export const addBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: new Date(),
      userId: auth.currentUser?.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Add booking error:', error);
    throw error;
  }
};

export const getBookings = async (locationId = null, limitCount = 50) => {
  try {
    let q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (locationId) {
      q = query(
        collection(db, 'bookings'),
        where('locationId', '==', locationId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get bookings error:', error);
    throw error;
  }
};

export const subscribeToBookings = (callback, locationId = null) => {
  let q = query(
    collection(db, 'bookings'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  if (locationId) {
    q = query(
      collection(db, 'bookings'),
      where('locationId', '==', locationId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(bookings);
  });
};

// Staff functions
export const addStaffMember = async (staffData) => {
  try {
    const docRef = await addDoc(collection(db, 'staff'), {
      ...staffData,
      createdAt: new Date(),
      userId: auth.currentUser?.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Add staff error:', error);
    throw error;
  }
};

export const getStaff = async (locationId = null) => {
  try {
    let q = query(collection(db, 'staff'), orderBy('name', 'asc'));
    
    if (locationId) {
      q = query(
        collection(db, 'staff'),
        where('locationId', '==', locationId),
        orderBy('name', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get staff error:', error);
    throw error;
  }
};

// Inventory functions
export const addInventoryItem = async (itemData) => {
  try {
    const docRef = await addDoc(collection(db, 'inventory'), {
      ...itemData,
      createdAt: new Date(),
      userId: auth.currentUser?.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Add inventory error:', error);
    throw error;
  }
};

export const getInventory = async (locationId = null) => {
  try {
    let q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    
    if (locationId) {
      q = query(
        collection(db, 'inventory'),
        where('locationId', '==', locationId),
        orderBy('name', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get inventory error:', error);
    throw error;
  }
};

// Customer functions
export const addCustomer = async (customerData) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: new Date(),
      loyaltyPoints: 0,
      userId: auth.currentUser?.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Add customer error:', error);
    throw error;
  }
};

export const getCustomers = async () => {
  try {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get customers error:', error);
    throw error;
  }
};

// Analytics functions
export const getRevenueData = async (locationId = null, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let q = query(
      collection(db, 'bookings'),
      where('createdAt', '>=', startDate),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );
    
    if (locationId) {
      q = query(
        collection(db, 'bookings'),
        where('locationId', '==', locationId),
        where('createdAt', '>=', startDate),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Get revenue data error:', error);
    throw error;
  }
};

// Update functions
export const updateBooking = async (bookingId, updates) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Update booking error:', error);
    throw error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
  } catch (error) {
    console.error('Delete booking error:', error);
    throw error;
  }
};

export const reportError = async (errorData) => {
  try {
    await addDoc(collection(db, 'error_reports'), {
      ...errorData,
      timestamp: new Date(),
      userId: auth.currentUser?.uid || 'anonymous',
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('Error reporting failed:', error);
  }
};

export const submitFeedback = async (feedbackData) => {
  try {
    await addDoc(collection(db, 'feedback'), {
      ...feedbackData,
      timestamp: new Date(),
      userId: auth.currentUser?.uid || 'anonymous'
    });
  } catch (error) {
    console.error('Feedback submission failed:', error);
    throw error;
  }
};