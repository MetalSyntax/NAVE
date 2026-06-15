// Marcas y modelos de motos comunes en Venezuela.
// Lista orientativa basada en marcas ensambladas/comercializadas en el país.

export interface MotoBrand {
  brand: string;
  category: string; // segmento típico de la marca
  models: string[];
}

export const VENEZUELA_MOTORCYCLES: MotoBrand[] = [
  { brand: 'Bera', category: 'PASEO', models: ['BR 200', 'SBR', 'Socialista', 'BX 150', 'BR 150', 'Cobra', 'AVA 250', 'Speed 150', 'Tucán', 'Dakar 200'] },
  { brand: 'Empire Keeway', category: 'PASEO', models: ['Owen', 'Horse', 'Speed 150', 'Arsen II', 'TX 200', 'RKV 200', 'Superlight 200', 'Outlook 150'] },
  { brand: 'Skygo', category: 'PASEO', models: ['AG 150', 'SG 150', 'Luxury 150', 'Max 150', 'Pony 110'] },
  { brand: 'Toro', category: 'PASEO', models: ['GN 125', 'Negra 150', 'AX 100', 'Sport 150'] },
  { brand: 'MD', category: 'PASEO', models: ['RX 150', 'Sport 150', 'Star 150'] },
  { brand: 'Vefase', category: 'PASEO', models: ['Arend 150', 'Speed 150'] },
  { brand: 'Haojue', category: 'PASEO', models: ['DK 150', 'Lindy 110', 'TR 150'] },
  { brand: 'UM', category: 'TRAIL', models: ['DSR 200', 'Renegade Commando', 'Max 125'] },
  { brand: 'Bajaj', category: 'PASEO', models: ['Pulsar 180', 'Pulsar 200', 'Boxer 150', 'Discover 125'] },
  { brand: 'Suzuki', category: 'PASEO', models: ['GN 125', 'GS 125', 'AX 100', 'DR 650', 'V-Strom 250', 'GIXXER 150'] },
  { brand: 'Yamaha', category: 'PASEO', models: ['YBR 125', 'FZ 16', 'Crypton 110', 'XTZ 125', 'XTZ 250', 'MT-03'] },
  { brand: 'Honda', category: 'PASEO', models: ['CB 125', 'XR 150', 'Titan 150', 'CG 125', 'Bross 150', 'CB 190R'] },
  { brand: 'Ssenda', category: 'PASEO', models: ['SS 150', 'SS 200'] },
  { brand: 'AVA', category: 'TRAIL', models: ['250', '200'] },
  { brand: 'Otra / Personalizada', category: '', models: [] },
];
