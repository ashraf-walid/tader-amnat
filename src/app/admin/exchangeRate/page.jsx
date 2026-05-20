'use client';

import { useState, useEffect } from 'react';

export default function AdminExchangeRatePage() {
  const [rate, setRate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          setRate(data.exchangeRate);
        }
      } catch (err) {
        console.error("Failed to fetch rate:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRate();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exchangeRate: Number(rate) })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ text: 'تم حفظ سعر الصرف بنجاح!', type: 'success' });
        setRate(data.exchangeRate);
      } else {
        setMessage({ text: 'حدث خطأ: ' + (data.error || 'غير معروف'), type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'فشل الاتصال بالخادم.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px', margin: '40px auto', padding: '30px', 
      background: '#1a2035', borderRadius: '16px', color: '#f0f2f8', 
      direction: 'rtl', fontFamily: "'Tajawal', system-ui, sans-serif",
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#f0b429' }}>إدارة سعر الصرف</h1>
      <p style={{ fontSize: '14px', color: '#8892a4', marginBottom: '24px' }}>قم بتحديث سعر الصرف الرسمي الذي يتم استخدامه في حاسبة التخزين.</p>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#8892a4' }}>جاري التحميل...</div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f0f2f8' }}>سعر الصرف الحالي (ج.م / $)</label>
            <input 
              type="number" 
              step="0.0001" 
              min="0.1" 
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', fontSize: '18px', fontWeight: 'bold',
                background: '#111827', border: '1.5px solid rgba(255,255,255,0.12)', 
                borderRadius: '8px', color: '#f0b429', outline: 'none', direction: 'rtl'
              }}
              onFocus={e => e.target.style.borderColor = '#f0b429'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>

          {message.text && (
            <div style={{ 
              padding: '12px', borderRadius: '8px', fontSize: '13px',
              background: message.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
              color: message.type === 'error' ? '#f87171' : '#34d399',
              border: `1px solid ${message.type === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`
            }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSaving}
            style={{
              padding: '14px', marginTop: '10px', fontSize: '16px', fontWeight: '700',
              background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
              transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(14,165,233,0.3)'
            }}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ سعر الصرف'}
          </button>
        </form>
      )}
    </div>
  );
}
