import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://qdldbgaoweqqcvdvlwfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGRiZ2Fvd2VxcWN2ZHZsd2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNjc5MTYsImV4cCI6MjA3MTY0MzkxNn0.WxUiQt7y2b89IdwjkIduLy_6dF0x66iGSIUu3dCSehM';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for API calls
export const api = {
  // Authentication
  async login(username: string, password: string) {
    // For now, we'll use a simple check against hardcoded admin credentials
    // Later we can move this to Supabase Auth or a database table
    if (username === 'admin' && password === 'vakvak12') {
      const token = 'admin-token-' + Date.now(); // Simple token for demo
      localStorage.setItem('adminToken', token);
      return { token, username };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  async verifyToken() {
    const token = localStorage.getItem('adminToken');
    if (token && token.startsWith('admin-token-')) {
      return { valid: true, username: 'admin' };
    } else {
      localStorage.removeItem('adminToken');
      throw new Error('Invalid token');
    }
  },

  // Listings
  async getListings() {
    // Check if user is admin to determine which view to use
    const token = localStorage.getItem('adminToken');
    const isAdmin = token && token.startsWith('admin-token-');
    
    if (isAdmin) {
      // Admin can see all listing details including owner info
      const { data, error } = await supabase
        .from('ilan')
        .select('*')
        .order('ilan_tarihi', { ascending: false });
      
      if (error) throw error;
      return data;
    } else {
      // Regular users see limited info (no owner details)
      const { data, error } = await supabase
        .from('ilan')
        .select(`
          ilan_no,
          ilan_tarihi,
          baslik,
          emlak_tipi,
          fiyat,
          detay,
          m2,
          il,
          ilce,
          mahalle,
          sahibinden_no,
          sahibinden_tarih,
          ada,
          parsel,
          oda_sayisi,
          bina_yasi,
          bulundugu_kat,
          kat_sayisi,
          isitma,
          banyo_sayisi,
          balkon,
          asansor,
          esyali,
          aidat,
          fotolar
        `)
        .order('ilan_tarihi', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  async addListing(listing: any) {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    if (!token || !token.startsWith('admin-token-')) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('ilan')
      .insert([{
        ...listing,
        ilan_tarihi: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteListing(id: number) {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    if (!token || !token.startsWith('admin-token-')) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('ilan')
      .delete()
      .eq('ilan_no', id);
    
    if (error) throw error;
    return true;
  }
};

export default api;
