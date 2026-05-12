import Purchases from "@revenuecat/purchases-js";

let isConfigured = false;
const API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || "YOUR_REVENUECAT_API_KEY";

// Initialize RevenueCat
export const initializeRevenueCat = (userId = null) => {
  try {
    if (!API_KEY || API_KEY.includes('YOUR_')) {
      console.warn('RevenueCat API key not configured. Subscription features will be disabled.');
      return;
    }
    
    if (!isConfigured) {
      Purchases.configure(API_KEY, userId);
      isConfigured = true;
    }
    
    if (userId && isConfigured) {
      Purchases.getSharedInstance().logIn(userId);
    }
  } catch (error) {
    console.error('RevenueCat initialization error:', error);
  }
};

// Check subscription status
export const checkEntitlements = async () => {
  try {
    if (!isConfigured) {
      return {
        isPro: false,
        isStarter: false,
        isProfessional: false,
        isEnterprise: false,
        customerInfo: null
      };
    }
    
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
    return {
      isPro: customerInfo.entitlements.active["pro"] !== undefined,
      isStarter: customerInfo.entitlements.active["starter"] !== undefined,
      isProfessional: customerInfo.entitlements.active["professional"] !== undefined,
      isEnterprise: customerInfo.entitlements.active["enterprise"] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error("RevenueCat entitlements error:", error);
    return {
      isPro: false,
      isStarter: false,
      isProfessional: false,
      isEnterprise: false,
      customerInfo: null
    };
  }
};

// Get available offerings
export const getOfferings = async () => {
  try {
    if (!isConfigured) {
      return null;
    }
    
    const offerings = await Purchases.getSharedInstance().getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("RevenueCat offerings error:", error);
    return null;
  }
};

// Purchase a package
export const purchasePackage = async (pkg) => {
  try {
    if (!isConfigured) {
      throw new Error('RevenueCat not configured');
    }
    
    const { customerInfo } = await Purchases.getSharedInstance().purchase({ rcPackage: pkg });
    return {
      success: true,
      isPro: customerInfo.entitlements.active["pro"] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error("RevenueCat purchase error:", error);
    return {
      success: false,
      error: error.message,
      customerInfo: null
    };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    if (!isConfigured) {
      throw new Error('RevenueCat not configured');
    }
    
    const customerInfo = await Purchases.getSharedInstance().restorePurchases();
    return {
      success: true,
      isPro: customerInfo.entitlements.active["pro"] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error("RevenueCat restore error:", error);
    return {
      success: false,
      error: error.message,
      customerInfo: null
    };
  }
};

// Get current customer info
export const getCustomerInfo = async () => {
  try {
    if (!isConfigured) {
      return null;
    }
    
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error("RevenueCat customer info error:", error);
    return null;
  }
};

// Check specific plan limits
export const getPlanLimits = (entitlements) => {
  if (entitlements.isEnterprise) {
    return {
      maxLocations: Infinity,
      hasAdvancedAnalytics: true,
      hasAutomatedMarketing: true,
      hasInventoryTracking: true,
      hasCrossLocationBooking: true,
      planName: "Enterprise",
      price: "$199/month"
    };
  }
  
  if (entitlements.isProfessional) {
    return {
      maxLocations: 10,
      hasAdvancedAnalytics: true,
      hasAutomatedMarketing: true,
      hasInventoryTracking: true,
      hasCrossLocationBooking: true,
      planName: "Professional",
      price: "$79/month"
    };
  }
  
  if (entitlements.isStarter) {
    return {
      maxLocations: 3,
      hasAdvancedAnalytics: false,
      hasAutomatedMarketing: false,
      hasInventoryTracking: true,
      hasCrossLocationBooking: true,
      planName: "Starter",
      price: "$29/month"
    };
  }
  
  // Free tier
  return {
    maxLocations: 1,
    hasAdvancedAnalytics: false,
    hasAutomatedMarketing: false,
    hasInventoryTracking: false,
    hasCrossLocationBooking: false,
    planName: "Free Trial",
    price: "$0"
  };
};

// Format plan features for display
export const getFeatureList = (planLimits) => {
  const features = [
    `Up to ${planLimits.maxLocations === Infinity ? 'unlimited' : planLimits.maxLocations} locations`
  ];
  
  if (planLimits.hasCrossLocationBooking) {
    features.push('Cross-location booking system');
  }
  
  if (planLimits.hasInventoryTracking) {
    features.push('Inventory tracking & alerts');
  }
  
  if (planLimits.hasAutomatedMarketing) {
    features.push('Automated marketing campaigns');
  }
  
  if (planLimits.hasAdvancedAnalytics) {
    features.push('Advanced analytics & reporting');
  }
  
  return features;
};

// Check if feature is available
export const canUseFeature = (feature, entitlements) => {
  const limits = getPlanLimits(entitlements);
  
  switch (feature) {
    case 'advanced_analytics':
      return limits.hasAdvancedAnalytics;
    case 'automated_marketing':
      return limits.hasAutomatedMarketing;
    case 'inventory_tracking':
      return limits.hasInventoryTracking;
    case 'cross_location_booking':
      return limits.hasCrossLocationBooking;
    case 'multiple_locations':
      return limits.maxLocations > 1;
    default:
      return true;
  }
};

// Upgrade prompts
export const getUpgradeMessage = (feature) => {
  const messages = {
    advanced_analytics: "Advanced analytics and reporting are available with Professional and Enterprise plans.",
    automated_marketing: "Automated marketing campaigns require a Professional or Enterprise subscription.",
    inventory_tracking: "Inventory tracking is available with Starter plan and above.",
    cross_location_booking: "Cross-location booking requires a Starter plan or higher.",
    multiple_locations: "Managing multiple locations requires a paid subscription."
  };
  
  return messages[feature] || "This feature requires a subscription upgrade.";
};