import { Component } from 'react';

const defaultFallback = ({ error, onReload }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 32,
      background: '#0d0d0f',
      color: '#ccc',
      fontFamily: 'JetBrains Mono, monospace',
      textAlign: 'center',
      minHeight: 200,
    }}
  >
    <p style={{ color: '#f87171', fontSize: 15, fontWeight: 600, margin: 0 }}>
      Something went wrong
    </p>
    <p style={{ color: '#888', fontSize: 13, margin: 0, maxWidth: 420 }}>
      {error?.message || 'An unexpected error occurred.'}
    </p>
    <button
      type="button"
      onClick={onReload}
      style={{
        padding: '10px 20px',
        background: 'hsl(119, 99%, 46%)',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
    >
      Reload
    </button>
  </div>
);

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback || defaultFallback;
      return (
        <Fallback
          error={this.state.error}
          onReload={this.handleReload}
          title={this.props.title}
        />
      );
    }
    return this.props.children;
  }
}

export const SandpackErrorFallback = ({ error, onReload }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 24,
      background: '#0d0d0f',
      color: '#888',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      minHeight: 120,
    }}
  >
    <p style={{ color: '#fbbf24', margin: 0 }}>Preview panel failed to load</p>
    <p style={{ margin: 0, maxWidth: 360 }}>
      {error?.message || 'Sandpack encountered an error.'} You can keep editing — try reloading.
    </p>
    <button
      type="button"
      onClick={onReload}
      style={{
        padding: '8px 16px',
        background: '#3c3c3c',
        color: '#ccc',
        border: '1px solid #555',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 12,
      }}
    >
      Reload
    </button>
  </div>
);
