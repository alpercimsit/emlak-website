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
      sahibinden_tarih: listing.sahibinden_tarih,
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
  }
};

export default api;
