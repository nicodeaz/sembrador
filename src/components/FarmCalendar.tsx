import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FarmData, FarmTask } from '../types';
import { addDays, displayDate, today, weekStart } from '../utils/dates';
import { barnLabel, calendarEntries } from '../utils/rearing';

export function FarmCalendar({ data, onBatch, onTask }: { data: FarmData; onBatch: (id: string) => void; onTask: (task: FarmTask) => void }) {
  const [month, setMonth] = useState(today().slice(0,7));
  const [selected, setSelected] = useState(today());
  const [barn, setBarn] = useState('');
  const all = useMemo(() => calendarEntries(data), [data]);
  const events = all.filter(e => !barn || (e.batchId && barnLabel(data.batches.find(b => b.id === e.batchId)) === barn));
  const monthEvents = events.filter(e => e.date.startsWith(month));
  const dayEvents = events.filter(e => e.date === selected);
  const first = `${month}-01`;
  const days = Array.from({length:42},(_,i) => addDays(weekStart(first),i));
  const monthTitle = new Date(`${first}T12:00:00`).toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  const changeMonth = (delta: number) => { const d = new Date(`${first}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth()+delta); const next = d.toISOString().slice(0,7); setMonth(next); setSelected(`${next}-01`); };
  const selectEvent = (event: typeof all[number]) => {
    const task = data.tasks.find(t => t.id === event.taskId);
    if (task) onTask(task); else if (event.batchId) onBatch(event.batchId);
  };
  return <section className="panel calendar-panel" aria-label="Calendario de la granja">
    <div className="calendar-toolbar"><button className="icon-button" aria-label="Mes anterior" onClick={() => changeMonth(-1)}><ChevronLeft/></button><h2 aria-live="polite">{monthTitle}</h2><button className="icon-button" aria-label="Mes siguiente" onClick={() => changeMonth(1)}><ChevronRight/></button><button className="secondary" onClick={() => { setMonth(today().slice(0,7));setSelected(today()); }}>Hoy</button></div>
    <label className="field"><span>Ver galpón</span><select value={barn} onChange={e => setBarn(e.target.value)}><option value="">Todos los galpones y trabajos generales</option>{[...new Set(data.batches.map(barnLabel))].sort().map(b => <option key={b}>{b}</option>)}</select></label>
    <div className="calendar-legend"><span className="arrival">● Llegadas</span><span className="departure">● Retiros</span><span className="task">● Trabajos</span></div>
    <div className="calendar-grid">{['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d => <span className="weekday" key={d}>{d}</span>)}
      {days.map(date => {
        const entries = events.filter(e => e.date === date);
        return <button key={date} className={`calendar-day ${date.startsWith(month) ? '' : 'outside'} ${date === selected ? 'selected' : ''} ${date === today() ? 'is-today' : ''}`} aria-pressed={date === selected} aria-label={`${displayDate(date)}${date === today() ? ', hoy' : ''}: ${entries.length} eventos`} onClick={() => {setSelected(date);if(!date.startsWith(month))setMonth(date.slice(0,7));}}><strong>{Number(date.slice(-2))}</strong><span className="day-dots">{[...new Set(entries.map(e => e.kind))].map(kind => <span key={kind} className={kind}>●</span>)}</span><span className="day-count">{entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'evento' : 'eventos'}` : ''}</span></button>;
      })}
    </div>
    <div className="calendar-agenda" aria-live="polite"><h3>{displayDate(selected)}</h3>{dayEvents.length === 0 && <p className="muted">Sin llegadas, retiros ni trabajos para este día.</p>}{dayEvents.map(e => <button className="list-row" key={e.id} onClick={() => selectEvent(e)}><span className={`event-mark ${e.kind}`}>●</span><span><strong>{e.title}</strong><small>{e.detail} · {e.planned ? 'Previsto' : 'Registrado'}</small></span><ChevronRight size={20}/></button>)}</div>
    <details><summary>Todos los eventos del mes ({monthEvents.length})</summary>{monthEvents.map(e => <button className="list-row" key={e.id} onClick={() => {setSelected(e.date);selectEvent(e);}}><span className="date-chip">{displayDate(e.date)}</span><span><strong>{e.title}</strong><small>{e.detail} · {e.planned ? 'Previsto' : 'Registrado'}</small></span></button>)}</details>
  </section>;
}
