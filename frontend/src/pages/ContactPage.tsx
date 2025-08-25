function ContactPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
      <div className="d-flex justify-center align-center mb-4">
        <h1 className="text-center mb-4">
          <i className="fas fa-phone" style={{ marginRight: 'var(--spacing-sm)', color: 'var(--primary-color)' }}></i>
          İletişim
        </h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-body text-center">
          <div style={{ fontSize: '4rem', color: 'var(--primary-color)', marginBottom: 'var(--spacing-lg)' }}>
            <i className="fas fa-building"></i>
          </div>

          <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)' }}>
            Emlak Dükkanım
          </h3>

          <div className="d-flex flex-column gap-3" style={{ textAlign: 'left' }}>
            <div className="d-flex align-center gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)'
              }}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <strong>Adres</strong>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--text-secondary)' }}>
                  Örnek Mah. Örnek Sok. No:1<br />
                  İstanbul, Türkiye
                </p>
              </div>
            </div>

            <div className="d-flex align-center gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)'
              }}>
                <i className="fas fa-phone"></i>
              </div>
              <div>
                <strong>Telefon</strong>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--text-secondary)' }}>
                  0 (212) 123 45 67
                </p>
              </div>
            </div>

            <div className="d-flex align-center gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)'
              }}>
                <i className="fas fa-envelope"></i>
              </div>
              <div>
                <strong>E-posta</strong>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0', color: 'var(--text-secondary)' }}>
                  info@emlakdukkanim.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;

