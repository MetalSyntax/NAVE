import React, { useState, useEffect } from 'react';
import { BadgeCheck, Camera, AlertTriangle, Fuel, Save, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useVehicle } from '../hooks/useVehicle';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';
import { toArrayBuffer, arrayBufferToUrl } from '../utils/fileUtils';

// Normaliza nivelGasolina a escala 1-5
const normalizeLevel = (val: number): number => {
  if (!val || val <= 0) return 1;
  if (val > 5) return Math.max(1, Math.min(5, Math.round(val / 20)));
  return Math.min(5, Math.max(1, Math.round(val)));
};

const FUEL_COLORS = [
  'bg-error',
  'bg-orange-400',
  'bg-secondary',
  'bg-primary/70',
  'bg-primary',
];

const FUEL_HEIGHTS = ['h-5', 'h-7', 'h-9', 'h-11', 'h-14'];

const FUEL_LABELS: Record<number, string> = {
  1: 'Crítico',
  2: 'Bajo',
  3: 'Medio',
  4: 'Alto',
  5: 'Lleno',
};

export function VehicleScreen() {
  const { t } = useTranslation(['vehicle', 'seo', 'common']);
  const { vehicle, vehicles, isLoading: isVehicleLoading, updateVehicle, createNewVehicle, setActiveVehicle, deleteVehicle } = useVehicle();
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState<any>({});
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        anio: vehicle.anio.toString(),
        color: vehicle.color,
        placa: vehicle.placa,
        vin: vehicle.vin,
        tipoCombustible: vehicle.tipoCombustible,
        nivelGasolina: normalizeLevel(vehicle.nivelGasolina),
        rendimientoKmL: vehicle.rendimientoKmL.toString(),
        kilometrajeActual: vehicle.kilometrajeActual.toString(),
        kilometrajeUltimoServicio: vehicle.kilometrajeUltimoServicio.toString(),
        kilometrajeProximoServicio: vehicle.kilometrajeProximoServicio.toString(),
        fechaUltimoServicio: vehicle.fechaUltimoServicio ? vehicle.fechaUltimoServicio.split('T')[0] : '',
        fechaProximoServicio: vehicle.fechaProximoServicio ? vehicle.fechaProximoServicio.split('T')[0] : '',
        aseguradora: vehicle.aseguradora,
        numeroPoliza: vehicle.numeroPoliza,
        vigenciaSeguro: vehicle.vigenciaSeguro ? vehicle.vigenciaSeguro.split('T')[0] : '',
        categoria: vehicle.categoria || '',
        identificadorUnidad: vehicle.identificadorUnidad || '',
        estadoSistema: vehicle.estadoSistema || '',
      });

      if (vehicle.fotoPortada) {
        const url = arrayBufferToUrl(vehicle.fotoPortada);
        setImagePreviewUrl(url);
      } else {
        setImagePreviewUrl(null);
      }
    }
  }, [vehicle]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await toArrayBuffer(file);
        setFormData((prev: any) => ({ ...prev, _newPhoto: buffer }));
        setImagePreviewUrl(URL.createObjectURL(file));
      } catch {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (vehicle) {
        const payload = {
          ...vehicle,
          marca: formData.marca,
          modelo: formData.modelo,
          anio: parseInt(formData.anio) || new Date().getFullYear(),
          color: formData.color,
          placa: formData.placa,
          vin: formData.vin,
          tipoCombustible: formData.tipoCombustible,
          nivelGasolina: parseInt(formData.nivelGasolina) || 1,
          rendimientoKmL: parseFloat(formData.rendimientoKmL) || 0,
          kilometrajeActual: parseInt(formData.kilometrajeActual) || 0,
          kilometrajeUltimoServicio: parseInt(formData.kilometrajeUltimoServicio) || 0,
          kilometrajeProximoServicio: parseInt(formData.kilometrajeProximoServicio) || 0,
          fechaUltimoServicio: formData.fechaUltimoServicio ? new Date(formData.fechaUltimoServicio).toISOString() : new Date().toISOString(),
          fechaProximoServicio: formData.fechaProximoServicio ? new Date(formData.fechaProximoServicio).toISOString() : new Date().toISOString(),
          aseguradora: formData.aseguradora,
          numeroPoliza: formData.numeroPoliza,
          vigenciaSeguro: formData.vigenciaSeguro ? new Date(formData.vigenciaSeguro).toISOString() : new Date().toISOString(),
          categoria: formData.categoria,
          identificadorUnidad: formData.identificadorUnidad,
          estadoSistema: formData.estadoSistema,
          actualizadoEn: new Date().toISOString(),
        };
        if (formData._newPhoto) payload.fotoPortada = formData._newPhoto;
        await updateVehicle(payload);
        showToast(t('common:saved_success'), 'success');
      }
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewVehicle = async () => {
    setIsCreating(true);
    try {
      await createNewVehicle();
      showToast(t('vehicle:add_new'), 'success');
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (vehicles.length <= 1) {
      showToast('No puedes eliminar el único vehículo', 'error');
      return;
    }
    if (confirm('¿Eliminar este vehículo? Esta acción no se puede deshacer.')) {
      try {
        await deleteVehicle(id);
        showToast('Vehículo eliminado', 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  if (isVehicleLoading && !vehicle) return <LoadingScreen />;

  const isDueForService =
    parseInt(formData.kilometrajeActual) >= parseInt(formData.kilometrajeProximoServicio) * 0.95;

  const fuelLevel = parseInt(formData.nivelGasolina) || 1;

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface uppercase font-bold transition-colors";
  const labelCls = "font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase block mb-1";

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:profile_title')}</title>
        <meta name="description" content={t('seo:profile_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <form onSubmit={handleSubmit} className="space-y-6 pb-12">

        {/* Service Due Alert */}
        {isDueForService && (
          <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-2xl shadow-elevation-1 animate-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-headline font-bold uppercase text-sm tracking-wide">
              {t('vehicle:service_due_alert')}
            </span>
          </div>
        )}

        {/* ── Multi-Vehicle Switcher ── */}
        <section className="bg-surface-container rounded-2xl p-4 shadow-elevation-1">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label text-[10px] font-black uppercase tracking-widest text-secondary">
              {t('vehicle:section_identity')} — {vehicles.length} {vehicles.length === 1 ? 'unidad' : 'unidades'}
            </span>
            <button
              type="button"
              onClick={handleNewVehicle}
              disabled={isCreating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-primary transition-colors disabled:opacity-50"
            >
              {isCreating ? <Spinner className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {t('vehicle:add_new')}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {vehicles.map(v => {
              const isActive = v.id === vehicle?.id;
              return (
                <div key={v.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => setActiveVehicle(v.id!)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-headline font-bold uppercase tracking-tight transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-elevation-1'
                        : 'bg-surface-high text-surface-variant hover:bg-surface-low hover:text-on-surface'
                    }`}
                  >
                    {isActive && <BadgeCheck className="w-3 h-3" />}
                    {v.identificadorUnidad || `UNIDAD_${String(v.id).slice(-4)}`}
                    <span className="opacity-60">({v.marca})</span>
                  </button>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id!)}
                      className="w-6 h-6 rounded-full bg-surface-high flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Hero Image */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden shadow-elevation-2">
          <div className="lg:col-span-8 bg-surface-lowest relative aspect-[16/9] lg:aspect-auto lg:h-[420px] overflow-hidden group">
            <img
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt="Vehicle"
              src={imagePreviewUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest via-transparent to-transparent opacity-70" />
          </div>
          <div className="lg:col-span-4 bg-surface-high p-7 flex flex-col justify-between border-l-0 lg:border-l-4 border-primary">
            <div>
              <h2 className="font-headline text-3xl font-black leading-none mb-2 tracking-tighter text-primary uppercase break-words">
                {formData.marca || '---'} {formData.modelo || t('vehicle:unit_placeholder')}
              </h2>
              <p className="font-label text-secondary text-xs font-bold tracking-[0.2em] mb-5">
                {formData.categoria || t('vehicle:category_placeholder')} // {formData.anio || '----'}
              </p>
              <div>
                <label className={labelCls}>{t('vehicle:status_label')}</label>
                <input
                  name="estadoSistema"
                  value={formData.estadoSistema || ''}
                  onChange={handleChange}
                  placeholder={t('vehicle:status_optimal')}
                  className="font-headline text-base text-secondary bg-transparent border-0 border-b-2 border-surface-variant focus:border-secondary outline-none w-full pb-1 uppercase transition-colors"
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>
            <div className="mt-6 lg:mt-0 relative">
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-full bg-secondary-container hover:bg-secondary transition-colors py-3 px-5 flex items-center justify-between rounded-xl relative z-0">
                <span className="font-headline font-black text-on-secondary-container uppercase tracking-tight text-sm">{t('vehicle:change_photo')}</span>
                <Camera className="text-on-secondary-container w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Identity */}
        <section className="bg-surface-low rounded-2xl p-7 shadow-elevation-1">
          <h3 className="font-headline text-lg font-black mb-7 tracking-tight text-on-surface uppercase flex items-center gap-3">
            <span className="w-5 h-[2px] bg-primary rounded-full" />
            {t('vehicle:section_identity')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {[
              { name: 'marca', label: t('vehicle:manufacturer') },
              { name: 'modelo', label: t('vehicle:model') },
              { name: 'anio', label: t('vehicle:year'), type: 'number', min: '1900', max: '2100' },
              { name: 'placa', label: t('vehicle:license_plate') },
              { name: 'vin', label: t('vehicle:vin') },
              { name: 'identificadorUnidad', label: t('vehicle:label_unit_id') },
              { name: 'categoria', label: t('vehicle:label_category') },
            ].map(({ name, label, type = 'text', min, max }: any) => (
              <div key={name} className="space-y-1">
                <label className={labelCls}>{label}</label>
                <input name={name} value={formData[name] || ''} onChange={handleChange} type={type} min={min} max={max} className={inputCls} />
              </div>
            ))}
          </div>
        </section>

        {/* Section: Engine & Telemetry */}
        <section className="bg-surface-low rounded-2xl p-7 shadow-elevation-1">
          <h3 className="font-headline text-lg font-black mb-7 tracking-tight text-on-surface uppercase flex items-center gap-3">
            <span className="w-5 h-[2px] bg-secondary rounded-full" />
            {t('vehicle:section_fuel')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            {/* Fuel Type */}
            <div className="space-y-1">
              <label className={labelCls}>{t('vehicle:fuel_type')}</label>
              <select name="tipoCombustible" value={formData.tipoCombustible || ''} onChange={handleChange} className={inputCls}>
                <option value="gasoline">⛽ {t('vehicle:gasoline')}</option>
                <option value="diesel">🛢 {t('vehicle:diesel')}</option>
                <option value="electric">⚡ {t('vehicle:electric')}</option>
                <option value="hybrid">🔋 {t('vehicle:hybrid')}</option>
              </select>
            </div>

            {/* Fuel Level 1–5 gauge */}
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase flex justify-between items-center">
                {t('vehicle:fuel_level')}
                <span className={`font-black ${fuelLevel <= 1 ? 'text-error' : fuelLevel <= 2 ? 'text-secondary' : 'text-primary'}`}>
                  {fuelLevel}/5 — {FUEL_LABELS[fuelLevel]}
                </span>
              </label>
              <div className="flex items-end gap-2 bg-surface-container rounded-xl p-3">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, nivelGasolina: level }))}
                    className={`flex-1 rounded-md transition-all duration-200 hover:opacity-90 active:scale-95 ${FUEL_HEIGHTS[level - 1]} ${
                      level <= fuelLevel ? FUEL_COLORS[level - 1] : 'bg-surface-high opacity-40'
                    }`}
                    aria-label={`Nivel ${level}`}
                  />
                ))}
                <Fuel className={`w-5 h-5 ml-1 mb-0.5 flex-shrink-0 ${fuelLevel <= 1 ? 'text-error' : 'text-primary'}`} />
              </div>
            </div>

            {/* Mileage fields */}
            {[
              { name: 'kilometrajeActual', label: t('vehicle:current_mileage') },
              { name: 'rendimientoKmL', label: t('vehicle:fuel_efficiency'), step: '0.1' },
              { name: 'kilometrajeUltimoServicio', label: 'KM Último Servicio' },
              { name: 'kilometrajeProximoServicio', label: 'KM Próximo Servicio' },
            ].map(({ name, label, step }: any) => (
              <div key={name} className="space-y-1">
                <label className={labelCls}>{label}</label>
                <input name={name} value={formData[name] || ''} onChange={handleChange} type="number" step={step} className={inputCls} />
              </div>
            ))}

            {/* Service Dates */}
            <div className="space-y-1">
              <label className={labelCls}>{t('vehicle:label_last_service_date')}</label>
              <input name="fechaUltimoServicio" value={formData.fechaUltimoServicio || ''} onChange={handleChange} type="date" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('vehicle:label_next_service_date')}</label>
              <input name="fechaProximoServicio" value={formData.fechaProximoServicio || ''} onChange={handleChange} type="date" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Section: Insurance */}
        <section className="bg-surface-low rounded-2xl p-7 shadow-elevation-1">
          <h3 className="font-headline text-lg font-black mb-7 tracking-tight text-on-surface uppercase flex items-center gap-3">
            <span className="w-5 h-[2px] bg-tertiary rounded-full" />
            {t('vehicle:section_insurance')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {[
              { name: 'aseguradora', label: t('vehicle:insurance_company') },
              { name: 'numeroPoliza', label: t('vehicle:policy_number') },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1">
                <label className={labelCls}>{label}</label>
                <input name={name} value={formData[name] || ''} onChange={handleChange} type="text" className={inputCls} />
              </div>
            ))}
            <div className="space-y-1">
              <label className={labelCls}>{t('vehicle:insurance_expiry')}</label>
              <input name="vigenciaSeguro" value={formData.vigenciaSeguro || ''} onChange={handleChange} type="date" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary/90 transition-all py-4 px-10 font-headline font-black uppercase tracking-widest shadow-elevation-2 disabled:opacity-50 rounded-full"
          >
            {isSubmitting ? <Spinner className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {t('common:btn_save')}
          </button>
        </div>
      </form>
    </div>
  );
}
