import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearnerStore } from '../store/learnerStore';
import { phonemes } from '../games/phonics/curriculum/phonemes';
import { words } from '../games/phonics/curriculum/words';
import { Mic, Square, Play, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ParentVoiceStudio() {
  const { parentVoiceClips, saveParentVoiceClip, deleteParentVoiceClip } = useLearnerStore();
  
  // Selection/Recording states
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // MediaRecorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Category filter
  const [category, setCategory] = useState<'phonemes' | 'words'>('phonemes');

  const startRecording = async (id: string) => {
    setErrorMsg('');
    setPreviewUrl(null);
    setRecordingId(id);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);

        // Turn off microphone tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access denied or unsupported:', err);
      setErrorMsg('Microphone blocked! Please allow microphone access in your browser settings. 🔒');
      setRecordingId(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playPreview = () => {
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audio.play().catch((err) => console.warn('Preview playback failed:', err));
    }
  };

  const handleSave = () => {
    if (recordingId && previewUrl) {
      saveParentVoiceClip(recordingId, previewUrl);
      setRecordingId(null);
      setPreviewUrl(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this voice recording and restore the standard robot voice? 🤖')) {
      deleteParentVoiceClip(id);
    }
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '750px', margin: '0 auto', color: '#fff' }}>
      
      {/* Description header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.8em', color: '#a78bfa', fontWeight: 900, marginBottom: '5px' }}>
          🎙️ Parent Voice Recording Studio
        </h3>
        <p style={{ fontSize: '1.1em', color: '#cbd5e1', fontWeight: 700, lineHeight: 1.4 }}>
          Record your actual voice pronouncing letters and spelling words! The app will automatically override the robotic voices with your custom warm recordings!
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
        <button
          onClick={() => { setCategory('phonemes'); setRecordingId(null); setPreviewUrl(null); }}
          style={{
            padding: '8px 24px',
            fontSize: '1em',
            fontWeight: 900,
            background: category === 'phonemes' ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${category === 'phonemes' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '20px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          🔤 Letter Phonics Sounds
        </button>
        <button
          onClick={() => { setCategory('words'); setRecordingId(null); setPreviewUrl(null); }}
          style={{
            padding: '8px 24px',
            fontSize: '1em',
            fontWeight: 900,
            background: category === 'words' ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${category === 'words' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '20px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          📝 spelling Words
        </button>
      </div>

      {/* Audio Capture Control Box Panel */}
      <AnimatePresence>
        {recordingId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'rgba(139, 92, 246, 0.12)',
              border: '3px solid #8b5cf6',
              borderRadius: '25px',
              padding: '20px',
              marginBottom: '30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <h4 style={{ fontSize: '1.2em', fontWeight: 900, color: '#a78bfa', marginBottom: '8px' }}>
              {isRecording ? '🎙️ Recording Voice...' : previewUrl ? '▶️ Recording Complete!' : 'Get Ready...'}
            </h4>
            
            <div style={{ fontSize: '1.8em', fontWeight: 950, marginBottom: '20px', color: '#fff' }}>
              Say: "<strong>{category === 'phonemes' ? `/${phonemes.find((p) => p.id === recordingId)?.sound}/` : words.find((w) => w.id === recordingId)?.text}</strong>"
            </div>

            {/* Glowing wave rings if recording */}
            {isRecording && (
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  position: 'absolute',
                  top: '80px',
                  zIndex: 1
                }}
              />
            )}

            {/* Recording Controls */}
            <div style={{ display: 'flex', gap: '15px', zIndex: 2 }}>
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                  }}
                  title="Stop recording"
                >
                  <Square size={24} fill="white" />
                </button>
              ) : (
                <>
                  {previewUrl && (
                    <button
                      onClick={playPreview}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                      }}
                      title="Play Preview"
                    >
                      <Play size={24} fill="white" />
                    </button>
                  )}
                  {previewUrl && (
                    <button
                      onClick={handleSave}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                      }}
                      title="Save recording"
                    >
                      <Save size={24} />
                    </button>
                  )}
                  <button
                    onClick={() => { setRecordingId(null); setPreviewUrl(null); }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '1.6em'
                    }}
                    title="Cancel"
                  >
                    &times;
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microphone status errors */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', color: '#fca5a5', padding: '15px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', fontWeight: 700 }}>
          <AlertCircle size={22} /> {errorMsg}
        </div>
      )}

      {/* Items List Scrollable Drawer */}
      <div 
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '2px solid rgba(255,255,255,0.06)',
          borderRadius: '30px',
          padding: '20px',
          maxHeight: '400px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {category === 'phonemes' ? (
          phonemes.map((p) => {
            const hasRecording = !!parentVoiceClips[p.id];
            
            return (
              <div 
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '2em', fontWeight: 900, color: '#fff' }}>
                    {p.grapheme}
                  </span>
                  <span style={{ fontSize: '1.1em', color: '#94a3b8', fontWeight: 800 }}>
                    Sound: /{p.sound}/
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {hasRecording ? (
                    <span style={{ background: '#064e3b', color: '#34d399', fontSize: '0.85em', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Custom Recorded 🎙️
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.85em', fontWeight: 900, padding: '4px 12px', borderRadius: '12px' }}>
                      Standard Robot 🤖
                    </span>
                  )}

                  <button
                    onClick={() => startRecording(p.id)}
                    disabled={isRecording}
                    style={{
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      cursor: isRecording ? 'not-allowed' : 'pointer',
                      fontWeight: 900,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Mic size={14} /> {hasRecording ? 'Record Again' : 'Record'}
                  </button>

                  {hasRecording && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Delete recording"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          words.map((w) => {
            const hasRecording = !!parentVoiceClips[w.id];
            
            return (
              <div 
                key={w.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '2em' }}>{w.imageEmoji}</span>
                  <span style={{ fontSize: '1.4em', fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>
                    {w.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {hasRecording ? (
                    <span style={{ background: '#064e3b', color: '#34d399', fontSize: '0.85em', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Custom Recorded 🎙️
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.85em', fontWeight: 900, padding: '4px 12px', borderRadius: '12px' }}>
                      Standard Robot 🤖
                    </span>
                  )}

                  <button
                    onClick={() => startRecording(w.id)}
                    disabled={isRecording}
                    style={{
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      cursor: isRecording ? 'not-allowed' : 'pointer',
                      fontWeight: 900,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Mic size={14} /> {hasRecording ? 'Record Again' : 'Record'}
                  </button>

                  {hasRecording && (
                    <button
                      onClick={() => handleDelete(w.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Delete recording"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
