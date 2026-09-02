import React, { useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Loader2, ScanText, Upload } from 'lucide-react';
import type { UniversalDocument } from '../../lib/documentEditor/types';
import { createDocumentFromText } from '../../lib/documentEditor/templates';

interface Props {
  onOpenInEditor: (doc: UniversalDocument) => void;
}

export const PdfOcrPanel: React.FC<Props> = ({ onOpenInEditor }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const runOcr = async (file: File) => {
    setBusy(true);
    setText('');
    setProgress(0);
    setStatus('Запуск OCR...');

    try {
      const worker = await createWorker('ukr+eng', 1, {
        logger: (m) => {
          if (m.status) setStatus(m.status);
          if (typeof m.progress === 'number') setProgress(Math.round(m.progress * 100));
        },
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();
      setText(data.text.trim());
      setStatus('Готово');
    } catch {
      setStatus('Помилка розпізнавання');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <ScanText className="mx-auto text-orange-400 mb-3" size={40} />
        <h3 className="text-white font-semibold text-lg">OCR — розпізнавання тексту</h3>
        <p className="text-white/50 text-sm mt-1">
          Завантажте фото або скан — текст можна відредагувати в універсальному редакторі
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full border-2 border-dashed border-white/15 rounded-2xl p-10 text-center hover:border-orange-400/50 hover:bg-white/5 transition-all"
      >
        <Upload className="mx-auto mb-3 text-white/50" size={28} />
        <p className="text-white/80 font-medium">Завантажити зображення (JPG, PNG)</p>
        <p className="text-white/40 text-sm mt-1">Українська + English</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void runOcr(f);
          e.target.value = '';
        }}
      />

      {busy && (
        <div className="flex items-center gap-3 text-white/70 text-sm">
          <Loader2 className="animate-spin text-orange-400" size={18} />
          {status} {progress > 0 && `(${progress}%)`}
        </div>
      )}

      {text && (
        <div className="space-y-3">
          <textarea
            readOnly
            value={text}
            rows={12}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white/80 text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => onOpenInEditor(createDocumentFromText('OCR документ', text))}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold"
          >
            Відкрити в редакторі
          </button>
        </div>
      )}
    </div>
  );
};
