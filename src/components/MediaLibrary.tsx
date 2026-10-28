import { FormEvent, useEffect, useRef, useState } from 'react';
import { Download, FileImage, Upload, X, ZoomIn } from 'lucide-react';
import { MediaAsset } from '../types';

const endpoint = `${import.meta.env.BASE_URL}api/media.php`;
const categories: Record<MediaAsset['category'], string> = { logo:'Logo', etiqueta:'Etiquetas', flyer:'Flyers de raciones', servicios:'Servicios y aviso de revista' };
const original: MediaAsset = {id:'original',title:'Logo original · El Sembrador',category:'logo',mime:'image/png',size:0,createdAt:''};
const assetUrl = (asset: MediaAsset, download = false) => asset.id === 'original' ? `${import.meta.env.BASE_URL}logo-original.png` : `${endpoint}?id=${asset.id}${download ? '&download=1' : ''}`;
const extensions: Record<string,string> = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'};
const filename = (asset: MediaAsset) => `${asset.title.replace(/[^\p{L}\p{N}\s-]/gu,'').trim() || 'El-Sembrador'}.${extensions[asset.mime] || 'png'}`;
async function errorMessage(response: Response) {
  if (response.status === 401) return 'Volvé a iniciar sesión para abrir la biblioteca.';
  if (response.status === 413) return 'El archivo supera el espacio disponible. Probá con una versión más liviana.';
  return 'No se pudo guardar. Usá una imagen PNG, JPG o WebP, o un PDF, dentro del tamaño permitido.';
}

export function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filter, setFilter] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [limit, setLimit] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<MediaAsset|null>(null);
  const requestId = useRef(crypto.randomUUID().replaceAll('-',''));
  const load = async () => {
    setError('');
    try {
      const response = await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error(response.status === 401 ? 'Volvé a iniciar sesión.' : 'No se pudo abrir la biblioteca. Revisá la conexión y reintentá.');
      const result = await response.json(); setAssets(result.assets); setLimit(result.maxUploadBytes); setLoaded(true);
    } catch (e) { setError((e as Error).message); }
  };
  useEffect(() => { void load(); }, []);
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const body = new FormData(form); const file=body.get('file') as File;
    setError(''); setMessage('');
    if (!file?.size || file.size > limit) { setError('Elegí un archivo dentro del tamaño permitido.'); return; }
    setUploading(true); body.set('id',requestId.current);
    try {
      const response = await fetch(endpoint,{method:'POST',headers:{'X-Sembrador-Upload':'1'},body,signal:AbortSignal.timeout(60000)});
      if (!response.ok) throw new Error(await errorMessage(response));
      const result = await response.json(); setAssets(current => [result.asset,...current.filter(a => a.id !== result.asset.id)]);
      requestId.current=crypto.randomUUID().replaceAll('-',''); form.reset(); setUploadOpen(false); setFilter(result.asset.category); setMessage('Archivo guardado en la biblioteca interna.');
    } catch(e) { setError((e as Error).name === 'TimeoutError' ? 'No llegó la confirmación. Reintentá con el mismo archivo; no se duplicará.' : (e as Error).message); } finally { setUploading(false); }
  };
  const shown = [original,...assets].filter(a => !filter || a.category === filter);
  return <>
    <div className="page-heading"><div><p className="eyebrow">ARCHIVOS DE LA EMPRESA</p><h1>Biblioteca interna</h1><p>Logo, etiquetas y materiales de la empresa, reunidos en un solo lugar.</p></div><button className="primary" disabled={!loaded || uploading} onClick={() => setUploadOpen(!uploadOpen)}><Upload size={21}/> {uploadOpen ? 'Cerrar carga' : 'Agregar archivo'}</button></div>
    {error && <div className="alert" role="alert">{error}{!loaded && <button onClick={() => void load()}>Reintentar</button>}</div>}
    {message && <p className="notice" role="status">{message}</p>}
    {!loaded && !error && <p role="status">Abriendo biblioteca…</p>}
    {uploadOpen && <form className="panel entry-form media-upload" onSubmit={upload} onChange={() => { requestId.current=crypto.randomUUID().replaceAll('-',''); }}>
      <h2>Guardar un material</h2><label className="field"><span>Nombre para encontrarlo</span><input name="title" maxLength={100} required placeholder="Ej. Ración ovina peletizada" disabled={uploading}/></label>
      <label className="field"><span>Sección</span><select name="category" defaultValue={filter || 'flyer'} disabled={uploading}>{Object.entries(categories).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="field"><span>Imagen o PDF (máximo {(limit/1024/1024).toLocaleString('es-AR',{maximumFractionDigits:1})} MB)</span><input name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required disabled={uploading}/></label>
      <p className="form-hint">Cargá el diseño terminado. Para flyers de raciones, podés guardar uno para ovina peletizada, ovina no peletizada, ponedoras y recría.</p><button className="primary" disabled={uploading}>{uploading ? 'Guardando archivo…' : 'Guardar en la biblioteca'}</button>
    </form>}
    <div className="filters media-filters" aria-label="Tipo de material"><button className={!filter ? 'selected' : ''} onClick={() => setFilter('')}>Todo</button>{Object.entries(categories).map(([key,label]) => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div>
    <div className="media-grid">{shown.map(asset => <article className="media-card" key={asset.id}><div className="media-preview">{asset.mime.startsWith('image/') ? <button onClick={() => setPreview(asset)} aria-label={`Ampliar ${asset.title}`}><img src={assetUrl(asset)} alt={asset.title} loading="lazy"/></button> : <div><FileImage size={70}/><p>Documento PDF</p></div>}</div><div className="media-info"><span className="eyebrow">{categories[asset.category]}</span><h2>{asset.title}</h2><div className="action-row">{asset.mime.startsWith('image/') && <button className="primary" onClick={() => setPreview(asset)}><ZoomIn size={20}/> Ver en grande</button>}<a className="secondary" href={assetUrl(asset,true)} download={filename(asset)}><Download size={20}/> Descargar</a></div></div></article>)}</div>
    {preview && <MediaPreview asset={preview} onClose={() => setPreview(null)}/>}
    {loaded && shown.length === 0 && <div className="empty-state"><FileImage size={40}/><p>Todavía no hay materiales en esta sección.</p><button className="primary" onClick={() => setUploadOpen(true)}>Agregar el primer archivo</button></div>}
    <p className="muted">Los archivos cargados se guardan en el servidor y se conservan al actualizar la aplicación. El respaldo de registros en JSON no incluye estas imágenes; el respaldo completo del servidor sí.</p>
  </>;
}

function MediaPreview({asset,onClose}:{asset:MediaAsset;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!;dialog.showModal();return ()=>dialog.close();},[]);
  return <dialog ref={ref} className="farm-dialog media-fullscreen" onCancel={onClose} aria-label={asset.title}><div className="dialog-heading"><h2>{asset.title}</h2><button className="secondary" onClick={onClose}><X size={20}/> Cerrar</button></div><img src={assetUrl(asset)} alt={asset.title}/><a className="secondary" href={assetUrl(asset,true)} download={filename(asset)}><Download size={20}/> Descargar archivo</a></dialog>;
}
