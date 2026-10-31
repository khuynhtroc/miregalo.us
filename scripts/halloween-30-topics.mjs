import fs from 'fs';

const rawTopics = [
  // Day 1 - 21 Oct 2026 (Disfraces Express & Última Hora)
  {
    day: '2026-10-21', time: '06:00:00',
    query: 'disfraces de halloween de última hora envío rápido',
    title: '12 Disfraces de Halloween de Última Hora con Envío Rápido en Amazon para Salvar la Noche',
    slug: 'disfraces-halloween-ultima-hora-envio-rapido',
    cluster: 'Disfraces Express',
    recipient: 'quienes necesitan un disfraz urgente con envío Prime en 24 horas',
    focus: 'disfraces de última hora con entrega rápida en Estados Unidos',
    itemNames: [
      'Capa gótica de terciopelo unisex con capucha profunda',
      'Set clásico de vampiro victoriano con chaleco y colmillos retráctiles',
      'Traje inflable de dinosaurio T-Rex con ventilador ultrarrápido',
      'Disfraz de fantasma brillante con luces LED ocultas',
      'Conjunto de médico de la peste negra con máscara de pico y guantes',
      'Mono estilo piloto de carreras retro con parches bordados',
      'Disfraz poncho de esqueleto mexicano fácil de poner',
      'Túnica de mago oscuro con varita luminosa y runas bordadas',
      'Set de diadema de cuernos de maléfica con gargantilla de encaje',
      'Máscara de látex realista de payaso siniestro de película',
      'Kit de accesorios de marinero vintage para armar en 5 minutos',
      'Disfraz poncho de calabaza sonriente en forro polar ultrasuave'
    ]
  },
  {
    day: '2026-10-21', time: '09:30:00',
    query: 'disfraces inflables de halloween para adultos',
    title: 'Los 10 Mejores Disfraces Inflables de Halloween para Adultos en 2026: Risa y Éxito al Instante',
    slug: 'disfraces-inflables-halloween-adultos',
    cluster: 'Disfraces Express',
    recipient: 'adultos que buscan un disfraz divertido, cómodo y de gran impacto visual',
    focus: 'disfraces inflables para adultos con motor portátil',
    itemNames: [
      'Disfraz inflable de extraterrestre abduciendo a humano',
      'Traje inflable gigante de tiranosaurio Rex para adultos',
      'Disfraz inflable de jinete montando dinosaurio velociraptor',
      'Traje inflable de fantasma gigante con ojos iluminados',
      'Disfraz inflable de luchador de sumo con cinturón acolchado',
      'Traje inflable de tiburón devorador con aleta dorsal reforzada',
      'Disfraz inflable de vaquero montando toro salvaje',
      'Traje inflable de esqueleto bailarín con contraste neón',
      'Disfraz inflable de calabaza gigante con sonrisa iluminada',
      'Traje inflable de astronauta espacial con visera reflectante'
    ]
  },
  {
    day: '2026-10-21', time: '13:00:00',
    query: 'disfraces de halloween fáciles para mujer amazon prime',
    title: '10 Disfraces Fáciles de Halloween para Mujer con Entrega Rápida: Elegantes y Sin Complicaciones',
    slug: 'disfraces-halloween-faciles-mujer-prime',
    cluster: 'Disfraces Express',
    recipient: 'mujeres que buscan un look glamuroso, rápido y fácil de combinar',
    focus: 'disfraces fáciles de Halloween para mujer con entrega rápida',
    itemNames: [
      'Vestido midi gótico de encaje negro estilo Miércoles Addams',
      'Kimono largo de hechicera con mangas acampanadas y cinturón',
      'Set de orejas de gato en terciopelo con antifaz de encaje y cola',
      'Poncho elegante de esqueleto con estampado de encaje plateado',
      'Vestido terciopelo rojo vino estilo vampiresa inmortal',
      'Disfraz de diosa griega con diadema de laurel dorado y toga drapeada',
      'Conjunto retro de marinera pin-up con pañuelo al cuello',
      'Body de esqueleto con efecto glitter y guantes largos a juego',
      'Falda de tul multicapa en negro y naranja con luces estrelladas',
      'Sombrero artesanal de bruja moderna con flores secas y velo'
    ]
  },
  {
    day: '2026-10-21', time: '16:30:00',
    query: 'disfraces de halloween para hombres prácticos',
    title: '10 Disfraces Prácticos de Halloween para Hombres: Ideas Rápidas para Fiestas de Último Minuto',
    slug: 'disfraces-practicos-halloween-hombres',
    cluster: 'Disfraces Express',
    recipient: 'hombres que buscan vestirse con estilo sin complicaciones ni maquillaje pesado',
    focus: 'disfraces prácticos para hombres para fiestas de Halloween',
    itemNames: [
      'Camisa de leñador rústica con tirantes de cuero y hacha de espuma',
      'Chaqueta estilo gángster de los años 20 con sombrero fedora',
      'Máscara de calavera táctica de neopreno con pasamontañas térmico',
      'Camiseta estampada de rayos X con esqueleto hiperrealista',
      'Bata de laboratorio de científico loco con gafas de seguridad steampunk',
      'Set de detective clásico con gabardina ligera y pipa de utilería',
      'Chaqueta bomber de piloto aviador con parches militares bordados',
      'Túnica medieval de guerrero cruzado con capa desmontable',
      'Poncho tribal con máscara rústica de brujo chamán',
      'Conjunto de preso retro a rayas con esposas de metal vintage'
    ]
  },
  {
    day: '2026-10-21', time: '20:00:00',
    query: 'máscaras de halloween realistas entrega inmediata',
    title: 'Las 10 Máscaras de Halloween Más Realistas y Aterradoras para Comprar a Último Minuto',
    slug: 'mascaras-halloween-realistas-entrega-inmediata',
    cluster: 'Disfraces Express',
    recipient: 'fanáticos del terror que quieren asustar al instante sin disfraz completo',
    focus: 'máscaras realistas de látex para Halloween con envío rápido',
    itemNames: [
      'Máscara de látex premium de anciano arrugado hiperrealista',
      'Máscara de demonio rojo con cuernos estriados y colmillos afilados',
      'Máscara de payaso sangriento con pelo sintético despeinado',
      'Máscara LED de Purga con cable electroluminiscente de doble tono',
      'Máscara veneciana de médico de la peste con remaches metálicos',
      'Máscara de hombre lobo con mandíbula articulada que se mueve al hablar',
      'Máscara de calavera anatómica con textura de hueso envejecido',
      'Máscara alienígena de ojos negros profundos y piel translúcida',
      'Máscara de zombi infectado con heridas abiertas y piel putrefacta',
      'Máscara de espantapájaros siniestro cosida con arpillera auténtica'
    ]
  },

  // Day 2 - 22 Oct 2026 (Kits SFX & Boo Baskets)
  {
    day: '2026-10-22', time: '06:00:00',
    query: 'kits de maquillaje halloween sfx fáciles',
    title: 'Top 10 Kits de Maquillaje de Halloween y Heridas Falsas: Transfórmate en Minutos',
    slug: 'kits-maquillaje-halloween-sfx-faciles',
    cluster: 'Disfraces Express',
    recipient: 'quienes buscan crear caracterizaciones impactantes sin ser profesionales',
    focus: 'kits de maquillaje SFX y efectos especiales para Halloween',
    itemNames: [
      'Kit completo de cera para modelar cicatrices y piel desgarrada',
      'Bote de sangre falsa coagulada de secado rápido no manchante',
      'Paleta de pinturas al agua profesionales para Catrina y esqueleto',
      'Set de látex líquido para arrugas de envejecimiento y quemaduras',
      'Kit de colmillos de vampiro termoplásticos con adhesivo seguro',
      'Esponjas de punteado para crear hematomas y rozaduras realistas',
      'Tatuajes temporales de cicatrices quirúrgicas y puntos de sutura',
      'Delineadores neón UV que brillan en la oscuridad para discoteca',
      'Sellador fijador en spray de maquillaje de larga duración 16h',
      'Kit de maquillaje blanco teatral opaco para payasos y fantasmas'
    ]
  },
  {
    day: '2026-10-22', time: '09:30:00',
    query: 'boo basket ideas para novia',
    title: 'Cómo Armar la Boo Basket Perfecta para tu Novia: 12 Regalos Tiernos y Spooky que Le Fascinarán',
    slug: 'boo-basket-ideas-para-novia',
    cluster: 'Boo Baskets & Cestas',
    recipient: 'tu novia o prometida para sorprenderla con la tendencia viral de otoño',
    focus: 'ideas para armar una Boo Basket para novia con detalles acogedores',
    itemNames: [
      'Canasta rústica de mimbre negro forrada con tela de cuadros otoñales',
      'Taza térmica con forma de fantasma sonriente en cerámica pastel',
      'Vela de soja perfumada con aroma a galletas de calabaza y canela',
      'Manta de franela supersuave con estampado de murciélagos rosados',
      'Calcetines térmicos mullidos con orejitas de gato negro y antideslizante',
      'Set de mascarillas faciales hidratantes temáticas de Halloween',
      'Bálsamo labial orgánico sabor pumpkin spice latte con envase gótico',
      'Libro de misterio romántico bestseller encuadernado en tapa dura',
      'Chocolates artesanales belgas con formas de calabaza rellenas de praliné',
      'Gorro beanie de punto grueso en tono naranja caldera con parche spooky',
      'Peluche ultraesponjoso de fantasma con corazón bordado',
      'Cadena de luces LED de hadas con mini calabazas cálidas a batería'
    ]
  },
  {
    day: '2026-10-22', time: '13:00:00',
    query: 'boo basket para novio que regalar',
    title: '10 Ideas Geniales para Llenar una Boo Basket de Hombre: Regalos de Halloween para tu Novio',
    slug: 'boo-basket-para-novio-ideas',
    cluster: 'Boo Baskets & Cestas',
    recipient: 'tu novio o esposo con gustos por el cine de terror, snacks y confort',
    focus: 'regalos para llenar una canasta de Halloween para novio',
    itemNames: [
      'Caja organizadora de madera rústica quemada con broche metálico',
      'Sudadera con capucha negra oversized con gráfico retro de película de culto',
      'Vaso térmico de acero inoxidable negro mate para café y bebidas frías',
      'Paquete surtido de salsas picantes artesanales con chiles habanero y fantasma',
      'Gominolas ácidas gourmet y palomitas de maíz con caramelo y calabaza',
      'Juego de dados poliedricos con motivos de calavera para rol o mesa',
      'Vela aromática masculina con esencia de madera de cedro, tabaco y ámbar',
      'Abrebotellas de hierro forjado macizo con diseño de garra esquelética',
      'Calcetines divertidos de algodón con estampados de monstruos clásicos',
      'Gorra de béisbol con bordado minimalista de Jack O Lantern en hilo naranja'
    ]
  },
  {
    day: '2026-10-22', time: '16:30:00',
    query: 'boo basket para niños ideas baratas',
    title: '12 Detalles Mágicos para Crear una Boo Basket Infantil sin Gastar de Más',
    slug: 'boo-basket-para-ninos-ideas-economicas',
    cluster: 'Boo Baskets & Cestas',
    recipient: 'niños pequeños y escolares para festejar Halloween con ilusión',
    focus: 'detalles económicos y seguros para canastas de Halloween para niños',
    itemNames: [
      'Cubeta de calabaza clásica naranja con asa reforzada para dulces',
      'Libro infantil interactivo de pegatinas reutilizables de monstruos',
      'Juguetes squishy antiestrés con formas de fantasma y calabaza',
      'Pulseras de silicona fosforescentes que brillan en la oscuridad',
      'Pijama enterizo de esqueleto que brilla tras exponerse a la luz',
      'Cortadores de galletas temáticos para cocinar en familia',
      'Set de sellos de tinta lavable con caritas de brujas y murciélagos',
      'Peluche sonajero de murciélago con alas de terciopelo crujiente',
      'Vaso infantil antiderrames con pajita y purpurina flotante de murciélagos',
      'Burbujero manual con varita mágica iluminada de Halloween',
      'Lápices flexibles con borradores gigantes desmontables de monstruos',
      'Lámpara quitamiedos de silicona recargable con forma de fantasma suave'
    ]
  },
  {
    day: '2026-10-22', time: '20:00:00',
    query: 'tazas de halloween y termos pumpkin spice',
    title: 'Las 10 Tazas de Halloween Más Originales para Fanáticos del Pumpkin Spice y el Café',
    slug: 'tazas-halloween-termos-pumpkin-spice',
    cluster: 'Boo Baskets & Cestas',
    recipient: 'amantes del café matutino, tés otoñales y fanáticos del Pumpkin Spice',
    focus: 'tazas cerámicas y termos temáticos de Halloween para regalar',
    itemNames: [
      'Taza de cerámica con forma de caldera de bruja esmaltada en negro brillo',
      'Taza escultórica con relieve de fantasma 3D que abraza la taza',
      'Taza térmica de viaje aislada con grabado de Jack-o-Lantern',
      'Taza que cambia de color con la temperatura revelando una escena gótica',
      'Vaso de vidrio con tapa de bambú y pajita de cristal para café helado',
      'Taza de calabaza con tapa extraíble para mantener infusiones calientes',
      'Taza de porcelana con estampado de calaveras mexicanas policromadas',
      'Juego de dos tazas para parejas con la frase "His Boo & Her Ghoul"',
      'Taza con platillo con forma de ataúd y cuchara de hueso plateada',
      'Termo de acero inoxidable con purpurina degradada en negro y naranja'
    ]
  },

  // Day 3 - 23 Oct 2026 (Cozy Spooky & Decoración Express)
  {
    day: '2026-10-23', time: '06:00:00',
    query: 'velas aromáticas de otoño y halloween',
    title: '10 Velas Aromáticas de Calabaza y Especias de Otoño para Ambientar tu Hogar con Estilo',
    slug: 'velas-aromaticas-calabaza-halloween',
    cluster: 'Boo Baskets & Cestas',
    recipient: 'quienes disfrutan de la aromaterapia y los hogares cálidos en otoño',
    focus: 'velas de cera de soja con aromas de calabaza, canela y especias',
    itemNames: [
      'Vela de cera de soja en tarro de ámbar con mecha de madera crujiente',
      'Vela escultórica con forma de calabaza acanalada en cera natural de abejas',
      'Vela en caldero metálico negro con aroma a manzana asada y sidra caliente',
      'Set de 4 mini velas votivas con fragancias clásicas de otoño estadounidense',
      'Vela aromática de vainilla negra, nuez moscada y corteza de canela',
      'Vela en vaso de vidrio esmerilado con etiqueta ilustrada vintage de botica',
      'Lámpara calentadora de velas eléctrica sin llama para máxima seguridad',
      'Vela de tres mechas de larga duración con notas de calabaza caramelizada',
      'Vela de masaje relajante con manteca de karité e infusión de naranja dulce',
      'Campana de cristal con base de madera oscura para proteger velas de colección'
    ]
  },
  {
    day: '2026-10-23', time: '09:30:00',
    query: 'pijamas y calcetines de halloween para regalo',
    title: '10 Pijamas y Calcetines Acogedores de Halloween: El Regalo Cómodo Ideal para Octubre',
    slug: 'pijamas-calcetines-acogedores-halloween',
    cluster: 'Boo Baskets & Cestas',
    recipient: 'quienes adoran pasar el fin de semana abrigados viendo películas de terror',
    focus: 'pijamas temáticos y calcetines cálidos de Halloween para regalar',
    itemNames: [
      'Pijama de dos piezas en algodón modal con estampado sutil de calabacitas',
      'Mono enterizo con capucha de murciélago y forro polar afelpado',
      'Pack de 5 pares de calcetines de lana merino con motivos vintage de Halloween',
      'Pantalón de pijama a cuadros franela roja y negra con cintura elástica',
      'Zapatillas de andar por casa con forma de fantasma mullido y suela de goma',
      'Camisón largo de algodón orgánico con encaje estilo gótico victoriano',
      'Calcetines altos por encima de la rodilla a rayas negras y moradas',
      'Bata kimono corta en satén negro con bordado dorado de fases lunares',
      'Conjunto térmico interior con costuras planas para noches frías de otoño',
      'Pantuflas térmicas con plantilla de viscoelástica y diseño de calabaza sonriente'
    ]
  },
  {
    day: '2026-10-23', time: '13:00:00',
    query: 'kits de decoracion trunk or treat para carros',
    title: '10 Kits de Decoración Trunk or Treat para Carros: Decora tu Cajuela en 15 Minutos',
    slug: 'kits-decoracion-trunk-or-treat-carros',
    cluster: 'Fiestas & Decoración',
    recipient: 'familias y maestros que participan en eventos escolares de Trunk or Treat',
    focus: 'kits completos para decorar cajuelas de autos para Halloween',
    itemNames: [
      'Kit de monstruo gigante con dientes colmilludos y ojos saltones para maletero',
      'Decoración de boca de tiburón con lona resistente a la intemperie',
      'Kit temático de castillo embrujado con torretas de cartón rígido y murciélagos',
      'Guirnalda de flecos brillantes y globos metalizados para portón trasero',
      'Kit de safari jurásico con vegetación artificial y cabeza de tiranosaurio',
      'Juego de telas de araña gigantes elásticas con arañas peludas de patas flexibles',
      'Tira de luces LED multicolor a batería con ventosas para cristales de auto',
      'Letrero magnético para carro con la leyenda "Trick or Treat Here"',
      'Cortina de lluvia metálica naranja y púrpura para fondo de maletero',
      'Kit de laboratorio científico con matraces inflables y tubos fluorescentes'
    ]
  },
  {
    day: '2026-10-23', time: '16:30:00',
    query: 'decoracion de halloween exterior facil de instalar',
    title: '12 Adornos de Halloween para Exterior Fáciles de Instalar: Transforma tu Porche al Instante',
    slug: 'decoracion-halloween-exterior-facil-instalar',
    cluster: 'Fiestas & Decoración',
    recipient: 'dueños de casa que desean impresionar a los vecinos sin obras complicadas',
    focus: 'decoración de Halloween para jardín y porche de instalación rápida',
    itemNames: [
      'Red de telaraña gigante triangular de 5 metros con estacas para césped',
      'Esqueleto articulado de tamaño real de 1,60 m con articulaciones posables',
      'Set de 6 lápidas de espuma de alta densidad con estacas metálicas reforzadas',
      'Proyector de luces LED dinámicas para fachada con patrones de fantasmas',
      'Brazos y piernas de zombi con estacas que simulan salir de la tierra',
      'Siluetas negras de gatos y brujas de metal para clavar en el jardín',
      'Calabaza inflable de 2 metros con ventilador silencioso y luces internas',
      'Guirnalda de luces solares impermeables con 50 mini globos oculares morados',
      'Corona fúnebre para puerta principal con rosas negras y ramas secas',
      'Brujas colgantes con sensores de sonido que emiten carcajadas en la brisa',
      'Focos LED RGB de estaca para iluminar árboles con tonos sangre y niebla',
      'Cadena de eslabones plásticos oxidados de 2 metros para barandillas'
    ]
  },
  {
    day: '2026-10-23', time: '20:00:00',
    query: 'maquinas de humo con luces para halloween',
    title: 'Las 8 Mejores Máquinas de Humo con Luces LED para Elevar tu Fiesta de Halloween',
    slug: 'maquinas-humo-luces-led-halloween',
    cluster: 'Fiestas & Decoración',
    recipient: 'anfitriones de fiestas que buscan crear una atmósfera de película de misterio',
    focus: 'máquinas de humo portátiles con iluminación LED para Halloween',
    itemNames: [
      'Máquina de humo de 500W con 3 luces LED RGB y control remoto inalámbrico',
      'Nebulizador ultrasónico para calderos con luces que cambian de color',
      'Máquina de niebla de baja densidad con depósito de 1 litro para exteriores',
      'Líquido para máquina de humo de alta densidad base agua no tóxico',
      'Generador de niebla compacto con mango portátil para disfraces y fotos',
      'Máquina de humo con temporizador programable automático para entradas',
      'Estroboscopio LED blanco potente de alta velocidad para sincronizar con humo',
      'Caldero plástico gigante con orificio premoldeado para difusor de niebla'
    ]
  },

  // Day 4 - 24 Oct 2026 (Fiestas & Escuela)
  {
    day: '2026-10-24', time: '06:00:00',
    query: 'accesorios de cocteleria y vasos calavera',
    title: '10 Accesorios de Coctelería Espeluznantes: Vasos de Calavera y Pociones para Noche de Brujas',
    slug: 'accesorios-cocteleria-vasos-calavera-halloween',
    cluster: 'Fiestas & Decoración',
    recipient: 'aficionados a la mixología y anfitriones de reuniones temáticas',
    focus: 'utensilios de bar y vasos temáticos de calavera para Halloween',
    itemNames: [
      'Decantador de whisky de cristal transparente en relieve de calavera anatómica',
      'Set de 4 vasos de chupito con interior de doble pared en forma de cráneo',
      'Molde de silicona prémium para cubitos de hielo gigantes con forma de calavera',
      'Coctelera Boston de acero inoxidable negro titanio con grabados esotéricos',
      'Copa de vino gótica sostenida por una mano de esqueleto de peltre pulido',
      'Varillas agitadoras de acero con figuras miniatura de murciélagos y cuervos',
      'Enfriador de botellas en forma de caldero de hierro fundido con asas',
      'Dispensador de bebidas de vidrio con grifo y soporte de pedestal victoriano',
      'Pajitas reutilizables de metal iridiscente con cepillo de limpieza',
      'Posavasos de piedra de pizarra natural grabados con símbolos alquímicos'
    ]
  },
  {
    day: '2026-10-24', time: '09:30:00',
    query: 'juegos de mesa de misterio para halloween',
    title: 'Los 10 Mejores Juegos de Mesa de Terror y Escape Room para Tu Fiesta de Adultos',
    slug: 'juegos-mesa-terror-escape-room-halloween',
    cluster: 'Fiestas & Decoración',
    recipient: 'grupos de amigos y amantes de los retos intelectuales y el misterio',
    focus: 'juegos de mesa de investigación, deducción y terror para fiestas',
    itemNames: [
      'Juego de misterio y asesinato sin resolver con expedientes policiales reales',
      'Juego cooperativo de escape room en caja temática de mansión embrujada',
      'Juego de mesa de supervivencia y traición en una colina misteriosa',
      'Juego de deducción rápida y cartas con hombres lobo y aldeanos',
      'Juego de terror cósmico lovecraftiano con miniaturas detalladas',
      'Party game de preguntas macabras y dilemas morales extremos para adultos',
      'Juego narrativo de cartas sobre leyendas urbanas con mecánica de faroleo',
      'Escape room de realidad aumentada controlado mediante aplicación móvil',
      'Juego de tablero de detectives victorianos investigando crímenes en la niebla',
      'Baraja de cartas de póker de diseño gótico con ilustraciones oscuras a mano'
    ]
  },
  {
    day: '2026-10-24', time: '13:00:00',
    query: 'calabazas con luces led para exteriores',
    title: '10 Calabazas con Luces LED y Temporizador para Iluminar tu Entrada sin Ensuciarte',
    slug: 'calabazas-luces-led-exteriores-halloween',
    cluster: 'Fiestas & Decoración',
    recipient: 'quienes desean iluminar su hogar sin el engorro de tallar calabazas naturales',
    focus: 'calabazas decorativas con luz LED a prueba de agua con temporizador',
    itemNames: [
      'Set de 3 calabazas cerámicas texturizadas con bombilla LED cálida integrada',
      'Calabaza de resina impermeable con mueca clásica de Halloween a pilas',
      'Guirnalda de 20 mini calabazas de vidrio con filamento vintage para balaustradas',
      'Calabaza metálica perforada con diseño marroquí que proyecta sombras arabescas',
      'Calabaza apilable de tres alturas con iluminación intermitente suave',
      'Luces sumergibles a prueba de agua con control remoto para colocar en calabazas',
      'Calabaza rústica de madera tallada con panel de iluminación posterior suave',
      'Calabaza decorativa de terciopelo con tallo dorado para mesas de centro',
      'Farolillo estilo candil antiguo con vela LED parpadeante y silueta de calabaza',
      'Calabaza de cristal ahumado mercurizado con luces microled de hilo de cobre'
    ]
  },
  {
    day: '2026-10-24', time: '16:30:00',
    query: 'bolsas de dulces para halloween por mayor',
    title: '10 Paquetes de Bolsitas de Dulces y Sorpresas de Halloween al por Mayor para la Escuela',
    slug: 'bolsas-dulces-halloween-por-mayor-escuela',
    cluster: 'Escuela & Niños',
    recipient: 'profesores, coordinadores escolares y padres que preparan goodie bags',
    focus: 'bolsitas y cajas para empaquetar dulces de Halloween al por mayor',
    itemNames: [
      'Pack de 100 bolsas de celofán transparente con lazos de alambre temáticos',
      'Cajas de cartón automontables con asas de fiesta de monstruos (pack de 48)',
      'Bolsas de papel kraft rústico con sellos de murciélago y calabaza (pack de 50)',
      'Bolsitas de tela no tejida reutilizables con asas resistentes (pack de 36)',
      'Bolsas tipo cono para palomitas y chucherías con motivos de telaraña',
      'Cajitas con forma de ataúd negro mate para detalles pequeños (pack de 24)',
      'Pegatinas redondas de cierre para bolsas con frases divertidas de "Trick or Treat"',
      'Minicalderos plásticos negros en lote de 24 unidades para rellenar de golosinas',
      'Bolsitas holográficas con cierre zip hermético y ventana transparente',
      'Etiquetas de regalo de cartulina negra con cordel de yute para personalizar nombres'
    ]
  },
  {
    day: '2026-10-24', time: '20:00:00',
    query: 'juguetes de halloween que no son dulces',
    title: '12 Regalos de Halloween Sin Azúcar para Niños: Alternativas Divertidas para Trick-or-Treat',
    slug: 'juguetes-halloween-sin-azucar-trick-or-treat',
    cluster: 'Escuela & Niños',
    recipient: 'familias que apoyan el movimiento Teal Pumpkin y buscan alternativas saludables',
    focus: 'juguetes no comestibles y sorpresas seguras para repartir en Halloween',
    itemNames: [
      'Pack de 72 anillos luminosos LED de silicona con formas de arañas y calabazas',
      'Brazaletes de bofetada con estampados acolchados de monstruos (lote de 30)',
      'Burbujeros individuales temáticos con tapas de personajes de Halloween',
      'Figuritas antiestrés de gomaespuma blanda de rebote lento (pack de 24)',
      'Varitas luminosas químicas glow sticks con conectores para pulseras y collares',
      'Set de sellos estampadores automáticos infantiles con tintas de colores vivos',
      'Gomas de borrar 3D desmontables coleccionables de temática terrorífica',
      'Libritos de colorear de bolsillo con minicajas de 4 ceras de colores',
      'Yo-yos pequeños de plástico con luces dinámicas al girar',
      'Resortes mágicos tipo slinky con caritas de calabaza sonriente',
      'Plantillas para pintar con purpurina y esponjas con figuras de Halloween',
      'Monedas doradas piratas de plástico con calavera grabada para cazas del tesoro'
    ]
  },

  // Day 5 - 25 Oct 2026 (Seguridad & Mascotas)
  {
    day: '2026-10-25', time: '06:00:00',
    query: 'cubetas de calabaza y bolsas reflectantes',
    title: 'Las 10 Mejores Bolsas y Cubetas Luminosas para Pedir Dulces con Seguridad en Halloween',
    slug: 'bolsas-cubetas-luminosas-pedir-dulces-halloween',
    cluster: 'Escuela & Niños',
    recipient: 'padres que priorizan la visibilidad nocturna y la comodidad de sus hijos',
    focus: 'bolsas reflectantes y cubetas con luces para pedir dulces seguros',
    itemNames: [
      'Bolsa de lona resistente con bandas reflectantes de alta visibilidad 360°',
      'Cubeta de plástico con borde LED luminoso recargable por USB',
      'Saco de tela personalizado para recoger caramelos con asa ergonómica',
      'Bolsa tote de poliéster ligero con estampado que brilla en la noche tras cargarse',
      'Mochila infantil tipo saco impermeable con cordones dobles de seguridad',
      'Balde plegable de silicona con iluminación interior para fácil almacenaje',
      'Clip de luz LED intermitente de seguridad para enganchar a mochilas y disfraces',
      'Bolsa con purpurina holográfica de gran capacidad y costuras dobles reforzadas',
      'Cubeta metálica esmaltada con asa de madera estilo granja tradicional',
      'Bolsa térmica aislada para mantener aperitivos y bebidas frescas en la caminata'
    ]
  },
  {
    day: '2026-10-25', time: '09:30:00',
    query: 'disfraces de halloween para bebes comodos',
    title: '10 Disfraces de Halloween Tiernos y Cómodos para Bebés y Toddlers con Entrega Inmediata',
    slug: 'disfraces-halloween-bebes-toddlers-comodos',
    cluster: 'Escuela & Niños',
    recipient: 'bebés de 0 a 24 meses y sus familias para su primera noche de brujas',
    focus: 'disfraces de algodón suave y fáciles de abrochar para bebés',
    itemNames: [
      'Pelele de una pieza con forma de calabaza sonriente y gorrito a juego',
      'Enterizo de murciélago en forro polar con alas cosidas bajo los brazos',
      'Disfraz de pequeño león de la selva con capucha de melena aterciopelada',
      'Body de algodón 100% orgánico con estampado de esqueleto y botones a presión',
      'Mameluco acolchado de dinosaurio verde menta con crestas de fieltro suave',
      'Vestido tutu infantil de brujita buena con cinturilla elástica sin rozaduras',
      'Saco de dormir para recién nacido estilo momia con cremallera frontal segura',
      'Disfraz de aguacate tierno con panza rellena acolchada para fotos',
      'Mono de monstruito azul peludo con pies antideslizantes integrados',
      'Gorro tejido a crochet de calabaza artesanal para recién nacidos'
    ]
  },
  {
    day: '2026-10-25', time: '13:00:00',
    query: 'detalles de halloween para maestras',
    title: '10 Ideas de Regalos de Halloween para Maestras: Detalles Útiles, Dulces y Temáticos',
    slug: 'regalos-halloween-para-maestras-ideas',
    cluster: 'Escuela & Niños',
    recipient: 'maestras de kínder y primaria para agradecer su esfuerzo en octubre',
    focus: 'detalles de agradecimiento útiles y elegantes para maestras',
    itemNames: [
      'Vaso térmico con tapa y pajita decorado con la frase "Teacher Boo Crew"',
      'Tarjetero para credencial escolar con cordón de cinta temático y colgante',
      'Caja surtida de tés e infusiones otoñales con notas de canela y manzana',
      'Bolsa de mano tote bag de lona resistente para llevar cuadernos y material',
      'Set de bolígrafos de gel con tintas de secado rápido y carcasas de calabaza',
      'Crema de manos nutritiva con aroma de vainilla otoñal y manteca de cacao',
      'Libreta de notas con encuadernación de espiral y portada ilustrada de brujitas',
      'Estuche portalápices organizador de escritorio con diseño de gato negro',
      'Tarjeta pop-up 3D cortada a láser con dedicatoria de agradecimiento escolar',
      'Galletas artesanales de mantequilla decoradas con glaseado real temático'
    ]
  },
  {
    day: '2026-10-25', time: '16:30:00',
    query: 'disfraces de halloween para perros faciles',
    title: '10 Disfraces de Halloween para Perros Cómodos y Fáciles de Poner: Diversión Garantizada',
    slug: 'disfraces-halloween-perros-comodos-faciles',
    cluster: 'Mascotas & Parejas',
    recipient: 'dueños de perros pequeños, medianos y grandes que buscan disfrazar a su mascota',
    focus: 'disfraces con cierres de velcro cómodos y seguros para perros',
    itemNames: [
      'Arnés con alas acolchadas de murciélago en fieltro ligero no invasivo',
      'Disfraz de muñeco asesino con brazos rellenos frontales y cuchillo de espuma',
      'Capa de vampiro roja y negra con cuello alzado ajustable al collar',
      'Camiseta de esqueleto de algodón elástico para perros medianos y grandes',
      'Disfraz de león con melena de piel sintética suave para perros medianos',
      'Traje de repartidor de paquetería con cajita falsa sostenida al frente',
      'Gorro de calabaza con orejeras elásticas y cordón regulable a la barbilla',
      'Pañuelo bandana de doble faz con estampados de murciélagos y telarañas',
      'Disfraz de perrito caliente con panecillo y mostaza acolchado en los costados',
      'Collar luminoso de silicona resistente al agua recargable para paseos nocturnos'
    ]
  },
  {
    day: '2026-10-25', time: '20:00:00',
    query: 'disfraces de halloween para gatos comodos',
    title: '8 Disfraces y Alas de Murciélago Ligeras para Gatos que No les Molestan',
    slug: 'disfraces-alas-murcielago-para-gatos-halloween',
    cluster: 'Mascotas & Parejas',
    recipient: 'gatos curiosos y dueños que desean fotos tiernas sin estresar al felino',
    focus: 'accesorios superligeros y cómodos para gatos en Halloween',
    itemNames: [
      'Alas de murciélago de fieltro ultrafino con ajuste suave al pecho',
      'Gorro con forma de melena de león diminuta con cierre seguro de velcro',
      'Capa de conde Drácula miniatura con forro de raso sedoso no ruidoso',
      'Collar con cascabel de calabaza y pajarita naranja desmontable',
      'Disfraz de sombrero de brujita con elástico suave que no aprieta los bigotes',
      'Pañuelo bandana triangular de algodón transpirable con estampado de fantasmas',
      'Juguete catnip con forma de calabaza de peluche para que juegue en su fiesta',
      'Túnel de juegos plegable para gatos con estampado de Halloween y mirillas'
    ]
  },

  // Day 6 - 26 Oct 2026 (Parejas & Día de los Muertos)
  {
    day: '2026-10-26', time: '06:00:00',
    query: 'disfraces de halloween para parejas de ultimo minuto',
    title: '10 Disfraces de Halloween para Parejas de Último Minuto: Conjuntos Clásicos y Fáciles de Armar',
    slug: 'disfraces-halloween-parejas-ultimo-minuto',
    cluster: 'Mascotas & Parejas',
    recipient: 'parejas y dúos de amigos que buscan un atuendo coordinado y divertido',
    focus: 'disfraces a juego para parejas para fiestas de Halloween',
    itemNames: [
      'Conjunto coordinado de Gomez y Morticia Addams con vestidos de gala',
      'Disfraz clásico de enchufe y tomacorriente gigante de tela acolchada',
      'Pareja de ladrones de banco con antifaces negros, camisetas a rayas y sacos de dinero',
      'Atuendo de salero y pimentero gigante fáciles de poner sobre ropa de calle',
      'Set de doctor y enfermera zombi con manchas de pintura simulada',
      'Disfraz de barista y café con vaso gigante con logo de sirena',
      'Pareja de náufragos con ropa rasgada y flotador salvavidas decorado',
      'Capas a juego de vampiros victorianos en terciopelo rojo y negro',
      'Atuendos coordinados de cartas de baraja (Rey y Reina de Corazones)',
      'Conjunto retro de cazadores de fantasmas con mochilas inflables'
    ]
  },
  {
    day: '2026-10-26', time: '09:30:00',
    query: 'sudaderas de halloween a juego para parejas',
    title: '10 Sudaderas de Halloween a Juego para Parejas: El Look Cómodo y Spooky para Octubre',
    slug: 'sudaderas-halloween-parejas-a-juego',
    cluster: 'Mascotas & Parejas',
    recipient: 'parejas que prefieren la comodidad del loungewear temático sobre disfraces complejos',
    focus: 'sudaderas a juego de Halloween con algodón perchado y diseños bordados',
    itemNames: [
      'Pack de dos sudaderas con capucha bordadas con "Jack & Sally"',
      'Sudaderas a juego con fantasmitas tomados de la mano en el pecho',
      'Hoodies oversize con frase complementaria "Her Boo & His Ghoul"',
      'Sudaderas con cuello redondo en tono marrón moka con estampado vintage de calabaza',
      'Conjunto de sudaderas con estampado de esqueleto en las mangas al abrazarse',
      'Sudaderas con capucha negra y forro polar con dibujo de murciélagos minimalistas',
      'Sudaderas con estampado desgastado retro de noche de brujas estilo años 80',
      'Sudaderas unisex de mezcla de algodón y poliéster con bolsillo de canguro amplio',
      'Juego de sudaderas con iniciales bordadas en color naranja calabaza y telaraña',
      'Sudaderas estilo varsity deportiva con letras colegiales en tonos negro y naranja'
    ]
  },
  {
    day: '2026-10-26', time: '13:00:00',
    query: 'diademas de flores y accesorios de catrina dia de los muertos',
    title: '10 Diademas de Flores y Accesorios de Catrina para un Look Deslumbrante en Día de los Muertos',
    slug: 'diademas-flores-accesorios-catrina-dia-muertos',
    cluster: 'Día de los Muertos',
    recipient: 'quienes celebran la hermosa tradición del Día de los Muertos el 1 y 2 de noviembre',
    focus: 'diademas de flores de cempasúchil y accesorios de Catrina',
    itemNames: [
      'Diadema ancha de rosas rojas y flores de cempasúchil con velo de encaje negro',
      'Tatuajes temporales faciales de calavera de azúcar con glitter y gemas adhesivas',
      'Pendientes largos con dije de esqueleto danzante en metal dorado envejecido',
      'Collar gargantilla de encaje negro con camafeo de Catrina grabado',
      'Guantes largos de rejilla negra hasta el codo con aplicaciones florales',
      'Máscara de media cara de Catrina pintada a mano con cintas de satén',
      'Abanico plegable de encaje español con varillas caladas para fotos',
      'Corona de flores multicolor con calaveritas de resina incrustadas',
      'Horquillas para el pelo con minirrosas de tela y calaveritas de azúcar',
      'Falda tradicional mexicana de vuelo amplio con ribetes de encaje colorido'
    ]
  },
  {
    day: '2026-10-26', time: '16:30:00',
    query: 'velas led para altar de muertos en casa',
    title: '10 Elementos Esenciales y Velas LED Seguras para Armar tu Altar de Día de los Muertos',
    slug: 'elementos-esenciales-velas-led-altar-dia-muertos',
    cluster: 'Día de los Muertos',
    recipient: 'familias que arman su ofrenda en casa y buscan seguridad contra incendios',
    focus: 'velas LED sin llama y elementos esenciales para ofrendas del Día de los Muertos',
    itemNames: [
      'Pack de 12 velas votivas LED parpadeantes con luz ámbar cálida y temporizador',
      'Cirios LED de pilar recubiertos de cera real con mecha oscilante realista',
      'Guirnalda de flores de cempasúchil artificiales de seda de color naranja intenso',
      'Marcos portafotos dorados estilo barroco para honrar las fotografías de los ancestros',
      'Copitas de barro cocido tradicional mexicano para ofrendas de agua y sal',
      'Tapete de tela con diseño impreso de papel picado para base de ofrenda',
      'Calaveras de cerámica artesanal pintadas a mano en talavera poblana',
      'Cruz de madera rústica tallada con detalles tradicionales para el nivel superior',
      'Incensario cerámico seguro para conos de copal y mirra aromáticos',
      'Luces microled sumergibles a batería para vasijas con agua y pétalos'
    ]
  },
  {
    day: '2026-10-26', time: '20:00:00',
    query: 'papel picado y guirnaldas dia de los muertos',
    title: 'Top 8 Sets de Papel Picado Tradicional y Pancartas Coloridas para Tu Celebración',
    slug: 'sets-papel-picado-tradicional-dia-muertos',
    cluster: 'Día de los Muertos',
    recipient: 'quienes organizan eventos culturales, altares y fiestas conmemorativas',
    focus: 'papel picado tradicional mexicano de plástico y papel para decoración',
    itemNames: [
      'Tira de papel picado de plástico duradero impermeable de 5 metros para exteriores',
      'Guirnalda tradicional de papel picado de seda en colores vivos para interiores',
      'Pancarta con siluetas caladas de Catrinas, músicos mariachis y calaveras',
      'Set de banderines mini de mesa para decorar los niveles de la ofrenda',
      'Camino de mesa tejido estilo sarape mexicano con flecos de colores',
      'Flores de papel crepé hechas a mano en tonos morado, rosa y amarillo cempasúchil',
      'Faroles de papel plegables con diseños tradicionales de esqueletos festivos',
      'Mantel impermeable con estampado de alebrijes y flores de muertos'
    ]
  }
];

export { rawTopics };
