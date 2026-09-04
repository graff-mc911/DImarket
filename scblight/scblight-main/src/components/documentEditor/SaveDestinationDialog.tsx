import React, { useEffect, useMemo, useState } from 'react';
import { FolderPlus, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DocumentFolder, DocumentSaveDestination, DocumentSaveScope } from '../../lib/documentEditor/types';
import { createFolder, listFolders } from '../../lib/documentEditor/storage';

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
  documentName: string;
  initial?: Partial<DocumentSaveDestination>;
  onClose: () => void;
  onConfirm: (destination: DocumentSaveDestination) => void;
}

const scopeOptions: { id: DocumentSaveScope; title: string; desc: string }[] = [
  { id: 'general', title: 'Загальна папка', desc: 'Спільна бібліотека документів' },
  { id: 'client', title: 'До клієнта', desc: 'Привʼязати до картки клієнта' },
  { id: 'invoice', title: 'До інвойсу', desc: 'Привʼязати до конкретного інвойсу' },
];

export const SaveDestinationDialog: React.FC<Props> = ({
  open,
  documentName,
  initial,
  onClose,
  onConfirm,
}) => {
  const [scope, setScope] = useState<DocumentSaveScope>(initial?.saveScope || 'general');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [clientId, setClientId] = useState(initial?.clientId || '');
  const [invoiceId, setInvoiceId] = useState(initial?.invoiceId || '');
  const [folderId, setFolderId] = useState(initial?.folderId || '');
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setScope(initial?.saveScope || 'general');
    setClientId(initial?.clientId || '');
    setInvoiceId(initial?.invoiceId || '');
    setFolderId(initial?.folderId || '');
    setNewFolderName('');
    setError(null);
  }, [open, initial?.saveScope, initial?.clientId, initial?.invoiceId, initial?.folderId]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
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
        } else {
          setClients([]);
          setInvoices([]);
        }
      } catch {
        setClients([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filteredInvoices = useMemo(() => {
    if (!clientId) return invoices;
    return invoices.filter((inv) => inv.client_id === clientId);
  }, [invoices, clientId]);

  const refreshFolders = async (
    nextScope: DocumentSaveScope,
    nextClientId?: string,
    nextInvoiceId?: string
  ) => {
    const list = await listFolders({
      scope: nextScope,
      clientId: nextScope === 'client' ? nextClientId || null : undefined,
      invoiceId: nextScope === 'invoice' ? nextInvoiceId || null : undefined,
    });
    setFolders(list);
  };

  useEffect(() => {
    if (!open) return;
    void refreshFolders(scope, clientId, invoiceId);
  }, [open, scope, clientId, invoiceId]);

  if (!open) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedInvoice = invoices.find((i) => i.id === invoiceId);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setError('Введіть назву папки');
      return;
    }
    if (scope === 'client' && !clientId) {
      setError('Спочатку оберіть клієнта');
      return;
    }
    if (scope === 'invoice' && !invoiceId) {
      setError('Спочатку оберіть інвойс');
      return;
    }
    setCreatingFolder(true);
    setError(null);
    try {
      const folder = await createFolder({
        name,
        scope,
        clientId: scope === 'client' ? clientId : scope === 'invoice' ? selectedInvoice?.client_id || null : null,
        invoiceId: scope === 'invoice' ? invoiceId : null,
      });
      setNewFolderName('');
      await refreshFolders(scope, clientId, invoiceId);
      setFolderId(folder.id);
    } catch {
      setError('Не вдалося створити папку');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleConfirm = () => {
    if (scope === 'client' && !clientId) {
      setError('Оберіть клієнта');
      return;
    }
    if (scope === 'invoice' && !invoiceId) {
      setError('Оберіть інвойс');
      return;
    }
    const dest: DocumentSaveDestination = {
      saveScope: scope,
      folderId: folderId || null,
      clientId: scope === 'client' ? clientId : scope === 'invoice' ? selectedInvoice?.client_id || null : null,
      clientName:
        scope === 'client'
          ? selectedClient?.name || null
          : scope === 'invoice'
            ? selectedInvoice?.client_name || null
            : null,
      invoiceId: scope === 'invoice' ? invoiceId : null,
      invoiceLabel:
        scope === 'invoice'
          ? selectedInvoice?.document_no || selectedInvoice?.id.slice(0, 8) || null
          : null,
    };
    onConfirm(dest);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Закрити" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1f2e] shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Зберегти в додатку</h3>
            <p className="text-sm text-white/50 mt-1 truncate max-w-[280px]">{documentName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-white/60 mb-3">Куди зберегти документ?</p>

        <div className="grid gap-2 mb-4">
          {scopeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setScope(opt.id);
                setFolderId('');
                setError(null);
              }}
              className={`text-left p-3 rounded-xl border transition-all ${
                scope === opt.id
                  ? 'border-orange-500/50 bg-orange-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="text-white text-sm font-medium">{opt.title}</p>
              <p className="text-white/45 text-xs mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/50 text-sm py-4">
            <Loader2 className="animate-spin" size={16} /> Завантаження…
          </div>
        ) : (
          <div className="space-y-3">
            {(scope === 'client' || scope === 'invoice') && (
              <div>
                <label className="block text-xs text-white/50 mb-1">Клієнт</label>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setInvoiceId('');
                    setFolderId('');
                  }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-orange-500/50"
                >
                  <option value="">Оберіть клієнта…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-xs text-amber-400/80 mt-1">Немає клієнтів або ви не увійшли в акаунт</p>
                )}
              </div>
            )}

            {scope === 'invoice' && (
              <div>
                <label className="block text-xs text-white/50 mb-1">Інвойс</label>
                <select
                  value={invoiceId}
                  onChange={(e) => {
                    setInvoiceId(e.target.value);
                    setFolderId('');
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv?.client_id) setClientId(inv.client_id);
                  }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-orange-500/50"
                >
                  <option value="">Оберіть інвойс…</option>
                  {filteredInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.document_no || inv.id.slice(0, 8)}
                      {inv.client_name ? ` — ${inv.client_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-white/50 mb-1">Папка (необовʼязково)</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">Без папки</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Нова папка…"
                className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
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
                disabled={creatingFolder}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 disabled:opacity-50"
              >
                {creatingFolder ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
                Створити
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 text-sm">
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};
