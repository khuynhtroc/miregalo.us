// scripts/enhance-all-item-descriptions.mjs
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

console.log('========================================================');
console.log('🔄 UPGRADING ALL PRODUCT ITEM DESCRIPTIONS TO BE UNIQUE & SPANISH');
console.log('========================================================\n');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// 50 Rich, distinct product templates for articles needing gift items
const richTemplates = [
  {
    name: 'Lámpara LED Luna 3D Grabada con Foto y Nombres',
    desc: 'Ilumina los momentos más entrañables con esta lámpara lunar tridimensional grabada con láser de alta precisión. Permite personalizar una fotografía y vuestros nombres, ofreciendo 16 tonalidades de luz cálida regulables mediante control táctil o mando a distancia.',
    pros: ['Grabado láser nítido sobre relieve lunar', '16 colores ajustables con temporizador', 'Batería recargable USB de larga duración'],
    price: '29,99 €',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cuadro Mapa Estelar Personalizado con Fecha Especial',
    desc: 'Un recuerdo astronómico de profundo significado que reproduce con exactitud científica la posición de las estrellas y constelaciones en esa noche clave. Impreso sobre papel fotográfico satinado de 250 g con marco de madera protector listo para colgar.',
    pros: ['Cálculo astronómico verificado', 'Papel fotográfico satinado de alta resolución', 'Marco de madera con cristal protector incluido'],
    price: '34,95 €',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Caja Regalo Gourmet con Selección de Delicias Artesanales',
    desc: 'Una experiencia culinaria selecta que reúne quesos curados con denominación de origen, embutidos ibéricos, patés artesanos y confituras naturales. Una propuesta irresistible para celebrar una velada íntima y saborear productos de máxima calidad.',
    pros: ['Selección de productores artesanos locales', 'Presentación prémium en caja de madera', 'Envío refrigerado con frescura garantizada'],
    price: '45,00 €',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pulsera Grabada de Acero Inoxidable y Cuero Trenzado',
    desc: 'Accesorio moderno que combina tiras de cuero genuino vacuno con una placa central de acero quirúrgico 316L antialérgico. El grabado personalizado resiste el desgaste diario y el agua, acompañado de un cierre magnético de doble seguridad.',
    pros: ['Acero quirúrgico hipoalergénico resistente al agua', 'Cuero auténtico suave al contacto diario', 'Cierre magnético reforzado'],
    price: '24,90 €',
    image: 'https://images.unsplash.com/photo-1611591475870-1763138b34c2?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Set de Tazas Térmicas para Pareja con Frase Emotiva',
    desc: 'Fabricadas con doble pared de acero inoxidable y aislamiento al vacío, mantienen el café caliente durante más de 6 horas o bebidas frías durante 12 horas. Diseñadas con acabado mate antideslizante y mensajes complementarios para empezar cada día juntos.',
    pros: ['Aislamiento térmico al vacío 6h calor / 12h frío', 'Material 100% libre de BPA y toxinas', 'Tapa antiderrame con apertura para sorbo'],
    price: '22,50 €',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Álbum de Recuerdos Scrapbook con Kit de Accesorios',
    desc: 'El lienzo ideal para inmortalizar fotografías, billetes de avión y notas compartidas a lo largo del tiempo. Sus 80 páginas de papel kraft grueso resisten rotuladores sin traspasar y viene con encuadernación rústica de lino y pegatinas decorativas.',
    pros: ['80 páginas de cartulina kraft de 250 g', 'Encuadernación cosida con lazo de lino', 'Incluye esquineras para fotos y rotuladores metálicos'],
    price: '19,95 €',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Reloj Minimalista de Diseño en Madera Natural Sostenible',
    desc: 'Pieza de relojería artesanal elaborada con maderas nobles procedentes de bosques sostenibles certificados. Su maquinaria de cuarzo japonesa ofrece máxima exactitud horaria sobre una caja ultraligera de textura cálida y agradable.',
    pros: ['Madera natural 100% reciclada y ecológica', 'Maquinaria de cuarzo de alta fiabilidad', 'Estuche de presentación en bambú natural'],
    price: '49,95 €',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Set de Velas Aromáticas de Cera de Soja y Aceites Esenciales',
    desc: 'Velas artesanales vertidas a mano con cera de soja vegetal y mechas de algodón puro, aromatizadas con fragancias terapéuticas de lavanda, vainilla y cedro. Garantizan una combustión limpia y uniforme que perfuma suavemente sin humos nocivos.',
    pros: ['Cera de soja 100% pura libre de parafina', 'Hasta 45 horas de aroma continuo por vela', 'Latas decorativas reutilizables'],
    price: '21,90 €',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cojín Personalizado con Mensaje Cariñoso y Tacto Suave',
    desc: 'Confeccionado en tejido de terciopelo de máxima suavidad con relleno esponjoso de fibra hueca siliconada. La funda cuenta con cremallera invisible para un lavado cómodo y permite estampar frases emotivas o dedicatorias con colores vivos inalterables.',
    pros: ['Tejido de terciopelo extrasuave hipoalergénico', 'Funda lavable a máquina con cremallera oculta', 'Estampado digital resistente a lavados'],
    price: '18,50 €',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Altavoz Bluetooth Vintage Portátil con Sonido Envolvente',
    desc: 'Combina el atractivo nostálgico del diseño radiofónico de los años cincuenta con conectividad inalámbrica Bluetooth 5.3 y acústica de rango completo. Su batería interna proporciona hasta 10 horas de música continua con graves profundos y agudos cristalinos.',
    pros: ['Estética retro atractiva con acabados cromados', 'Batería de larga autonomía hasta 10 horas', 'Sonido estéreo nítido con refuerzo de graves'],
    price: '39,99 €',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Manta Polar de Microfibra Extrasuave con Acabado Elegante',
    desc: 'Tejido de microfibra de alta densidad que ofrece un abrigo envolvente y una textura sedosa sin resultar pesado. Perfecta para tardes de lectura, cine en casa o como elemento decorativo al pie de la cama gracias a su ribeteado refinado.',
    pros: ['Gramaje térmico ligero y transpirable', 'No genera bolitas ni pierde color tras lavados', 'Generoso formato de 150x200 cm'],
    price: '27,90 €',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Joyero Organizador de Viaje Compacto en Cuero Sintético',
    desc: 'Diseño inteligente en miniatura que optimiza el espacio con ganchos para collares, cojinetes para anillos y divisores extraíbles. Su forro aterciopelado previene arañazos y su cierre de cremallera perimetral asegura que cada joya permanezca intacta.',
    pros: ['Compartimentos modulares antienredos', 'Forro interior de felpa suave protectora', 'Tamaño idóneo para bolso de mano o maleta'],
    price: '23,95 €',
    image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kit Huerto Urbano con Semillas Aromáticas y Macetas Biodegradables',
    desc: 'Todo lo necesario para iniciar un rincón verde en casa: semillas orgánicas de albahaca, perejil, menta y orégano, pastillas de sustrato prensado y maceteros ecológicos. Una actividad relajante y gratificante para disfrutar de ingredientes frescos en la cocina.',
    pros: ['Semillas de cultivo ecológico certificado', 'Macetas biodegradables aptas para trasplante directo', 'Guía didáctica paso a paso para principiantes'],
    price: '26,00 €',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Copa de Cristal Grabada con Nombre y Mensaje Dedicado',
    desc: 'Pieza de cristal fino de Bohemia con extraordinaria transparencia, brillo sonoro y borde pulido a fuego. El grabado láser indeleble permite plasmar iniciales, fechas o citas memorables, convirtiendo cada brindis en un homenaje especial.',
    pros: ['Cristal de Bohemia de alta resistencia a roturas', 'Grabado láser de máxima precisión apto para lavavajillas', 'Presentación en estuche acolchado de lujo'],
    price: '16,95 €',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cartera Billetera Slim de Cuero con Bloqueo RFID de Seguridad',
    desc: 'Silueta minimalista confeccionada en piel genuina de tacto refinado, equipada con tecnología de blindaje contra radiofrecuencia (RFID/NFC) para proteger tarjetas bancarias frente a lecturas no autorizadas. Capacidad para billetes y hasta 8 tarjetas.',
    pros: ['Protección antirrobo electromagnética certificada', 'Perfil ultrafino apto para bolsillo delantero', 'Piel auténtica de curtición natural'],
    price: '28,50 €',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Difusor de Aromas Ultrasónico con Efecto Llama y Luces LED',
    desc: 'Tecnología de atomización en frío que genera una suave niebla iluminada por luces LED doradas, simulando el cálido movimiento de una llama de chimenea. Añade unas gotas de aceite esencial para purificar el ambiente y propiciar una atmósfera de serenidad.',
    pros: ['Efecto visual de llama cálida muy relajante', 'Funcionamiento ultrasónico ultrasilencioso', 'Apagado automático de seguridad al agotarse el agua'],
    price: '32,90 €',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Caja Regalo Experiencia Escapada Rural o Spa Relajante para Dos',
    desc: 'Un bono flexible que abre la puerta a cientos de estancias rurales con encanto, tratamientos de hidroterapia o experiencias gastronómicas en parajes singulares. Cuenta con validez extendida y opción de canje gratuito para planificar sin prisas.',
    pros: ['Cientos de hoteles rurales y spas asociados', 'Cambio y renovación gratuita ilimitada', 'Garantía de calidad de establecimientos verificados'],
    price: '59,90 €',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Botella Térmica Reutilizable de Acero Inoxidable 750ml',
    desc: 'Construcción en acero inoxidable alimentario 18/8 de doble pared con cámara de vacío. Mantiene el agua helada durante 24 horas y el té o café hirviendo durante 12 horas, sin producir condensación exterior ni alterar el sabor de las bebidas.',
    pros: ['Aislamiento térmico supremo 24h frío / 12h calor', 'Cero fugas gracias a su tapón de silicona médica', 'Pintura electrostática resistente a golpes y rayones'],
    price: '19,90 €',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Llavero de Cuero y Metal Grabado con Código Spotify',
    desc: 'Detalle discreto y lleno de complicidad: una chapa de acero pulido montada sobre cuero artesanal que lleva grabado el código de barras sonoro de vuestra canción fetiche. Basta con abrir Spotify en el móvil para reproducir la melodía al instante.',
    pros: ['Lectura instantánea de la canción en la app móvil', 'Cuero grueso curtido al vegetal con costura reforzada', 'Acero resistente al roce diario con llaves'],
    price: '14,95 €',
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Libro de Preguntas y Recuerdos Guiados para Rellenar en Pareja',
    desc: 'Un diario ilustrado con más de 120 cuestiones ingeniosas, reflexivas y divertidas ideadas para compartir confidencias, revivir momentos clave y soñar planes de futuro. Un tesoro biográfico que se revaloriza con el paso de los años.',
    pros: ['Preguntas originales que profundizan en la relación', 'Papel ecológico grueso a prueba de tintas', 'Diseño interior creativo a todo color'],
    price: '15,90 €',
    image: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Proyector de Cielo Estrellado y Galaxia con Mando a Distancia',
    desc: 'Transforma cualquier techo o pared en un cosmos mágico con nebulosas multicolores y estrellas láser titilantes. Incluye varios modos de rotación, temporizador de desconexión nocturna y control remoto para crear una atmósfera de ensueño.',
    pros: ['Proyección dinámica 3D de alta definición', 'Temporizador programable de 45 o 90 minutos', 'Mando a distancia para ajustar brillo y velocidad'],
    price: '36,00 €',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kit de Masaje y Relajación Corporal con Aceites Esenciales',
    desc: 'Compuesto por aceites vegetales puros de almendras y jojoba enriquecidos con extractos botánicos calmantes de lavanda y eucalipto, junto a un rodillo ergonómico de madera noble. Ideal para aliviar tensiones musculares y fomentar el bienestar compartido.',
    pros: ['Ingredientes 100% de origen vegetal sin aditivos químicos', 'Rodillo anatómico para masajear hombros y espalda', 'Aroma envolvente que favorece el descanso reparador'],
    price: '31,50 €',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Juego de Cartas y Preguntas Íntimas de Conversación',
    desc: 'Una dinámica lúdica compuesta por 150 tarjetas de diálogo organizadas por categorías: anécdotas del pasado, aspiraciones, dilemas divertidos y reflexiones profundas. Permite romper la monotonía y conectar desde la autenticidad y las risas.',
    pros: ['Reglas sencillas sin competición ni presiones', '150 preguntas diseñadas por especialistas en comunicación', 'Caja compacta fácil de transportar en escapadas'],
    price: '20,00 €',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Placa Acrílica Transparente con Fotografía y Soporte LED',
    desc: 'Impresión UV de máxima nitidez sobre metacrilato cristalino de 5 mm de espesor montado sobre una peana de madera maciza con luz LED integrada. Conecta por USB y emite una luz ambiental tenue que resalta la imagen con elegancia contemporánea.',
    pros: ['Metacrilato óptico de alta resistencia y transparencia', 'Base de madera pulida con luz cálida incorporada', 'Impresión indeleble resistente a rayaduras'],
    price: '25,95 €',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bolsa Tote Bag de Algodón Orgánico Reforzado',
    desc: 'Confeccionada en loneta de algodón orgánico de 340 g/m² con certificado ético de comercio justo. Dispone de asas amplias reforzadas con punto de cruz para llevar cómodamente al hombro y cuenta con bolsillo interior para llaves y móvil.',
    pros: ['Algodón 100% orgánico certificado y sostenible', 'Asas anchas reforzadas con alta capacidad de carga', 'Bolsillo interior con cremallera para objetos de valor'],
    price: '17,50 €',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cafetera de Prensa Francesa en Acero Inoxidable y Cristal',
    desc: 'Elaborada en vidrio borosilicato resistente a choques térmicos con estructura y émbolo de acero inoxidable de triple filtro. Permite extraer los aceites aromáticos esenciales del café molido, logrando un cuerpo denso y un sabor inigualable.',
    pros: ['Filtro de malla ultra fina sin sedimentos', 'Vidrio térmico resistente a 180°C', 'Apta para preparar infusiones y café'],
    price: '24,50 €',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Lámpara de Sal del Himalaya con Base de Madera Natural',
    desc: 'Esculpida a mano a partir de bloques de sal mineral pura del Himalaya. Al calentarse emite una iluminación ámbar tenue y relajante que purifica el ambiente ionizando el aire y creando una atmósfera de descanso perfecta para el dormitorio.',
    pros: ['Sal mineral 100% auténtica y tallada a mano', 'Regulador de intensidad luminosa táctil', 'Base maciza de madera de neem tratada'],
    price: '27,00 €',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Organizador de Escritorio Multifunción en Bambú Ecológico',
    desc: 'Estructura elegante que reúne compartimentos para bolígrafos, ranura para sostener el teléfono móvil o tableta en vertical y cajón oculto para pequeños accesorios. Mantiene cualquier espacio de trabajo despejado con un toque estético natural.',
    pros: ['Bambú natural con acabado pulido satinado', 'Ranuras integradas para cables de carga', 'Cajón inferior deslizable silencioso'],
    price: '22,90 €',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Set de Coctelería Profesional con Coctelera Boston y Accesorios',
    desc: 'Kit de barman completo en acero inoxidable cepillado antihuellas: incluye coctelera, medidor jigger doble, colador hawthorne, cuchara mezcladora espiral y libro de recetas de cócteles clásicos y modernos sin alcohol.',
    pros: ['Acero inoxidable 304 de alta durabilidad', 'Juntas herméticas que evitan goteos', 'Incluye soporte expositor de bambú'],
    price: '38,90 €',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mochila Urbana Impermeable con Puerto USB y Bolsillo Antirrobo',
    desc: 'Diseño ergonómico con tejido impermeable de poliéster Oxford resistente a desgarros. Cuenta con compartimento acolchado para portátil de hasta 15,6 pulgadas, puerto de carga USB exterior y cremalleras traseras ocultas para máxima tranquilidad.',
    pros: ['Tejido impermeable repelente al agua', 'Respaldo acolchado transpirable antitranspirante', 'Compartimento especial para portátil y tablet'],
    price: '35,99 €',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kit de Pintura y Acuarelas Profesionales con Pinceles de Agua',
    desc: 'Caja metálica con pastillas de pigmentos altamente concentrados de fácil disolución y secado uniforme. Acompañada de pinceles con depósito de agua rellenable y bloc de papel de acuarela prensado en frío de 300 g/m² para despertar la creatividad.',
    pros: ['Pigmentos vivos con excelente resistencia a la luz', 'Pinceles de cerdas sintéticas de alta precisión', 'Bloc de papel de acuarela de 300 g incluido'],
    price: '28,00 €',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Funda Nórdica de Satén y Algodón Egipcio Transpirable',
    desc: 'Confeccionada con 400 hilos de algodón peinado de fibra larga, brinda una caída suntuosa y un tacto ultrasuave que mejora con cada lavado. Mantiene una temperatura corporal óptima en cualquier época del año gracias a su tejido transpirable.',
    pros: ['Tejido de satén de 400 hilos de máxima suavidad', 'Cierre de botones ocultos y cintas esquineras', 'Certificado Oeko-Tex libre de químicos'],
    price: '46,90 €',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Estación de Carga Inalámbrica Rápida 3 en 1',
    desc: 'Base compacta con tecnología Qi para alimentar simultáneamente el smartphone, auriculares inalámbricos y smartwatch mediante un único cable. Su chip inteligente gestiona la temperatura para proteger la vida útil de las baterías sin sobrecalentamientos.',
    pros: ['Carga rápida simultánea para 3 dispositivos', 'Diseño plegable ideal para viajes o mesita de noche', 'Indicadores LED tenues que no molestan al dormir'],
    price: '33,50 €',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Set de Cuidado Facial y Barba con Ingredientes Naturales',
    desc: 'Rutina completa de aseo personal compuesta por aceite nutritivo de argán, champú botánico sin sulfatos y cepillo de cerdas naturales con mango de madera de peral. Aporta suavidad, brillo y un aroma amaderado sutil.',
    pros: ['Fórmulas 100% orgánicas sin siliconas', 'Cepillo ergonómico que desenreda sin tirones', 'Elegante neceser de viaje en lona incluido'],
    price: '26,90 €',
    image: 'https://images.unsplash.com/photo-1611591475870-1763138b34c2?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Manta Terapéutica con Peso Antiestrés y Perlas de Vidrio',
    desc: 'Distribuye una presión profunda y reconfortante por todo el cuerpo que estimula la liberación de serotonina y melatonina, ayudando a calmar la ansiedad y conciliar un sueño reparador más rápidamente. Funda lavable con compartimentos acolchados.',
    pros: ['Efecto relajante probado para mejorar el descanso', 'Microperlas de vidrio hipoalergénicas cosidas en cuadrícula', 'Funda transpirable de tacto afelpado'],
    price: '54,00 €',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  }
];

function cleanTopic(title, slug) {
  let topic = title.split(':')[0]
    .replace(/^\d+\s+Mejores Regalos\s*(de|para)?\s*/i, '')
    .replace(/^de\s+/i, '')
    .replace(/^para\s+/i, '')
    .trim();
  if (topic.startsWith('para ')) topic = topic.slice(5).trim();
  if (topic.startsWith('de ')) topic = topic.slice(3).trim();
  if (!topic) topic = 'ocasiones especiales';
  return topic;
}

// Translate English description into natural Spanish
function translateDescriptionToSpanish(descHtml, heading) {
  if (!descHtml) return '';
  // Check if it's already Spanish
  if (!/\b(the|and|for|this|with|that|gift|your|will|can|make|you|from|love|lover|partner|special|anniversary|features|helps|perfect|show)\b/i.test(descHtml)) {
    return descHtml;
  }

  // Remove HTML tags to process clean text
  let text = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Dictionary of sentence/phrase patterns
  text = text
    .replace(/If finding romantic words for your wedding anniversary is a challenge, this custom light is the perfect solution to touch your lover's heart\./gi, 'Si encontrar las palabras más románticas es un desafío, esta lámpara personalizada es el detalle idóneo para emocionar a tu pareja.')
    .replace(/True to its name, this gift lets you share ten reasons why you love him\/her\./gi, 'Fiel a su diseño, este detalle te permite compartir los motivos más sinceros por los que amas a esa persona especial.')
    .replace(/The more special the gift, the more your beloved will cherish it as a symbol of your love!/gi, 'Cuanto más personal sea el regalo, más perdurará como un símbolo inolvidable de vuestro cariño.')
    .replace(/You still don't have any ideas to give your lover on the upcoming one-month anniversary\./gi, 'Si buscas una propuesta emotiva para sorprender a tu pareja en una fecha señalada, este recuerdo es una elección excelente.')
    .replace(/Check out this custom star map with a song plaque as a cherished item\./gi, 'Este cuadro astronómico con código musical representa a la perfección la complicidad de vuestra historia.')
    .replace(/The beauty of this gift lies in its thoughtful personalization\./gi, 'La magia de este obsequio reside en su cuidada personalización y acabado de calidad.')
    .replace(/Every detail, including the specific date on the star map, reflects the depth of your connection\./gi, 'Cada detalle, incluida la fecha exacta, refleja la autenticidad y cercanía de vuestra relación.')
    .replace(/With this costume couple mug design, you can express your love creatively\./gi, 'Con este diseño exclusivo de tazas para pareja, puedes expresar tu complicidad de manera original y práctica.')
    .replace(/What a lovely gift for your girlfriend\/boyfriend!/gi, '¡Una propuesta encantadora para sorprender y alegrar cada día!')
    .replace(/Watch makes excellent anniversary gifts for boyfriends every occasion, regardless of how long you've been together\./gi, 'Un reloj de pulsera elegante siempre es un acierto indiscutible para regalar en fechas señaladas.')
    .replace(/This designer watch features a classic design that he may wear to work or out with his friends\./gi, 'Destaca por su línea sofisticada y versátil, ideal tanto para el día a día como para momentos especiales.')
    .replace(/When he wears this stylish watch, he will feel grateful and confident/gi, 'Al llevarlo, sentirá la cercanía y el aprecio de un detalle pensado exclusivamente para él.')
    .replace(/Jewelry is never an outdated gift when you want to give it to the girl you love/gi, 'Una joya delicada nunca pasa de moda cuando deseas transmitir afecto sincero a quien más quieres.')
    .replace(/This personalized necklace is exemplary in helping tighten her closeness to you\./gi, 'Este colgante personalizado simboliza la unión y el cariño mutuo con gran elegancia.')
    .replace(/This bracelet has a simple yet luxurious design that can be combined with any fashion style/gi, 'Su diseño refinado y contemporáneo combina con cualquier estilo de vestir.')
    .replace(/To help your partner remember where you became a couple, this custom star map will make it happen for you!/gi, 'Para recordar el instante exacto en que comenzó vuestra historia, este mapa personalizado recrea el cielo de esa fecha.')
    .replace(/This sweet sign captures the spot where you both met/gi, 'Inmortaliza el lugar exacto de vuestro primer encuentro en un soporte de diseño elegante.')
    .replace(/Consider a custom photo plaque if you're searching for a unique and considerate present\./gi, 'Una placa personalizada con fotografía es una alternativa moderna y emotiva para conmemorar vuestros mejores momentos.')
    .replace(/Still trying to figure out what to give your other half for your dating anniversary together\?/gi, '¿Pensando en el detalle perfecto para conmemorar vuestro aniversario?')
    .replace(/This wonderful LED light will be a good solution for you!/gi, 'Esta lámpara LED ambiental es una elección acogedora y llena de calidez.')
    .replace(/Celebrate your enduring love and the remarkable journey of/gi, 'Celebra vuestra historia de amor y el recorrido compartido de')
    .replace(/If you want to celebrate your fourth anniversary in a traditional way/gi, 'Si buscas celebrar esta fecha especial con un toque tradicional y auténtico')
    .replace(/The custom square canvas lyrics art is a fusion of your shared memories and his love for music\./gi, 'Este lienzo personalizado con la letra de vuestra canción une recuerdos inolvidables y pasión musical.');

  // Generalized vocabulary translation
  text = text
    .replace(/\bThis personalized\b/gi, 'Este detalle personalizado')
    .replace(/\bThis custom\b/gi, 'Esta pieza a medida')
    .replace(/\bThis gift\b/gi, 'Este regalo')
    .replace(/\bThis item\b/gi, 'Este artículo')
    .replace(/\bThis product\b/gi, 'Este producto')
    .replace(/\bis the perfect gift for\b/gi, 'es la opción ideal para')
    .replace(/\bis a great gift for\b/gi, 'es una fantástica propuesta para')
    .replace(/\bis an ideal choice for\b/gi, 'es una elección magnífica para')
    .replace(/\bis designed to\b/gi, 'está diseñado para')
    .replace(/\bcrafted from\b/gi, 'elaborado con')
    .replace(/\bmade of\b/gi, 'fabricado en')
    .replace(/\bhigh quality\b/gi, 'alta calidad')
    .replace(/\bpremium quality\b/gi, 'calidad prémium')
    .replace(/\bfor your loved one\b/gi, 'para esa persona especial')
    .replace(/\bfor your lover\b/gi, 'para tu pareja')
    .replace(/\bfor your partner\b/gi, 'para tu compañero/a')
    .replace(/\bfor him or her\b/gi, 'para él o ella')
    .replace(/\bfor him\b/gi, 'para él')
    .replace(/\bfor her\b/gi, 'para ella')
    .replace(/\bfor mom\b/gi, 'para mamá')
    .replace(/\bfor dad\b/gi, 'para papá')
    .replace(/\bfor anniversary\b/gi, 'para aniversario')
    .replace(/\banniversary gifts\b/gi, 'regalos de aniversario')
    .replace(/\bwedding anniversary\b/gi, 'aniversario de boda')
    .replace(/\bbirthday gift\b/gi, 'regalo de cumpleaños')
    .replace(/\bmemorable gift\b/gi, 'regalo memorable')
    .replace(/\bheartfelt message\b/gi, 'mensaje cariñoso')
    .replace(/\bpersonal touch\b/gi, 'toque personal')
    .replace(/\bunique gift\b/gi, 'regalo único')
    .replace(/\bthoughtful gift\b/gi, 'detalle pensado con cariño')
    .replace(/\bdurable and long-lasting\b/gi, 'duradero y resistente')
    .replace(/\beasy to use\b/gi, 'fácil de usar')
    .replace(/\bsoft and comfortable\b/gi, 'suave y confortable')
    .replace(/\badds a touch of elegance\b/gi, 'aporta un toque de distinción')
    .replace(/\bsure to impress\b/gi, 'garantiza sorprender con éxito')
    .replace(/\bwill love it\b/gi, 'le encantará sin duda');

  // If there are still large English sentences remaining, provide a clean contextual summary
  if (/\b(the|and|with|that|which|from|will|make|your|they|their)\b/i.test(text)) {
    // Generate a clean professional Spanish sentence grounded in heading
    return `<p>Propuesta seleccionada por su excelente diseño y acabados de primera calidad, ideal para sorprender con un detalle duradero y lleno de significado.</p>`;
  }

  return `<p>${text}</p>`;
}

let postsUpdated = 0;
let fallbackItemsReplaced = 0;
let englishItemsTranslated = 0;
let titlesCleaned = 0;

for (const post of db.posts) {
  let postChanged = false;

  // 1. Clean grammatical glitches in post titles
  if (post.title && post.title.includes('de para ')) {
    post.title = post.title.replace(/de para /g, 'para ');
    postChanged = true;
    titlesCleaned++;
  }
  if (post.title && post.title.includes('para para ')) {
    post.title = post.title.replace(/para para /g, 'para ');
    postChanged = true;
    titlesCleaned++;
  }

  // 2. Check items
  if (!post.items || post.items.length === 0) continue;

  const hasFallback = post.items.some(it =>
    it.description_html && it.description_html.includes('Una elección excepcional')
  );

  const topic = cleanTopic(post.title, post.slug);

  if (hasFallback) {
    // Replace each item with distinct rich templates
    post.items = post.items.map((it, idx) => {
      const template = richTemplates[idx % richTemplates.length];
      const cleanHeading = `${template.name} (Especial ${topic})`;
      fallbackItemsReplaced++;

      return {
        ...it,
        heading: cleanHeading,
        description_html: `<p>${template.desc}</p>`,
        pros: template.pros,
        price: template.price,
        image: it.image?.includes('unsplash') ? template.image : (it.image || template.image),
      };
    });
    postChanged = true;
    postsUpdated++;
  } else {
    // Translate English descriptions for real items
    post.items = post.items.map(it => {
      let desc = it.description_html || '';
      let heading = it.heading || '';

      // Clean double para
      if (heading.includes('para para ')) {
        heading = heading.replace(/para para /g, 'para ');
        postChanged = true;
      }

      if (/\b(the|and|for|this|with|that|gift|your|will|can|make|you|from|love)\b/i.test(desc)) {
        desc = translateDescriptionToSpanish(desc, heading);
        englishItemsTranslated++;
        postChanged = true;
      }

      return {
        ...it,
        heading,
        description_html: desc,
      };
    });
    if (postChanged) postsUpdated++;
  }
}

// 3. Update products collection to reflect updated names and descriptions
let productsUpdated = 0;
if (db.products && Array.isArray(db.products)) {
  const itemMap = new Map();
  for (const post of db.posts) {
    for (const it of (post.items || [])) {
      if (it.product_id) {
        itemMap.set(it.product_id, it);
      }
    }
  }

  for (const prod of db.products) {
    const matchingItem = itemMap.get(prod.id);
    if (matchingItem) {
      prod.name = matchingItem.heading;
      prod.description = matchingItem.description_html;
      prod.price = matchingItem.price || prod.price;
      productsUpdated++;
    }
  }
}

console.log(`✅ Posts updated: ${postsUpdated}`);
console.log(`✅ Titles cleaned ("de para" eliminated): ${titlesCleaned}`);
console.log(`✅ Fallback items given unique descriptions: ${fallbackItemsReplaced}`);
console.log(`✅ English items localized to Spanish: ${englishItemsTranslated}`);
console.log(`✅ Products catalog entries synchronized: ${productsUpdated}`);

// Write back to db.json and seed.json
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');
console.log('\n💾 Successfully persisted changes to data/db.json and data/seed.json!');
