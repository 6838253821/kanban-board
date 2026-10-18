import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Plus, Trash2, ArrowRight, ArrowLeft, LayoutDashboard, Pencil, X, Check } from 'lucide-react'
import './style.css'

type Status = 'todo' | 'doing' | 'done'
type Card = { id: string; title: string; description: string; status: Status; created_at: string }
const columns: {key: Status; label: string; subtitle: string}[] = [
  {key:'todo',label:'To Do',subtitle:'Ideas & upcoming tasks'},
  {key:'doing',label:'Doing',subtitle:'Currently in progress'},
  {key:'done',label:'Done',subtitle:'Finished & delivered'},
]
const api = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(api + path, {headers:{'Content-Type':'application/json'}, ...options})
  if (!response.ok) { const e = await response.json().catch(()=>({})); throw new Error(e.detail || `Request failed (${response.status})`) }
  return response.status === 204 ? undefined as T : await response.json()
}
function App() {
  const [cards,setCards] = useState<Card[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [showModal,setShowModal] = useState(false)
  const [editing,setEditing] = useState<Card | null>(null)
  const [title,setTitle] = useState('')
  const [description,setDescription] = useState('')
  const [status,setStatus] = useState<Status>('todo')
  const [saving,setSaving] = useState(false)
  const [dragId,setDragId] = useState<string | null>(null)
  async function load() {
    setLoading(true); setError('')
    try {setCards(await request<Card[]>('/cards'))} catch(e) {setError((e as Error).message)} finally {setLoading(false)}
  }
  useEffect(()=>{void load()},[])
  function openCreate(s:Status='todo') {setEditing(null);setTitle('');setDescription('');setStatus(s);setShowModal(true)}
  function openEdit(card:Card) {setEditing(card);setTitle(card.title);setDescription(card.description);setStatus(card.status);setShowModal(true)}
  async function save(e: React.FormEvent) {
    e.preventDefault();if(!title.trim())return;setSaving(true);setError('')
    try {
      const body = JSON.stringify({title:title.trim(),description:description.trim(),status})
      const result = await request<Card>(editing?`/cards/${editing.id}`:'/cards',{method:editing?'PATCH':'POST',body})
      setCards(prev=>editing?prev.map(c=>c.id===result.id?result:c):[...prev,result]);setShowModal(false)
    } catch(e) {setError((e as Error).message)} finally {setSaving(false)}
  }
  async function move(card:Card,target:Status) {
    if(card.status===target)return
    setError('')
    try {const updated=await request<Card>(`/cards/${card.id}`,{method:'PATCH',body:JSON.stringify({status:target})});setCards(prev=>prev.map(c=>c.id===card.id?updated:c))}
    catch(e){setError((e as Error).message)}
  }
  async function remove(card:Card) {
    if(!confirm(`Delete “${card.title}”?`))return
    setError('')
    try {await request<void>(`/cards/${card.id}`,{method:'DELETE'});setCards(prev=>prev.filter(c=>c.id!==card.id))}
    catch(e){setError((e as Error).message)}
  }
  return <div className="app">
    <header className="topbar"><div className="brand"><span className="logo"><LayoutDashboard size={21}/></span><span>flowboard<span className="brand-dot">.</span></span></div><span className="header-note">YOUR PERSONAL WORKSPACE</span><span className="avatar">FB</span></header>
    <main>
      <div className="hero"><div><div className="eyebrow"><span className="pulse"/> WORKSPACE / BOARD</div><h1>My Kanban Board <span className="sparkle">✳</span></h1><p>Stay focused, move things forward, and celebrate the wins.</p></div><button className="primary" onClick={()=>openCreate()}><Plus size={18}/> New task</button></div>
      <div className="summary"><div><span className="summary-number">{cards.length}</span><span className="summary-label">Total tasks</span></div><div><span className="summary-number">{cards.filter(c=>c.status==='doing').length}</span><span className="summary-label">In progress</span></div><div><span className="summary-number">{cards.filter(c=>c.status==='done').length}</span><span className="summary-label">Completed</span></div><div className="summary-tip">✦ &nbsp; Small steps make big progress.</div></div>
      {error && <div className="error">{error} <button onClick={()=>setError('')}><X size={16}/></button></div>}
      <section className="board">{columns.map((column,index)=><div className={`column col-${column.key}`} key={column.key} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const card=cards.find(c=>c.id===dragId);if(card)void move(card,column.key);setDragId(null)}}><div className="column-head"><div className="column-title"><span className={`status-dot dot-${column.key}`}/><h2>{column.label}</h2><span className="count">{cards.filter(c=>c.status===column.key).length}</span></div><button title={`Add to ${column.label}`} className="icon-button add-icon" onClick={()=>openCreate(column.key)}><Plus size={18}/></button></div><p className="column-subtitle">{column.subtitle}</p><div className="card-list">{cards.filter(c=>c.status===column.key).map(card=><article key={card.id} className="task" draggable onDragStart={()=>setDragId(card.id)} onDragEnd={()=>setDragId(null)}><div className="task-top"><span className={`tag tag-${card.status}`}>{card.status==='todo'?'UPCOMING':card.status==='doing'?'IN PROGRESS':'COMPLETED'}</span><div className="task-actions"><button title="Edit" onClick={()=>openEdit(card)}><Pencil size={15}/></button><button title="Delete" onClick={()=>void remove(card)}><Trash2 size={15}/></button></div></div><h3>{card.title}</h3>{card.description&&<p>{card.description}</p>}<div className="task-footer"><span className="task-date">{new Date(card.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span><div className="move-buttons">{index>0&&<button title="Move left" onClick={()=>void move(card,columns[index-1].key)}><ArrowLeft size={16}/></button>}{index<2&&<button title="Move right" onClick={()=>void move(card,columns[index+1].key)}><ArrowRight size={16}/></button>}</div></div></article>)}{!loading&&cards.filter(c=>c.status===column.key).length===0&&<div className="empty"><span>✦</span><strong>Nothing here yet</strong><p>Drop a task here or add one.</p></div>}</div><button className="add-task" onClick={()=>openCreate(column.key)}><Plus size={17}/> Add a task</button></div>)}</section>
      {loading&&<p className="loading">Loading your board…</p>}<footer>FLOWBOARD © 2026 <span>Built for getting things done.</span></footer>
    </main>
    {showModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowModal(false)}}><form className="modal" onSubmit={e=>void save(e)}><div className="modal-head"><div><span className="eyebrow">TASK DETAILS</span><h2>{editing?'Edit task':'Create new task'}</h2></div><button type="button" className="icon-button" onClick={()=>setShowModal(false)}><X size={20}/></button></div><label>Task name<input autoFocus required maxLength={200} placeholder="What needs to get done?" value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Description <span className="optional">(optional)</span><textarea maxLength={2000} rows={4} placeholder="Add a few details…" value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value as Status)}><option value="todo">To Do</option><option value="doing">Doing</option><option value="done">Done</option></select></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowModal(false)}>Cancel</button><button className="primary" disabled={saving||!title.trim()} type="submit"><Check size={17}/>{saving?'Saving…':editing?'Save changes':'Create task'}</button></div></form></div>}
  </div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
