import { Bird, ChevronRight, Wheat } from 'lucide-react';
import { BatchSummary, FarmData } from '../types';
import { barnLabel, feedOverview } from '../utils/rearing';
import { displayDate } from '../utils/dates';
import { formatCurrency } from '../utils/calculations';
import { kilos } from '../utils/farm';

export function BarnOverview({ data, summaries, onSelect }: { data: FarmData; summaries: BatchSummary[]; onSelect: (id: string) => void }) {
  return <section><div className="section-heading"><h2>Hoy en los galpones</h2></div><div className="barn-grid">
    {summaries.map(s => {
      const feed = feedOverview(data, s.batch.id);
      return <button className="barn-card" key={s.batch.id} onClick={() => onSelect(s.batch.id)}>
        <span className="eyebrow">{barnLabel(s.batch)}</span><h3>{s.batch.name} <ChevronRight size={20}/></h3>
        <div className="barn-count"><Bird/><strong>{s.currentLiveCount.toLocaleString('es-AR')}</strong> pollitas</div>
        <p>{s.currentAgeWeeks} semanas y {s.currentAgeDaysRemainder} días de edad</p>
        <dl><div><dt>Alimento registrado hoy</dt><dd>{kilos(feed.todayKg)}</dd></div><div><dt>Costo del lote hasta hoy</dt><dd>{formatCurrency(s.totalExpenses)}</dd></div></dl>
        <p className="last-feed"><Wheat size={19}/>{feed.last ? `${feed.last.title} · último registro ${displayDate(feed.last.date)}` : 'Todavía no se registró alimento'}</p>
        <span className="barn-exit">Retiro previsto: {s.batch.expectedExitDate ? displayDate(s.batch.expectedExitDate) : 'sin fecha'}</span>
      </button>;
    })}
  </div></section>;
}

export function RearingDetails({ data, batchId, onEdit }: { data: FarmData; batchId: string; onEdit: (id: string) => void }) {
  const feed = feedOverview(data, batchId);
  const movements = data.movements.filter(m => m.type === 'feed' && m.batchId === batchId).sort((a,b) => b.date.localeCompare(a.date));
  return <section className="panel feed-detail"><h2>Qué comieron y cuánto costó</h2>
    <div className="metrics compact"><div className="metric"><span>Total registrado</span><strong>{kilos(feed.totalKg)}</strong></div><div className="metric"><span>Últimos 7 días</span><strong>{kilos(feed.recentKg)}</strong></div><div className="metric"><span>Costo del alimento</span><strong>{formatCurrency(feed.cost)}</strong></div></div>
    {feed.last && <p>Último alimento registrado: <strong>{feed.last.title}</strong>, el {displayDate(feed.last.date)}.</p>}
    {feed.hasUnconvertedBags && <p className="form-hint">Hay registros anteriores en bolsas. Su costo está incluido; faltan los pesos para sumar sus kilos.</p>}
    {feed.weekly.length > 0 && <><h3>Consumo por semana y tipo de ración</h3><div className="table-scroll"><table className="mobile-cards"><thead><tr><th>Semana del</th><th>Alimento</th><th>Kilos</th><th>Costo</th></tr></thead><tbody>{feed.weekly.map(row => <tr key={`${row.week}-${row.product}`}><td data-label="Semana del">{displayDate(row.week)}</td><td data-label="Alimento">{row.product}</td><td data-label="Kilos">{kilos(row.kg)}</td><td data-label="Costo">{formatCurrency(row.cost)}</td></tr>)}</tbody></table></div></>}
    <h3>Consumos y precio de compra</h3>{movements.length === 0 && <p className="muted">Usá “Registrar alimento” para anotar lo que comió este lote.</p>}
    {movements.map(m => {
      const purchase = data.movements.find(p => p.id === m.purchaseId);
      return <div className="list-row" key={m.id}><span><strong>{m.product} · {kilos(m.quantityKg)}</strong><small>{displayDate(m.date)} · {purchase ? `Compra del ${displayDate(purchase.date)} a ${formatCurrency(purchase.amount / purchase.quantityKg)}/kg` : 'Costo ingresado manualmente'}</small></span><strong>{formatCurrency(m.amount)}</strong><button className="text-button" onClick={() => onEdit(m.id)}>Editar</button></div>;
    })}
  </section>;
}
