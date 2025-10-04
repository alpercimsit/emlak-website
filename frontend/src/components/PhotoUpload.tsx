import { useState, useRef, useCallback } from 'react';
import api from '../utils/api';

interface Photo {
  id: string;
  url: string;
  file?: File;
  uploading?: boolean;
}

interface Props {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  listingId?: number; // For organizing photos in storage
}

function PhotoUpload({ photos, onPhotosChange, maxPhotos = 30, listingId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePhotoId = () => `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // WhatsApp tarzı fotoğraf sıkıştırma fonksiyonu
  const compressImage = (file: File, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Orijinal boyutları al
        let { width, height } = img;
        
        // Boyutları optimize et (WhatsApp mantığı)
        if (width > height) {
          // Yatay fotoğraf
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          // Dikey fotoğraf
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Canvas boyutlarını ayarla
        canvas.width = width;
        canvas.height = height;
        
        // Fotoğrafı çiz (yüksek kalite için imageSmoothingEnabled)
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Blob'a dönüştür
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Hata durumunda orijinal dosyayı döndür
            }
          }, 'image/jpeg', quality);
        } else {
          resolve(file);
        }
      };
      
      img.onerror = () => resolve(file); // Hata durumunda orijinal dosyayı döndür
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToSupabase = async (file: File, photoId: string): Promise<string> => {
    // Use the centralized upload function from API
    return await api.uploadPhoto(file, listingId);
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      // Only accept image files
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" geçerli bir resim dosyası değil.`);
        return false;
      }
      
      // Check file size (max 50MB before compression)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`"${file.name}" çok büyük. Maksimum 50MB olmalı.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Check if we exceed max photos
    if (photos.length + validFiles.length > maxPhotos) {
      alert(`En fazla ${maxPhotos} fotoğraf yükleyebilirsiniz.`);
      return;
    }

    // Compress images first (WhatsApp style)
    const compressedFiles: File[] = [];
    for (const file of validFiles) {
      try {
        const compressedFile = await compressImage(file);
        compressedFiles.push(compressedFile);
        console.log(`${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      } catch (error) {
        console.error('Compression failed for:', file.name, error);
        compressedFiles.push(file); // Use original if compression fails
      }
    }

    // Create photo objects with temporary IDs
    const newPhotos: Photo[] = compressedFiles.map(file => ({
      id: generatePhotoId(),
      url: URL.createObjectURL(file),
      file,
      uploading: true
    }));

    // Add photos to state immediately for preview
    const updatedPhotos = [...photos, ...newPhotos];
    onPhotosChange(updatedPhotos);

    // Upload files to Supabase
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      try {
        const publicUrl = await uploadToSupabase(photo.file!, photo.id);
        
        // Update photo with actual URL and remove uploading state
        const photoIndex = updatedPhotos.findIndex(p => p.id === photo.id);
        if (photoIndex !== -1) {
          updatedPhotos[photoIndex] = {
            ...photo,
            url: publicUrl,
            uploading: false
          };
          delete updatedPhotos[photoIndex].file;
          onPhotosChange([...updatedPhotos]);
        }
      } catch (error) {
        console.error('Upload failed for photo:', photo.id, error);
        console.error('Error details:', error);
        // Remove failed photo
        const filteredPhotos = updatedPhotos.filter(p => p.id !== photo.id);
        onPhotosChange(filteredPhotos);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        alert(`Fotoğraf yükleme başarısız oldu: ${errorMessage}. Lütfen tekrar deneyin.`);
      }
    }
  }, [photos, onPhotosChange, maxPhotos, listingId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [handleFiles]);

  const removePhoto = useCallback(async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    // If photo is uploaded to Supabase, delete it
    if (photo.url && photo.url.includes('supabase')) {
      try {
        await api.deletePhoto(photo.url);
      } catch (error) {
        console.error('Failed to delete photo from storage:', error);
      }
    }

    // Remove from local state
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="photo-upload">
      <label className="form-label">
        <i className="fas fa-images" style={{ marginRight: 'var(--spacing-sm)' }}></i>
        Fotoğraflar ({photos.length}/{maxPhotos})
      </label>
      
      {/* Upload Area */}
      <div
        className={`photo-upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="upload-content">
          <i className="fas fa-cloud-upload-alt"></i>
          <p>
            Fotoğrafları buraya sürükleyin veya <strong>tıklayın</strong>
          </p>
          <small className="text-muted">
            PNG, JPG, JPEG desteklenir • En fazla {maxPhotos} fotoğraf • Otomatik sıkıştırma
          </small>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="photo-preview-grid">
          {photos.map((photo, index) => (
            <div key={photo.id} className="photo-preview-item">
              <img src={photo.url} alt={`Fotoğraf ${index + 1}`} />
              
              {/* Loading Overlay */}
              {photo.uploading && (
                <div className="photo-loading-overlay">
                  <div className="spinner"></div>
                  <small>Yükleniyor...</small>
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                className="photo-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(photo.id);
                }}
                disabled={photo.uploading}
              >
                <i className="fas fa-times"></i>
              </button>

              {/* Main Photo Indicator */}
              {index === 0 && (
                <div className="main-photo-badge">
                  <i className="fas fa-star"></i>
                  Ana Fotoğraf
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default PhotoUpload;
