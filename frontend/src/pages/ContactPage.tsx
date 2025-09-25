import { useEffect } from 'react';

function ContactPage() {
  useEffect(() => {
    // Initialize map when component mounts
    const initializeMap = () => {
      // Check if Leaflet is already loaded
      if (typeof window.L === 'undefined') {
        // Load Leaflet CSS and JS if not already loaded
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          createMap();
        };
        document.head.appendChild(script);
      } else {
        createMap();
      }
    };

    const createMap = () => {
      // Coordinates for Büyükyoncalı Mah. Atatürk Cad. No: 27/1B Saray Tekirdağ
      // Approximate coordinates for Tekirdağ, Saray district
      const latitude = 41.377956;
      const longitude = 27.928578;

      const map = window.L.map('contact-map').setView([latitude, longitude], 15);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = window.L.marker([latitude, longitude]).addTo(map);
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>Öz Kafkas Emlak</strong><br/>
          Büyükyoncalı Mah. Atatürk Cad. No: 27/1B<br/>
          Saray / Tekirdağ
        </div>
      `).openPopup();
    };

    initializeMap();
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-xl)' }}>

      {/* Main Content - Map and Contact Info Side by Side */}
      <div className="card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card-body">
          {/* Contact Information - Right Side */}
          <div className="col-12 col-lg-6">
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Address Section */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <div className="d-flex align-center gap-3" style={{ textAlign: 'left' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)',
                      flexShrink: 0
                    }}>
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>Adres</strong>
                      <p style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        Büyükyoncalı Mah. Atatürk Cad. No: 27/1B<br />
                        Saray / Tekirdağ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Persons Section */}
                <div style={{ flex: 1 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)',
                      flexShrink: 0,
                      float: 'left',
                      marginRight: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-sm)'
                    }}>
                      <i className="fas fa-phone"></i>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <strong style={{ fontSize: '1.1rem' }}>İletişim</strong>
                      <div className="d-flex flex-column gap-2" style={{ marginTop: 'var(--spacing-sm)' }}>
                        <div className="d-flex align-center gap-3">
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)', minWidth: '120px' }}>
                            Ünal Aytekin:
                          </span>
                            0536 642 47 52
                        </div>
                        <div className="d-flex align-center gap-3">
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)', minWidth: '120px' }}>
                            Metin Cimşit:
                          </span>
                            0532 063 73 62
                        </div>
                        <div className="d-flex align-center gap-3">
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)', minWidth: '120px' }}>
                            Akın İncedere:
                          </span>
                            0530 465 04 14
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          <div className="row" style={{ gap: 'var(--spacing-lg)' }}>
            {/* Map Section - Left Side */}
            <div className="col-12 col-lg-6">
              <div id="contact-map" style={{
                width: '100%',
                height: '400px',
                borderRadius: 'var(--radius-md)',
                zIndex: 1,
                border: '2px solid var(--border-color)'
              }}></div>
              <p style={{
                marginTop: 'var(--spacing-md)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontSize: '0.9rem'
              }}>
                <i className="fas fa-info-circle" style={{ marginRight: 'var(--spacing-xs)' }}></i>
                Haritada işaretli noktada bizi bulabilirsiniz.
              </p>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;

