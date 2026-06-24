// Marcas y modelos de motos comercializadas en Venezuela.
// Fuentes: beravirtual.com, empirekeeway.com, motoespacios.com, bajajauto.com,
//          forzamotos.com, suzuki.com.ve, venemotos-yamaha.com (catálogo conocido).

export interface MotoModel {
  name: string;
  cc?: number;
  tankL?: number;
  rendimientoKmL?: number;
  maxSpeedKmh?: number;
  colors?: string[];
  weightKg?: number;
}

export interface MotoBrand {
  brand: string;
  category: string;
  models: MotoModel[];
}

const m = (name: string, opts?: Omit<MotoModel, 'name'>): MotoModel => ({ name, ...opts });

export const VENEZUELA_MOTORCYCLES: MotoBrand[] = [
  {
    brand: 'Bera',
    category: 'PASEO',
    models: [
      m('BR200 200cc',     { cc: 200, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra', 'Plata'] }),
      m('BRF 150cc',       { cc: 150, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra', 'Plata'] }),
      m('BRZ 250cc',       { cc: 250, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Naranja', 'Negra'] }),
      m('BWS 180cc',       { cc: 180, tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra', 'Roja'] }),
      m('Carguero 200cc',  { cc: 200, tankL: 12,   rendimientoKmL: 43.5, maxSpeedKmh: 60 }),
      m('Cobra 150cc',     { cc: 150, tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 85,  colors: ['Azul', 'Blanca', 'Negra', 'Roja'] }),
      m('GBR 200cc',       { cc: 200, tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Amarilla', 'Blanca', 'Negra', 'Roja'] }),
      m('GR 250cc',        { cc: 250, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra'] }),
      m('Kavak 150cc',     { cc: 150, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Blanca', 'Gris', 'Morada', 'Negra', 'Roja'] }),
      m('León 150cc',      { cc: 150, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Naranja', 'Negra', 'Roja'] }),
      m('Milan 150cc',     { cc: 150, tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra', 'Roja', 'Rosa'] }),
      m('Optimus',         {          tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra', 'Roja', 'Rosa'] }),
      m('Runner 6G 150cc', { cc: 150, tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 50,  colors: ['Amarilla', 'Azul', 'Blanca', 'Negra'] }),
      m('SBR 150cc',       { cc: 150, tankL: 13,   rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Gris', 'Negra', 'Roja'] }),
      m('Super DT 200cc',  { cc: 200, tankL: 12,   rendimientoKmL: 43.5, maxSpeedKmh: 105, colors: ['Azul', 'Blanca', 'Negra'] }),
      m('Tezo',            {                        maxSpeedKmh: 90,                         colors: ['Azul', 'Blanca', 'Morada', 'Negra'] }),
      m('X1 125cc',        { cc: 125, tankL: 5,    rendimientoKmL: 43.5, maxSpeedKmh: 90,  colors: ['Azul', 'Blanca', 'Negra', 'Roja', 'Rosa'] }),
      m('Bera Bike',       {                        maxSpeedKmh: 35,                         colors: ['Amarilla', 'Azul', 'Blanca', 'Gris', 'Negra'] }),
    ],
  },
  {
    brand: 'Empire Keeway',
    category: 'PASEO',
    models: [
      m('Atlas',              { cc: 200, tankL: 11,   colors: ['Verde', 'Rojo'],               weightKg: 480 }),
      m('Atlas HD',           { cc: 200, tankL: 23,   colors: ['Azul'],                         weightKg: 350 }),
      m('Atlas HDs',          { cc: 200, tankL: 23,   colors: ['Azul'],                         weightKg: 350 }),
      m('Benelli Classica',   {                        colors: ['Gris'] }),
      m('Benelli e-Go',       {                        colors: ['Gris'] }),
      m('EK Xpress',          { cc: 149, tankL: 12,   colors: ['Negro', 'Azul', 'Rojo'] }),
      m('EK Xpress 200S',     { cc: 180, tankL: 12,   colors: ['Rojo'] }),
      m('EK Xpress II',       { cc: 149, tankL: 12,   colors: ['Negro', 'Azul', 'Rojo'] }),
      m('EK Xpress Lite',     {          tankL: 12,   colors: ['Rojo'] }),
      m('EK4',                {                        colors: ['Azul', 'Blanca', 'Negra'],      weightKg: 127 }),
      m('EK7',                {                        colors: ['Azul', 'Blanca', 'Negra'],      weightKg: 127 }),
      m('Fort 4.0',           { cc: 350, tankL: 14,   colors: ['Blanco', 'Gris', 'Negro'],      weightKg: 195 }),
      m('GEV 1000',           {                        colors: ['Azul'],                         weightKg: 56 }),
      m('Horse RL',           { cc: 150, tankL: 12,   colors: ['Negro', 'Azul', 'Rojo'] }),
      m('Matrix II',          { cc: 150, tankL: 6.8,  colors: ['Negro', 'Rojo'] }),
      m('Matrix Lite',        {          tankL: 6.8,  colors: ['Negro', 'Rojo'] }),
      m('New Horse',          { cc: 150, tankL: 12,   colors: ['Negro', 'Azul', 'Rojo'] }),
      m('New Outlook II',     { cc: 175, tankL: 9.5,  colors: ['Negro', 'Blanco', 'Azul'],      weightKg: 130 }),
      m('New Owen',           { cc: 150, tankL: 10,   colors: ['Negro', 'Azul', 'Rojo'] }),
      m('Outlook 300 XL',     { cc: 300, tankL: 13.5, colors: ['Azul', 'Negro', 'Rojo'],        weightKg: 155 }),
      m('Owen 200S',          { cc: 200, tankL: 10,   colors: ['Negro', 'Amarillo', 'Rojo'] }),
      m('QJ Motor SRK 400',   { cc: 400, tankL: 13.5, colors: ['Negro'],                        weightKg: 155 }),
      m('QJ MOTOR SRT550',    { cc: 554, tankL: 19.5, colors: ['Azul'],                         weightKg: 235 }),
      m('QJ MOTOR SRT 550X',  { cc: 554, tankL: 19.5, colors: ['Amarilla'],                     weightKg: 235 }),
      m('QJ MOTOR SRT700S',   { cc: 698, tankL: 19.5, colors: ['Azul'],                         weightKg: 243 }),
      m('QJ MOTOR SRT700SX',  { cc: 698, tankL: 19.5, colors: ['Azul'],                         weightKg: 243 }),
      m('RK 200',             { cc: 200, tankL: 14,   colors: ['Negro', 'Azul', 'Rojo'],        weightKg: 122 }),
      m('RK 250',             { cc: 250, tankL: 18,   colors: ['Negro', 'Rojo', 'Azul'],        weightKg: 122 }),
      m('SFA1000 ADV QJ',     { cc: 976, tankL: 25,                                             weightKg: 139 }),
      m('Superlight 200S',    { cc: 197, tankL: 14.5, colors: ['Negro'],                        weightKg: 152 }),
      m('Thunder',            { cc: 180, tankL: 10,   colors: ['Gris'],                         weightKg: 122 }),
      m('TX II 150',          { cc: 150, tankL: 13,   colors: ['Rojo', 'Negro', 'Azul'] }),
      m('TX 250GS',           { cc: 248, tankL: 15,   colors: ['Azul', 'Negro', 'Rojo'],        weightKg: 150 }),
      m('V302C',              { cc: 298, tankL: 15,   colors: ['Negro'],                        weightKg: 167 }),
    ],
  },
  {
    brand: 'Toro',
    category: 'PASEO',
    models: [
      m('Cappuccino'), m('Fox TR180'), m('Jaguar'), m('Leon TR200'), m('Moka 150'),
      m('Power TR180'), m('R3X 250'), m('REX 150'), m('Rex TR250'), m('Tank 3'),
      m('Tank TR180'), m('TRX 150'), m('Typhoon'),
    ],
  },
  {
    brand: 'MD / Haojin',
    category: 'PASEO',
    models: [
      m('Abeja'), m('Aguila'), m('Canario'), m('Cardenal'), m('Colibrí'), m('Cóndor'),
      m('Cuervo'), m('Falco'), m('Fenix 150'), m('Fenix 200'), m('Kiwi'), m('Lechuza'),
      m('Lechuza II'), m('Tauro'), m('Tucán'),
    ],
  },
  {
    brand: 'Vefase',
    category: 'PASEO',
    models: [m('Arend 150'), m('Speed 150')],
  },
  {
    brand: 'Haojue / HJ',
    category: 'PASEO',
    models: [
      m('DK150'), m('DL160'), m('NK150'), m('AT 200'), m('Cargo 250'), m('GTL'), m('NK 250'),
      m('Squalo Plus'), m('Super II'), m('HJM Classic 150'), m('HJM JB'),
      m('HJM New Street Sport 150'), m('HJM Sport 150'), m('HJM ZR 150'),
      m('Loncin HM 150'), m('Loncin HM 150 GTL'), m('Loncin MS 250'), m('Loncin Rally 300'),
      m('Haojue 150-8'),
    ],
  },
  {
    brand: 'Bajaj',
    category: 'PASEO',
    models: [
      m('Pulsar N250', { cc: 250 }),
      m('Pulsar NS200', { cc: 200 }),
      m('Pulsar N160', { cc: 160 }),
      m('Pulsar 150 Neon', { cc: 150 }),
      m('CT 100 ES', { cc: 100 }),
      m('Boxer BM 150', { cc: 150 }),
    ],
  },
  {
    brand: 'Forza',
    category: 'PASEO',
    models: [
      m('SF501 250cc', { cc: 250 }),
      m('Carrera 250cc', { cc: 250 }),
      m('Scrambler 250cc', { cc: 250 }),
      m('Scrambler 300cc', { cc: 300 }),
      m('Batllos 250cc', { cc: 250 }),
      m('Milano 125cc', { cc: 125 }),
      m('Evo Discovery 450cc', { cc: 450 }),
      m('Nova 150cc', { cc: 150 }),
    ],
  },
  {
    brand: 'Suzuki',
    category: 'ALTO CILINDRAJE',
    models: [
      m('GSX-R1000RZA', { cc: 1000 }),
      m('GSX-S1000GT', { cc: 1000 }),
      m('GSX-S1000GT+', { cc: 1000 }),
      m('GSX 800 FRQ', { cc: 800 }),
      m('HAYABUSA GSX1300 RRQ2', { cc: 1300 }),
      m('V-STROM DL1050', { cc: 1050 }),
      m('V-STROM DL800 DERC', { cc: 800 }),
      m('V-STROM DL650', { cc: 650 }),
      m('V-STROM DS250 SX', { cc: 250 }),
      m('SV-650', { cc: 650 }),
      m('DR650', { cc: 650 }),
      m('DR-Z400SM', { cc: 400 }),
      m('RM-Z450', { cc: 450 }),
      m('GN 125', { cc: 125 }),
      m('BURGMAN 125', { cc: 125 }),
    ],
  },
  {
    brand: 'Yamaha',
    category: 'PASEO',
    models: [
      m('YBR 125', { cc: 125 }),
      m('Crypton 110', { cc: 110 }),
      m('FZ 16', { cc: 153 }),
      m('FZ 25', { cc: 249 }),
      m('FZS 150', { cc: 150 }),
      m('XTZ 125', { cc: 125 }),
      m('XTZ 150', { cc: 150 }),
      m('XTZ 250', { cc: 250 }),
      m('XTZ 300', { cc: 300 }),
      m('MT-03', { cc: 321 }),
      m('MT-07', { cc: 689 }),
      m('MT-09', { cc: 890 }),
      m('NMAX 155', { cc: 155 }),
      m('Aerox 155', { cc: 155 }),
      m('Tenere 700', { cc: 689 }),
      m('R3', { cc: 321 }),
      m('R7', { cc: 689 }),
    ],
  },
  {
    brand: 'AVA',
    category: 'TRAIL',
    models: [
      m('Avispón'), m('Chita'), m('Deer'), m('Flash'), m('Jaguar'), m('León'), m('Leopardo'),
      m('Mule'), m('Mustang 250', { cc: 250 }), m('Mustang Adventure'), m('Pantera'),
      m('Pantera Speed'), m('Puma'), m('Rhino'), m('Tigre'), m('Tigrito'),
      m('Tigrito Speed'), m('Tucán'), m('Wolf'),
    ],
  },
  {
    brand: 'Escuda',
    category: 'PASEO',
    models: [
      m('Adventure'), m('Alexa 180', { cc: 180 }), m('EM200', { cc: 200 }),
      m('Extreme'), m('Hero'), m('New Jog 150', { cc: 150 }),
    ],
  },
  {
    brand: 'Ssenda',
    category: 'PASEO',
    models: [m('SS 150', { cc: 150 }), m('SS 200', { cc: 200 })],
  },
  {
    brand: 'Vento',
    category: 'PASEO',
    models: [
      m('Lithium 150 4.0', { cc: 150 }),
      m('Thunderstar 300 XL', { cc: 300 }),
      m('Cyclone 150', { cc: 150 }),
      m('Cyclone 200', { cc: 200 }),
      m('Nitrox 300 T3', { cc: 300 }),
      m('GTS 300', { cc: 300 }),
      m('Dakar 300', { cc: 300 }),
      m('Crossmax 200', { cc: 200 }),
      m('Reptile Trek 200', { cc: 200 }),
    ],
  },
  { brand: 'Otra / Personalizada', category: '', models: [] },
];
