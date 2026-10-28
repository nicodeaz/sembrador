import React from 'react';
import { Sprout, RefreshCw } from 'lucide-react';
import { FarmWorkspace } from './components/FarmWorkspace';
import { EmailAccess } from './components/EmailAccess';
import { InstallPrompt } from './components/InstallPrompt';
import { useFarm } from './utils/useFarm';
import { logout } from './utils/api';
import './farm.css';

export default function FarmApp() {
  const farm = useFarm();
  if (farm.boot === 'locked') return <><EmailAccess onSuccess={() => void farm.load()}/><InstallPrompt/></>;
  if (farm.boot !== 'ready') return <div className="farm-app boot-screen"><Sprout size={60}/><h1>El Sembrador</h1><p>{farm.boot === 'loading' ? 'Conectando con tus registros…' : 'No pudimos cargar los datos del servidor. Revisá la conexión e intentá de nuevo.'}</p>{farm.boot === 'error' && <button className="primary" onClick={() => void farm.load()}><RefreshCw size={18}/> Reintentar</button>}</div>;
  return <><FarmWorkspace data={farm.data} update={farm.update} status={farm.status} cacheError={farm.cacheError} retry={() => void farm.flush()} resolve={farm.useServer} onLock={async () => { if (farm.status !== 'saved' && !await farm.flush()) return; await logout(); farm.setBoot('locked'); }}/><InstallPrompt/></>;
}
