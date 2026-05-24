import { useState } from 'react';
import api from '../api/axios';

const RatingModal = ({ sessionId, reviewers, onClose, onRated }) => {
  const [selectedReviewer, setSelectedReviewer] = useState(
    reviewers.length === 1 ? reviewers[0] : null
  );
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const labels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Excellent!'
  };

  const handleSubmit = async () => {
    if (!rating) return setError('Please select a rating');
    if (!selectedReviewer) return setError('Please select a reviewer');

    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post(`/ratings/session/${sessionId}`, {
        rating,
        reviewerId: selectedReviewer.id
      });
      onRated(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Backdrop
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000
    }}>
      {/* Modal */}
      <div style={{
        background: '#1e1e1e', borderRadius: 16,
        padding: 32, width: 400,
        border: '1px solid #3d3d3d',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{
          color: '#f0f0f5', fontSize: 20,
          fontWeight: 700, margin: '0 0 8px',
          fontFamily: 'Syne, sans-serif'
        }}>
          Rate this review session
        </h2>
        <p style={{
          color: '#888', fontSize: 13,
          fontFamily: 'monospace', margin: '0 0 24px'
        }}>
          Your rating helps build reviewer reputation
        </p>

        {/* Reviewer selector — only if multiple reviewers */}
        {reviewers.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: '#888', fontSize: 11, fontFamily: 'monospace', marginBottom: 8 }}>
              SELECT REVIEWER
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reviewers.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReviewer(r)}
                  style={{
                    padding: '10px 14px',
                    background: selectedReviewer?.id === r.id ? '#2d2d3d' : '#252526',
                    border: `1px solid ${selectedReviewer?.id === r.id ? '#6366f1' : '#3d3d3d'}`,
                    borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#6366f1', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 600
                  }}>
                    {r.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: 13, margin: 0 }}>{r.username}</p>
                    <p style={{ color: '#888', fontSize: 11, margin: 0, fontFamily: 'monospace' }}>
                      rep: {r.reputation || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single reviewer display */}
        {reviewers.length === 1 && selectedReviewer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: '#252526',
            borderRadius: 8, marginBottom: 24,
            border: '1px solid #3d3d3d'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#6366f1', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 600
            }}>
              {selectedReviewer.username[0].toUpperCase()}
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 14, margin: 0, fontWeight: 500 }}>
                {selectedReviewer.username}
              </p>
              <p style={{ color: '#888', fontSize: 11, margin: 0, fontFamily: 'monospace' }}>
                current reputation: {selectedReviewer.reputation || 0}/100
              </p>
            </div>
          </div>
        )}

        {/* Star rating */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: '#888', fontSize: 11, fontFamily: 'monospace', marginBottom: 12 }}>
            YOUR RATING
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
                  transition: 'all 0.15s'
                }}
              >
                ⭐
              </button>
            ))}
          </div>

          {/* Rating label */}
          {(hoveredStar || rating) > 0 && (
            <p style={{
              textAlign: 'center', color: '#6366f1',
              fontSize: 14, fontWeight: 600,
              margin: '8px 0 0', fontFamily: 'monospace'
            }}>
              {labels[hoveredStar || rating]}
            </p>
          )}
        </div>

        {error && (
          <p style={{
            color: '#f44747', fontSize: 12,
            fontFamily: 'monospace', marginBottom: 12
          }}>
            ⚠ {error}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12,
              background: '#3c3c3c', color: '#ccc',
              border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 13,
              fontFamily: 'monospace'
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            style={{
              flex: 2, padding: 12,
              background: rating ? '#6366f1' : '#3c3c3c',
              color: rating ? '#fff' : '#666',
              border: 'none', borderRadius: 8,
              cursor: rating ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'monospace',
              transition: 'background 0.2s'
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