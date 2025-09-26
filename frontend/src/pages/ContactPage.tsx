import { useEffect } from 'react';

function ContactPage() {
  useEffect(() => {
    // Initialize Google Map when component mounts
    const initializeMap = () => {
      // Check if Google Maps is loaded
      if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
        // Wait for Google Maps API to load
        const checkGoogleMaps = () => {
          if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
            createMap();
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
      } else {
        createMap();
      }
    };

    const createMap = () => {
      // Coordinates for Büyükyoncalı Mah. Atatürk Cad. No: 27/1B Saray Tekirdağ
      const latitude = 41.377956;
      const longitude = 27.928578;

      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 18,
        mapTypeId: 'hybrid',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true

      };

      const map = new window.google.maps.Map(document.getElementById('contact-map'), mapOptions);

      // Create marker
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: 'Öz Kafkas Emlak'
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="text-align: center; font-family: Arial, sans-serif;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Öz Kafkas Emlak</h4>
            <p style="margin: 0; color: #666;">Büyükyoncalı Mah. Atatürk Cad. No: 27/1B<br>Saray / Tekirdağ</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Open info window by default
      infoWindow.open(map, marker);
    };

    initializeMap();
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-xl)' }}>

      {/* Main Content - Map and Contact Info Side by Side */}
      <div className="card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card-body">
          <div className="row" style={{ gap: 'var(--spacing-lg)' }}>
            {/* Left Side - Address and Contact Info */}
            <div className="col-12 col-lg-6">
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Address and Contact Sections Side by Side */}
                <div style={{ display: 'flex', gap: 'var(--spacing-lg)', padding: '0 0 var(--spacing-lg) 0' }}>
                  {/* Address Section - Left */}
                  <div style={{ flex: 1 }}>
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

                  {/* Contact Persons Section - Right */}
                  <div style={{ flex: 1 }}>
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
                        <i className="fas fa-phone"></i>
                      </div>
                      <div>
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
            </div>

            {/* Map Section - Right Side */}
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

