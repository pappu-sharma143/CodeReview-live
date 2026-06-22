const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads', 'voice-notes');

const EXT_BY_MIME = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
};

const parseDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const saveVoiceNote = async (sessionId, dataUrl, mimeType) => {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error('Invalid audio data URL');
  }

  const ext = EXT_BY_MIME[parsed.mimeType] || EXT_BY_MIME[mimeType] || 'webm';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(UPLOADS_ROOT, String(sessionId));

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), parsed.buffer);

  return `/uploads/voice-notes/${sessionId}/${filename}`;
};

const isLegacyBase64Audio = (value) =>
  typeof value === 'string' && value.startsWith('data:');

module.exports = {
  saveVoiceNote,
  isLegacyBase64Audio,
  UPLOADS_ROOT,
};
