import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const AuthPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const { login, register, loginAsGuest, loading, error, clearError } = useAuth();

  useEffect(() => {
    clearError();
    setLocalError('');
  }, [mode, clearError]);

  const validate = () => {
    if (!username.trim()) return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'Only letters, numbers and underscores';
    if (!password) return 'Password is required';
    if (mode === 'register' && password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setLocalError(validationError); return; }
    setLocalError('');
    if (mode === 'login') {
      await login(username.trim(), password);
    } else {
      await register(username.trim(), password);
    }
  };

  const handleGuestLogin = async () => {
    setLocalError('');
    await loginAsGuest();
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__icon">◈</span>
          <span className="auth-brand__name">ChatSpace</span>
        </div>

        <div className="auth-toggle">
          <button
            className={`auth-toggle__btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-toggle__btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
          <div className={`auth-toggle__slider ${mode === 'register' ? 'right' : ''}`} />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="username">Username</label>
            <input
              id="username"
              className="auth-field__input"
              type="text"
              placeholder="e.g. panky_dev"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setLocalError(''); }}
              autoComplete="username"
              spellCheck={false}
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="password">Password</label>
            <input
              id="password"
              className="auth-field__input"
              type="password"
              placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {displayError && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {displayError}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <span className="auth-submit__spinner" />
            ) : (
              mode === 'login' ? 'Enter ChatSpace' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="auth-submit auth-submit--guest"
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          {loading ? (
            <span className="auth-submit__spinner" />
          ) : (
            'Continue as Guest'
          )}
        </button>

        <p className="auth-footer">
          {mode === 'login' ? "No account? " : "Already have one? "}
          <button
            className="auth-footer__link"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            type="button"
          >
            {mode === 'login' ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

