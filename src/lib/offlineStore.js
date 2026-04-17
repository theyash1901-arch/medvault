import { get, set, del, keys } from 'idb-keyval';

// Offline data store using IndexedDB (via idb-keyval)
// Works like a simple key-value store that persists across sessions

export const offlineStore = {
  // Save any data locally
  save: async (key, data) => {
    try {
      await set(key, JSON.stringify(data));
    } catch (err) {
      console.error('Offline save failed:', err);
    }
  },

  // Load data from local store
  load: async (key) => {
    try {
      const data = await get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Offline load failed:', err);
      return null;
    }
  },

  // Remove data
  remove: async (key) => {
    try {
      await del(key);
    } catch (err) {
      console.error('Offline remove failed:', err);
    }
  },

  // Get all keys
  allKeys: async () => {
    try {
      return await keys();
    } catch (err) {
      console.error('Offline keys failed:', err);
      return [];
    }
  },

  // Save profile for offline QR access
  saveEmergencyData: async (profile, summary) => {
    const emergencyData = {
      name: profile?.full_name || '',
      blood_group: profile?.blood_group || '',
      dob: profile?.date_of_birth || '',
      gender: profile?.gender || '',
      emergency_contact: profile?.emergency_contact_name || '',
      emergency_phone: profile?.emergency_contact_phone || '',
      conditions: summary?.conditions || [],
      allergies: summary?.allergies || [],
      medications: summary?.current_medications || [],
      updated_at: new Date().toISOString(),
    };
    await set('emergency_qr_data', JSON.stringify(emergencyData));
    return emergencyData;
  },

  getEmergencyData: async () => {
    try {
      const data = await get('emergency_qr_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // ----------------------------------------
  // Feature 6: Sync Queue mechanism
  // ----------------------------------------
  
  // Add operation to queue
  addToSyncQueue: async (operation) => {
    try {
      const queueStr = await get('sync_queue');
      const queue = queueStr ? JSON.parse(queueStr) : [];
      queue.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...operation
      });
      await set('sync_queue', JSON.stringify(queue));
      return true;
    } catch (err) {
      console.error('Failed to add to sync queue:', err);
      return false;
    }
  },

  // Get current sync queue
  getSyncQueue: async () => {
    try {
      const queueStr = await get('sync_queue');
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  },

  // Remove successful operation from queue
  removeFromSyncQueue: async (operationId) => {
    try {
      const queueStr = await get('sync_queue');
      if (!queueStr) return;
      const queue = JSON.parse(queueStr);
      const newQueue = queue.filter(item => item.id !== operationId);
      await set('sync_queue', JSON.stringify(newQueue));
    } catch (err) {
      console.error('Failed to remove from sync queue:', err);
    }
  },
};
