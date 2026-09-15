import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Folder, FolderOpen, FolderPlus, Loader2, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DocumentFolder, DocumentSaveScope, StoredDocumentMeta, UniversalDocument } from '../../lib/documentEditor/types';
import {
  createFolder,
  deleteFolder,
  deleteStoredDocument,
  listFolders,
  listStoredDocuments,
  loadDocumentFromApp,
  scopeLabel,
} from '../../lib/documentEditor/storage';

interface ClientRow {
  id: string;
  name: string;
}

interface InvoiceRow {
  id: string;
  document_no: string | null;
  client_id: string | null;
  client_name: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: (doc: UniversalDocument) => void;
  /** Якщо true — рендерити inline без fullscreen overlay (стартовий екран) */
  inline?: boolean;
}

type BrowseTab = 'all' | DocumentSaveScope;

const modeLabel = (mode: StoredDocumentMeta['mode']) => {
  if (mode === 'presentation') return 'Презентація';
  if (mode === 'book') return 'Книга';
  return 'Документ';
};

export const DocumentLibraryPanel: React.FC<Props> = ({ open, onClose, onOpen, inline }) => {
  const [tab, setTab] = useState<BrowseTab>('all');
  const [docs, setDocs] = useState<StoredDocumentMeta[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | 'all'>('all');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const scope: DocumentSaveScope | 'all' = tab === 'all' ? 'all' : tab;
      const [docList, folderList] = await Promise.all([
        listStoredDocuments({
          scope,
          clientId: clientFilter || undefined,
          invoiceId: invoiceFilter || undefined,
          folderId: selectedFolderId === 'all' ? undefined : selectedFolderId,
        }),
        listFolders({
          scope: tab === 'all' ? 'all' : tab,
          clientId: tab === 'client' && clientFilter ? clientFilter : undefined,
          invoiceId: tab === 'invoice' && invoiceFilter ? invoiceFilter : undefined,
        }),
      ]);
      setDocs(docList);
      setFolders(folderList);
    } catch {
      setError('Не вдалося завантажити бібліотеку');
    } finally {
      setLoading(false);
    }
  }, [tab, clientFilter, invoiceFilter, selectedFolderId]);

  useEffect(() => {
    if (!open && !inline) return;
    void refresh();
  }, [open, inline, refresh]);

  useEffect(() => {
    if (!open && !inline) return;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: clientRows }, { data: invoiceRows }] = await Promise.all([
        supabase.from('clients').select('id, name').eq('user_id', user.id).order('name'),
        supabase
          .from('invoices')
          .select('id, document_no, client_id, client_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      setClients(clientRows || []);
      setInvoices(invoiceRows || []);
    })();
  }, [open, inline]);

  const filteredInvoices = useMemo(() => {
    if (!clientFilter) return invoices;
    return invoices.filter((i) => i.client_id === clientFilter);
  }, [invoices, clientFilter]);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const scope: DocumentSaveScope = tab === 'all' ? 'general' : tab;
    if (scope === 'client' && !clientFilter) {
      setError('Оберіть клієнта, щоб створити папку');
      return;
    }
    if (scope === 'invoice' && !invoiceFilter) {
      setError('Оберіть інвойс, щоб створити папку');
      return;
    }
    setCreating(true);
    try {
      const inv = invoices.find((i) => i.id === invoiceFilter);
      await createFolder({
        name,
        scope,
        clientId: scope === 'client' ? clientFilter : scope === 'invoice' ? inv?.client_id || null : null,
        invoiceId: scope === 'invoice' ? invoiceFilter : null,
      });
      setNewFolderName('');
      await refresh();
    } catch {
      setError('Не вдалося створити папку');
    } finally {
      setCreating(false);
    }
  };

  if (!open && !inline) return null;

  const body = (
    <div className={`flex flex-col ${inline ? '' : 'max-h-[80vh]'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderOpen size={20} className="text-orange-400" /> Бібліотека документів
          </h3>
          <p className="text-xs text-white/45 mt-1">Відкрийте файл для читання або редагування</p>
        </div>
        {!inline && (
          <button type="button" onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {(
          [
            ['all', 'Усі'],
            ['general', 'Загальні'],
            ['client', 'Клієнти'],
            ['invoice', 'Інвойси'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setSelectedFolderId('all');
              setError(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === id ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(tab === 'client' || tab === 'invoice') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setInvoiceFilter('');
              setSelectedFolderId('all');
            }}
            className="rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
          >
            <option value="">Усі клієнти</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {tab === 'invoice' && (
            <select
              value={invoiceFilter}
              onChange={(e) => {
                setInvoiceFilter(e.target.value);
                setSelectedFolderId('all');
              }}
              className="rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2"
            >
              <option value="">Усі інвойси</option>
              {filteredInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.document_no || inv.id.slice(0, 8)}
                  {inv.client_name ? ` — ${inv.client_name}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          onClick={() => setSelectedFolderId('all')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${
            selectedFolderId === 'all' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/55 hover:bg-white/10'
          }`}
        >
          Усі файли
        </button>
        <button
          type="button"
          onClick={() => setSelectedFolderId(null)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${
            selectedFolderId === null ? 'bg-white/15 text-white' : 'bg-white/5 text-white/55 hover:bg-white/10'
          }`}
        >
          Без папки
        </button>
        {folders.map((f) => (
          <div key={f.id} className="inline-flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSelectedFolderId(f.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${
                selectedFolderId === f.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/55 hover:bg-white/10'
              }`}
            >
              <Folder size={12} /> {f.name}
            </button>
            <button
              type="button"
              title="Видалити папку"
              onClick={async () => {
                if (!window.confirm(`Видалити папку «${f.name}»? Файли залишаться.`)) return;
                await deleteFolder(f.id);
                if (selectedFolderId === f.id) setSelectedFolderId('all');
                await refresh();
              }}
              className="p-1 text-white/30 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder={tab === 'all' ? 'Нова загальна папка…' : 'Нова папка…'}
          className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2 placeholder:text-white/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleCreateFolder();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void handleCreateFolder()}
          disabled={creating}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 disabled:opacity-50"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
          Папка
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

      <div className={`space-y-1 overflow-y-auto ${inline ? 'max-h-72' : 'flex-1 min-h-[200px]'}`}>
        {loading ? (
          <div className="flex items-center gap-2 text-white/50 text-sm py-6 justify-center">
            <Loader2 className="animate-spin" size={16} /> Завантаження…
          </div>
        ) : docs.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">Немає збережених документів у цій категорії</p>
        ) : (
          docs.map((item) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <button
                type="button"
                onClick={async () => {
                  const loaded = await loadDocumentFromApp(item.id);
                  if (loaded) onOpen(loaded);
                }}
                className="flex-1 text-left p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-orange-400 shrink-0" />
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                </div>
                <p className="text-white/40 text-xs mt-1 truncate pl-6">
                  {modeLabel(item.mode)} · {scopeLabel(item.saveScope)}
                  {item.clientName ? ` · ${item.clientName}` : ''}
                  {item.invoiceLabel ? ` · №${item.invoiceLabel}` : ''}
                  {' · '}
                  {new Date(item.updatedAt).toLocaleString('uk-UA')}
                </p>
                {item.preview && <p className="text-white/30 text-xs truncate pl-6 mt-0.5">{item.preview}</p>}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(`Видалити «${item.name}»?`)) return;
                  await deleteStoredDocument(item.id);
                  await refresh();
                }}
                className="p-2 text-red-400/70 hover:text-red-400 opacity-70 group-hover:opacity-100"
                title="Видалити"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (inline) {
    return <div className="bg-white/8 border border-white/10 rounded-2xl p-4">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Закрити" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1f2e] shadow-2xl p-5">{body}</div>
    </div>
  );
};
