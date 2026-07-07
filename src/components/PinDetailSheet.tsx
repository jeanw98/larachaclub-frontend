import { useState, useEffect } from 'react';
import type { PinDetail, ReactionType } from '../types';
import { REACTIONS } from '../types';
import * as api from '../api';
import MediaDisplay from './MediaDisplay';

interface Props {
  pinId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PinDetailSheet({ pinId, onClose, onUpdate }: Props) {
  const [pin, setPin] = useState<PinDetail | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.getPin(pinId).then(setPin).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [pinId]);

  const handleReaction = async (type: ReactionType) => {
    await api.toggleReaction(pinId, type);
    load();
    onUpdate();
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.addComment(pinId, comment, rating);
      setComment('');
      load();
      onUpdate();
    } finally {
      setSubmitting(false);
    }
  };

  const mediaUrl = pin?.media_url || pin?.image_url || '';
  const mediaType = pin?.media_type || 'image';

  if (loading || !pin) {
    return (
      <div className="sheet-overlay" onClick={onClose}>
        <div className="sheet pin-detail-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet pin-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <MediaDisplay
          url={mediaUrl}
          mediaType={mediaType}
          className="pin-hero"
          autoPlay={mediaType === 'video'}
          muted={false}
          controls={mediaType === 'video'}
        />

        <div className="pin-meta">
          <div className="pin-author">
            <div className="avatar sm" style={{ background: pin.avatar_color }}>
              {pin.user_name?.[0]}
            </div>
            <div>
              <span className="name">{pin.user_name}</span>
              {pin.place_name && <p className="place-tag">{pin.place_name}</p>}
              {pin.caption && <p className="caption">{pin.caption}</p>}
            </div>
          </div>
          {pin.avg_rating && (
            <div className="rating-badge">⭐ {pin.avg_rating}</div>
          )}
        </div>

        <div className="reactions-bar">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              className={`reaction-btn ${pin.user_reaction === r.type ? 'active' : ''}`}
              onClick={() => handleReaction(r.type)}
            >
              <span>{r.emoji}</span>
              <span className="reaction-count">{pin.reactions?.[r.type] || 0}</span>
            </button>
          ))}
        </div>

        <div className="comment-form">
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                className={`star ${s <= rating ? 'filled' : ''}`}
                onClick={() => setRating(s)}
              >
                ★
              </button>
            ))}
          </div>
          <div className="comment-input-row">
            <input
              type="text"
              placeholder="Deja un comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={300}
            />
            <button
              className="btn btn-sm"
              disabled={submitting || !comment.trim()}
              onClick={handleComment}
            >
              Enviar
            </button>
          </div>
        </div>

        <div className="comments-list">
          {pin.comments.length === 0 && (
            <p className="empty-text">Sin comentarios aún — ¡sé el primero!</p>
          )}
          {pin.comments.map((c) => (
            <div key={c.id} className="comment-row">
              <div className="avatar xs" style={{ background: c.avatar_color }}>
                {(c.nickname || c.cool_name)?.[0]}
              </div>
              <div className="comment-body">
                <span className="comment-author">{c.nickname || c.cool_name}</span>
                <span className="comment-stars">{'★'.repeat(c.rating)}</span>
                <p>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
