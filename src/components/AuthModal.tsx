import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { X, Mail, Lock, User, AlertCircle, Loader, Eye, EyeOff, Key, ArrowLeft, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: (loginSuccess?: boolean) => void;
}

type AuthView = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = (loginSuccess: boolean = false) => {
    console.log('[AuthModal] handleClose called with loginSuccess:', loginSuccess);
    onClose(loginSuccess);
    // Reset states on close
    setView('login');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        handleClose(true);
      } else if (view === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }
        handleClose(true);
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Link reset password telah dikirim ke email Anda.');
        setEmail('');
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('Auth error:', firebaseError);
      let errorMsg = firebaseError.message || 'Terjadi kesalahan. Silakan coba lagi.';
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        errorMsg = 'Email atau password salah.';
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        errorMsg = 'Email sudah terdaftar.';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMsg = 'Password minimal terdiri dari 6 karakter.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMsg = 'Format email tidak valid.';
      } else if (firebaseError.code === 'auth/user-disabled') {
        errorMsg = 'Akun ini telah dinonaktifkan.';
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        errorMsg = 'Metode Email/Password belum diaktifkan di Firebase Console Anda. Silakan buka Firebase Console > Build > Authentication > Sign-in method, lalu aktifkan "Email/Password".';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleClose(true);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('Google Auth error:', firebaseError);
      let errorMsg = firebaseError.message || 'Gagal masuk dengan Google.';
      if (firebaseError.code === 'auth/operation-not-allowed') {
        errorMsg = 'Metode Google Sign-In belum diaktifkan di Firebase Console Anda. Silakan buka Firebase Console > Build > Authentication > Sign-in method, lalu aktifkan "Google".';
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Proses masuk Google dibatalkan oleh pengguna.';
      } else if (firebaseError.code === 'auth/popup-blocked') {
        errorMsg = 'Popup diblokir oleh browser. Silakan izinkan popup untuk situs ini.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-fade-in" id="auth-modal-dialog">
        {/* Close Button */}
        <button className="close-btn" onClick={() => handleClose(false)} aria-label="Tutup dialog">
          <X size={18} />
        </button>

        {/* Back Button (Only for Forgot Password view) */}
        {view === 'forgot' && (
          <button 
            type="button" 
            className="back-btn" 
            onClick={() => { setView('login'); setError(''); setSuccess(''); }}
            title="Kembali ke Login"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Top Key Icon for Forgot Password */}
        {view === 'forgot' && (
          <div className="forgot-icon-container">
            <div className="key-icon-wrapper">
              <Key size={32} className="key-icon" />
            </div>
            <h2>Lupa Password?</h2>
            <p className="auth-subtitle">
              Masukkan email yang terdaftar untuk menerima link reset password.
            </p>
          </div>
        )}

        {/* Header for Login / Register */}
        {view !== 'forgot' && (
          <div className="auth-header">
            <h2>{view === 'login' ? 'Masuk ke Sistem' : 'Daftar Akun Baru'}</h2>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="auth-success-banner">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name (Register Only) */}
          {view === 'register' && (
            <div className="input-group">
              <label htmlFor="name-input">Nama Lengkap</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="name-input"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Email (All views) */}
          <div className="input-group">
            <label htmlFor="email-input">Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="email-input"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Password (Login & Register Only) */}
          {view !== 'forgot' && (
            <div className="input-group">
              <label htmlFor="password-input">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={view === 'login' ? 'Masukkan password Anda' : 'Minimal 6 karakter'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field password-input-field"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Link (Login Only) */}
          {view === 'login' && (
            <div className="forgot-link-wrapper">
              <button 
                type="button" 
                className="forgot-link" 
                onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
              >
                Lupa Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button 
            id="auth-submit-btn" 
            type="submit" 
            className="btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="spinner" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>
                {view === 'login' && 'Masuk'}
                {view === 'register' && 'Daftar'}
                {view === 'forgot' && 'Kirim Link Reset'}
              </span>
            )}
          </button>
        </form>

        {/* Divider & Google Sign-In */}
        {view !== 'forgot' && (
          <>
            <div className="auth-divider">
              <span>atau</span>
            </div>
            
            <button 
              type="button" 
              className="btn-google" 
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </>
        )}

        {/* Bottom Switch Links */}
        <div className="auth-footer-links">
          {view === 'login' && (
            <p>
              Belum punya akun?{' '}
              <button 
                type="button" 
                onClick={() => { setView('register'); setError(''); setSuccess(''); }}
              >
                Daftar Sekarang
              </button>
            </p>
          )}

          {view === 'register' && (
            <p>
              Sudah punya akun?{' '}
              <button 
                type="button" 
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              >
                Masuk
              </button>
            </p>
          )}

          {view === 'forgot' && (
            <p>
              Ingat password?{' '}
              <button 
                type="button" 
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              >
                Masuk
              </button>
            </p>
          )}
        </div>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 12, 20, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: var(--font-body, sans-serif);
          padding: 16px;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 36px 32px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .auth-card .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .auth-card .close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
          transform: rotate(90deg);
        }

        .auth-card .back-btn {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .auth-card .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .auth-header {
          text-align: left;
          margin-bottom: 28px;
        }

        .auth-header h2 {
          font-size: 1.45rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .forgot-icon-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 28px;
          margin-top: 10px;
        }

        .key-icon-wrapper {
          width: 72px;
          height: 72px;
          background: rgba(99, 102, 241, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          margin-bottom: 16px;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }

        .forgot-icon-container h2 {
          font-size: 1.45rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 8px;
        }

        .auth-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 24px;
        }

        .auth-success-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 24px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
          text-align: left;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #64748b;
          pointer-events: none;
        }

        .input-with-icon .input-field {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(31, 41, 55, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #f8fafc;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .input-with-icon .input-field::placeholder {
          color: #4b5563;
        }

        .input-with-icon .input-field:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          background: rgba(31, 41, 55, 0.6);
        }

        .password-input-field {
          padding-right: 42px !important;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #94a3b8;
        }

        .forgot-link-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-top: -6px;
        }

        .forgot-link {
          background: transparent;
          border: none;
          color: #6366f1;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }

        .forgot-link:hover {
          color: #818cf8;
          text-decoration: underline;
        }

        .auth-submit-btn {
          width: 100%;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 10px;
          background: #6366f1;
          color: #ffffff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
        }

        .auth-submit-btn:hover {
          background: #4f46e5;
          box-shadow: 0 4px 18px rgba(99, 102, 241, 0.45);
          transform: translateY(-1px);
        }

        .auth-submit-btn:active {
          transform: translateY(1px);
        }

        .auth-submit-btn:disabled {
          background: #312e81;
          color: #6366f1;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .auth-submit-btn .spinner {
          animation: spin 1s linear infinite;
        }

        .auth-footer-links {
          text-align: center;
          margin-top: 24px;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .auth-footer-links button {
          background: transparent;
          border: none;
          color: #6366f1;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
        }

        .auth-footer-links button:hover {
          color: #818cf8;
          text-decoration: underline;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-fade-in {
          animation: fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #4b5563;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .auth-divider:not(:empty)::before {
          margin-right: .5em;
        }

        .auth-divider:not(:empty)::after {
          margin-left: .5em;
        }

        .auth-divider span {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-google {
          width: 100%;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-google:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .btn-google:active {
          transform: translateY(1px);
        }

        .btn-google:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};
