import fs from 'fs';

function generateRealisticPrice(name, id = '') {
  const lower = (name || '').toLowerCase();

  // 1. Small stationery / trinkets / socks / keychains / stickers
  if (/llavero|calcetin|pegatina|chapa|marcapáginas|bolígrafo|imán|jabón|pin|parche|carrete|insignia|cordón|abridor|posavasos|bálsamo|pastillero|peine/i.test(lower)) {
    const list = ['8,95 €', '9,99 €', '10,50 €', '11,90 €', '12,50 €', '13,95 €', '14,99 €'];
    return pickStable(id + name, list);
  }

  // 2. Mugs / Drinkware / Tumblers / Coasters
  if (/taza|termo|vaso|copa|botella|jarra|infusor|cantimplora|mug/i.test(lower)) {
    const list = ['14,95 €', '15,99 €', '17,50 €', '18,90 €', '19,95 €', '21,90 €', '23,50 €'];
    return pickStable(id + name, list);
  }

  // 3. Bath, Spa, Personal Care, Candles, Soaps
  if (/vela|velas|aromática|difusor|sales de baño|bomba de baño|champú|crema|loción|afeitado|barba|mascarilla/i.test(lower)) {
    const list = ['16,90 €', '18,50 €', '21,90 €', '24,50 €', '26,90 €', '28,50 €'];
    return pickStable(id + name, list);
  }

  // 4. Apparel / T-shirts / Caps / Aprons
  if (/camiseta|gorra|delantal|gorro|bufanda|guantes|sombrero|pañuelo|corbata/i.test(lower)) {
    const list = ['19,95 €', '21,90 €', '22,95 €', '24,50 €', '25,99 €', '27,90 €'];
    return pickStable(id + name, list);
  }

  // 5. Sweatshirts / Hoodies / Bathrobes / Sweaters
  if (/sudadera|jersey|albornoz|bata|pijama|chaqueta|suéter/i.test(lower)) {
    const list = ['34,95 €', '37,90 €', '39,99 €', '42,50 €', '45,90 €', '49,95 €'];
    return pickStable(id + name, list);
  }

  // 6. Blankets / Pillows / Home decor / Lamps / Clocks
  if (/manta|cojín|almohada|póster|cuadro|lienzo|lámina|lámpara|luz nocturna|reloj de pared|felpudo|marco/i.test(lower)) {
    const list = ['25,90 €', '28,50 €', '31,90 €', '34,95 €', '37,50 €', '39,99 €', '42,90 €'];
    return pickStable(id + name, list);
  }

  // 7. Jewelry / Watches / Leather wallets / Bags
  if (/collar|pulsera|anillo|pendientes|joya|reloj|cartera|billetera|bolso|mochila|neceser|cinturón|gemelos|colgante|brazalete/i.test(lower)) {
    const list = ['28,90 €', '32,50 €', '36,90 €', '42,00 €', '46,50 €', '52,90 €', '58,00 €'];
    return pickStable(id + name, list);
  }

  // 8. Gourmet / Gift baskets / Sweets / Wine / Chocolates
  if (/caja|cesta|pack|kit|lote|bombones|dulces|chocolate|vino|cerveza|degustación|gourmet|delicatessen|jamón|spa/i.test(lower)) {
    const list = ['32,90 €', '36,50 €', '39,95 €', '45,00 €', '49,90 €', '55,00 €', '64,90 €'];
    return pickStable(id + name, list);
  }

  // 9. Tech / Gadgets / Speakers / Electronics
  if (/altavoz|auriculares|masajeador|inalámbrico|bluetooth|cargador|gadget|proyector|teclado|smartwatch/i.test(lower)) {
    const list = ['39,95 €', '45,00 €', '49,99 €', '56,90 €', '64,95 €', '72,00 €', '84,90 €'];
    return pickStable(id + name, list);
  }

  // 10. Books / Board Games / Hobbies
  if (/libro|novela|guía|juego|puzzle|baraja|tablero|rompecabezas|manualidades/i.test(lower)) {
    const list = ['15,90 €', '17,50 €', '19,95 €', '22,90 €', '24,50 €', '27,90 €'];
    return pickStable(id + name, list);
  }

  // 11. General realistic gift fallback
  const fallback = ['16,95 €', '19,90 €', '22,50 €', '24,95 €', '27,90 €', '29,95 €', '32,50 €', '35,00 €', '38,90 €', '42,00 €', '45,90 €'];
  return pickStable(id + name, fallback);
}

function pickStable(str, arr) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % arr.length;
  return arr[idx];
}

const testNames = [
  'Manta facial personalizada con foto',
  'Camiseta Pareja Personalizada Completa Nivel 1',
  'Dulces de boda dorados',
  'Percha para bata personalizada de novia',
  'James Madison: el primer libro',
  'Jabón para Fondo de Bikini',
  'Temporizador de baño lateral',
  'Cartera de piel grabada personalizada',
  'Collar con inicial de corazón',
  'Colgador de tazas de madera',
  'Calcetines de enfermera novedosos',
  'Vaso para estetoscopio',
  'Pulsera con dijes de enfermera',
  'Caja de regalo spa aromática de lavanda',
  'Altavoz bluetooth impermeable para ducha',
];

console.log('Sample generated prices:');
testNames.forEach(n => {
  console.log(`${n.padEnd(46)} -> ${generateRealisticPrice(n, 'test-' + n)}`);
});
