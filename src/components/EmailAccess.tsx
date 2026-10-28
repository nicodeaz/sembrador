import { FormEvent, useEffect, useState } from 'react';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { PinScreen } from './PinScreen';
import { readPendingAccess, savePendingAccess } from '../utils/emailAccess';

const endpoint = `${import.meta.env.BASE_URL}api/`;
export function EmailAccess({onSuccess}: {onSuccess: () => void}) {
  const [pending, setPending] = useState(readPendingAccess);
  const [mode, setMode] = useState('loading');
  const [email, setEmail] = useState(pending?.email || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(pending?.retryAt || 0);
  const [now, setNow] = useState(Date.now);
  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const expired = !!pending && pending.expiresAt <= now;
  const loadMode = async () => {
    try {
      const response = await fetch(endpoint + 'access_mode.php', {cache: 'no-store', signal: AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error();
      setMode((await response.json()).mode);
    } catch { setMode('error'); }
  };
  useEffect(() => { void loadMode(); }, []);
  useEffect(() => { savePendingAccess(pending); }, [pending]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, []);

  const request = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(endpoint + 'access_request.php', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}), signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      const sentAt = Date.now();
      const nextRetry = sentAt + (result.retryAfter || 0) * 1000;
      setNow(sentAt); setRetryAt(nextRetry);
      if (!response.ok) {
        if (pending) setPending({...pending, retryAt: nextRetry});
        throw new Error(response.status === 429
          ? 'Esperá antes de pedir otro código. Si ya tenés uno, todavía podés usarlo.'
          : result.error === 'invalid_email' ? 'Revisá la dirección de correo.'
          : 'No pudimos enviar el código. Intentá nuevamente en unos minutos.');
      }
      setPending({email: email.trim(), challenge: result.challenge, expiresAt: sentAt + (result.expiresIn ?? 600) * 1000, retryAt: nextRetry});
      setCode('');
    } catch (e) {
      setError((e as Error).name === 'TimeoutError'
        ? 'La respuesta demoró. Volvé a pedir el código cuando tengas conexión.'
        : (e as Error).name === 'TypeError' ? 'Revisá tu conexión y volvé a intentar.' : (e as Error).message);
    } finally { setBusy(false); }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!pending) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(endpoint + 'access_verify.php', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({challenge: pending.challenge, code}), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === 'expired_code' || result.error === 'too_many_attempts') {
          setPending({...pending, expiresAt: Date.now()});
        }
        throw new Error(result.error === 'expired_code' ? 'Este código ya venció. Pedí uno nuevo con el botón de abajo.'
          : result.error === 'too_many_attempts' ? 'Se agotaron los intentos. Pedí un código nuevo.'
          : response.status >= 500 ? 'No pudimos conectar. Probá entrar de nuevo en unos instantes.'
          : 'El código no coincide. Usá los 6 números del último correo que pediste.');
      }
      savePendingAccess(null);
      setPending(null);
      onSuccess();
    } catch (e) {
      setError((e as Error).name === 'TimeoutError' || (e as Error).name === 'TypeError'
        ? 'No pudimos conectar. Revisá tu conexión y volvé a tocar Entrar.' : (e as Error).message);
    } finally { setBusy(false); }
  };

  if (mode === 'pin') return <PinScreen onSuccess={onSuccess}/>;
  return <div className="farm-app access-screen"><main className="access-card">
    <img src={`${import.meta.env.BASE_URL}logo-original.png`} alt="El Sembrador"/>
    <h1>Entrá a tu granja</h1>
    {mode === 'loading' ? <p>Abriendo acceso.</p> : mode === 'error' ? <>
      <p>No pudimos conectar con el servidor.</p>
      <button className="primary" onClick={() => void loadMode()}><RefreshCw/> Reintentar</button>
    </> : <>
      {!pending ? <form className="entry-form" onSubmit={e => { e.preventDefault(); void request(); }}>
        <p>Ingresá el correo de la empresa. Te enviaremos un código para entrar.</p>
        <label className="field"><span>Correo electrónico</span>
          <input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => setEmail(e.target.value)} placeholder="Tu correo" disabled={busy}/>
        </label>
        <button className="primary" disabled={busy || wait > 0}><Mail size={21}/>{busy ? 'Enviando.' : wait > 0 ? `Reintentar en ${wait} s` : 'Recibir código'}</button>
      </form> : <form className="entry-form" onSubmit={verify}>
        <p>Revisá el correo <strong>{pending.email}</strong> y volvé acá para poner el código. Si no aparece, mirá en spam.</p>
        <p>{expired ? 'Pedí un código nuevo para continuar.' : <>Podés usarlo hasta las <strong>{new Date(pending.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</strong>. Esta pantalla se conserva al volver del correo.</>}</p>
        <label className="field"><span>Código de 6 números</span>
          <input className="access-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus disabled={busy || expired}/>
        </label>
        <button className="primary" disabled={busy || expired || code.length !== 6}>{busy ? 'Entrando.' : 'Entrar'}<ArrowRight size={21}/></button>
        <button className="secondary" type="button" disabled={busy || wait > 0} onClick={() => void request()}>{wait > 0 ? `Pedir otro código en ${wait} s` : 'Pedir otro código'}</button>
        <p className="access-note">Si pediste varios códigos, usá el del último correo.</p>
        <button className="text-button" type="button" disabled={busy} onClick={() => { setPending(null); setCode(''); setError(''); }}>Corregir correo</button>
      </form>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="access-note">Este teléfono recordará tu sesión para los próximos ingresos.</p>
    </>}
  </main></div>;
}
