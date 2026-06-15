// Marcas y modelos de motos comercializadas en Venezuela.
// Fuentes: beravirtual.com, empirekeeway.com, motoespacios.com, bajajauto.com,
//          forzamotos.com, suzuki.com.ve, venemotos-yamaha.com (catálogo conocido).

export interface MotoBrand {
  brand: string;
  category: string;
  models: string[];
}

export const VENEZUELA_MOTORCYCLES: MotoBrand[] = [
  {
    brand: 'Bera',
    category: 'PASEO',
    models: [
      'BR200 200cc', 'BRF 150cc', 'BRZ 250cc', 'BWS 180cc', 'Carguero 200cc',
      'Cobra 150cc', 'GBR 200cc', 'GR 250cc', 'Kavak 150cc', 'León 150cc',
      'Milan 150cc', 'Optimus', 'Runner 6G 150cc', 'SBR 150cc', 'Super DT 200cc',
      'Tezo', 'X1 125cc', 'Bera Bike',
    ],
  },
  {
    brand: 'Empire Keeway',
    category: 'PASEO',
    models: [
      'Atlas', 'Atlas HD', 'Atlas HDs', 'Benelli Classica', 'Benelli e-Go',
      'EK Xpress', 'EK Xpress 200S', 'EK Xpress II', 'EK Xpress Lite', 'EK4', 'EK7',
      'Fort 4.0', 'GEV 1000', 'Horse RL', 'Matrix II', 'Matrix Lite',
      'New Horse', 'New Outlook II', 'New Owen', 'Outlook 300 XL', 'Owen 200S',
      'QJ Motor SRK 400', 'QJ MOTOR SRT550', 'QJ MOTOR SRT 550X',
      'QJ MOTOR SRT700S', 'QJ MOTOR SRT700SX', 'RK 200', 'RK 250',
      'SFA1000 ADV QJ', 'Superlight 200S', 'Thunder', 'TX II 150', 'TX 250GS', 'V302C',
    ],
  },
  {
    brand: 'Toro',
    category: 'PASEO',
    models: [
      'Cappuccino', 'Fox TR180', 'Jaguar', 'Leon TR200', 'Moka 150',
      'Power TR180', 'R3X 250', 'REX 150', 'Rex TR250', 'Tank 3',
      'Tank TR180', 'TRX 150', 'Typhoon',
    ],
  },
  {
    brand: 'MD / Haojin',
    category: 'PASEO',
    models: [
      'Abeja', 'Aguila', 'Canario', 'Cardenal', 'Colibrí', 'Cóndor',
      'Cuervo', 'Falco', 'Fenix 150', 'Fenix 200', 'Kiwi', 'Lechuza',
      'Lechuza II', 'Tauro', 'Tucán',
    ],
  },
  { brand: 'Vefase', category: 'PASEO', models: ['Arend 150', 'Speed 150'] },
  {
    brand: 'Haojue / HJ',
    category: 'PASEO',
    models: [
      'DK150', 'DL160', 'NK150', 'AT 200', 'Cargo 250', 'GTL', 'NK 250',
      'Squalo Plus', 'Super II', 'HJM Classic 150', 'HJM JB',
      'HJM New Street Sport 150', 'HJM Sport 150', 'HJM ZR 150',
      'Loncin HM 150', 'Loncin HM 150 GTL', 'Loncin MS 250', 'Loncin Rally 300',
      'Haojue 150-8',
    ],
  },
  {
    brand: 'Bajaj',
    category: '',
    models: [
      'Pulsar N250', 'Pulsar NS200', 'Pulsar N160', 'Pulsar 150 Neon',
      'CT 100 ES', 'Boxer BM 150',
    ],
  },
  {
    brand: 'Forza',
    category: 'PASEO',
    models: [
      'SF501 250cc', 'Carrera 250cc', 'Scrambler 250cc', 'Scrambler 300cc',
      'Batllos 250cc', 'Milano 125cc', 'Evo Discovery 450cc', 'Nova 150cc',
    ],
  },
  {
    brand: 'Suzuki',
    category: '',
    models: [
      'GSX-R1000RZA', 'GSX-S1000GT', 'GSX-S1000GT+', 'GSX 800 FRQ',
      'HAYABUSA GSX1300 RRQ2', 'V-STROM DL1050', 'V-STROM DL800 DERC',
      'V-STROM DL650', 'V-STROM DS250 SX', 'SV-650',
      'DR650', 'DR-Z400SM', 'RM-Z450',
      'GN 125', 'BURGMAN 125',
    ],
  },
  {
    brand: 'Yamaha',
    category: '',
    models: [
      'YBR 125', 'Crypton 110', 'FZ 16', 'FZ 25', 'FZS 150',
      'XTZ 125', 'XTZ 150', 'XTZ 250', 'XTZ 300',
      'MT-03', 'MT-07', 'MT-09',
      'NMAX 155', 'Aerox 155',
      'Tenere 700', 'R3', 'R7',
    ],
  },
  {
    brand: 'AVA',
    category: 'TRAIL',
    models: [
      'Avispón', 'Chita', 'Deer', 'Flash', 'Jaguar', 'León', 'Leopardo',
      'Mule', 'Mustang 250', 'Mustang Adventure', 'Pantera', 'Pantera Speed',
      'Puma', 'Rhino', 'Tigre', 'Tigrito', 'Tigrito Speed', 'Tucán', 'Wolf',
    ],
  },
  {
    brand: 'Escuda',
    category: 'PASEO',
    models: ['Adventure', 'Alexa 180', 'EM200', 'Extreme', 'Hero', 'New Jog 150'],
  },
  { brand: 'Ssenda', category: 'PASEO', models: ['SS 150', 'SS 200'] },
  {
    brand: 'Vento',
    category: '',
    models: [
      'Lithium 150 4.0', 'Thunderstar 300 XL',
      'Cyclone 150', 'Cyclone 200', 'Nitrox 300 T3',
      'GTS 300', 'Dakar 300',
      'Crossmax 200', 'Reptile Trek 200',
    ],
  },
  { brand: 'Otra / Personalizada', category: '', models: [] },
];
