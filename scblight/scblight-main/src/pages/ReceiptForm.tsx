import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Save,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { useLanguage } from '../contexts/LanguageContext';
import { useToastContext } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { downloadReceiptPDF } from '../lib/receiptPdfGenerator';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'PLN', 'CZK', 'UAH'];
const VAT_RATES = ['0', '7', '10', '19', '20', '21', '23', '25'];
const PAYMENT_METHODS = [
  'Bar',
  'EC-Karte',
  'Kreditkarte',
  'Visa',
  'Mastercard',
  'American Express',
  'PayPal',
  'Apple Pay',
  'Google Pay',
  'TWINT',
  'Überweisung',
  'Scheck',
];

const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Чек' },
  { value: 'supplier_invoice', label: 'Рахунок постачальника' },
  { value: 'subcontractor_invoice', label: 'Рахунок субпідрядника' },
  { value: 'other', label: 'Інше' },
];

const EXPENSE_CATEGORIES = [
  { value: 'materials', label: 'Матеріали' },
  { value: 'labor', label: 'Робота' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'tools', label: 'Інструменти' },
  { value: 'rent', label: 'Оренда' },
  { value: 'other', label: 'Інше' },
];

const LINK_MODES = [
  { value: 'none', label: 'Без привʼязки' },
  { value: 'client', label: 'До клієнта' },
  { value: 'invoice', label: 'До інвойсу' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  PLN: 'zł',
  CZK: 'Kč',
  UAH: '₴',
};

interface FormData {
  document_number: string;
  document_date: string;
  vendor_name: string;
  items_text: string;
  payment_method: string;
  vat_enabled: boolean;
  amount_net: string;
  vat_rate: string;
  vat_amount: string;
  total_amount: string;
  currency: string;
  original_file_url: string;
  notes: string;
  document_type: string;
  expense_category: string;
  link_mode: string;
  client_id: string;
  invoice_id: string;
}

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

function parseAmount(value: string | number | null | undefined): number {
  return parseFloat(String(value ?? '0').replace(',', '.')) || 0;
}

function normalizePaymentMethod(value: string): string {
  const normalized = value.toLowerCase().trim();
  for (const method of PAYMENT_METHODS) {
    if (method.toLowerCase() === normalized) return method;
  }
  return 'Bar';
}

function calcVatFromNet(net: string, rate: string) {
  const netValue = parseAmount(net);
  const rateValue = parseAmount(rate);
  const vat = (netValue * rateValue) / 100;
  return {
    vat: vat.toFixed(2),
    gross: (netValue + vat).toFixed(2),
  };
}

const initialFormData = (): FormData => ({
  document_number: '',
  document_date: new Date().toISOString().split('T')[0],
  vendor_name: '',
  items_text: '',
  payment_method: 'Bar',
  vat_enabled: false,
  amount_net: '',
  vat_rate: '19',
  vat_amount: '0.00',
  total_amount: '',
  currency: 'EUR',
  original_file_url: '',
  notes: '',
  document_type: 'receipt',
  expense_category: 'materials',
  link_mode: 'none',
  client_id: '',
  invoice_id: '',
});

export default function ReceiptForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { showSuccess, showError } = useToastContext();

  const isEdit = id !== 'new';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('expense_documents')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return;

        setFormData({
          document_number: data.document_number || '',
          document_date: data.document_date || new Date().toISOString().split('T')[0],
          vendor_name: data.vendor_name || '',
          items_text: data.ocr_raw_text || '',
          payment_method: data.payment_method || 'Bar',
          vat_enabled: !!data.vat_enabled,
          amount_net: data.amount_net != null ? String(data.amount_net) : '',
          vat_rate: data.vat_rate != null ? String(data.vat_rate) : '19',
          vat_amount: data.vat_amount != null ? String(data.vat_amount) : '0.00',
          total_amount: data.total_amount != null ? String(data.total_amount) : '',
          currency: data.currency || 'EUR',
          original_file_url: data.original_file_url || '',
          notes: data.notes || '',
          document_type: data.document_type || 'receipt',
          expense_category: data.expense_category || 'materials',
          link_mode: data.invoice_id ? 'invoice' : data.client_id ? 'client' : 'none',
          client_id: data.client_id || '',
          invoice_id: data.invoice_id || '',
        });

        const { data: items } = await supabase
          .from('expense_document_items')
          .select('description')
          .eq('expense_document_id', data.id)
          .order('sort_order');

        if (items?.length) {
          const joined = items.map((item) => item.description || '').filter(Boolean).join('\n');
          if (joined) {
            setFormData((prev) => ({ ...prev, items_text: joined }));
          }
        }
      } catch {
        showError('Не вдалося завантажити документ витрат');
      }
    })();
  }, [id, isEdit, showError]);

  useEffect(() => {
    if (isEdit) return;

    const issuerName = searchParams.get('issuer_name');
    const fileUrl = searchParams.get('file_url');
    const linkMode = searchParams.get('link_mode') || 'none';
    const clientId = searchParams.get('client_id') || '';
    const invoiceId = searchParams.get('invoice_id') || '';

    if (fileUrl && !issuerName) {
      setFormData((prev) => ({
        ...prev,
        original_file_url: fileUrl,
        link_mode: linkMode,
        client_id: clientId,
        invoice_id: invoiceId,
      }));
      return;
    }

    if (issuerName === null) return;

    const gross = searchParams.get('amount_gross') || '';
    const net = searchParams.get('amount_net') || '';
    const vatAmount = searchParams.get('vat_amount') || '';
    const grossValue = parseAmount(gross);
    const netValue = parseAmount(net);
    const vatValue = parseAmount(vatAmount);
    const hasVat = netValue > 0 && vatValue > 0 && netValue < grossValue;

    let vatRate = '19';
    if (hasVat && netValue > 0) {
      const estimatedRate = Math.round(100 * (grossValue / netValue - 1));
      vatRate = [0, 7, 10, 19, 20, 21, 23, 25].reduce((best, current) =>
        Math.abs(current - estimatedRate) < Math.abs(best - estimatedRate) ? current : best,
      ).toString();
    }

    setFormData((prev) => ({
      ...prev,
      vendor_name: issuerName,
      document_date: searchParams.get('date') || new Date().toISOString().split('T')[0],
      total_amount: gross,
      amount_net: hasVat ? net : gross,
      vat_amount: hasVat ? vatAmount : '0.00',
      vat_rate: hasVat ? vatRate : '19',
      vat_enabled: hasVat,
      payment_method: normalizePaymentMethod(searchParams.get('payment_method') || 'Bar'),
      items_text: searchParams.get('items') || '',
      original_file_url: searchParams.get('file_url') || '',
      document_number: searchParams.get('receipt_number') || '',
      link_mode: linkMode,
      client_id: clientId,
      invoice_id: invoiceId,
    }));
  }, [isEdit, searchParams]);

  useEffect(() => {
    if (formData.link_mode !== 'invoice' || !formData.invoice_id) return;
    const invoice = invoices.find((row) => row.id === formData.invoice_id);
    if (invoice?.client_id && formData.client_id !== invoice.client_id) {
      setFormData((prev) => ({ ...prev, client_id: invoice.client_id || '' }));
    }
  }, [formData.link_mode, formData.invoice_id, formData.client_id, invoices]);

  const filteredInvoices = useMemo(
    () =>
      formData.client_id
        ? invoices.filter((invoice) => invoice.client_id === formData.client_id)
        : invoices,
    [formData.client_id, invoices],
  );

  const currencySymbol = CURRENCY_SYMBOLS[formData.currency] || formData.currency;

  const isValid =
    formData.vendor_name.trim() !== '' &&
    formData.total_amount !== '' &&
    (formData.link_mode !== 'client' || !!formData.client_id) &&
    (formData.link_mode !== 'invoice' || (!!formData.client_id && !!formData.invoice_id));

  const hasImageAttachment =
    !!formData.original_file_url &&
    /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?|$)/i.test(formData.original_file_url);

  const updateAmountField = (field: 'total_amount' | 'amount_net' | 'vat_rate', value: string) => {
    if (formData.vat_enabled) {
      if (field === 'total_amount') {
        const gross = parseAmount(value);
        const rate = parseAmount(formData.vat_rate);
        const net = rate > 0 ? gross / (1 + rate / 100) : gross;
        const vat = gross - net;
        setFormData((prev) => ({
          ...prev,
          total_amount: value,
          amount_net: net.toFixed(2),
          vat_amount: vat.toFixed(2),
        }));
      } else if (field === 'amount_net') {
        const { vat, gross } = calcVatFromNet(value, formData.vat_rate);
        setFormData((prev) => ({
          ...prev,
          amount_net: value,
          vat_amount: vat,
          total_amount: gross,
        }));
      } else {
        const { vat, gross } = calcVatFromNet(formData.amount_net, value);
        setFormData((prev) => ({
          ...prev,
          vat_rate: value,
          vat_amount: vat,
          total_amount: gross,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        total_amount: field === 'total_amount' ? value : prev.total_amount || value,
        amount_net: value,
        vat_amount: '0.00',
      }));
    }
  };

  const toggleVat = (enabled: boolean) => {
    if (!enabled) {
      setFormData((prev) => ({
        ...prev,
        vat_enabled: false,
        vat_amount: '0.00',
        amount_net: prev.total_amount,
      }));
      return;
    }

    const net = formData.amount_net || formData.total_amount;
    const { vat, gross } = calcVatFromNet(net, formData.vat_rate);
    setFormData((prev) => ({
      ...prev,
      vat_enabled: true,
      amount_net: net,
      vat_amount: vat,
      total_amount: gross,
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showError('Користувач не авторизований');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError(t('fileSizeLimit10mb') || 'Файл має бути менше 10 МБ');
      return;
    }

    setIsUploading(true);
    try {
      const extension = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from('scanned-documents').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('scanned-documents').getPublicUrl(path);

      setFormData((prev) => ({ ...prev, original_file_url: publicUrl }));
      showSuccess('Файл завантажено');
    } catch {
      showError('Не вдалося завантажити файл');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = async () => {
    if (!formData.original_file_url) return;

    try {
      const fileName = formData.original_file_url.split('/').pop();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (fileName && user) {
        await supabase.storage.from('scanned-documents').remove([`${user.id}/${fileName}`]);
      }
      setFormData((prev) => ({ ...prev, original_file_url: '' }));
    } catch {
      setFormData((prev) => ({ ...prev, original_file_url: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showError('Користувач не авторизований');
        return;
      }

      const payload = {
        user_id: user.id,
        document_type: formData.document_type,
        vendor_name: formData.vendor_name || '',
        document_number: formData.document_number || '',
        document_date: formData.document_date || null,
        total_amount: parseAmount(formData.total_amount),
        currency: formData.currency || 'EUR',
        vat_enabled: formData.vat_enabled,
        vat_amount: parseAmount(formData.vat_amount) || null,
        payment_method: formData.payment_method || '',
        expense_category: formData.expense_category || 'other',
        original_file_url: formData.original_file_url || null,
        ocr_raw_text: formData.items_text || '',
        client_id:
          formData.link_mode === 'client' || formData.link_mode === 'invoice'
            ? formData.client_id || null
            : null,
        invoice_id: formData.link_mode === 'invoice' ? formData.invoice_id || null : null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
        amount_net: parseAmount(formData.amount_net) || null,
        vat_rate: parseAmount(formData.vat_rate) || null,
      };

      let expenseId = id;

      if (isEdit && id) {
        const { error } = await supabase.from('expense_documents').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('expense_documents')
          .insert([payload])
          .select()
          .maybeSingle();
        if (error) throw error;
        expenseId = data?.id;
      }

      if (!expenseId) {
        throw new Error('Не вдалося отримати ID документа витрат');
      }

      await supabase.from('expense_document_items').delete().eq('expense_document_id', expenseId);

      const lines = formData.items_text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0) {
        const { error } = await supabase.from('expense_document_items').insert(
          lines.map((description, index) => ({
            expense_document_id: expenseId,
            description,
            quantity: null,
            unit: null,
            unit_price: null,
            total_price: null,
            sort_order: index,
          })),
        );
        if (error) throw error;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expense_documents'] }),
        queryClient.invalidateQueries({ queryKey: ['receipts'] }),
        queryClient.invalidateQueries({ queryKey: ['client-expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      ]);

      showSuccess('Документ витрат збережено');
      navigate('/receipts');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Beleg konnte nicht gespeichert werden';
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const total = parseAmount(formData.total_amount);
      await downloadReceiptPDF({
        id: id || 'new',
        store_name: formData.vendor_name,
        date: formData.document_date,
        total,
        items: formData.items_text,
        payment_method: formData.payment_method,
        receipt_number: formData.document_number,
        file_url: formData.original_file_url,
        issuer_name: formData.vendor_name,
        amount_net: parseAmount(formData.amount_net),
        vat_rate: parseAmount(formData.vat_rate),
        vat_amount: parseAmount(formData.vat_amount),
        amount_gross: total,
        vat_enabled: formData.vat_enabled,
        currency: formData.currency,
        signature_data: '',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f24] text-white pb-24 pt-20">
      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => navigate('/receipts')}
            className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all"
          >
            <ArrowLeft size={18} className="text-white/70" />
          </button>
          <h1 className="text-xl font-semibold text-white flex-1">
            {isEdit ? 'Редагувати документ витрат' : 'Новий документ витрат'}
          </h1>
          {isEdit && (
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 text-white/60 hover:text-orange-400 transition-all text-sm font-medium disabled:opacity-50"
            >
              <Download size={15} />
              PDF
            </button>
          )}
        </div>

        {hasImageAttachment ? (
          <div className="bg-white/6 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <ImageIcon size={15} className="text-orange-400" />
                <span className="text-sm font-medium text-white/80">Оригінальний документ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowImageViewer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/60 hover:text-white text-xs font-medium transition-all"
                >
                  <ZoomIn size={13} />
                  Переглянути
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveAttachment()}
                  className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <div
              className="cursor-pointer group relative overflow-hidden"
              style={{ maxHeight: 340 }}
              onClick={() => setShowImageViewer(true)}
            >
              <img
                src={formData.original_file_url}
                alt="Original document"
                className="w-full object-contain bg-white"
                style={{ maxHeight: 340 }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white/6 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={15} className="text-white/40" />
                <span className="text-sm text-white/50">Документ не прикріплено</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-orange-500/15 border border-white/10 hover:border-orange-500/30 text-white/60 hover:text-orange-400 text-xs font-medium transition-all disabled:opacity-50"
              >
                <Upload size={13} />
                {isUploading ? 'Завантаження...' : 'Завантажити'}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => void handleFileUpload(event)}
          className="hidden"
        />

        <div className="bg-white/6 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-white/8">
            <p className="text-xs uppercase tracking-wider text-white/40 font-medium mb-3">
              Тип і привʼязка
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Тип документа"
                value={formData.document_type}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, document_type: event.target.value }))
                }
                options={DOCUMENT_TYPES}
              />
              <Select
                label="Куди привʼязати"
                value={formData.link_mode}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    link_mode: event.target.value,
                    client_id: event.target.value === 'none' ? '' : prev.client_id,
                    invoice_id: event.target.value === 'invoice' ? prev.invoice_id : '',
                  }))
                }
                options={LINK_MODES}
              />
              {(formData.link_mode === 'client' || formData.link_mode === 'invoice') && (
                <Select
                  label="Клієнт"
                  value={formData.client_id}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_id: event.target.value,
                      invoice_id: '',
                    }))
                  }
                  options={[
                    { value: '', label: 'Оберіть клієнта' },
                    ...clients.map((client) => ({ value: client.id, label: client.name })),
                  ]}
                />
              )}
              {formData.link_mode === 'invoice' && (
                <Select
                  label="Інвойс"
                  value={formData.invoice_id}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, invoice_id: event.target.value }))
                  }
                  options={[
                    { value: '', label: 'Оберіть інвойс' },
                    ...filteredInvoices.map((invoice) => ({
                      value: invoice.id,
                      label: `${invoice.document_no || 'Без номера'}${
                        invoice.client_name ? ` — ${invoice.client_name}` : ''
                      }`,
                    })),
                  ]}
                />
              )}
              <Select
                label="Категорія витрати"
                value={formData.expense_category}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, expense_category: event.target.value }))
                }
                options={EXPENSE_CATEGORIES}
              />
            </div>
          </div>

          <div className="px-5 pt-5 pb-4 border-b border-white/8">
            <p className="text-xs uppercase tracking-wider text-white/40 font-medium mb-3">
              Основна інформація
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('date')}
                type="date"
                value={formData.document_date}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, document_date: event.target.value }))
                }
              />
              <Input
                label="Номер документа"
                value={formData.document_number}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, document_number: event.target.value }))
                }
                placeholder="001"
              />
            </div>
          </div>

          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-xs uppercase tracking-wider text-white/40 font-medium mb-3">
              Магазин / постачальник
            </p>
            <Input
              label="Магазин / постачальник *"
              value={formData.vendor_name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, vendor_name: event.target.value }))
              }
              placeholder="BAUHAUS"
              required
            />
          </div>

          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-xs uppercase tracking-wider text-white/40 font-medium mb-3">
              Позиції / опис
            </p>
            <Textarea
              label="Розпізнані позиції"
              value={formData.items_text}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, items_text: event.target.value }))
              }
              placeholder="Один рядок = одна позиція"
              rows={4}
            />
          </div>

          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-xs uppercase tracking-wider text-white/40 font-medium mb-3">
              Сума і валюта
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    label={formData.vat_enabled ? 'Нетто' : 'Сума'}
                    type="number"
                    step="0.01"
                    value={formData.vat_enabled ? formData.amount_net : formData.total_amount}
                    onChange={(event) =>
                      formData.vat_enabled
                        ? updateAmountField('amount_net', event.target.value)
                        : updateAmountField('total_amount', event.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
                <Select
                  label={t('currency') || 'Валюта'}
                  value={formData.currency}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
                />
              </div>

              <div className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => toggleVat(!formData.vat_enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    formData.vat_enabled ? 'bg-orange-500' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.vat_enabled ? 'translate-x-5.5 left-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-white/70">Включити ПДВ</span>
              </div>

              {formData.vat_enabled && (
                <div className="bg-white/4 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="ПДВ %"
                      value={formData.vat_rate}
                      onChange={(event) => updateAmountField('vat_rate', event.target.value)}
                      options={VAT_RATES.map((rate) => ({ value: rate, label: `${rate} %` }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Сума ПДВ
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl text-white/60 py-3 px-4 text-sm">
                        {formData.vat_amount} {currencySymbol}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-sm font-semibold text-white/80">Брутто</span>
                    <span className="text-lg font-bold text-orange-400">
                      {parseAmount(formData.total_amount).toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-b border-white/8">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Спосіб оплати"
                value={formData.payment_method}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, payment_method: event.target.value }))
                }
                options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Загальна сума
                </label>
                <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 font-bold py-3 px-4 text-sm">
                  {parseAmount(formData.total_amount).toFixed(2)} {currencySymbol}
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <Textarea
              label="Примітки"
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Додаткові нотатки"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/receipts')}
            className="flex-1 py-3 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all font-medium"
          >
            {t('cancel') || 'Скасувати'}
          </button>
          <button
            type="submit"
            disabled={isSaving || !isValid}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? t('saving') || 'Збереження...' : t('save') || 'Зберегти'}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showImageViewer && formData.original_file_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col"
            onClick={() => setShowImageViewer(false)}
          >
            <div
              className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/5"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowImageViewer(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <X size={20} className="text-white" />
              </button>
              <span className="text-white/70 text-sm font-medium">Оригінальний документ</span>
              <div className="w-10" />
            </div>
            <div
              className="flex-1 overflow-auto p-4 flex items-start justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={formData.original_file_url}
                alt="Original document"
                className="max-w-full rounded-lg shadow-2xl"
                style={{ minWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="p-3 bg-black/90 border-t border-white/5">
              <p className="text-white/30 text-xs text-center">Натисніть, щоб закрити</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
