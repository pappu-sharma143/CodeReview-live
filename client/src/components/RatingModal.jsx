import { useState } from 'react';
import api from '../api/axios';

const RatingModal = ({ sessionId, creator, onClose, onRated }) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const labels = {
    1: 'Poor code',
    2: 'Needs work',
    3: 'Decent',
    4: 'Good code',
    5: 'Excellent code!',
  };

  const handleSubmit = async () => {
    if (!rating) return setError('Please select a rating');
    if (!creator) return setError('Session creator not found');

    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post(`/ratings/session/${sessionId}`, { rating });
      onRated(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#1e1e1e', borderRadius: 16,
        padding: 32, width: 400,
        border: '1px solid #3d3d3d',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{
          color: '#f0f0f5', fontSize: 20,
          fontWeight: 700, margin: '0 0 8px',
          fontFamily: 'Syne, sans-serif',
        }}>
          Rate the code quality
        </h2>
        <p style={{
          color: '#888', fontSize: 13,
          fontFamily: 'monospace', margin: '0 0 24px',
        }}>
          Your rating helps build the creator&apos;s reputation
        </p>

        {creator ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: '#252526',
            borderRadius: 8, marginBottom: 24,
            border: '1px solid #3d3d3d',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'hsl(119, 99%, 46%)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 600,
            }}>
              {creator.username[0].toUpperCase()}
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 14, margin: 0, fontWeight: 500 }}>
                {creator.username}
              </p>
              <p style={{ color: '#888', fontSize: 11, margin: 0, fontFamily: 'monospace' }}>
                session creator · rep {creator.reputation || 0}/100
              </p>
            </div>
          </div>
        ) : (
          <p style={{
            color: '#888', fontSize: 12, fontFamily: 'monospace',
            marginBottom: 20, lineHeight: 1.5,
          }}>
            Could not load creator info for this session.
          </p>
        )}

        {creator && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: '#888', fontSize: 11, fontFamily: 'monospace', marginBottom: 12 }}>
              CODE QUALITY
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  style={{
                    background: 'none', border: 'none',
                    fontSize: 36, cursor: 'pointer',
                    opacity: star <= (hoveredStar || rating) ? 1 : 0.3,
                    transform: star <= (hoveredStar || rating)
                      ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            {(hoveredStar || rating) > 0 && (
              <p style={{
                textAlign: 'center', color: 'hsl(119, 99%, 46%)',
                fontSize: 14, fontWeight: 600,
                margin: '8px 0 0', fontFamily: 'monospace',
              }}>
                {labels[hoveredStar || rating]}
              </p>
            )}
          </div>
        )}

        {error && (
          <p style={{
            color: '#f44747', fontSize: 12,
            fontFamily: 'monospace', marginBottom: 12,
          }}>
            ⚠ {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12,
              background: '#3c3c3c', color: '#ccc',
              border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 13,
              fontFamily: 'monospace',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating || submitting || !creator}
            style={{
              flex: 2, padding: 12,
              background: rating && creator ? 'hsl(119, 99%, 46%)' : '#3c3c3c',
              color: rating && creator ? '#fff' : '#666',
              border: 'none', borderRadius: 8,
              cursor: rating && creator ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'monospace',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : `Submit ${rating ? `(${rating}★)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
