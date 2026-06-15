import React, { useState } from 'react';
import { ArrowLeft, FileUp, FileText, Eye, Download, Trash2, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useManuals } from '../hooks/useManuals';
import { arrayBufferToUrl } from '../utils/fileUtils';
import { ManualEntry } from '../db/database';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ManualsScreen({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { t } = useTranslation(['seo', 'common', 'manuals']);
  const { manuals, isLoading, addManual, removeManual } = useManuals();
  const { toast, showToast, hideToast } = useToast();

  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await addManual(file, title);
      showToast(t('common:saved_success'), 'success');
      setTitle('');
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleView = (m: ManualEntry) => {
    const url = arrayBufferToUrl(m.data, m.mimeType);
    window.open(url, '_blank');
  };

  const handleDownload = (m: ManualEntry) => {
    const url = arrayBufferToUrl(m.data, m.mimeType);
    const a = document.createElement('a');
    a.href = url;
    a.download = m.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('manuals:confirm_delete'))) return;
    try {
      await removeManual(id);
      showToast(t('common:saved_success'), 'success');
    } catch {
      showToast(t('common:error_generic'), 'error');
    }
  };

  if (isLoading && manuals.length === 0) return <LoadingScreen />;

  const labelCls = "font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{t('seo:manuals_title')}</title>
        <meta name="description" content={t('seo:manuals_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header with back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('profile')}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-headline text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          {t('manuals:title')}
        </h1>
      </div>

      {/* Upload card */}
      <section className="bg-surface-low rounded-2xl p-7 shadow-elevation-1 space-y-5">
        <h2 className="font-headline text-lg font-black uppercase tracking-tight flex items-center gap-3">
          <span className="w-6 h-[2px] bg-primary rounded-full"></span>
          {t('manuals:upload_title')}
        </h2>
        <div className="space-y-1">
          <label className={labelCls}>{t('manuals:title_label')}</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            type="text"
            placeholder={t('manuals:title_ph')}
            className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-body text-base transition-colors"
          />
        </div>
        <label className="relative cursor-pointer flex items-center justify-center gap-3 bg-primary text-on-primary font-headline font-black text-sm py-4 px-8 uppercase tracking-widest hover:bg-primary/90 transition-all rounded-full shadow-elevation-1">
          <input type="file" accept="application/pdf,image/*" onChange={handleUpload} disabled={isUploading} className="hidden" />
          {isUploading ? <Spinner className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
          {t('manuals:btn_upload')}
        </label>
        <p className="font-label text-[10px] text-surface-variant uppercase tracking-widest">
          {t('manuals:storage_hint')}
        </p>
      </section>

      {/* Library list */}
      <section className="space-y-4">
        <h2 className="font-headline text-xl font-black uppercase tracking-tight">{t('manuals:library')}</h2>
        {manuals.length === 0 && (
          <div className="bg-surface-lowest rounded-2xl p-10 flex flex-col items-center justify-center border border-outline-variant/30 text-center">
            <FileText className="w-8 h-8 text-surface-variant mb-2" />
            <p className="font-headline text-lg font-bold text-surface-variant uppercase">{t('manuals:empty')}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {manuals.map((m, i) => (
            <div key={m.id} className={`group flex items-center justify-between gap-3 p-5 rounded-xl hover:bg-surface-high transition-colors ${i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface-low'}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-headline font-bold text-base truncate">{m.title}</div>
                  <div className="text-[10px] text-surface-variant uppercase tracking-widest">
                    {formatSize(m.size)} • {new Date(m.addedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleView(m)} title={t('manuals:btn_view')} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-primary hover:bg-surface-high transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleDownload(m)} title={t('manuals:btn_download')} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-secondary hover:bg-surface-high transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(m.id!)} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
