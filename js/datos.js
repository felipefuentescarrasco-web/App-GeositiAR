/* Datos del geoparque: geositios, georutas y glosario.
   Fuente: inventario de geositios y tabla de georutas de SERNAGEOMIN
   (Unidad de Geopatrimonio, proyecto GEOPARQUEMET, 2020). */

const UNIDADES = {
  OlMa: {
    sigla: 'OlMa',
    nombre: 'Formación Abanico',
    edad: 'Oligoceno – Mioceno temprano (~34 a 20 millones de años)',
    color: '#8d6a52',
    resumen: 'Rocas volcánicas y volcanoclásticas —sobre todo tobas— acumuladas en una cuenca ' +
      'que se hundía mientras un arco de volcanes hacía erupción. Forman la mayor parte del ' +
      'cerro San Cristóbal.'
  },
  Mh: {
    sigla: 'Mh',
    nombre: 'Intrusivos hipabisales',
    edad: 'Mioceno (~20 a 15 millones de años)',
    color: '#5d7a86',
    resumen: 'Magma que ascendió y se enfrió a poca profundidad dentro de las tobas de Abanico, ' +
      'sin llegar a la superficie. Da rocas de grano fino a medio, como la microdiorita.'
  },
  Qs: {
    sigla: 'Qs',
    nombre: 'Depósitos no consolidados',
    edad: 'Cuaternario (últimos 2,6 millones de años)',
    color: '#c9b48a',
    resumen: 'Suelo, gravas y sedimentos sueltos que cubren la roca en las laderas y en el ' +
      'llano de Santiago.'
  }
};

const GEOSITIOS = [
  {
    id: 'GPM01', num: 1, codigo: 'GST00001',
    nombre: 'Caída de bloques de roca volcánica',
    subtitulo: 'Cómo se suelta un bloque de un talud',
    lat: -33.4286, lon: -70.6374, alt: 590,
    ruta: 'r1', orden: 1,
    unidad: 'OlMa', litologia: 'Toba de lapilli andesítica', clase: 'Andesítica',
    interes: 'Fracturamiento y peligro geológico',
    valor: 'Didáctico',
    conservacion: 'Muy conservado',
    gancho: 'Un talud de 4 metros cortado por fracturas en todas direcciones: el manual de ' +
      'instrucciones de un derrumbe.',
    descripcion: 'Toba de lapilli andesítica de la Formación Abanico. Talud rocoso subvertical ' +
      'de 4 metros de altura con fracturas polidireccionales que generan cuñas con planos ' +
      'favorables para el deslizamiento de bloques.',
    claves: [
      'Busca los planos de fractura que se cruzan: donde dos o tres se juntan queda una cuña de roca suelta.',
      'Los bloques caídos al pie del talud son la prueba de que el proceso sigue activo.',
      'El agua de lluvia y las raíces meten presión dentro de las fracturas y las van abriendo.'
    ],
    observa: 'Mira la base del talud. Cada bloque acumulado ahí estuvo antes encajado arriba.',
    fotos: [
      { base: 'GST1.jpg', interp: 'GST1_interpretada.jpg',
        titulo: 'Talud fracturado',
        leyenda: 'Las líneas marcan los planos de fractura que aíslan cuñas de roca.' }
    ],
    modelo: { archivo: 'gst1.glb', titulo: 'Talud del geositio 1',
      nota: 'Modelo fotogramétrico del talud completo. Gíralo para seguir cada plano de ' +
        'fractura y usa el corte transparente para ver la geometría de las cuñas.' },
    glosario: ['toba', 'lapilli', 'andesita', 'fractura', 'talud', 'cuna']
  },
  {
    id: 'GPM02', num: 2, codigo: 'GST00002',
    nombre: 'Dique en rocas volcánicas',
    subtitulo: 'Una grieta que se llenó de magma',
    lat: -33.4265, lon: -70.6376, alt: 620,
    ruta: 'r1', orden: 2,
    unidad: 'Mh', litologia: 'Microdiorita', clase: 'Diorítica',
    interes: 'Intrusivo en rocas volcánicas',
    valor: 'Didáctico',
    conservacion: 'Muy conservado',
    gancho: 'Una banda de roca distinta cruza el afloramiento: magma que rellenó una grieta y ' +
      'se congeló ahí dentro.',
    descripcion: 'Intrusivo microdiorítico de cerca de un metro de espesor y con orientación ' +
      'N27E/55NW cortando tobas andesíticas de la Formación Abanico.',
    claves: [
      'El dique corta a la toba: por lo tanto es más joven que ella (principio de relaciones de corte).',
      'Mide poco más de un metro de espesor y se inclina 55° hacia el noroeste.',
      'El borde del dique es de grano más fino porque se enfrió rápido al tocar la roca fría.'
    ],
    observa: 'Sigue el dique con la vista ladera arriba y ladera abajo: es un plano, no una mancha.',
    fotos: [
      { base: 'GST2_1.jpg', interp: 'GST2_1_interpretada.jpg',
        titulo: 'El dique en el afloramiento',
        leyenda: 'En rojo, los dos contactos del dique con la toba de caja.' },
      { base: 'GST2_2.jpg', interp: 'GST2_2_interpretada.jpg',
        titulo: 'Detalle del contacto',
        leyenda: 'El cambio de color y de grano marca el borde enfriado del dique.' }
    ],
    modelo: { archivo: 'gst2.glb', titulo: 'Afloramiento del dique',
      nota: 'Gira el modelo para comprobar que el dique es un plano que atraviesa todo el afloramiento.' },
    glosario: ['dique', 'microdiorita', 'intrusivo', 'toba', 'manteo']
  },
  {
    id: 'GPM03', num: 3, codigo: 'GST00003',
    nombre: 'Vegetación, roca y suelo',
    subtitulo: 'De la roca dura a la tierra del cerro',
    lat: -33.4207, lon: -70.6377, alt: 655,
    ruta: 'r1', orden: 3,
    unidad: 'OlMa', litologia: 'Toba meteorizada', clase: 'Andesítica',
    interes: 'Meteorización y suelo',
    valor: 'Didáctico',
    conservacion: 'Muy conservado',
    gancho: 'La roca todavía conserva sus fracturas, pero se deshace con la mano: aquí nace el suelo.',
    descripcion: 'Roca meteorizada y descompuesta pero que conserva las fracturas. Estas se ' +
      'presentan abiertas a selladas, con pátinas de yeso y probablemente arcillas y escasos ' +
      'carbonatos. Los árboles aprovechan la debilidad del suelo y el espacio dejado por las ' +
      'fracturas para el desarrollo de su sistema de raíces.',
    claves: [
      'La roca conserva el "dibujo" de sus fracturas aunque ya esté descompuesta: es una roca fantasma.',
      'Las pátinas blancas en las fracturas son yeso y carbonatos precipitados por el agua.',
      'Las raíces siguen las fracturas y aceleran la desintegración de la roca.'
    ],
    observa: 'Compara la roca junto a un árbol con la de un sector despejado: la vegetación cambia el ritmo.',
    fotos: [
      { base: 'GST3_1.jpg', interp: 'GST3_1_interpretada.jpg',
        titulo: 'Roca descompuesta y raíces',
        leyenda: 'Trazado de las fracturas heredadas y del sistema radicular que las aprovecha.' },
      { base: 'GST3_2.jpg', interp: 'GST3_2_interpretada.jpg',
        titulo: 'Perfil roca–suelo',
        leyenda: 'Paso gradual desde la roca fracturada hasta el suelo con raíces.' }
    ],
    modelo: { archivo: 'gst3.glb', titulo: 'Afloramiento con raíces',
      nota: 'Modelo del talud donde las raíces se abren paso por las fracturas.' },
    glosario: ['meteorizacion', 'suelo', 'yeso', 'arcilla', 'fractura']
  },
  {
    id: 'GPM04', num: 4, codigo: 'GST00004',
    nombre: 'Cristales de piroxeno en roca intrusiva',
    subtitulo: 'Cristales que crecieron antes que el resto',
    lat: -33.4203, lon: -70.6379, alt: 650,
    ruta: 'r1', orden: 4,
    unidad: 'Mh', litologia: 'Microdiorita porfírica', clase: 'Diorítica',
    interes: 'Minerales (fenocristales) máficos en roca intrusiva',
    valor: 'Didáctico',
    conservacion: 'Conservado',
    gancho: 'Cristales negros de hasta 1,2 cm flotando en una masa de grano fino: dos velocidades ' +
      'de enfriamiento en una misma roca.',
    descripcion: 'Intrusivo microdiorítico con textura porfírica y fenocristales de 1-5 mm de ' +
      'plagioclasa (40%) con alteración pervasiva a arcillas, y piroxeno (10%) euhedral de 1 mm ' +
      'a 1,2 cm. Masa fundamental microcristalina muy alterada con microlitos de plagioclasa y ' +
      'probables microlitos de magnetita (leve magnetismo).',
    claves: [
      'Los cristales grandes (fenocristales) crecieron lento, en profundidad, dentro del magma.',
      'La masa fina que los rodea se enfrió rápido cuando el magma subió: textura porfírica.',
      'Los cristales oscuros y brillantes con caras planas son piroxeno; los blanquecinos, plagioclasa.'
    ],
    observa: 'Acerca la vista a una cara fresca: los piroxenos reflejan la luz como pequeños espejos.',
    fotos: [
      { base: 'GST4_1.jpg', interp: 'GST4_1_interpretada.jpg',
        titulo: 'Textura porfírica',
        leyenda: 'Fenocristales de piroxeno y plagioclasa destacados sobre la masa fundamental.' },
      { base: 'GST4_2.jpg', interp: 'GST4_2_interpretada.jpg',
        titulo: 'Detalle de fenocristales', leyenda: 'Cristales euhedrales de piroxeno.' },
      { base: 'GST4_5.jpg', interp: 'GST4_5_interpretada.jpg',
        titulo: 'Afloramiento', leyenda: 'Vista general de la microdiorita porfírica.' },
      { base: 'GST4_7.jpg', interp: 'GST4_7_interpretada.jpg',
        titulo: 'Cara fresca', leyenda: 'Contraste entre cara alterada y cara fresca de la roca.' }
    ],
    modelo: { archivo: 'gst4.glb', titulo: 'Bloque de microdiorita',
      nota: 'Acércate al modelo hasta ver los cristales de piroxeno.' },
    glosario: ['piroxeno', 'plagioclasa', 'fenocristal', 'porfirica', 'microdiorita', 'magnetita']
  },
  {
    id: 'GPM05', num: 5, codigo: 'GST00005',
    nombre: 'Descomposición de la roca en capas',
    subtitulo: 'La roca que se pela como cebolla',
    lat: -33.4202, lon: -70.6378, alt: 651,
    ruta: 'r1', orden: 5,
    unidad: 'Mh', litologia: 'Microdiorita porfírica', clase: 'Diorítica',
    interes: 'Meteorización esferoidal',
    valor: 'Didáctico',
    conservacion: 'Muy conservado',
    gancho: 'Capas concéntricas que se desprenden de un bloque redondeado: la roca se descompone ' +
      'desde afuera hacia adentro.',
    descripcion: 'Intrusivo microdiorítico con textura porfírica con claras estructuras ' +
      'concéntricas de exfoliación generadas por la meteorización de la roca.',
    claves: [
      'El agua ataca la roca por las fracturas, que forman una red de bloques cúbicos.',
      'Las esquinas de cada bloque se atacan por tres caras a la vez, así que se redondean primero.',
      'El resultado son cáscaras concéntricas alrededor de un núcleo aún sano.'
    ],
    observa: 'Busca un bloque partido: verás el núcleo gris fresco rodeado de capas pardas.',
    fotos: [
      { base: 'GST5_1.jpg', interp: 'GST5_1_interpretada.jpg',
        titulo: 'Meteorización esferoidal',
        leyenda: 'Capas concéntricas de exfoliación en torno al núcleo sano.' },
      { base: 'GST5_2.jpg', interp: 'GST5_2_interpretada.jpg',
        titulo: 'Bloques redondeados',
        leyenda: 'La red de fracturas define bloques que se redondean al meteorizarse.' }
    ],
    modelo: { archivo: 'gst5.glb', titulo: 'Bloques con exfoliación',
      nota: 'Gira el modelo para ver la forma de cebolla de los bloques.' },
    glosario: ['meteorizacion', 'exfoliacion', 'microdiorita', 'fractura']
  },
  {
    id: 'GPM06', num: 6, codigo: 'GST00006',
    nombre: 'Contacto de roca volcánica con roca intrusiva',
    subtitulo: 'La frontera entre dos mundos',
    lat: -33.4174, lon: -70.6275, alt: 710,
    ruta: 'r1', orden: 6,
    unidad: 'Mh', litologia: 'Contacto microdiorita / toba', clase: 'Mixta',
    interes: 'Contacto litológico',
    valor: 'Didáctico',
    conservacion: 'Alterado',
    gancho: 'A un lado, ceniza volcánica endurecida; al otro, magma solidificado bajo tierra. ' +
      'La línea que los separa es el contacto.',
    descripcion: 'Contacto intrusivo entre tobas de la Formación Abanico y la unidad ' +
      'microdiorita hipabisal.',
    claves: [
      'La toba (Formación Abanico) es la roca antigua; la microdiorita la intruyó después.',
      'Cerca del contacto la microdiorita es de grano más fino: se enfrió contra roca fría.',
      'Este contacto es el que explica las columnas del geositio 9, a pocos metros de aquí.'
    ],
    observa: 'Recorre el contacto con la mano: el cambio de textura se siente antes de verse.',
    fotos: [
      { base: 'GST6_1.jpg', interp: 'GST6_1_interpretada.jpg',
        titulo: 'El contacto',
        leyenda: 'Trazado del contacto entre la toba (izquierda) y el intrusivo (derecha).' },
      { base: 'GST6_2.jpg', interp: 'GST6_2_interpretada.jpg',
        titulo: 'Vista general', leyenda: 'El contacto recorre todo el afloramiento.' },
      { base: 'GST6_3.jpg', interp: 'GST6_3_interpretada.jpg',
        titulo: 'Detalle', leyenda: 'Borde enfriado del intrusivo contra la toba.' }
    ],
    modelo: { archivo: 'gst6.glb', titulo: 'Afloramiento del contacto',
      nota: 'Usa el corte transparente: el contacto es una superficie, no una línea.' },
    glosario: ['contacto', 'intrusivo', 'toba', 'microdiorita', 'hipabisal']
  },
  {
    id: 'GPM07', num: 7, codigo: 'GST00007',
    nombre: 'Toba soldada',
    subtitulo: 'Pómez aplastadas por su propio calor',
    lat: -33.4171, lon: -70.6254, alt: 716,
    ruta: 'r1', orden: 7,
    unidad: 'OlMa', litologia: 'Toba soldada andesítica', clase: 'Andesítica',
    interes: 'Textura de roca piroclástica',
    valor: 'Didáctico',
    conservacion: 'Alterado',
    gancho: 'Manchas alargadas y oscuras, como llamas: son trozos de pómez aplastados cuando el ' +
      'depósito todavía estaba al rojo.',
    descripcion: 'Toba soldada andesítica de la Formación Abanico con estructuras de fiamme de ' +
      'hasta 17,5 cm de largo y espesor de hasta 2,5 cm. Las fiamme presentan orientaciones ' +
      'entre N20°W y N10°W y manteo entre 22° y 35° al NE.',
    claves: [
      'Los fiamme son pómez aplastadas por el peso del propio depósito caliente.',
      'Su forma achatada define un plano: sirve para saber cómo quedó depositada la unidad.',
      'Aquí ese plano se inclina entre 22° y 35° hacia el noreste.'
    ],
    observa: 'Los fiamme son paralelos entre sí. Esa orientación común es un dato estructural.',
    fotos: [
      { base: 'GST7_1.jpg', interp: 'GST7_1_interpretada.jpg',
        titulo: 'Fiamme en la toba',
        leyenda: 'Contorno de los fiamme y su orientación preferente.' },
      { base: 'GST7_2.jpg', interp: 'GST7_2_interpretada.jpg',
        titulo: 'Detalle de un fiamme', leyenda: 'Pómez aplastada de hasta 17,5 cm de largo.' }
    ],
    modelo: { archivo: 'gst7.glb', titulo: 'Afloramiento de toba soldada',
      nota: 'Acércate para reconocer los fiamme sobre la superficie del modelo.' },
    pano: { base: 'GST7_360.jpg', interp: 'GST7_360_interpretada.jpg',
      titulo: 'Panorámica del afloramiento',
      leyenda: 'Arrastra para mirar alrededor. Activa la capa interpretada para ver el análisis.' },
    glosario: ['fiamme', 'pomez', 'toba', 'soldamiento', 'piroclastico', 'manteo']
  },
  {
    id: 'GPM08', num: 8, codigo: 'GST00008',
    nombre: 'Roca de la piscina Tupahue',
    subtitulo: 'La roca que cambió el plano del arquitecto',
    lat: -33.4159, lon: -70.6238, alt: 700,
    ruta: 'r1', orden: 8, tambienRuta: 'r2',
    unidad: 'OlMa', litologia: 'Toba de ceniza cristalina', clase: 'Andesítica',
    interes: 'Fracturamiento, textura y color de la roca volcánica',
    valor: 'Recreacional',
    conservacion: 'Muy conservado',
    proteccion: 'Monumento Nacional, categoría Zona Típica',
    gancho: 'Apareció al fondo de una cantera y era tan bella que rediseñaron la piscina para ' +
      'dejarla adentro.',
    descripcion: 'Las rocas de la piscina corresponden a una toba de ceniza cristalina de la ' +
      'Formación Abanico. Presenta algunos fragmentos líticos y pómez aplastadas, lo que indica ' +
      'algún grado de soldamiento. Su coloración es gris violáceo a rojiza, dada por una matriz ' +
      'afanítica donde se insertan cristales de plagioclasa de hasta 3 mm y, en menor número, ' +
      'fragmentos líticos de hasta 15 mm.\n\nEl diseño de la piscina Tupahue se realizó in situ ' +
      'y no consideraba originalmente la roca en su interior. Esta fue incluida tras despejar el ' +
      'terreno del material movilizado por las labores de la cantera y encontrarse con ella en el ' +
      'fondo. Dado su tamaño y belleza, se decidió modificar el diseño incluyendo la roca.',
    claves: [
      'Las caras planas del bloque no son cortes de cantera: son planos de falla y fractura naturales.',
      'Los planos principales tienen dirección promedio N30°O y son subverticales.',
      'Es una roca resistente (clase R4): resiste entre 50 y 100 MPa de compresión.'
    ],
    observa: 'En algunas caras aún se reconocen estrías: marcas del movimiento de la falla.',
    estructura: 'La roca se divide en dos bloques. Las caras planas corresponden a fracturas, ' +
      'algunas con indicadores de dirección de movimiento degradados pero reconocibles. Las ' +
      'fracturas conjugadas configuran cuñas de hasta 1 metro que, por su grado de apertura, ' +
      'podrían desprenderse hacia el interior de la piscina.',
    geotecnia: 'Clase R4 (Brown, 1981): requiere de 2 a 3 golpes de martillo para fracturarse; ' +
      'resistencia a la compresión uniaxial estimada entre 50 y 100 MPa.',
    fotos: [
      { base: 'GST8_1.jpg', interp: 'GST8_1_interpretada.jpg',
        titulo: 'El bloque en la piscina',
        leyenda: 'Planos de falla y fracturas conjugadas que definen las caras del bloque.' },
      { base: 'GST8_2.jpg', interp: 'GST8_2_interpretada.jpg',
        titulo: 'Caras y cuñas', leyenda: 'Cuñas de roca definidas por fracturas conjugadas.' },
      { base: 'GST8_3.jpg', interp: 'GST8_3_interpretada.jpg',
        titulo: 'Vista desde el agua', leyenda: 'El bloque mayor y el menor.' }
    ],
    muestra: { base: 'GST8_MuestraMano.jpg', interp: 'GST8_MuestraMano_interpretada.jpg',
      titulo: 'Muestra de mano',
      leyenda: 'Toba de ceniza cristalina: matriz afanítica con cristales de plagioclasa y líticos.' },
    glosario: ['toba', 'plagioclasa', 'litico', 'fiamme', 'falla', 'estria', 'afanitica']
  },
  {
    id: 'GPM09', num: 9, codigo: 'GST00009',
    nombre: 'Columnas de roca intrusiva en Av. Pedro Bannen',
    subtitulo: 'El magma se agrietó al enfriarse',
    lat: -33.4183, lon: -70.6282, alt: 762,
    ruta: 'r2', orden: 4,
    unidad: 'Mh', litologia: 'Microdiorita', clase: 'Diorítica',
    interes: 'Estructuras de enfriamiento en rocas hipabisales',
    valor: 'Didáctico',
    conservacion: 'Muy conservado',
    gancho: 'Columnas de 5 o 6 metros con caras de 4 a 6 lados, creciendo perpendiculares al ' +
      'contacto con la roca fría.',
    descripcion: 'Intrusivo microdiorítico con textura porfírica con cristales de plagioclasa ' +
      '(60%) de 0,1-2 mm, anfíbol (7%) de 1 mm promedio y opacos (probablemente magnetita, 5%). ' +
      'La roca presenta un fuerte magnetismo.\n\nSe observan columnas de disyunción de ' +
      'aproximadamente 5 a 6 m de largo y diámetro promedio de 0,3 m, con caras basales de entre ' +
      '4 y 6 lados. Estas columnas se presentan en las cercanías del contacto entre la roca ' +
      'volcánica y el intrusivo y se generan por enfriamiento del magma en las cercanías del ' +
      'contacto con la roca volcánica fría. Las columnas crecen de manera perpendicular a la zona ' +
      'de contacto y las fracturas se propagan desde el contacto hacia el interior del magma en ' +
      'la medida en que este se va enfriando.',
    claves: [
      'Al enfriarse, el magma se contrae y se agrieta en polígonos, igual que el barro seco.',
      'Cada polígono se prolonga en profundidad y forma una columna.',
      'Las columnas crecen perpendiculares a la superficie que enfría, así que apuntan al contacto.'
    ],
    observa: 'Cuenta los lados de una cara basal: casi siempre son 5 o 6. La roca es magnética; ' +
      'una brújula puede desviarse cerca de ella.',
    fotos: [
      { base: 'PM43_IMG_6710.jpg', interp: 'PM43_IMG_6710_interpretada.jpg',
        titulo: 'Columnas en el talud',
        leyenda: 'Trazado de los ejes de las columnas y de sus caras basales.' },
      { base: 'PM43_IMG_6858.jpg', interp: 'PM43_IMG_6858_interpretada.jpg',
        titulo: 'Sección de las columnas', leyenda: 'Caras basales de 4 a 6 lados.' },
      { base: 'PM43_IMG_6860.jpg', interp: 'PM43_IMG_6860_interpretada.jpg',
        titulo: 'Conjunto columnar', leyenda: 'Las columnas apuntan hacia la zona de contacto.' }
    ],
    modelo: { archivo: 'gst9.glb', titulo: 'Columnas de disyunción',
      nota: 'Modelo fotogramétrico de la pared de columnas. El corte transparente permite ' +
        'ver su sección poligonal.' },
    pano: { base: 'GST9_360.jpg', interp: 'GST9_360_interpretada.jpg',
      titulo: 'Panorámica de las columnas',
      leyenda: 'Mira hacia arriba para ver el largo completo de las columnas.' },
    glosario: ['disyuncion', 'microdiorita', 'anfibol', 'plagioclasa', 'magnetita', 'contacto', 'hipabisal']
  },
  {
    id: 'GPM10', num: 10, codigo: 'GST00010',
    nombre: 'Marcas de movimiento en fracturas',
    subtitulo: 'La huella de un terremoto antiguo',
    lat: -33.4180, lon: -70.6269, alt: 761,
    ruta: 'r2', orden: 3,
    unidad: 'OlMa', litologia: 'Toba de lapilli andesítica', clase: 'Andesítica',
    interes: 'Indicadores cinemáticos en planos de falla',
    valor: 'Didáctico',
    conservacion: 'Alterado',
    gancho: 'Las estrías sobre el plano de falla indican en qué dirección se movió un bloque ' +
      'respecto del otro.',
    descripcion: 'Roca de origen piroclástico, con presencia de líticos y cristales rotos de ' +
      'plagioclasa principalmente, alterados a arcilla. Afloramiento altamente fracturado y ' +
      'meteorizado. Plano de fractura N34°W subvertical, con estrías de rake 2,9°.',
    claves: [
      'Las estrías son rayas paralelas grabadas cuando los bloques rozaron entre sí.',
      'Un rake de casi 0° indica un movimiento prácticamente horizontal: falla de rumbo.',
      'El plano tiene dirección N34°O y es subvertical.'
    ],
    observa: 'Pon la luz del teléfono rasante sobre la superficie: las estrías aparecen de golpe.',
    estructura: 'Plano de fractura N34°W subvertical; rake de las estrías 2,9°.',
    modelo: { archivo: 'gst10.glb', titulo: 'Plano estriado',
      nota: 'Ilumina el modelo desde distintos ángulos para resaltar las estrías.' },
    glosario: ['estria', 'falla', 'rake', 'toba', 'lapilli']
  },
  {
    id: 'GPM11', num: 11, codigo: 'GST00011',
    nombre: 'Columnas de roca en Casa de las Arañas',
    subtitulo: 'Otra vez columnas, otra vez enfriamiento',
    lat: -33.4227, lon: -70.6324, alt: 828,
    ruta: 'r2', orden: 2,
    unidad: 'OlMa', litologia: 'Toba de lapilli andesítica', clase: 'Andesítica',
    interes: 'Estructuras de enfriamiento',
    valor: 'Didáctico',
    conservacion: 'Conservado',
    gancho: 'Roca densa y resistente, de color gris verdoso oscuro, con capas blancas de calcita ' +
      'en sus fracturas.',
    descripcion: 'Textura levemente porfírica. Fenocristales de tamaño promedio 1 mm: plagioclasa ' +
      '(20%), anfíbol (10%) y opacos, probablemente magnetita (5%), con borde de oxidación. Masa ' +
      'fundamental microcristalina equigranular.',
    claves: [
      'Color gris verdoso oscuro en la cara exterior y gris verdoso claro en cara fresca.',
      'En las fracturas hay capas blancas de calcita precipitada por circulación de agua.',
      'Es una roca de gran densidad y resistencia.'
    ],
    observa: 'Compara el color de una cara expuesta con el de una recién rota: es la misma roca.',
    alteracion: 'Color gris verdoso oscuro en cara exterior, localmente con capas blancas de ' +
      'calcita; gris verdoso claro en cara fresca.',
    glosario: ['calcita', 'anfibol', 'plagioclasa', 'toba', 'lapilli', 'porfirica']
  },
  {
    id: 'GPM12', num: 12, codigo: 'GST00012',
    nombre: 'Rocas intrusivas en la cumbre del San Cristóbal',
    subtitulo: 'El techo del parque, sobre roca intrusiva',
    lat: -33.4255, lon: -70.6332, alt: 847,
    ruta: 'r2', orden: 1,
    unidad: 'Mh', litologia: 'Microdiorita porfírica', clase: 'Diorítica',
    interes: 'Roca intrusiva en la cumbre',
    valor: 'Didáctico / panorámico',
    conservacion: 'Conservado',
    gancho: 'La cumbre se mantiene alta porque está hecha de la roca más dura del cerro: el intrusivo.',
    descripcion: 'Textura porfírica con fenocristales de 1-5 mm de plagioclasa (40%) con ' +
      'alteración pervasiva a arcillas y piroxeno (10%) euhedral de 1 mm a 1,2 cm. Masa ' +
      'fundamental microcristalina muy alterada con microlitos de plagioclasa y probables ' +
      'microlitos de magnetita (leve magnetismo).',
    claves: [
      'El intrusivo resiste mejor la erosión que las tobas: por eso forma las cumbres.',
      'Desde aquí se ve la cuenca de Santiago, rellena de sedimentos, y el frente cordillerano.',
      'Es la misma microdiorita de los geositios 4, 5, 9 y 12: un mismo cuerpo, varias ventanas.'
    ],
    observa: 'Mira hacia el oriente: el cambio de pendiente marca el borde de la cuenca de Santiago.',
    glosario: ['microdiorita', 'piroxeno', 'plagioclasa', 'intrusivo', 'erosion', 'cuenca']
  }
];

/* Puntos de interés que no son geositios pero valen la parada. El mirador es la categoría
   «geomirador» (U.categoria); coordenadas de los shp de la carpeta SIG. */
const PUNTOS = [
  { id: 'POI01', tipo: 'mirador', nombre: 'Mirador El Hundimiento',
    lat: -33.420218, lon: -70.62558, alt: 783, ruta: 'r2',   // Mirador PM-XX-03 de Cumbre-Tupahue-21012020.shp
    texto: 'Mirador desde donde se explica la geomorfología de Santiago y la historia geológica ' +
      'de la región: la cuenca rellena de sedimentos, el cordón de cerros isla y la cordillera al fondo.' },
  { id: 'POI02', tipo: 'cantera', nombre: 'Cantera El Hundimiento',
    lat: -33.418966, lon: -70.625176, alt: 771, ruta: 'r2',  // PM-31 de Cumbre-Tupahue-21012020.shp (771 m)
    texto: 'Antigua cantera. La roca está totalmente meteorizada y alterada a arcillas y calcita, ' +
      'y se evidencia una posible zona de falla: la mitad izquierda del frente es de color amarillo ' +
      'claro. Taludes inestables: obsérvala desde el camino.' }
];

/* Paradas especiales de las georutas que no son geositios del inventario: tienen ficha propia
   (#/p/<id>) y aparecen en la ruta después del geositio indicado en "despues". No cuentan en el
   progreso de los doce geositios ni tienen número. */
const PARADAS = [
  {
    id: 'PAR01', tipo: 'maqueta', ruta: 'r1', despues: 'GPM01',
    nombre: 'Maqueta táctil Parquemet',
    subtitulo: 'El cerro en relieve, para verlo también con las manos',
    lat: -33.427617, lon: -70.637852,
    gancho: 'Todo el Parque Metropolitano en una mesa: el relieve del cerro San Cristóbal ' +
      'modelado en 3D, con textos en braille y capas de información que se pueden recorrer con ' +
      'la vista o con los dedos.',
    descripcion: 'Maqueta en relieve del Parque Metropolitano de Santiago, con adaptación táctil ' +
      'para personas ciegas o con baja visión. Reúne en un mismo modelo varias capas de ' +
      'información del parque: su geología, la ubicación de los geositios y las georutas, y ' +
      'datos del parque como infraestructura, rutas de trekking y de bicicleta, vegetación, ' +
      'flora, fauna y sistemas hídricos.',
    capas: [
      'Mapa geológico',
      'Geositios y georutas',
      'Infraestructura del parque',
      'Rutas de trekking y de bicicleta',
      'Vegetación, flora y fauna',
      'Sistemas hídricos'
    ],
    claves: [
      'Recorre con la mano las curvas de nivel: donde se juntan, la ladera es más empinada.',
      'Ubica el geositio 1, que acabas de visitar, y sigue con el dedo la Georuta 1 hasta Tupahue.',
      'Compara el relieve de la cumbre con el del resto del cerro: la roca intrusiva, más dura, forma las partes más altas.'
    ],
    observa: 'Antes de subir, busca en la maqueta los geositios que vas a visitar: así se ve de ' +
      'una vez cómo se reparten por el cerro.',
    fotos: [
      { archivo: 'PAR01_1.jpg', titulo: 'La maqueta completa',
        leyenda: 'Vista a lo largo de la maqueta, con el relieve del cerro San Cristóbal al fondo.' },
      { archivo: 'PAR01_2.jpg', titulo: 'Relieve y textos en braille',
        leyenda: 'Las curvas de nivel se sienten con los dedos; los rótulos del borde están en braille.' },
      { archivo: 'PAR01_3.jpg', titulo: 'Detalle desde arriba',
        leyenda: 'Calles, caminos y curvas de nivel en el sector del cerro.' }
    ],
    ra: 'ar-maqueta.html',   // realidad aumentada sobre la maqueta real (tools/maqueta/ra_objetivos.py)
    modelo: { archivo: 'maqueta.glb', titulo: 'Maqueta táctil Parquemet',
      nota: 'Modelo hecho por fotogrametría con videos tomados alrededor de la maqueta. Gíralo ' +
        'y acércalo para recorrer el relieve y los rótulos del borde. Las capas se pegan sobre el ' +
        'relieve: la maqueta se georreferenció calzándola con el modelo de elevación ALOS PALSAR.',
      /* imágenes de tools/maqueta/5_capas.py, en el marco de la vista cenital del modelo */
      capas: [
        { archivo: 'maqueta_capas/georutas.png', fichas: 'maqueta_capas/georutas.json', nombre: 'Georutas' },
        { archivo: 'maqueta_capas/geologia.png', fichas: 'maqueta_capas/geologia.json', nombre: 'Geología' },
        { archivo: 'maqueta_capas/limite.png', fichas: 'maqueta_capas/limite.json', nombre: 'Límite del parque' },
        { archivo: 'maqueta_capas/senderos.png', nombre: 'Senderos' },
        { archivo: 'maqueta_capas/bosques.png', fichas: 'maqueta_capas/bosques.json', nombre: 'Tipos de bosque' },
        { archivo: 'maqueta_capas/conservacion.png', fichas: 'maqueta_capas/conservacion.json', nombre: 'Conservación' },
        { archivo: 'maqueta_capas/rehabilitacion.png', fichas: 'maqueta_capas/rehabilitacion.json', nombre: 'Rehabilitación ambiental' }
      ] }
  }
];

const RUTAS = [
  {
    id: 'r1', nombre: 'Georuta 1 · Pío Nono – Tupahue',
    corta: 'Pío Nono – Tupahue',
    descripcion: 'Sube por la ladera sur del cerro San Cristóbal, desde la entrada Pío Nono ' +
      'hasta la piscina Tupahue. Ocho geositios que cuentan, en orden, cómo se formó y cómo se ' +
      'desarma la roca del cerro.',
    geositios: ['GPM01', 'GPM02', 'GPM03', 'GPM04', 'GPM05', 'GPM06', 'GPM07', 'GPM08'],
    distancia: '3,4 km', desnivel: '110 m de subida', duracion: '2 h a 2 h 30 con paradas',
    dificultad: 'Media · camino pavimentado con pendiente sostenida',
    inicio: 'Entrada Pío Nono (Metro Baquedano)', fin: 'Piscina Tupahue',
    color: '#c1622f'
  },
  {
    id: 'r2', nombre: 'Georuta 2 · Cumbre – Tupahue',
    corta: 'Cumbre – Tupahue',
    descripcion: 'Desde la cumbre del cerro San Cristóbal, bajando hacia Tupahue. Recorre el ' +
      'contacto entre el intrusivo y las tobas, las columnas de enfriamiento y las huellas de ' +
      'fallas, con los mejores miradores de la cuenca de Santiago.',
    geositios: ['GPM12', 'GPM11', 'GPM10', 'GPM09', 'GPM08'],
    distancia: '2,6 km', desnivel: '150 m de bajada', duracion: '1 h 30 a 2 h con paradas',
    dificultad: 'Baja a media · en bajada',
    inicio: 'Cumbre / terraza de la Virgen', fin: 'Piscina Tupahue',
    color: '#2f6f5e'
  }
];

const GLOSARIO = {
  afanitica: 'Textura de una roca cuyos cristales son tan pequeños que no se distinguen a simple vista.',
  andesita: 'Roca volcánica de composición intermedia, muy común en los Andes. Le da el nombre a la cordillera.',
  anfibol: 'Familia de minerales oscuros y alargados, frecuentes en rocas volcánicas e intrusivas.',
  arcilla: 'Mineral de grano muy fino, producto habitual de la alteración de otros minerales por acción del agua.',
  calcita: 'Carbonato de calcio. Precipita en fracturas como capas o vetillas blancas; reacciona con ácido.',
  contacto: 'Superficie donde se tocan dos unidades de roca distintas. Registra qué pasó primero y qué después.',
  cuenca: 'Depresión del terreno donde se acumulan sedimentos. Santiago se asienta sobre una.',
  cuna: 'Bloque de roca en forma de cuña, delimitado por dos o más planos de fractura, que puede deslizarse.',
  dique: 'Cuerpo de roca ígnea, tabular, que rellenó una grieta cortando a la roca que lo rodea.',
  disyuncion: 'Fracturamiento regular que se produce al contraerse una roca ígnea mientras se enfría. ' +
    'Cuando genera columnas se llama disyunción columnar.',
  erosion: 'Desgaste y transporte del material rocoso por el agua, el viento, el hielo o la gravedad.',
  estria: 'Raya fina y paralela grabada en un plano de falla por el roce entre dos bloques.',
  exfoliacion: 'Desprendimiento de la roca en capas o cáscaras, aquí por meteorización.',
  falla: 'Fractura de la roca a lo largo de la cual los bloques se han desplazado uno respecto del otro.',
  fenocristal: 'Cristal claramente más grande que el resto de la roca, formado antes que la masa que lo rodea.',
  fiamme: 'Fragmento de pómez aplastado dentro de una toba caliente. Tiene forma de llama, de ahí el nombre.',
  fractura: 'Rotura de la roca sin desplazamiento apreciable entre los bloques.',
  hipabisal: 'Roca ígnea que se enfrió a poca profundidad: ni en superficie como una lava, ni muy adentro como un granito.',
  lapilli: 'Fragmentos volcánicos de entre 2 y 64 mm expulsados durante una erupción.',
  litico: 'Fragmento de roca preexistente incorporado en una roca volcánica.',
  magnetita: 'Óxido de hierro magnético. Su presencia hace que la roca desvíe una brújula.',
  manteo: 'Ángulo con que un plano geológico se inclina respecto de la horizontal.',
  meteorizacion: 'Conjunto de procesos que descomponen y disgregan la roca en el lugar donde está.',
  microdiorita: 'Roca intrusiva de composición intermedia y grano fino, típica de cuerpos hipabisales.',
  piroclastico: 'Material fragmentado expulsado por una erupción volcánica explosiva.',
  piroxeno: 'Mineral oscuro, rico en hierro y magnesio, frecuente en rocas volcánicas e intrusivas.',
  plagioclasa: 'Mineral blanquecino de la familia de los feldespatos, el más abundante de estas rocas.',
  pomez: 'Roca volcánica muy porosa y liviana, formada por la espuma del magma al desgasificarse.',
  porfirica: 'Textura con cristales grandes (fenocristales) inmersos en una masa de grano fino.',
  rake: 'Ángulo que forman las estrías dentro del plano de falla; indica la dirección del movimiento.',
  soldamiento: 'Compactación y fusión parcial de un depósito piroclástico por su propio calor y peso.',
  suelo: 'Capa superficial donde la roca alterada se mezcla con materia orgánica y sostiene la vegetación.',
  talud: 'Superficie inclinada de roca o suelo, natural o cortada por una obra.',
  toba: 'Roca formada por la acumulación y compactación de ceniza y fragmentos volcánicos.',
  intrusivo: 'Cuerpo de roca ígnea que se enfrió dentro de la corteza, sin llegar a la superficie.',
  yeso: 'Sulfato de calcio hidratado. Aparece como pátinas blancas en fracturas.'
};

/* Las claves del glosario son slugs sin tilde, para poder reconocer las palabras
   dentro de los textos. Estas son sus formas correctas para mostrar. */
const TITULOS_GLOSARIO = {
  afanitica: 'Afanítica',
  anfibol: 'Anfíbol',
  cuna: 'Cuña',
  disyuncion: 'Disyunción',
  erosion: 'Erosión',
  estria: 'Estría',
  exfoliacion: 'Exfoliación',
  litico: 'Lítico',
  meteorizacion: 'Meteorización',
  piroclastico: 'Piroclástico',
  pomez: 'Pómez',
  porfirica: 'Porfírica'
};

const HISTORIA = [
  { t: 'Hace 34 a 20 millones de años', titulo: 'Volcanes y una cuenca que se hunde',
    texto: 'Un arco de volcanes hace erupción mientras el terreno se hunde. Ceniza, pómez y ' +
      'lavas se acumulan capa sobre capa: es la Formación Abanico, la roca de la mayor parte del cerro.',
    unidad: 'OlMa' },
  { t: 'Hace unos 20 a 15 millones de años', titulo: 'Magma que no alcanzó a salir',
    texto: 'Cuerpos de magma ascienden y se detienen a poca profundidad dentro de las tobas. Al ' +
      'enfriarse forman la microdiorita, y en los bordes fríos se agrietan en columnas.',
    unidad: 'Mh' },
  { t: 'Desde entonces', titulo: 'La cordillera se levanta y el cerro queda aislado',
    texto: 'El acortamiento tectónico levanta los Andes y deforma estas rocas. Se generan fallas ' +
      'y fracturas cuyas estrías todavía se leen en el cerro.' },
  { t: 'Últimos 2,6 millones de años', titulo: 'La cuenca se rellena',
    texto: 'Los ríos rellenan de sedimentos la cuenca de Santiago. El cordón del San Cristóbal ' +
      'queda como un cerro isla asomando entre el relleno.',
    unidad: 'Qs' },
  { t: 'Hoy', titulo: 'La roca se sigue desarmando',
    texto: 'Agua, raíces y cambios de temperatura descomponen la roca, generan suelo y sueltan ' +
      'bloques de los taludes. Todo el proceso se observa en los geositios de este parque.' }
];
