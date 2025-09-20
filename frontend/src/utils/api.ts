import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://qdldbgaoweqqcvdvlwfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGRiZ2Fvd2VxcWN2ZHZsd2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNjc5MTYsImV4cCI6MjA3MTY0MzkxNn0.WxUiQt7y2b89IdwjkIduLy_6dF0x66iGSIUu3dCSehM';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache management
class ApiCache {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static clear(): void {
    this.cache.clear();
  }
}

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
      // Regular users see limited info (no owner details) and only non-hidden listings
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
          fotolar,
          gizli
        `)
        .eq('gizli', false) // Only show non-hidden listings to regular users
        .order('ilan_tarihi', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  async getListingById(id: number) {
    // Check if user is admin to determine which view to use
    const token = localStorage.getItem('adminToken');
    const isAdmin = token && token.startsWith('admin-token-');
    
    if (isAdmin) {
      // Admin can see all listing details including owner info
      const { data, error } = await supabase
        .from('ilan')
        .select('*')
        .eq('ilan_no', id)
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Regular users see limited info (no owner details) and only non-hidden listings
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
          fotolar,
          gizli
        `)
        .eq('ilan_no', id)
        .eq('gizli', false) // Only show non-hidden listings to regular users
        .single();
      
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

    // Convert form data to database format
    const listingData = {
      ilan_tarihi: new Date().toISOString(),
      baslik: listing.baslik,
      emlak_tipi: listing.emlak_tipi,
      fiyat: listing.fiyat,
      detay: listing.detay,
      m2: listing.m2,
      il: listing.il,
      ilce: listing.ilce,
      mahalle: listing.mahalle,
      sahibinden_no: listing.sahibinden_no,
      sahibi_ad: listing.sahibi_ad,
      sahibi_tel: listing.sahibi_tel,
      sahibinden_tarih: listing.sahibinden_tarih || null,
      ada: listing.ada,
      parsel: listing.parsel,
      oda_sayisi: listing.oda_sayisi,
      bina_yasi: listing.bina_yasi,
      bulundugu_kat: listing.bulundugu_kat,
      kat_sayisi: listing.kat_sayisi,
      isitma: listing.isitma,
      banyo_sayisi: listing.banyo_sayisi,
      balkon: listing.balkon,
      asansor: listing.asansor,
      esyali: listing.esyali,
      aidat: listing.aidat,
      fotolar: listing.fotolar,
      gizli: listing.gizli || false // Default to false (not hidden)
    };

    console.log('Inserting listing data:', listingData);

    const { data, error } = await supabase
      .from('ilan')
      .insert([listingData])
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Successfully inserted:', data);
    return data[0];
  },

  async updateListing(id: number, updates: any) {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    if (!token || !token.startsWith('admin-token-')) {
      throw new Error('Unauthorized');
    }

    // Handle nullable date field
    if (updates.hasOwnProperty('sahibinden_tarih') && updates.sahibinden_tarih === '') {
      updates.sahibinden_tarih = null;
    }

    const { data, error } = await supabase
      .from('ilan')
      .update(updates)
      .eq('ilan_no', id)
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return data[0];
  },

  async deleteListing(id: number) {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    if (!token || !token.startsWith('admin-token-')) {
      throw new Error('Unauthorized');
    }

    // First, get the listing to access its photos
    const { data: listing, error: getError } = await supabase
      .from('ilan')
      .select('fotolar')
      .eq('ilan_no', id)
      .single();

    if (getError) throw getError;

    // Delete associated photos from storage
    if (listing?.fotolar) {
      await this.deletePhotosFromStorage(listing.fotolar);
    }

    const { error } = await supabase
      .from('ilan')
      .delete()
      .eq('ilan_no', id);
    
    if (error) throw error;
    return true;
  },

  // Photo management functions
  async deletePhotosFromStorage(photoUrls: string) {
    if (!photoUrls) return;

    const urls = photoUrls.split(',').filter(url => url.trim());
    const filesToDelete: string[] = [];

    for (const url of urls) {
      if (url.includes('supabase')) {
        // Extract filename from URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          filesToDelete.push(fileName);
        }
      }
    }

    if (filesToDelete.length > 0) {
      try {
        const { error } = await supabase.storage
          .from('ilan_fotolari')
          .remove(filesToDelete);
        
        if (error) {
          console.error('Error deleting photos from storage:', error);
        }
      } catch (error) {
        console.error('Error deleting photos from storage:', error);
      }
    }
  },

  async uploadPhoto(file: File, listingId?: number): Promise<string> {
    console.log('Starting photo upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${listingId || 'temp'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = fileName;

    console.log('Upload path:', filePath);

    // First, test if we can access the storage bucket
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      if (listError) {
        console.error('Cannot list buckets:', listError);
        throw new Error(`Storage erişim hatası: ${listError.message}`);
      }
    } catch (e) {
      console.error('Storage access test failed:', e);
      throw new Error('Supabase Storage erişilemez. Bağlantıyı kontrol edin.');
    }

    const { data, error } = await supabase.storage
      .from('ilan_fotolari')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      console.error('Error message:', error.message);
      
      if (error.message?.includes('already exists')) {
        throw new Error('Bu dosya zaten mevcut. Farklı bir dosya deneyin.');
      } else if (error.message?.includes('too large') || error.message?.includes('413')) {
        throw new Error('Dosya boyutu çok büyük. Maksimum 10MB olmalı.');
      } else if (error.message?.includes('Invalid MIME type')) {
        throw new Error('Geçersiz dosya türü. Sadece resim dosyaları yükleyebilirsiniz.');
      } else if (error.message?.includes('row-level security policy')) {
        throw new Error('Yetkilendirme hatası: Storage bucket ayarları kontrol edilmeli.');
      } else {
        throw new Error(`Yükleme hatası: ${error.message}`);
      }
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ilan_fotolari')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);
    return publicUrl;
  },

  async deletePhoto(photoUrl: string): Promise<void> {
    if (!photoUrl || !photoUrl.includes('supabase')) return;

    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (fileName) {
      const { error } = await supabase.storage
        .from('ilan_fotolari')
        .remove([fileName]);
      
      if (error) {
        console.error('Error deleting photo:', error);
        throw error;
      }
    }
  },

  // Helper function to convert photo objects to URL string for database
  photosToUrlString(photos: Array<{url: string}>): string {
    return photos.map(photo => photo.url).filter(url => url).join(',');
  },

  // Helper function to convert URL string to photo objects
  urlStringToPhotos(urlString: string): Array<{id: string, url: string}> {
    if (!urlString) return [];

    return urlString.split(',')
      .filter(url => url.trim())
      .map((url, index) => ({
        id: `existing_${index}_${Date.now()}`,
        url: url.trim()
      }));
  },

  // TürkiyeAPI integration for location selection
  async getProvinces(): Promise<Array<{id: number, name: string}>> {
    const cacheKey = 'turkey_api_provinces';

    // Check cache first
    const cachedData = ApiCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await fetch('https://turkiyeapi.dev/api/v1/provinces');
      const result = await response.json();

      if (result.status === 'OK') {
        const provinces = result.data.map((province: any) => ({
          id: province.id,
          name: province.name
        }));

        // Cache the result
        ApiCache.set(cacheKey, provinces);

        return provinces;
      } else {
        throw new Error('Failed to fetch provinces');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  },

  async getDistricts(provinceId: number): Promise<Array<{id: number, name: string}>> {
    const cacheKey = `turkey_api_districts_${provinceId}`;

    // Check cache first
    const cachedData = ApiCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await fetch(`https://turkiyeapi.dev/api/v1/provinces/${provinceId}`);
      const result = await response.json();

      if (result.status === 'OK') {
        const districts = result.data.districts.map((district: any) => ({
          id: district.id,
          name: district.name
        }));

        // Cache the result
        ApiCache.set(cacheKey, districts);

        return districts;
      } else {
        throw new Error('Failed to fetch districts');
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      throw error;
    }
  },

  async getNeighborhoods(districtId: number): Promise<Array<{id: number, name: string}>> {
    const cacheKey = `turkey_api_neighborhoods_${districtId}`;

    // Check cache first
    const cachedData = ApiCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await fetch(`https://turkiyeapi.dev/api/v1/districts/${districtId}`);
      const result = await response.json();

      if (result.status === 'OK') {
        const neighborhoods = result.data.neighborhoods.map((neighborhood: any) => ({
          id: neighborhood.id,
          name: neighborhood.name
        }));

        // Cache the result
        ApiCache.set(cacheKey, neighborhoods);

        return neighborhoods;
      } else {
        throw new Error('Failed to fetch neighborhoods');
      }
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      throw error;
    }
  }
};

export default api;
