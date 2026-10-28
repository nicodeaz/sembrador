import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Bird, CalendarDays, Check, ChevronRight, ClipboardList, Download, Home, Moon, Plus, Settings, FolderOpen, Menu, ShoppingBag, Sprout, Sun, Wallet, Wheat, X } from 'lucide-react';
import { Batch, CategoryType, Departure, FarmData, FarmTask, OperationRecord, StockMovement } from '../types';
import { calculateBatchSummary, formatCurrency } from '../utils/calculations';
import { cashEntries, costRecords, downloadBackup, id, kilos, movementLabels, normalizeFarm, PRODUCTS, stockBalances, reconcileLifecycle, feedCost, refreshLinkedFeedCosts } from '../utils/farm';
import { displayDate, today } from '../utils/dates';

import { barnLabel, BARN_SUGGESTIONS, suggestedExit } from '../utils/rearing';
import { BarnOverview, RearingDetails } from './RearingOverview';
import { FarmCalendar } from './FarmCalendar';
import { MediaLibrary } from './MediaLibrary';

type Tab = 'home'|'batches'|'stock'|'agenda'|'money'|'media';
type Action = 'batch'|'departure'|'task'|'record'|StockMovement['type'];
type Editing = Batch | Departure | FarmTask | OperationRecord | StockMovement;
const statusLabels = { active: 'En el galpón', planned: 'Por llegar', completed: 'Finalizado', archived: 'Archivado' };
const categoryLabels: Record<CategoryType, string> = { alimento: 'Alimento anterior (sin stock)', mortalidad: 'Bajas de pollitas', vacunas: 'Vacunas / sanidad', calefaccion: 'Calefacción', otros: 'Otro gasto del lote' };
const tabs = [{ id: 'home', label: 'Resumen', icon: Home }, { id: 'batches', label: 'Lotes', icon: Bird }, { id: 'stock', label: 'Raciones', icon: Wheat }, { id: 'agenda', label: 'Calendario', icon: CalendarDays }, { id: 'money', label: 'Cuentas', icon: Wallet }, { id: 'media', label: 'Archivos', icon: FolderOpen }] as const;

export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="farm-dialog" onCancel={onClose} aria-label={title}>
    <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Cerrar" onClick={onClose}><X /></button></div>{children}
  </dialog>;
}
const Field = ({ title, children }: { title: string; children: React.ReactNode }) => <label className="field"><span>{title}</span>{children}</label>;
const Empty = ({ children }: { children: React.ReactNode }) => <div className="empty-state"><Sprout size={32}/><p>{children}</p></div>;
const Metric = ({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) => <div className="metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;

interface Props { data: FarmData; update: (data: FarmData) => void; status: string; cacheError: boolean; retry: () => void; resolve: () => Promise<void>; onLock: () => void }
export function FarmWorkspace({ data, update, status, cacheError, retry, resolve, onLock }: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const [batchFilter, setBatchFilter] = useState('all');
  const [selected, setSelected] = useState<string>('');
  const [modal, setModal] = useState<{ action: Action; batchId?: string; edit?: Editing } | null>(null);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [tab, selected]);
  const [settings, setSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{key: 'movements'|'records'|'departures'|'tasks'; id: string}|null>(null);
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('sembrador:theme') === 'dark'; } catch { return false; } });
  const [notice, setNotice] = useState('');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [agendaFilter, setAgendaFilter] = useState('pending');
  const records = useMemo(() => costRecords(data), [data]);
  const summaries = useMemo(() => data.batches.map(b => calculateBatchSummary(b, records, data.departures)), [data, records]);
  const active = summaries.filter(s => s.batch.status === 'active');
  const planned = data.batches.filter(b => b.status === 'planned').sort((a,b) => a.startDate.localeCompare(b.startDate));
  const pending = data.tasks.filter(t => t.status === 'pending').sort((a,b) => a.date.localeCompare(b.date));
  const stock = stockBalances(data.movements);
  const money = cashEntries(data).filter(e => !month || e.date.startsWith(month));
  const income = money.reduce((s,e) => s + e.income, 0), expenses = money.reduce((s,e) => s + e.expense, 0);
  const chosen = summaries.find(s => s.batch.id === selected);
  const open = (action: Action, batchId?: string, edit?: Editing) => setModal({ action, batchId, edit });
  const apply = (next: FarmData) => { update(next); setNotice('Registro agregado. Comprobá el estado de guardado arriba.'); };
  const remove = (key: 'movements'|'records'|'departures'|'tasks', itemId: string) => {
    try {
      const next = structuredClone({ ...data, [key]: data[key].filter(item => item.id !== itemId) });
      if (key === 'departures' || key === 'records') {
        const changed = data[key].find(item => item.id === itemId);
        if (changed) reconcileLifecycle(next, changed.batchId);
      }
      apply(normalizeFarm(next));
    } catch (error) { setNotice((error as Error).message); }
  };
  const toggleTheme = () => { setDark(!dark); try { localStorage.setItem('sembrador:theme', dark ? 'light' : 'dark'); } catch {} };
  const selectBatch = (batchId: string) => { setTab('batches'); setSelected(batchId); };
  const syncLabels: Record<string,string> = { saved: 'Guardado en el servidor', saving: 'Guardando…', pending: 'Cambios pendientes de guardar', conflict: 'Hay cambios en otro dispositivo', error: 'No se pudo guardar' };
  const timeline = [
    ...data.tasks.filter(t => t.status === 'done').map(t => ({ id: t.id, date: t.completedDate!, title: t.title, detail: `Trabajo realizado · ${formatCurrency(t.cost)}` })),
    ...data.departures.map(d => ({ id: d.id, date: d.date, title: `Salida de ${d.count} pollitas`, detail: data.batches.find(b => b.id === d.batchId)?.name || '' })),
    ...data.batches.filter(b => b.status !== 'planned').map(b => ({ id: b.id, date: b.startDate, title: `Llegada · ${b.name}`, detail: `${b.initialCount} pollitas` })),
    ...data.records.map(r => ({ id: r.id, date: r.date, title: r.title, detail: `Registro del lote · ${formatCurrency(r.cost)}` })),
    ...data.movements.map(m => ({ id: m.id, date: m.date, title: `${movementLabels[m.type]} · ${m.product}`, detail: `${kilos(m.quantityKg)} · ${formatCurrency(m.amount)}` })),
  ].sort((a,b) => b.date.localeCompare(a.date));

  return <div className="farm-app" data-theme={dark ? 'dark' : 'light'}>
    <header className="farm-header"><div className="farm-header-inner">
      <button className="brand" onClick={() => { setTab('home'); setSelected(''); }}><img src={`${import.meta.env.BASE_URL}logo-mark.png`} alt=""/><span><strong>El Sembrador</strong><small>Gestión interna de la empresa</small></span></button>
      <div className="header-actions"><button className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Usar tema claro' : 'Usar tema oscuro'}>{dark ? <Sun/> : <Moon/>}</button><button className="icon-button" onClick={() => setSettings(true)} aria-label="Respaldos y acceso"><Settings/></button></div>
    </div></header>
    <div className={`sync-bar ${status === 'saved' ? 'is-saved' : 'needs-attention'}`} role="status"><span>{status === 'saved' && <Check size={15}/>} {syncLabels[status]}</span>{['pending','error'].includes(status) && <button onClick={retry}>Reintentar</button>}</div>
    {cacheError && <div className="alert">Este navegador no pudo guardar la copia local. Mantené la aplicación abierta hasta ver “Guardado en el servidor”. <button onClick={() => downloadBackup(data)}>Descargar copia</button></div>}
    {status === 'conflict' && <div className="alert">Tus cambios están conservados en este dispositivo. Descargalos antes de cargar la versión del servidor para revisarlos. <button onClick={() => downloadBackup(data, '-pendiente')}>Descargar mis cambios</button><button onClick={() => setResolveOpen(true)}>Cargar datos del servidor</button></div>}
    <nav className="farm-nav" aria-label="Secciones">{tabs.map(t => <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => { setTab(t.id); setSelected(''); }} className={`${tab === t.id ? 'selected' : ''} ${t.id === 'money' || t.id === 'media' ? 'desktop-nav-item' : ''}`}><t.icon size={21}/><span>{t.label}</span></button>)}<button className={`mobile-more ${tab === 'money' || tab === 'media' ? 'selected' : ''}`} aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21}/><span>Más</span></button></nav>
    <main className="farm-main">
      {notice && <div className="notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={18}/></button></div>}
      {tab === 'home' && <>
        <section className="welcome"><div><p className="eyebrow">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>Resumen de la granja</h1><p>Lotes, raciones, trabajos y cuentas a la vista.</p></div><button className="primary" onClick={() => open('batch')}><Plus/> Nuevo lote</button></section>
        <section><div className="section-heading"><h2>Registrar lo de hoy</h2></div><div className="quick-grid">
          <button onClick={() => open('feed')}><Bird/><strong>Di de comer</strong><small>Consumo y costo del lote</small></button>
          <button onClick={() => open('sale')}><ShoppingBag/><strong>Vendí ración</strong><small>Cliente, kilos e importe</small></button>
          <button onClick={() => open('purchase')}><Wheat/><strong>Compré insumos</strong><small>Maíz, soja o ración hecha</small></button>
          <button onClick={() => open('task')}><ClipboardList/><strong>Hice o agendé un trabajo</strong><small>Limpieza, sanidad y más</small></button>
        </div></section>
        <section className="metrics"><Metric label="Pollitas en la granja" value={active.reduce((s,b) => s + b.currentLiveCount, 0).toLocaleString('es-AR')} detail={`${active.length} lotes activos`}/><Metric label="Próximo lote" value={planned[0] ? <span style={{fontSize:'clamp(19px, 4vw, 28px)',whiteSpace:'nowrap'}}>{displayDate(planned[0].startDate)}</span> : 'Sin fecha'} detail={planned[0]?.name || 'Podés planificar su llegada'}/><Metric label="Trabajos pendientes" value={pending.length} detail={`${pending.filter(t => t.date < today()).length} con fecha pasada`}/></section>
        {active.length > 0 && <BarnOverview data={data} summaries={active} onSelect={selectBatch}/>}
        <div className="two-columns"><section className="panel"><div className="section-heading"><h2>Lo que viene</h2><button className="text-button" onClick={() => setTab('agenda')}>Ver agenda <ChevronRight size={16}/></button></div>{pending.length === 0 && planned.length === 0 ? <Empty>La agenda está libre. Anotá la próxima limpieza o llegada.</Empty> : <>{planned.map(b => <button className="list-row" key={b.id} onClick={() => selectBatch(b.id)}><span className="date-chip">{displayDate(b.startDate)}</span><span><strong>{b.name}</strong><small>Llegada prevista · {b.initialCount} pollitas</small></span><ChevronRight size={18}/></button>)}{pending.map(t => <button className="list-row" key={t.id} onClick={() => open('task', t.batchId, t)}><span className={`date-chip ${t.date < today() ? 'overdue' : ''}`}>{displayDate(t.date)}</span><span><strong>{t.title}</strong><small>{t.date < today() ? 'Pendiente desde esta fecha' : 'Trabajo programado'}</small></span><ChevronRight size={18}/></button>)}</>}</section>
        <section className="panel"><div className="section-heading"><h2>Próximas salidas</h2><button className="text-button" onClick={() => setTab('agenda')}>Calendario <ChevronRight size={16}/></button></div>{active.length === 0 ? <Empty>No hay lotes en los galpones.</Empty> : active.map(s => <button key={s.batch.id} className="list-row" onClick={() => selectBatch(s.batch.id)}><span className="date-chip">{s.batch.expectedExitDate ? displayDate(s.batch.expectedExitDate) : 'Sin fecha'}</span><span><strong>{s.batch.name}</strong><small>{barnLabel(s.batch)} · {s.currentLiveCount} pollitas</small></span><ChevronRight size={18}/></button>)}</section></div>
        <section className="panel"><div className="section-heading"><h2>Todos los lotes</h2><button className="text-button" onClick={() => setTab('batches')}>Ver lotes <ChevronRight size={16}/></button></div>{summaries.length === 0 ? <Empty>Agregá el primer lote para registrar sus pollitas, alimento y costos.</Empty> : <div className="table-scroll"><table className="mobile-cards"><thead><tr><th>Lote / galpón</th><th>Estado</th><th>Pollitas</th><th>Edad</th><th>Llegada</th><th>Salida real / prevista</th><th>Costo real / previsto</th></tr></thead><tbody>{summaries.map(s => <tr key={s.batch.id}><td data-label="Lote / galpón"><button className="text-button" onClick={() => selectBatch(s.batch.id)}>{s.batch.name}</button><small className="block">{barnLabel(s.batch)}</small></td><td data-label="Estado">{statusLabels[s.batch.status]}</td><td data-label="Pollitas">{s.batch.status === 'planned' ? s.batch.initialCount : s.currentLiveCount}</td><td data-label="Edad">{s.batch.status === 'planned' ? 'Por llegar' : s.currentAgeWeeks + ' sem. ' + s.currentAgeDaysRemainder + ' d.'}</td><td data-label="Llegada">{displayDate(s.batch.startDate)}</td><td data-label="Salida">{s.batch.endDate ? displayDate(s.batch.endDate) + ' · real' : s.batch.expectedExitDate ? displayDate(s.batch.expectedExitDate) + ' · prevista' : 'Sin fecha'}</td><td data-label="Costo">{formatCurrency(s.totalExpenses)}{s.batch.status === "planned" && <small className="block">Previsto</small>}</td></tr>)}</tbody></table></div>}</section>
        <div className="two-columns"><section className="panel"><div className="section-heading"><h2>Stock de raciones e insumos</h2><button className="text-button" onClick={() => setTab('stock')}>Movimientos <ChevronRight size={16}/></button></div>{[...new Set([...PRODUCTS,...Object.keys(stock)])].map(product => <div className="list-row" key={product}><span>{product}</span><strong className={(stock[product] || 0) < 0 ? 'negative' : ''}>{kilos(stock[product] || 0)}</strong></div>)}</section>
        <section className="panel"><div className="section-heading"><h2>Cuentas del mes</h2><button className="text-button" onClick={() => { setMonth(today().slice(0,7)); setTab('money'); }}>Ver cuentas <ChevronRight size={16}/></button></div><p className="muted">{new Date().toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</p>{(() => { const entries=cashEntries(data).filter(e => e.date.startsWith(today().slice(0,7))); const sales=entries.reduce((n,e)=>n+e.income,0), costs=entries.reduce((n,e)=>n+e.expense,0); return <><div className="list-row"><span>Ventas registradas</span><strong>{formatCurrency(sales)}</strong></div><div className="list-row"><span>Compras y gastos</span><strong>{formatCurrency(costs)}</strong></div><div className="list-row"><span>Diferencia</span><strong>{formatCurrency(sales-costs)}</strong></div></>; })()}<p className="muted">Ventas menos compras y gastos registrados.</p></section></div>
        <section className="panel"><h2>Historial de la granja</h2>{timeline.length === 0 ? <Empty>Los trabajos terminados y las salidas aparecerán aquí con su fecha.</Empty> : timeline.map(e => <div className="list-row" key={e.id}><span className="date-chip">{displayDate(e.date)}</span><span><strong>{e.title}</strong><small>{e.detail}</small></span></div>)}</section>
      </>}
      {tab === 'batches' && !chosen && <>
        <div className="page-heading"><div><p className="eyebrow">DE LA LLEGADA A LA SALIDA</p><h1>Mis lotes</h1></div><button className="primary" onClick={() => open('batch')}><Plus/> Nuevo lote</button></div>
        <div className="filters">{[['all','Todos'],['active','En la granja'],['planned','Por llegar'],['history','Historial']].map(([key,label]) => <button className={batchFilter === key ? 'selected' : ''} key={key} onClick={() => setBatchFilter(key)}>{label}</button>)}</div>
        <div className="batch-grid">{summaries.filter(s => batchFilter === 'all' ? true : batchFilter === 'history' ? ['completed','archived'].includes(s.batch.status) : s.batch.status === batchFilter).map(s => <button key={s.batch.id} className="batch-card" onClick={() => selectBatch(s.batch.id)}><span className="tag">{statusLabels[s.batch.status]}</span><h2>{s.batch.name}</h2><p>{barnLabel(s.batch)}</p><strong>{s.batch.status === 'planned' ? s.batch.initialCount : s.currentLiveCount} <small>pollitas</small></strong><div className="card-footer"><span>{s.batch.status === 'planned' ? `Llegan el ${displayDate(s.batch.startDate)}` : s.batch.endDate ? `Salida: ${displayDate(s.batch.endDate)}` : `${s.currentAgeWeeks} semanas · ${s.currentAgeDaysRemainder} días`}</span><ChevronRight size={20}/></div></button>)}</div>
        {!summaries.some(s => batchFilter === 'all' ? true : batchFilter === 'history' ? ['completed','archived'].includes(s.batch.status) : s.batch.status === batchFilter) && <Empty>No hay lotes en esta sección.</Empty>}
      </>}
      {tab === 'batches' && chosen && <>
        <button className="text-button" onClick={() => setSelected('')}>← Volver a los lotes</button>
        <div className="page-heading"><div><span className="tag">{statusLabels[chosen.batch.status]}</span><h1>{chosen.batch.name}</h1><p>{barnLabel(chosen.batch)} · Llegada: {displayDate(chosen.batch.startDate)}{chosen.batch.endDate ? ` · Salida: ${displayDate(chosen.batch.endDate)}` : chosen.batch.expectedExitDate ? ` · Retiro previsto: ${displayDate(chosen.batch.expectedExitDate)}` : ' · Retiro sin fecha'}</p></div><button className="secondary" onClick={() => open('batch', chosen.batch.id, chosen.batch)}>Editar lote</button></div>
        <section className="metrics"><Metric label={chosen.batch.status === 'planned' ? 'Pollitas previstas' : 'Pollitas presentes'} value={chosen.batch.status === 'planned' ? chosen.batch.initialCount : chosen.currentLiveCount} detail={`${chosen.totalMortality} bajas registradas`}/><Metric label={chosen.batch.endDate ? 'Edad al finalizar' : 'Edad del lote'} value={`${chosen.currentAgeWeeks} sem.`} detail={`${chosen.currentAgeDaysRemainder} días más`}/><Metric label="Costo acumulado del lote" value={formatCurrency(chosen.totalExpenses)} detail={chosen.currentLiveCount ? `${formatCurrency(chosen.currentUnitCost)} por pollita presente` : 'Incluye compra, alimento y trabajos'}/></section>
        <RearingDetails data={data} batchId={selected} onEdit={movementId => { const movement=data.movements.find(m => m.id === movementId)!; open('feed',selected,movement); }}/>
        <div className="action-row">{chosen.batch.status === 'planned' ? <button className="primary" onClick={() => open('batch', selected, { ...chosen.batch, status: 'active', startDate: today() })}>Registrar llegada</button> : chosen.batch.status === 'active' && <><button className="primary" onClick={() => open('feed', selected)}>Registrar alimento</button><button className="secondary" onClick={() => open('record', selected)}>Bajas u otro gasto</button><button className="secondary" onClick={() => open('departure', selected)}>Registrar salida</button></>}<button className="secondary" onClick={() => open('task', selected)}>Agendar trabajo</button></div>
        <section className="panel"><h2>Historial del lote</h2>{records.filter(r => r.batchId === selected).sort((a,b) => b.date.localeCompare(a.date)).map(r => <div className="list-row" key={r.id}><span><strong>{r.title}</strong><small>{displayDate(r.date)}{r.quantity ? ` · ${r.quantity} ${r.unit || ''}` : ''}</small></span><strong>{formatCurrency(r.cost)}</strong>{data.records.some(x => x.id === r.id) && <button className="text-button" onClick={() => open('record', selected, r)}>Editar</button>}</div>)}{data.departures.filter(d => d.batchId === selected).map(d => <div className="list-row" key={d.id}><span><strong>Salieron {d.count} pollitas</strong><small>{displayDate(d.date)} · {d.notes}</small></span><strong>{formatCurrency(d.amount)}</strong><button className="text-button" onClick={() => open('departure', selected, d)}>Editar</button></div>)}</section>
      </>}
      {tab === 'stock' && <>
        <div className="page-heading"><div><p className="eyebrow">LO QUE ENTRA, LO QUE SALE</p><h1>Raciones e insumos</h1></div></div>
        <div className="action-row">{(['sale','purchase','production','feed'] as const).map(type => <button key={type} className={type === 'sale' ? 'primary' : 'secondary'} onClick={() => open(type)}><Plus size={18}/>{movementLabels[type]}</button>)}</div>
        <div className="stock-grid">{[...new Set([...PRODUCTS, ...Object.keys(stock)])].map(product => <div className="stock-card" key={product}><Wheat size={23}/><span>{product}</span><strong className={(stock[product] || 0) < 0 ? 'negative' : ''}>{kilos(stock[product] || 0)}</strong></div>)}</div>
        {Object.values(stock).some(n => n < -0.001) && <div className="alert">Hay salidas sin una compra o elaboración registrada. Revisá el historial para completar el stock.</div>}
        <section className="panel"><h2>Movimientos</h2>{data.movements.length === 0 ? <Empty>Registrá la primera compra o venta. Las cantidades se llevan en kilos.</Empty> : [...data.movements].sort((a,b) => b.date.localeCompare(a.date)).map(m => <div className="list-row" key={m.id}><span><strong>{movementLabels[m.type]} · {m.product}</strong><small>{displayDate(m.date)} · {kilos(m.quantityKg)}{m.type === 'purchase' && ` · ${formatCurrency(m.amount / m.quantityKg)}/kg`}{m.contact && ` · ${m.contact}`}</small></span><strong>{formatCurrency(m.amount)}</strong><button className="text-button" onClick={() => open(m.type, m.batchId, m)}>Editar</button></div>)}</section>
      </>}
      {tab === 'agenda' && <>
        <div className="page-heading"><div><p className="eyebrow">ANTES, HOY Y DESPUÉS</p><h1>Calendario de la granja</h1></div><button className="primary" onClick={() => open('task')}><Plus/> Trabajo</button></div>
        <FarmCalendar data={data} onBatch={selectBatch} onTask={task => open('task',task.batchId,task)}/>
        <div className="filters"><button className={agendaFilter === 'pending' ? 'selected' : ''} onClick={() => setAgendaFilter('pending')}>Por hacer</button><button className={agendaFilter === 'history' ? 'selected' : ''} onClick={() => setAgendaFilter('history')}>Lo que se hizo</button></div>
        <section className="panel">{agendaFilter === 'pending' ? <>
          {planned.map(b => <button className="list-row" key={b.id} onClick={() => selectBatch(b.id)}><span className="date-chip">{displayDate(b.startDate)}</span><span><strong>Llegada · {b.name}</strong><small>{b.initialCount} pollitas previstas</small></span><ChevronRight/></button>)}
          {active.filter(s => s.batch.expectedExitDate).map(s => <button className="list-row" key={s.batch.id} onClick={() => selectBatch(s.batch.id)}><span className="date-chip">{displayDate(s.batch.expectedExitDate!)}</span><span><strong>Salida prevista · {s.batch.name}</strong><small>Confirmar la fecha y registrar la salida real</small></span><ChevronRight/></button>)}
          {pending.map(t => <div className="list-row" key={t.id}><span className={`date-chip ${t.date < today() ? 'overdue' : ''}`}>{displayDate(t.date)}</span><span><strong>{t.title}</strong><small>{data.batches.find(b => b.id === t.batchId)?.name || 'Toda la granja'} · {t.date < today() ? 'Atrasado' : 'Pendiente'}</small></span><button className="secondary" onClick={() => open('task', t.batchId, { ...t, status: 'done', completedDate: today() })}>Hecho</button><button className="text-button" onClick={() => open('task', t.batchId, t)}>Editar</button></div>)}
          {pending.length === 0 && planned.length === 0 && !active.some(s => s.batch.expectedExitDate) && <Empty>No hay tareas ni llegadas pendientes.</Empty>}
        </> : <>{timeline.length === 0 && <Empty>Aquí quedarán las fechas de los trabajos y movimientos.</Empty>}{timeline.map(e => <div className="list-row" key={e.id}><span className="date-chip">{displayDate(e.date)}</span><span><strong>{e.title}</strong><small>{e.detail}</small></span>{data.tasks.some(t => t.id === e.id) && <button className="text-button" onClick={() => { const task = data.tasks.find(t => t.id === e.id)!; open('task', task.batchId, task); }}>Editar</button>}</div>)}</>}</section>
      </>}
      {tab === 'money' && <>
        <div className="page-heading"><div><p className="eyebrow">LAS CUENTAS CLARAS</p><h1>Ingresos y costos</h1></div><button className="primary" onClick={() => open('expense')}><Plus/> Gasto</button></div>
        <div className="action-row"><Field title="Mes"><input type="month" value={month} onChange={e => setMonth(e.target.value)}/></Field><button className="text-button" onClick={() => setMonth('')}>Ver todo</button></div>
        <section className="metrics"><Metric label="Ventas registradas" value={formatCurrency(income)}/><Metric label="Compras y gastos" value={formatCurrency(expenses)}/><Metric label="Diferencia" value={formatCurrency(income - expenses)} detail="Ventas menos compras y gastos registrados"/></section>
        <p className="muted">Importes en $ de tu moneda habitual. La alimentación asignada a un lote no vuelve a sumar la compra del stock. En elaboración se suma solamente el costo adicional del trabajo. No incluye deudas ni cobros pendientes.</p>
        <section className="panel"><h2>Detalle del período</h2>{money.length === 0 && <Empty>No hay movimientos en este período.</Empty>}{money.map(e => <div className="list-row" key={e.id}><span><strong>{e.title}</strong><small>{displayDate(e.date)}</small></span><strong className={e.income ? 'positive' : ''}>{e.income ? '+' : '−'}{formatCurrency(e.income || e.expense)}</strong></div>)}</section>
      </>}
      {tab === 'media' && <MediaLibrary/>}
      <footer className="farm-footer"><Sprout size={16}/> El Sembrador · Uso interno de la empresa</footer>
    </main>
    {modal && <EntryForm key={`${modal.action}-${modal.edit?.id || 'new'}`} {...modal} data={data} onClose={() => setModal(null)} onSave={next => { apply(next); setModal(null); }} onDelete={modal.edit && modal.action !== 'batch' ? () => { const key = modal.action === 'task' ? 'tasks' : modal.action === 'record' ? 'records' : modal.action === 'departure' ? 'departures' : 'movements'; setDeleteTarget({key,id:modal.edit!.id}); setModal(null); } : undefined}/>}
    {deleteTarget && <Dialog title="Eliminar registro" onClose={() => setDeleteTarget(null)}><div className="entry-form"><p>Se quitará este registro y se recalcularán las cantidades y los costos. Podés descargar una copia completa antes de continuar.</p><button className="secondary" onClick={() => downloadBackup(data,'-antes-de-eliminar')}>Descargar respaldo</button><div className="form-actions"><button className="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="primary" onClick={() => { remove(deleteTarget.key,deleteTarget.id); setDeleteTarget(null); }}>Eliminar registro</button></div></div></Dialog>}
    {resolveOpen && <Dialog title="Abrir datos del servidor" onClose={() => setResolveOpen(false)}><div className="entry-form"><p>Primero se descargará una copia de tus cambios locales. Después se abrirán los datos actuales del servidor. Tus cambios locales no se combinarán automáticamente: revisá la copia para volver a registrar lo que falte.</p><div className="form-actions"><button className="secondary" onClick={() => setResolveOpen(false)}>Cancelar</button><button className="primary" onClick={() => resolve().then(() => setResolveOpen(false)).catch(e => setNotice(e.message))}>Descargar copia y continuar</button></div></div></Dialog>}
    {menuOpen && <Dialog title="Más opciones" onClose={() => setMenuOpen(false)}><div className="mobile-menu">{tabs.filter(t => t.id === 'money' || t.id === 'media').map(t => <button className={`secondary ${tab === t.id ? 'selected' : ''}`} key={t.id} onClick={() => { setTab(t.id); setSelected(''); setMenuOpen(false); }}><t.icon/><span>{t.id === 'money' ? 'Cuentas · ingresos y gastos' : 'Archivos · logo y flyers'}</span><ChevronRight/></button>)}<button className="secondary" onClick={() => { setMenuOpen(false); setSettings(true); }}><Settings/> Respaldos y acceso</button></div></Dialog>}
    {settings && <BackupSettings onLogout={onLock} data={data} update={update} onClose={() => setSettings(false)}/>}
  </div>;
}

function EntryForm({ action, batchId, edit, data, onClose, onSave, onDelete }: { action: Action; batchId?: string; edit?: Editing; data: FarmData; onClose: () => void; onSave: (data: FarmData) => void; onDelete?: () => void }) {
  const [error, setError] = useState('');
  const value = (key: string, fallback: string|number = '') => (edit as unknown as Record<string,string|number> | undefined)?.[key] ?? fallback;
  const [batchStatus, setBatchStatus] = useState(String(value('status', 'active')));
  const [startDate, setStartDate] = useState(String(value('startDate', today())));
  const [arrivalAge, setArrivalAge] = useState(Number(value('ageOnArrivalDays', 0)));
  const [exitDate, setExitDate] = useState(String(value('expectedExitDate')));
  const [entryDate, setEntryDate] = useState(String(value('date', today())));
  const [purchaseId, setPurchaseId] = useState(String(value('purchaseId', edit ? 'manual' : '')));
  const [quantityUnit, setQuantityUnit] = useState(String(value('quantityUnit', 'kg')));
  const [bagWeight, setBagWeight] = useState(String(value('bagWeightKg')));
  const [quantity, setQuantity] = useState(String(value('quantityKg') === '' ? '' : Number(value('quantityKg')) / (value('quantityUnit') === 'bolsas' ? Number(value('bagWeightKg',1)) : 1)));
  const quantityKg = Number(quantity) * (quantityUnit === 'bolsas' ? Number(bagWeight) : 1);
  const purchase = action === 'feed' ? data.movements.find(m => m.id === purchaseId && m.type === 'purchase') : undefined;
  const available = purchase ? purchase.quantityKg - data.movements.filter(m => m.purchaseId === purchase.id && m.id !== edit?.id).reduce((sum,m) => sum + m.quantityKg, 0) : 0;
  const [taskStatus, setTaskStatus] = useState(String(value('status', 'pending')));
  const [ingredients, setIngredients] = useState<{product: string; quantityKg: number}[]>((edit as StockMovement)?.ingredients || [{ product: 'Maíz', quantityKg: 0 }, { product: 'Soja', quantityKg: 0 }]);
  const names: Record<Action,string> = { batch: 'Lote de pollitas', departure: 'Salida de pollitas', task: 'Trabajo de la granja', record: 'Registro del lote', purchase: 'Compra de insumos', sale: 'Venta de ración', feed: 'Alimento para un lote', production: 'Elaboración de ración', expense: 'Gasto de la granja' };
  const stockAction = ['purchase','sale','feed','production','expense'].includes(action);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const str = (key: string) => String(form.get(key) || '').trim();
    const num = (key: string) => Number(form.get(key) || 0);
    const entryId = edit?.id || id();
    const next = structuredClone(data);
    try {
      if (action === 'batch') {
        const batch: Batch = { id: entryId, name: str('name'), startDate: str('startDate'), initialCount: num('initialCount'), initialCostPerPullet: num('initialCostPerPullet'), ageOnArrivalDays: num('ageOnArrivalDays'), status: batchStatus as Batch['status'], expectedExitDate: str('expectedExitDate') || undefined, endDate: value('endDate') ? String(value('endDate')) : undefined, breed: str('breed'), barn: str('barn'), notes: str('notes'), createdAt: String(value('createdAt', new Date().toISOString())) };
        if (batch.status === 'active' && batch.startDate > today()) throw new Error('Para una llegada futura, elegí “Por llegar”.');
        next.batches = [...next.batches.filter(b => b.id !== entryId), batch];
      } else if (action === 'task') {
        const task: FarmTask = { id: entryId, title: str('title'), date: str('date'), batchId: str('batchId') || undefined, kind: str('kind') as FarmTask['kind'], status: taskStatus as FarmTask['status'], completedDate: taskStatus === 'done' ? str('completedDate') : undefined, cost: num('cost'), notes: str('notes') };
        next.tasks = [...next.tasks.filter(t => t.id !== entryId), task];
      } else if (action === 'departure') {
        const batch = next.batches.find(b => b.id === str('batchId'));
        if (!batch || batch.status === 'planned') throw new Error('Elegí un lote que ya haya llegado.');
        const departure: Departure = { id: entryId, batchId: batch.id, date: str('date'), count: num('count'), amount: num('amount'), notes: str('notes') };
        next.departures = [...next.departures.filter(d => d.id !== entryId), departure];
        const remaining = calculateBatchSummary({ ...batch, status: 'active' }, next.records, next.departures).currentLiveCount;
        if (remaining === 0) {
          batch.status = 'completed';
          batch.endDate = next.departures.filter(d => d.batchId === batch.id).map(d => d.date).sort().at(-1);
          if (!next.tasks.some(t => t.batchId === batch.id && t.kind === 'limpieza' && t.status === 'pending')) next.tasks.push({ id: id(), title: `Limpieza después de ${batch.name}`, kind: 'limpieza', batchId: batch.id, date: departure.date, status: 'pending', cost: 0, notes: 'Revisar la fecha y registrar la limpieza del galpón.' });
        } else if (batch.status === 'completed') { batch.status = 'active'; delete batch.endDate; }
      } else if (action === 'record') {
        const record: OperationRecord = { id: entryId, batchId: str('batchId'), category: str('category') as CategoryType, date: str('date'), title: str('title'), quantity: num('quantity'), unit: str('unit') as OperationRecord['unit'], cost: num('cost'), notes: str('notes'), createdAt: String(value('createdAt', new Date().toISOString())) };
        next.records = [...next.records.filter(r => r.id !== entryId), record];
      } else {
        const movement: StockMovement = { id: entryId, type: action as StockMovement['type'], date: str('date'), product: str('product'), quantityKg: action === 'expense' ? 0 : quantityKg, quantityUnit: quantityUnit as 'kg'|'bolsas', bagWeightKg: quantityUnit === 'bolsas' ? Number(bagWeight) : undefined, purchaseId: purchase?.id, amount: purchase ? feedCost(purchase, quantityKg) : num('amount'), batchId: str('batchId') || undefined, contact: str('contact'), notes: str('notes'), ...(action === 'production' ? { ingredients: ingredients.filter(i => i.quantityKg > 0) } : {}) };
        if (action === 'feed' && next.batches.find(b => b.id === movement.batchId)?.status === 'planned') throw new Error('Registrá primero la llegada del lote.');
        next.movements = [...next.movements.filter(m => m.id !== entryId), movement];
      }
      if (['record','departure'].includes(action)) {
        reconcileLifecycle(next, str('batchId'));
        if (edit && 'batchId' in edit && edit.batchId && edit.batchId !== str('batchId')) reconcileLifecycle(next, edit.batchId);
      }
      if (action === 'batch') {
        const updated = next.batches.find(b => b.id === entryId)!;
        if (updated.status === 'planned' && (next.records.some(r => r.batchId === entryId) || next.departures.some(d => d.batchId === entryId) || next.movements.some(m => m.batchId === entryId && m.type === 'feed'))) throw new Error('Este lote ya tiene actividad. No se puede marcar como pendiente de llegada.');
        if (next.records.some(r => r.batchId === entryId && r.category === 'mortalidad') || next.departures.some(d => d.batchId === entryId)) reconcileLifecycle(next, entryId);
      }
      if (action === 'record' || action === 'feed') {
        const batch = next.batches.find(b => b.id === str('batchId'));
        if (!batch || batch.status === 'planned' || str('date') < batch.startDate || (action === 'feed' && batch.endDate && str('date') > batch.endDate)) throw new Error('La fecha debe corresponder a un lote que ya haya llegado y, para alimento, que todavía estuviera en la granja.');
      }
      refreshLinkedFeedCosts(next);
      onSave(normalizeFarm(next));
    } catch (err) { setError((err as Error).message); }
  };
  const batchSelect = (required = false) => <Field title={required ? 'Lote' : 'Lote relacionado (opcional)'}><select name="batchId" required={required} defaultValue={String(value('batchId', batchId || ''))}><option value="">{required ? 'Elegí un lote' : 'Toda la granja'}</option>{data.batches.map(b => <option key={b.id} value={b.id}>{barnLabel(b)} · {b.name} · {statusLabels[b.status]}</option>)}</select></Field>;
  return <Dialog title={`${edit ? 'Editar' : 'Registrar'} · ${names[action]}`} onClose={onClose}><form onSubmit={submit} className="entry-form">
    {action === 'batch' ? <>
      <Field title="Nombre del lote"><input name="name" required defaultValue={value('name')} placeholder="Ej. Lote noviembre · Galpón 1"/></Field>
      <Field title="Galpón"><input name="barn" list="barns" defaultValue={value('barn')} placeholder="Elegí o escribí el nombre del galpón"/><datalist id="barns">{[...new Set([...BARN_SUGGESTIONS,...data.batches.map(b => b.barn).filter(Boolean)])].map(b => <option key={b} value={b}/>)}</datalist></Field>
      <Field title="Estado"><select value={batchStatus} onChange={e => setBatchStatus(e.target.value)}><option value="active">Ya está en la granja</option><option value="planned">Por llegar</option>{['completed','archived'].includes(String(value('status'))) && <option value={String(value('status'))}>{statusLabels[String(value('status')) as Batch['status']]}</option>}</select></Field>
      <div className="form-grid"><Field title={batchStatus === 'planned' ? 'Llegada prevista' : 'Fecha de llegada'}><input name="startDate" type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}/></Field><Field title="Salida prevista (opcional)"><input name="expectedExitDate" type="date" min={startDate} value={exitDate} onChange={e => setExitDate(e.target.value)}/></Field><Field title="Cantidad inicial de pollitas"><input name="initialCount" type="number" inputMode="decimal" min="1" step="1" required defaultValue={value('initialCount')}/></Field><Field title="Costo de compra por pollita ($)"><input name="initialCostPerPullet" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={value('initialCostPerPullet')}/></Field><Field title="Edad al llegar (días)"><input name="ageOnArrivalDays" type="number" inputMode="decimal" min="0" step="1" required value={arrivalAge} onChange={e => setArrivalAge(Number(e.target.value))}/></Field><Field title="Raza o línea"><input name="breed" defaultValue={value('breed')} placeholder="Opcional"/></Field></div>
      <button type="button" className="secondary" disabled={!startDate} onClick={() => setExitDate(suggestedExit(startDate,arrivalAge))}>Sugerir retiro a las 16 semanas</button><p className="form-hint">Es una fecha orientativa para organizarte. Ajustala a la fecha acordada con quien retira las pollitas.</p>
    </> : <>
      <Field title={action === 'task' ? 'Fecha programada' : 'Fecha del registro'}><input name="date" type="date" max={action === 'task' ? undefined : today()} required value={entryDate} onChange={e => setEntryDate(e.target.value)}/></Field>
      {(action === 'feed' || action === 'departure' || action === 'record') && batchSelect(true)}
      {(action === 'task' || action === 'expense') && batchSelect()}
      {action === 'task' && <><Field title="Trabajo"><input name="title" required defaultValue={value('title')} placeholder="Ej. Limpiar y preparar el galpón"/></Field><div className="form-grid"><Field title="Tipo"><select name="kind" defaultValue={value('kind','limpieza')}><option value="limpieza">Limpieza</option><option value="sanidad">Sanidad</option><option value="mantenimiento">Mantenimiento</option><option value="otro">Otro</option></select></Field><Field title="Estado"><select value={taskStatus} onChange={e => setTaskStatus(e.target.value)}><option value="pending">Por hacer</option><option value="done">Ya lo hice</option></select></Field></div>{taskStatus === 'done' && <Field title="Fecha en que se hizo"><input name="completedDate" type="date" max={today()} required defaultValue={value('completedDate', today())}/></Field>}<Field title={taskStatus === 'done' ? 'Costo real del trabajo ($)' : 'Costo previsto ($)'}><input name="cost" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={value('cost',0)}/></Field></>}
      {action === 'departure' && <><Field title="Pollitas que salieron"><input name="count" type="number" inputMode="decimal" min="1" step="1" required defaultValue={value('count')}/></Field><Field title="Importe total de la venta ($; 0 si no hubo venta)"><input name="amount" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={value('amount',0)}/></Field><p className="form-hint">Cuando salgan todas, el lote pasará al historial y se agendará su limpieza.</p></>}
      {action === 'record' && <><Field title="Tipo"><select name="category" defaultValue={value('category','mortalidad')}>{Object.entries(categoryLabels).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></Field><Field title="Descripción"><input name="title" required defaultValue={value('title')} placeholder="Ej. Bajas del día"/></Field><div className="form-grid"><Field title="Cantidad"><input name="quantity" type="number" inputMode="decimal" min="0" step="0.001" defaultValue={value('quantity',0)}/></Field><Field title="Unidad"><select name="unit" defaultValue={value('unit','aves')}>{['aves','kg','bolsas','dosis','garrafas','unidades'].map(u => <option key={u}>{u}</option>)}</select></Field></div><Field title="Costo total ($)"><input name="cost" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={value('cost',0)}/></Field><p className="form-hint">Para descontar alimento del stock usá “Registrar alimento”. Este registro conserva también los gastos de la versión anterior.</p></>}
      {stockAction && <>
        {action === 'feed' && <Field title="¿De qué compra salió el alimento?"><select value={purchaseId} onChange={e => setPurchaseId(e.target.value)} required><option value="">Elegí la compra</option>{data.movements.filter(m => m.type === 'purchase' && m.date <= entryDate).sort((a,b) => b.date.localeCompare(a.date)).map(p => <option key={p.id} value={p.id}>{displayDate(p.date)} · {p.product} · {formatCurrency(p.amount / p.quantityKg)}/kg{p.contact ? ' · '+p.contact : ''}</option>)}<option value="manual">Otra procedencia / ingresar costo manual</option></select></Field>}
        {purchase ? <><input name="product" type="hidden" value={purchase.product}/><p className="feed-price"><strong>{purchase.product}</strong><br/>{formatCurrency(purchase.amount / purchase.quantityKg)} por kilo · {kilos(available)} sin asignar a consumos</p></> : <Field title={action === 'expense' ? 'Concepto del gasto' : action === 'production' ? 'Ración elaborada' : 'Producto'}><input name="product" list="products" required defaultValue={value('product')} placeholder={action === 'expense' ? 'Ej. Electricidad' : 'Elegí o escribí un producto'}/><datalist id="products">{[...new Set([...PRODUCTS,...data.movements.map(m => m.product)])].map(p => <option value={p} key={p}/>)}</datalist></Field>}

        {action !== 'expense' && <><div className="form-grid"><Field title="Unidad"><select value={quantityUnit} onChange={e => {setQuantityUnit(e.target.value);setQuantity('');}}><option value="kg">Kilos</option><option value="bolsas">Bolsas</option></select></Field><Field title={quantityUnit === 'bolsas' ? 'Cantidad de bolsas' : 'Cantidad total (kg)'}><input name="quantityKg" type="number" inputMode="decimal" min="0.001" step="0.001" required value={quantity} onChange={e => setQuantity(e.target.value)}/></Field>{quantityUnit === 'bolsas' && <Field title="Peso de cada bolsa (kg)"><input type="number" inputMode="decimal" min="0.001" step="0.001" required value={bagWeight} onChange={e => setBagWeight(e.target.value)}/></Field>}</div>{quantityUnit === 'bolsas' && <p className="form-hint">Total a registrar: {kilos(quantityKg)}</p>}</>}
        {purchase ? <div className="calculated-cost"><span>Costo de este consumo</span><strong>{formatCurrency(feedCost(purchase,quantityKg))}</strong><small>Calculado con el precio de la compra elegida.</small></div> : <Field title={action === 'feed' ? 'Costo del alimento consumido ($)' : action === 'production' ? 'Costo adicional de elaboración ($)' : 'Importe total ($)'}><input name="amount" type="number" inputMode="decimal" min="0" step="0.01" required defaultValue={value('amount')}/></Field>}
        {action === 'feed' && <p className="form-hint">El alimento se descuenta del stock y su costo se asigna al lote. Si usás dos compras a distinto precio, registrá un consumo para cada una.</p>}
        {action === 'production' && <div className="ingredients"><h3>Insumos utilizados</h3><p className="form-hint">Se descuentan del stock. Arriba ingresá solo mano de obra, energía u otros costos adicionales.</p>{ingredients.map((i,index) => <div className="form-grid" key={index}><Field title={`Insumo ${index + 1}`}><input list="products" value={i.product} onChange={e => setIngredients(ingredients.map((x,j) => j === index ? { ...x, product: e.target.value } : x))}/></Field><Field title="Kilos utilizados"><input type="number" inputMode="decimal" min="0" step="0.001" value={i.quantityKg || ''} onChange={e => setIngredients(ingredients.map((x,j) => j === index ? { ...x, quantityKg: Number(e.target.value) } : x))}/></Field></div>)}<button type="button" className="text-button" onClick={() => setIngredients([...ingredients,{ product: '', quantityKg: 0 }])}>+ Otro insumo</button></div>}
        {['purchase','sale'].includes(action) && <Field title={action === 'sale' ? 'Cliente (opcional)' : 'Proveedor (opcional)'}><input name="contact" defaultValue={value('contact')}/></Field>}
      </>}
    </>}
    <Field title="Notas (opcional)"><textarea name="notes" rows={2} defaultValue={value('notes')}/></Field>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">{onDelete && <button type="button" className="text-button danger" onClick={onDelete}>Eliminar</button>}<button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" type="submit"><Check size={18}/> Guardar</button></div>
  </form></Dialog>;
}

function BackupSettings({ data, update, onClose, onLogout }: { data: FarmData; update: (data: FarmData) => void; onClose: () => void; onLogout: () => void }) {
  const [message, setMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<FarmData|null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [recoveries, setRecoveries] = useState<FarmData[]>([]);
  const findPending = () => {
    try {
      const found: FarmData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        if (key.startsWith('sembrador:pending:')) found.push(normalizeFarm(JSON.parse(localStorage.getItem(key)!).data));
      }
      setRecoveries(found); setMessage(found.length ? 'Copias pendientes encontradas. Revisá una copia antes de restaurarla.' : 'No hay copias pendientes en este navegador.');
    } catch { setMessage('No se pudieron leer todas las copias locales.'); }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try { if (file.size > 8000000) throw new Error('El archivo es demasiado grande.'); setPendingImport(normalizeFarm(JSON.parse(await file.text()))); setMessage(''); }
    catch (error) { setMessage((error as Error).message); }
  };
  const legacy = () => {
    try { setPendingImport(normalizeFarm({ batches: JSON.parse(localStorage.getItem('sembrador:v1:batches') || localStorage.getItem('sembrador_batches') || 'null'), records: JSON.parse(localStorage.getItem('sembrador:v1:records') || localStorage.getItem('sembrador_records') || 'null') })); }
    catch { setMessage('No hay una copia antigua válida en este navegador. Revisá el celular o el dominio donde se usaba antes.'); }
  };
  return <Dialog title="Respaldos y acceso" onClose={onClose}><div className="entry-form">
    <p>Los registros se guardan en el servidor. Esta copia incluye lotes, consumos, compras, ventas y trabajos. Las imágenes y flyers se conservan por separado en el servidor y no se reemplazan al restaurar este archivo.</p>
    <button className="primary" onClick={() => downloadBackup(data)}><Download size={18}/> Descargar respaldo de registros</button>
    <Field title="Restaurar un archivo de respaldo"><input type="file" accept=".json,application/json" onChange={e => void importFile(e.target.files?.[0])}/></Field>
    <button className="secondary" onClick={legacy}>Buscar datos de la versión anterior en este navegador</button>
    <button className="secondary" onClick={findPending}>Buscar cambios sin guardar de otras pestañas</button>
    {recoveries.map((copy, index) => <div className="alert" key={index}><span>Copia {index + 1}: {copy.batches.length} lotes, {copy.movements.length} movimientos.</span><button onClick={() => downloadBackup(copy, `-pendiente-${index+1}`)}>Descargar</button><button onClick={() => setPendingImport(copy)}>Revisar restauración</button></div>)}
    {pendingImport && <div className="alert"><strong>Archivo listo para revisar</strong><p>{pendingImport.batches.length} lotes, {pendingImport.records.length} registros, {pendingImport.movements.length} movimientos y {pendingImport.tasks.length} trabajos.</p><p>Reemplazará los datos actuales. Primero se descargará una copia de lo que hay ahora.</p><button className="primary" onClick={() => { try { downloadBackup(data,'-antes-de-restaurar'); update(pendingImport); setPendingImport(null); setMessage('Restauración pendiente de guardar. Comprobá el estado de guardado.'); } catch (error) { setMessage((error as Error).message); } }}>Restaurar estos datos</button><button className="text-button" onClick={() => setPendingImport(null)}>Cancelar</button></div>}
    <hr/><h3>Acceso desde este teléfono</h3><p>La sesión queda recordada en este dispositivo.</p>{confirmLogout ? <div className="alert"><p>Para volver a entrar tendrás que solicitar un código de acceso.</p><button className="secondary" onClick={() => setConfirmLogout(false)}>Seguir conectado</button><button className="primary" onClick={onLogout}>Cerrar sesión</button></div> : <button className="secondary" onClick={() => setConfirmLogout(true)}>Cerrar sesión de este teléfono</button>}{message && <p role="status">{message}</p>}
  </div></Dialog>;
}
