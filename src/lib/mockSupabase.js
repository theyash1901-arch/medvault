// src/lib/mockSupabase.js
const delay = (ms) => Promise.resolve();

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.data = JSON.parse(localStorage.getItem(`mock_db_${table}`) || '[]');
    this.queryType = null;
    this.filters = [];
    this.singleResult = false;
    this.limitCount = null;
    this.orderConfig = null;
    this.payload = null;
    this.selectQuery = null;
  }

  saveData(newData) {
    localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(newData));
    this.data = newData;
  }

  select(q = '*') { 
    if (!this.queryType) this.queryType = 'select'; 
    this.selectQuery = q; 
    return this; 
  }
  
  insert(payload) { 
    this.queryType = 'insert'; 
    this.payload = Array.isArray(payload) ? payload : [payload]; 
    return this; 
  }
  
  upsert(payload, config) { 
    this.queryType = 'upsert'; 
    this.payload = Array.isArray(payload) ? payload : [payload]; 
    this.onConflict = config?.onConflict || 'id';
    return this; 
  }
  
  update(payload) { 
    this.queryType = 'update'; 
    this.payload = payload; 
    return this; 
  }
  
  delete() { 
    this.queryType = 'delete'; 
    return this; 
  }

  eq(col, val) { this.filters.push({ type: 'eq', col, val }); return this; }
  ilike(col, val) { this.filters.push({ type: 'ilike', col, val }); return this; }
  is(col, val) { this.filters.push({ type: 'is', col, val }); return this; }
  
  limit(n) { this.limitCount = n; return this; }
  single() { this.singleResult = true; return this; }
  order(col, config = { ascending: true }) { this.orderConfig = { col, ...config }; return this; }

  applyFilters(rows) {
    let result = [...rows];
    for (let f of this.filters) {
      if (f.type === 'eq') result = result.filter(r => r[f.col] === f.val);
      if (f.type === 'is') result = result.filter(r => r[f.col] === f.val);
      if (f.type === 'ilike') {
        const term = f.val.replace(/%/g, '').toLowerCase();
        result = result.filter(r => r[f.col] && String(r[f.col]).toLowerCase().includes(term));
      }
    }
    return result;
  }

  async execute() {
    await delay(300); // Simulate network delay
    let result = null;

    if (this.queryType === 'select') {
      let rows = this.applyFilters(this.data);
      
      if (this.orderConfig) {
        rows.sort((a, b) => {
           let valA = a[this.orderConfig.col]; let valB = b[this.orderConfig.col];
           if (this.orderConfig.ascending) return valA > valB ? 1 : -1;
           return valA < valB ? 1 : -1;
        });
      }
      if (this.limitCount) rows = rows.slice(0, this.limitCount);
      
      // Inject relational data if requested (specifically for access grants)
      if (this.table === 'access_grants' && this.selectQuery?.includes('doctor:profiles')) {
        const profiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
        rows = rows.map(r => ({
          ...r,
          doctor: profiles.find(p => p.id === r.doctor_id) || null
        }));
      }

      result = this.singleResult ? (rows[0] || null) : rows;
      if (this.singleResult && !result) {
         return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
      }
      return { data: result, error: null };
    }

    if (this.queryType === 'insert') {
      const newItems = this.payload.map(item => ({ id: generateUUID(), ...item }));
      this.saveData([...this.data, ...newItems]);
      result = this.singleResult ? newItems[0] : newItems;
      return { data: result, error: null };
    }

    if (this.queryType === 'upsert') {
      const newItems = [];
      const currentData = [...this.data];
      
      this.payload.forEach(item => {
        const conflictKey = this.onConflict;
        if (conflictKey === 'patient_id') {
           const existingIdx = currentData.findIndex(d => d.patient_id === item.patient_id);
           if (existingIdx >= 0) { currentData[existingIdx] = { ...currentData[existingIdx], ...item }; newItems.push(currentData[existingIdx]); }
           else { const n = { id: generateUUID(), ...item }; currentData.push(n); newItems.push(n); }
        } else {
           const existingIdx = currentData.findIndex(d => d.id === item.id);
           if (existingIdx >= 0) { currentData[existingIdx] = { ...currentData[existingIdx], ...item }; newItems.push(currentData[existingIdx]); }
           else { const n = { id: item.id || generateUUID(), ...item }; currentData.push(n); newItems.push(n); }
        }
      });
      
      this.saveData(currentData);
      result = this.singleResult ? newItems[0] : newItems;
      return { data: result, error: null };
    }

    if (this.queryType === 'update') {
      let updatedData = [...this.data];
      let affected = [];
      const matchPredicate = (row) => {
         return this.applyFilters([row]).length > 0;
      };
      
      updatedData = updatedData.map(row => {
        if (matchPredicate(row)) {
          const modInfo = { ...row, ...this.payload };
          affected.push(modInfo);
          return modInfo;
        }
        return row;
      });

      this.saveData(updatedData);
      result = this.singleResult ? affected[0] : affected;
      return { data: result, error: null };
    }

    if (this.queryType === 'delete') {
      const matchPredicate = (row) => this.applyFilters([row]).length > 0;
      const initialLength = this.data.length;
      const newData = this.data.filter(row => !matchPredicate(row));
      this.saveData(newData);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  // To support await supabase.from().... directly
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export class MockSupabaseClient {
  constructor() {
    this.authListeners = [];
    this.currentUser = JSON.parse(localStorage.getItem('mock_supabase_user') || 'null');
    
    this.auth = {
      getSession: async () => {
        return { data: { session: this.currentUser ? { user: this.currentUser, access_token: 'mock-token' } : null }, error: null };
      },
      onAuthStateChange: (callback) => {
        this.authListeners.push(callback);
        // Initial fire
        setTimeout(() => callback('INITIAL_SESSION', this.currentUser ? { user: this.currentUser } : null), 10);
        return {
          data: { subscription: { unsubscribe: () => { this.authListeners = this.authListeners.filter(cb => cb !== callback); } } }
        };
      },
      signUp: async ({ email, password }) => {
        await delay(500);
        const users = JSON.parse(localStorage.getItem('mock_db_auth_users') || '[]');
        if (users.find(u => u.email === email)) {
          return { data: null, error: { message: 'User already exists' } };
        }
        const newUser = { id: generateUUID(), email, password }; // In real app don't store plain pwd
        users.push(newUser);
        localStorage.setItem('mock_db_auth_users', JSON.stringify(users));
        
        this.currentUser = newUser;
        localStorage.setItem('mock_supabase_user', JSON.stringify(newUser));
        this.emitAuthChange('SIGNED_IN');
        return { data: { user: newUser, session: { user: newUser } }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        await delay(500);
        const users = JSON.parse(localStorage.getItem('mock_db_auth_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) return { data: null, error: { message: 'Invalid credentials' } };
        
        this.currentUser = user;
        localStorage.setItem('mock_supabase_user', JSON.stringify(user));
        this.emitAuthChange('SIGNED_IN');
        return { data: { user, session: { user } }, error: null };
      },
      signOut: async () => {
        await delay(300);
        this.currentUser = null;
        localStorage.removeItem('mock_supabase_user');
        this.emitAuthChange('SIGNED_OUT');
        return { error: null };
      }
    };
  }

  emitAuthChange(event) {
    const session = this.currentUser ? { user: this.currentUser } : null;
    this.authListeners.forEach(listener => listener(event, session));
  }

  from(table) {
    return new MockQueryBuilder(table);
  }
}
