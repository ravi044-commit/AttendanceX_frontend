import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#090d16',
          color: '#f87171',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#fff' }}>
            Application Error
          </h2>
          <pre style={{
            background: '#1e293b',
            padding: '16px',
            borderRadius: '12px',
            maxWidth: '600px',
            overflowX: 'auto',
            color: '#fca5a5',
            fontSize: '13px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
