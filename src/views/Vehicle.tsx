import React, { useState, useEffect } from 'react';
import { BadgeCheck, Camera, ShieldAlert, Cpu, Gauge, Save, Fuel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useVehicle } from '../hooks/useVehicle';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';
import { toArrayBuffer, arrayBufferToUrl } from '../utils/fileUtils';

export function VehicleScreen() {
  const { t } = useTranslation(['vehicle', 'seo', 'common']);
  const { vehicle, vehicles, isLoading: isVehicleLoading, updateVehicle, createNewVehicle, setActiveVehicle } = useVehicle();
  const { toast, showToast, hideToast } = useToast();
  
  const [formData, setFormData] = useState<any>({});
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        nivelGasolina: vehicle.nivelGasolina.toString(),
        rendimientoKmL: vehicle.rendimientoKmL.toString(),
        kilometrajeActual: vehicle.kilometrajeActual.toString(),
        kilometrajeUltimoServicio: vehicle.kilometrajeUltimoServicio.toString(),
        kilometrajeProximoServicio: vehicle.kilometrajeProximoServicio.toString(),
        aseguradora: vehicle.aseguradora,
        numeroPoliza: vehicle.numeroPoliza,
        vigenciaSeguro: vehicle.vigenciaSeguro ? vehicle.vigenciaSeguro.split('T')[0] : '',
        categoria: vehicle.categoria || t('vehicle:category_placeholder'),
        identificadorUnidad: vehicle.identificadorUnidad || t('vehicle:active_unit'),
        estadoSistema: vehicle.estadoSistema || '',
      });

      if (vehicle.fotoPortada) {
        setImagePreviewUrl(arrayBufferToUrl(vehicle.fotoPortada));
      }
    }
  }, [vehicle]);

  // Clean up object URL when component unmounts or image changes
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
      } catch (error) {
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
          anio: parseInt(formData.anio) || 2024,
          color: formData.color,
          placa: formData.placa,
          vin: formData.vin,
          tipoCombustible: formData.tipoCombustible,
          nivelGasolina: parseInt(formData.nivelGasolina) || 0,
          rendimientoKmL: parseFloat(formData.rendimientoKmL) || 0,
          kilometrajeActual: parseInt(formData.kilometrajeActual) || 0,
          kilometrajeUltimoServicio: parseInt(formData.kilometrajeUltimoServicio) || 0,
          kilometrajeProximoServicio: parseInt(formData.kilometrajeProximoServicio) || 0,
          aseguradora: formData.aseguradora,
          numeroPoliza: formData.numeroPoliza,
          vigenciaSeguro: new Date(formData.vigenciaSeguro).toISOString() || new Date().toISOString(),
          categoria: formData.categoria,
          identificadorUnidad: formData.identificadorUnidad,
          estadoSistema: formData.estadoSistema,
          actualizadoEn: new Date().toISOString()
        };

        if (formData._newPhoto) {
          payload.fotoPortada = formData._newPhoto;
        }

        await updateVehicle(payload);
        showToast(t('common:saved_success'), 'success');
      }
    } catch (err) {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVehicleLoading && !vehicle) return <LoadingScreen />;

  const isDueForService = parseInt(formData.kilometrajeActual) >= parseInt(formData.kilometrajeProximoServicio) * 0.95;

  return (
    <div className="animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:profile_title')}</title>
        <meta name="description" content={t('seo:profile_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <form onSubmit={handleSubmit} className="space-y-12 pb-12">
        {/* Hero: Image Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
          <div className="lg:col-span-8 bg-surface-lowest relative aspect-[16/9] lg:aspect-auto lg:h-[500px] overflow-hidden group">
            <img 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt="Motorcycle" 
              src={imagePreviewUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop'} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60"></div>
            <div className="absolute top-8 left-0 bg-primary-container pl-4 pr-1 py-1 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-on-primary-container" />
              <select 
                value={vehicle?.id || ''} 
                onChange={async (e) => {
                  if (e.target.value === 'NEW') {
                    await createNewVehicle();
                    showToast('Nueva unidad creada', 'success');
                  } else {
                    await setActiveVehicle(Number(e.target.value));
                  }
                }}
                className="bg-transparent text-on-primary-container font-headline font-black text-sm tracking-widest uppercase outline-none cursor-pointer border-0 pb-0.5 appearance-none"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-surface text-on-surface">
                    {v.identificadorUnidad || `UNIDAD_${String(v.id).slice(-4)}`} ({v.marca})
                  </option>
                ))}
                <option value="NEW" className="bg-primary text-on-primary font-black">
                  + {t('vehicle:add_new') || 'AÑADIR NUEVA UNIDAD'}
                </option>
              </select>
            </div>
          </div>
          <div className="lg:col-span-4 bg-surface-high p-8 flex flex-col justify-between border-l-0 lg:border-l-4 border-primary">
            <div>
              <h2 className="font-headline text-5xl font-black leading-none mb-2 tracking-tighter text-white uppercase break-words">
                <span className="text-primary">{formData.marca || t('common:empty_state')} {formData.modelo || t('vehicle:unit_placeholder')}</span>
              </h2>
              <p className="font-label text-secondary text-sm font-bold tracking-[0.2em] mb-8">{formData.categoria || t('vehicle:category_placeholder')} // {formData.anio || '----'}</p>
              <div className="space-y-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">{t('vehicle:status_label')}</span>
                  <input 
                    name="estadoSistema"
                    value={formData.estadoSistema}
                    onChange={handleChange}
                    placeholder={t('vehicle:status_optimal') || "CONFIGURACIÓN ÓPTIMA"}
                    className="font-headline text-xl text-secondary bg-transparent border-0 border-b-2 border-surface-variant focus:border-secondary outline-none w-full pb-1 uppercase"
                  />
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full bg-secondary-container hover:bg-secondary transition-colors py-4 px-6 flex items-center justify-between group active:scale-[0.98] duration-75 relative z-0">
                <span className="font-headline font-black text-white group-hover:text-surface-lowest uppercase tracking-tight">{t('vehicle:change_photo')}</span>
                <Camera className="text-white group-hover:text-surface-lowest w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Form Sections */}
        <section className="bg-surface-low p-8 border-t-4 border-surface-high">
          <h3 className="font-headline text-2xl font-black mb-10 tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-8 h-[2px] bg-primary"></span> {t('vehicle:section_identity')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:manufacturer')}</label>
              <input name="marca" value={formData.marca || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" required />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:model')}</label>
              <input name="modelo" value={formData.modelo || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" required />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:year')}</label>
              <input name="anio" value={formData.anio || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="number" min="1900" max="2100" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:license_plate')}</label>
              <input name="placa" value={formData.placa || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:vin')}</label>
              <input name="vin" value={formData.vin || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:label_unit_id')}</label>
              <input name="identificadorUnidad" value={formData.identificadorUnidad || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:label_category')}</label>
              <input name="categoria" value={formData.categoria || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" />
            </div>
          </div>
        </section>

        <section className="bg-surface-low p-8 border-t-4 border-surface-high">
          <h3 className="font-headline text-2xl font-black mb-10 tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-8 h-[2px] bg-secondary"></span> {t('vehicle:section_fuel')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:fuel_type')}</label>
              <select name="tipoCombustible" value={formData.tipoCombustible || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold">
                <option value="gasoline">{t('vehicle:gasoline')}</option>
                <option value="diesel">{t('vehicle:diesel')}</option>
                <option value="electric">{t('vehicle:electric')}</option>
                <option value="hybrid">{t('vehicle:hybrid')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase flex justify-between">
                {t('vehicle:fuel_level')} <span>{formData.nivelGasolina}%</span>
              </label>
              <div className="flex items-center gap-4">
                <input name="nivelGasolina" value={formData.nivelGasolina || 0} onChange={handleChange} type="range" min="0" max="100" className="flex-1 accent-primary" />
                <Fuel className={`w-6 h-6 ${parseInt(formData.nivelGasolina) < 15 ? 'text-error' : 'text-primary'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:current_mileage')}</label>
              <input name="kilometrajeActual" value={formData.kilometrajeActual || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="number" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:fuel_efficiency')}</label>
              <input name="rendimientoKmL" value={formData.rendimientoKmL || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="number" step="0.1" />
            </div>
          </div>
        </section>

        <section className="bg-surface-low p-8 border-t-4 border-surface-high">
          <h3 className="font-headline text-2xl font-black mb-10 tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-8 h-[2px] bg-tertiary"></span> {t('vehicle:section_insurance')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:insurance_company')}</label>
              <input name="aseguradora" value={formData.aseguradora || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:policy_number')}</label>
              <input name="numeroPoliza" value={formData.numeroPoliza || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('vehicle:insurance_expiry')}</label>
              <input name="vigenciaSeguro" value={formData.vigenciaSeguro || ''} onChange={handleChange} className="w-full bg-surface-high border-0 focus:outline-none px-4 py-3 text-white uppercase font-bold text-sm" type="date" />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-8">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-container hover:bg-primary transition-all py-4 px-12 font-headline font-black text-on-primary-container uppercase tracking-widest active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Spinner className="w-5 h-5 border-white" /> : <Save className="w-5 h-5" />}
            {t('common:btn_save')}
          </button>
        </div>
      </form>
    </div>
  );
}
