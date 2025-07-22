import React from 'react';

const RedirectNotice = () => {
  React.useEffect(() => {
    // Redirect after 3 seconds
    setTimeout(() => {
      window.location.href = 'https://lechworld.fly.dev';
    }, 3000);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#1e40af', marginBottom: '20px' }}>
          🚀 Estamos mudando!
        </h1>
        
        <p style={{ color: '#334155', marginBottom: '30px', fontSize: '18px' }}>
          O Milhas Lech agora é <strong>LechWorld</strong>!
        </p>
        
        <p style={{ color: '#64748b', marginBottom: '30px' }}>
          Você será redirecionado automaticamente em alguns segundos...
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '9999px',
              animation: 'progress 3s linear'
            }} />
          </div>
        </div>
        
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Se não for redirecionado, 
          <a href="https://lechworld.fly.dev" style={{ color: '#3b82f6', marginLeft: '5px' }}>
            clique aqui
          </a>
        </p>
      </div>
      
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default RedirectNotice;