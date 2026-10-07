/* Traducción de GeoParquemet Geotours al inglés y al portugués.

   Cómo funciona, para no tener que tocar cada vista:
     1. Los datos (geositios, rutas, glosario, historia) se traducen al cargar,
        antes de pintar nada: cada texto en español se reemplaza por su
        traducción de js/i18n-datos.js (generado con tools/i18n_datos.py).
     2. Los textos fijos de la interfaz se traducen sobre la página: un
        observador revisa cada texto que aparece y, si está en el diccionario
        UI (o calza con uno de los PATRONES de los textos que se arman por
        partes, como "Geositio 3" o "Estás a 120 m"), lo cambia.
   El español es el idioma base: si un texto no tiene traducción se queda tal
   cual, nunca desaparece. El idioma se guarda en "geoparquemet:idioma" (el
   mismo que usa la realidad aumentada, ar.html). */

const I18N = (() => {
  const CLAVE = 'geoparquemet:idioma';

  const IDIOMAS = {
    es: { nombre: 'Español', bandera: '🇨🇱', voz: 'es-CL' },
    en: { nombre: 'English', bandera: '🇬🇧', voz: 'en-US' },
    pt: { nombre: 'Português', bandera: '🇧🇷', voz: 'pt-BR' }
  };

  function detectar() {
    try {
      const v = JSON.parse(localStorage.getItem(CLAVE));
      if (IDIOMAS[v]) return v;
    } catch (e) { /* sin almacenamiento: se usa el idioma del teléfono */ }
    const n = (navigator.language || 'es').slice(0, 2).toLowerCase();
    return n === 'en' || n === 'pt' ? n : 'es';
  }

  const idioma = detectar();
  const pos = idioma === 'en' ? 0 : 1;

  /* ------------------------------------------------ textos de la interfaz */
  /* español: [inglés, portugués] */
  const UI = {
    'GeoParquemet': ['GeoParquemet', 'GeoParquemet'],
    'GeoParquemet · Geotours': ['GeoParquemet · Geotours', 'GeoParquemet · Geotours'],
    'Inicio': ['Home', 'Início'],
    'Mapa': ['Map', 'Mapa'],
    'Escanear': ['Scan', 'Escanear'],
    'Georutas': ['Georoutes', 'Georrotas'],
    'Georuta': ['Georoute', 'Georrota'],
    'Geositio': ['Geosite', 'Geossítio'],
    'Más': ['More', 'Mais'],
    'Volver': ['Back', 'Voltar'],
    'Ajustes': ['Settings', 'Ajustes'],
    'Ajustes y accesibilidad': ['Settings and accessibility', 'Ajustes e acessibilidade'],
    'Navegación principal': ['Main navigation', 'Navegação principal'],
    'Escanear código QR del geositio': ['Scan the geosite QR code', 'Escanear o código QR do geossítio'],
    'Historia geológica': ['Geological history', 'História geológica'],
    'Corte geológico': ['Geological cross-section', 'Corte geológico'],
    'Glosario': ['Glossary', 'Glossário'],
    'Unidades geológicas': ['Geological units', 'Unidades geológicas'],
    'No encontrado': ['Not found', 'Não encontrado'],
    'Este navegador no permite guardar contenido sin conexión': ['This browser cannot save content for offline use', 'Este navegador não permite salvar conteúdo para uso offline'],
    'Sin conexión: sigues viendo lo descargado': ['Offline: you can still see what you downloaded', 'Sem conexão: você continua vendo o que baixou'],
    '✓ visitado': ['✓ visited', '✓ visitado'],
    'Tu geotour': ['Your geotour', 'Seu geotour'],
    '¡Recorriste los doce geositios del parque!': ['You visited all twelve geosites in the park!', 'Você percorreu os doze geossítios do parque!'],
    'Cada geositio se marca solo al escanear su código QR.': ['Each geosite is marked automatically when you scan its QR code.', 'Cada geossítio é marcado sozinho ao escanear seu código QR.'],
    'Geotours por el cerro San Cristóbal. Escanea el código QR del geositio y mira la geología que tienes delante.': ['Geotours around San Cristóbal hill. Scan the geosite QR code and look at the geology right in front of you.', 'Geotours pelo morro San Cristóbal. Escaneie o código QR do geossítio e veja a geologia que está à sua frente.'],
    'Escanear el QR del geositio': ['Scan the geosite QR code', 'Escanear o QR do geossítio'],
    'Ver el mapa de geositios': ['See the geosite map', 'Ver o mapa dos geossítios'],
    'Antes de partir': ['Before you set off', 'Antes de partir'],
    'La historia geológica en cinco actos': ['The geological history in five acts', 'A história geológica em cinco atos'],
    'De los volcanes de hace 34 millones de años al bloque que se suelta hoy de un talud.': ['From the volcanoes of 34 million years ago to the block that breaks loose from a slope today.', 'Dos vulcões de 34 milhões de anos atrás ao bloco que se solta hoje de um talude.'],
    'Corte geológico del cerro': ['Geological cross-section of the hill', 'Corte geológico do morro'],
    'Qué hay bajo tus pies y por qué la cumbre está donde está.': ['What lies beneath your feet and why the summit is where it is.', 'O que há sob seus pés e por que o cume está onde está.'],
    'Unidad de Geopatrimonio · SERNAGEOMIN · Parque Metropolitano de Santiago': ['Geoheritage Unit · SERNAGEOMIN · Santiago Metropolitan Park', 'Unidade de Geopatrimônio · SERNAGEOMIN · Parque Metropolitano de Santiago'],
    'Lo más cercano a ti': ['Closest to you', 'O mais perto de você'],
    'Abrir su ficha': ['Open its page', 'Abrir a ficha'],
    'Dos recorridos con sentido: cada uno cuenta una parte distinta de la historia del cerro. Puedes hacerlos completos o visitar geositios sueltos.': ['Two routes with a story: each one tells a different part of the hill\'s history. You can walk them in full or visit individual geosites.', 'Dois percursos com sentido: cada um conta uma parte diferente da história do morro. Você pode fazê-los completos ou visitar geossítios avulsos.'],
    'Todos los geositios': ['All geosites', 'Todos os geossítios'],
    'Término': ['End', 'Término'],
    'Distancia': ['Distance', 'Distância'],
    'Desnivel': ['Elevation', 'Desnível'],
    'Duración': ['Duration', 'Duração'],
    'Dificultad': ['Difficulty', 'Dificuldade'],
    'Lleva agua y gorro: la ladera tiene poca sombra. No te salgas de los senderos ni golpees las rocas de los geositios: son patrimonio de todos.': ['Bring water and a hat: the slope has little shade. Stay on the paths and do not hammer the rocks of the geosites: they belong to everyone.', 'Leve água e chapéu: a encosta tem pouca sombra. Não saia das trilhas nem golpeie as rochas dos geossítios: são patrimônio de todos.'],
    'Paradas': ['Stops', 'Paradas'],
    'Ver la ruta en el mapa': ['See the route on the map', 'Ver a rota no mapa'],
    '✓ Visitado': ['✓ Visited', '✓ Visitado'],
    'Marcar como visitado': ['Mark as visited', 'Marcar como visitado'],
    'Geositio marcado como visitado': ['Geosite marked as visited', 'Geossítio marcado como visitado'],
    'Marca quitada': ['Mark removed', 'Marca removida'],
    'Escuchar': ['Listen', 'Ouvir'],
    'Detener': ['Stop', 'Parar'],
    'Cómo llegar': ['Directions', 'Como chegar'],
    'ya llegaste': ['you are here', 'você chegou'],
    'En terreno': ['On site', 'No local'],
    'Fotos interpretadas': ['Interpreted photos', 'Fotos interpretadas'],
    'Modelo 3D': ['3D model', 'Modelo 3D'],
    'Muestra de mano': ['Hand specimen', 'Amostra de mão'],
    'Ficha geológica': ['Geological data', 'Ficha geológica'],
    '📷 RA sobre la roca': ['📷 AR on the rock', '📷 RA sobre a rocha'],
    '📄 RA con hoja impresa': ['📄 AR with printed sheet', '📄 RA com folha impressa'],
    'La hoja impresa se ancla mejor.': ['The printed sheet holds the overlay steadier.', 'A folha impressa ancora melhor.'],
    'Descargar la hoja (PDF)': ['Download the sheet (PDF)', 'Baixar a folha (PDF)'],
    'Qué mirar aquí': ['What to look at here', 'O que observar aqui'],
    'Pista de campo': ['Field tip', 'Dica de campo'],
    'Desliza el control sobre cada fotografía: a la izquierda queda la foto tal cual, a la derecha la interpretación geológica dibujada sobre ella.': ['Slide the control across each photo: on the left you see the photo as it is, on the right the geological interpretation drawn on top.', 'Deslize o controle sobre cada fotografia: à esquerda fica a foto como ela é, à direita a interpretação geológica desenhada sobre ela.'],
    'Modelo construido con fotogrametría en terreno. Gíralo con un dedo, acércalo con dos y usa el corte transparente para mirar el interior de la roca.': ['Model built with field photogrammetry. Rotate it with one finger, zoom with two and use the transparent cut to look inside the rock.', 'Modelo construído com fotogrametria em campo. Gire-o com um dedo, aproxime com dois e use o corte transparente para olhar o interior da rocha.'],
    'Panorámica esférica tomada en el punto de observación. Mueve la vista y sube la interpretación para reconocer las estructuras.': ['Spherical panorama taken at the viewing point. Move the view and raise the interpretation to recognize the structures.', 'Panorâmica esférica tirada no ponto de observação. Mova a vista e aumente a interpretação para reconhecer as estruturas.'],
    'Muestra de mano recogida en el geositio, fotografiada en laboratorio.': ['Hand specimen collected at the geosite, photographed in the lab.', 'Amostra de mão coletada no geossítio, fotografada em laboratório.'],
    'Código del inventario': ['Inventory code', 'Código do inventário'],
    'Unidad geológica': ['Geological unit', 'Unidade geológica'],
    'Edad': ['Age', 'Idade'],
    'Litología': ['Lithology', 'Litologia'],
    'Clase de roca': ['Rock class', 'Classe de rocha'],
    'Interés geocientífico': ['Geoscientific interest', 'Interesse geocientífico'],
    'Valor principal': ['Main value', 'Valor principal'],
    'Estado de conservación': ['State of preservation', 'Estado de conservação'],
    'Figura de protección': ['Protection status', 'Figura de proteção'],
    'Parque urbano': ['Urban park', 'Parque urbano'],
    'Altitud': ['Altitude', 'Altitude'],
    'Coordenadas': ['Coordinates', 'Coordenadas'],
    'Descripción': ['Description', 'Descrição'],
    'Estructuras': ['Structures', 'Estruturas'],
    'Alteración': ['Alteration', 'Alteração'],
    'Comportamiento geotécnico': ['Geotechnical behaviour', 'Comportamento geotécnico'],
    'Datos del inventario': ['Inventory data', 'Dados do inventário'],
    'Fuente: Inventario Nacional de Geositios, SERNAGEOMIN. Unidad de Geopatrimonio, proyecto GEOPARQUEMET.': ['Source: National Geosite Inventory, SERNAGEOMIN. Geoheritage Unit, GEOPARQUEMET project.', 'Fonte: Inventário Nacional de Geossítios, SERNAGEOMIN. Unidade de Geopatrimônio, projeto GEOPARQUEMET.'],
    'Abrir ficha': ['Open page', 'Abrir ficha'],
    'Geositio por visitar': ['Geosite to visit', 'Geossítio a visitar'],
    'Geositio visitado': ['Visited geosite', 'Geossítio visitado'],
    'Mirador / cantera': ['Viewpoint / quarry', 'Mirante / pedreira'],
    'Centrar en mi posición': ['Center on my position', 'Centralizar na minha posição'],
    'Ver todos los geositios': ['See all geosites', 'Ver todos os geossítios'],
    'Sin señal de GPS por ahora': ['No GPS signal for now', 'Sem sinal de GPS por enquanto'],
    'Buscando tu posición…': ['Finding your position…', 'Buscando sua posição…'],
    'El cerro San Cristóbal es un cerro isla en medio de Santiago. Esta es, en cinco actos, la historia que cuentan sus rocas.': ['San Cristóbal hill is an island hill in the middle of Santiago. This is, in five acts, the story its rocks tell.', 'O morro San Cristóbal é um morro-ilha no meio de Santiago. Esta é, em cinco atos, a história que suas rochas contam.'],
    'Ver el corte geológico': ['See the geological cross-section', 'Ver o corte geológico'],
    'Perfil oeste–este del cerro. El cuerpo intrusivo, más duro, forma el núcleo de la cumbre; la Formación Abanico lo envuelve en los dos flancos. Toca un geositio para abrir su ficha.': ['West–east profile of the hill. The harder intrusive body forms the core of the summit; the Abanico Formation wraps around it on both flanks. Tap a geosite to open its page.', 'Perfil oeste–leste do morro. O corpo intrusivo, mais duro, forma o núcleo do cume; a Formação Abanico o envolve nos dois flancos. Toque em um geossítio para abrir sua ficha.'],
    'Esquema didáctico construido con las cotas y unidades de los doce geositios. No sustituye a la carta geológica del área.': ['Teaching diagram built from the elevations and units of the twelve geosites. It does not replace the geological map of the area.', 'Esquema didático construído com as cotas e unidades dos doze geossítios. Não substitui a carta geológica da área.'],
    'Buscar un término…': ['Search for a term…', 'Buscar um termo…'],
    'Buscar en el glosario': ['Search the glossary', 'Buscar no glossário'],
    'Sin resultados.': ['No results.', 'Sem resultados.'],
    'Los cinco actos que formaron el cerro.': ['The five acts that shaped the hill.', 'Os cinco atos que formaram o morro.'],
    'Qué hay bajo tus pies.': ['What lies beneath your feet.', 'O que há sob seus pés.'],
    'Toba, fiamme, disyunción y el resto del vocabulario.': ['Tuff, fiamme, jointing and the rest of the vocabulary.', 'Tufo, fiamme, disjunção e o resto do vocabulário.'],
    'Las tres unidades que verás en el parque.': ['The three units you will see in the park.', 'As três unidades que você verá no parque.'],
    'Tamaño del texto, contraste y datos guardados.': ['Text size, contrast and saved data.', 'Tamanho do texto, contraste e dados salvos.'],
    'Generar los carteles QR': ['Generate the QR signs', 'Gerar as placas QR'],
    'Para el equipo del parque: códigos listos para imprimir.': ['For the park team: codes ready to print.', 'Para a equipe do parque: códigos prontos para imprimir.'],
    'Sobre esta app': ['About this app', 'Sobre este app'],
    'GeoParquemet Geotours reúne el material del proyecto GEOPARQUEMET de la Unidad de Geopatrimonio de SERNAGEOMIN: el inventario de geositios, las fotografías interpretadas, los modelos fotogramétricos y las panorámicas 360°, preparados para consultarse en terreno desde el teléfono.': ['GeoParquemet Geotours brings together the material of the GEOPARQUEMET project by SERNAGEOMIN\'s Geoheritage Unit: the geosite inventory, the interpreted photographs, the photogrammetric models and the 360° panoramas, ready to be used on site from your phone.', 'GeoParquemet Geotours reúne o material do projeto GEOPARQUEMET da Unidade de Geopatrimônio do SERNAGEOMIN: o inventário de geossítios, as fotografias interpretadas, os modelos fotogramétricos e as panorâmicas 360°, preparados para consulta em campo pelo celular.'],
    'Sitio del proyecto: geoparquemet.sernageomin.cl': ['Project website: geoparquemet.sernageomin.cl', 'Site do projeto: geoparquemet.sernageomin.cl'],
    'Tamaño del texto': ['Text size', 'Tamanho do texto'],
    'Alto contraste': ['High contrast', 'Alto contraste'],
    'Descargar todo para usar sin conexión': ['Download everything for offline use', 'Baixar tudo para usar sem conexão'],
    'Listo: la app funciona completa sin conexión.': ['Done: the whole app works offline.', 'Pronto: o app funciona completo sem conexão.'],
    'Accesibilidad': ['Accessibility', 'Acessibilidade'],
    'Texto': ['Text', 'Texto'],
    'Uso sin conexión': ['Offline use', 'Uso sem conexão'],
    'En el cerro la señal es irregular. Descarga el contenido antes de salir: ocupa unos 135 MB con fotos, modelos 3D y panorámicas.': ['Signal on the hill is patchy. Download the content before you go: it takes about 135 MB with photos, 3D models and panoramas.', 'No morro o sinal é irregular. Baixe o conteúdo antes de sair: ocupa uns 135 MB com fotos, modelos 3D e panorâmicas.'],
    'Tu recorrido': ['Your visit', 'Seu percurso'],
    'Los geositios visitados se guardan solo en este teléfono. Nada se envía a ningún servidor.': ['Visited geosites are saved only on this phone. Nothing is sent to any server.', 'Os geossítios visitados ficam salvos só neste celular. Nada é enviado a nenhum servidor.'],
    'Borrar mi progreso': ['Clear my progress', 'Apagar meu progresso'],
    '¿Borrar el progreso?': ['Clear your progress?', 'Apagar o progresso?'],
    'Se quitarán las marcas de los geositios visitados. No se puede deshacer.': ['The marks on visited geosites will be removed. This cannot be undone.', 'As marcas dos geossítios visitados serão removidas. Não é possível desfazer.'],
    'Cancelar': ['Cancel', 'Cancelar'],
    'Borrar': ['Clear', 'Apagar'],
    'Progreso borrado': ['Progress cleared', 'Progresso apagado'],
    'No encontramos eso': ['We could not find that', 'Não encontramos isso'],
    'El geositio o la ruta que buscas no existe en la app.': ['The geosite or route you are looking for does not exist in the app.', 'O geossítio ou a rota que você procura não existe no app.'],
    'Volver al inicio': ['Back to home', 'Voltar ao início'],
    'Cerrar': ['Close', 'Fechar'],
    'Ver todo el glosario': ['See the full glossary', 'Ver todo o glossário'],
    'Este teléfono no puede leer en voz alta': ['This phone cannot read aloud', 'Este celular não consegue ler em voz alta'],
    'Apunta al código QR del cartel del geositio': ['Point at the QR code on the geosite sign', 'Aponte para o código QR da placa do geossítio'],
    'Cerrar el escáner': ['Close the scanner', 'Fechar o leitor'],
    'Escribir el número del geositio': ['Type the geosite number', 'Digitar o número do geossítio'],
    'Ese código no corresponde a un geositio de GeoParquemet': ['That code is not a GeoParquemet geosite', 'Esse código não corresponde a um geossítio do GeoParquemet'],
    'Sin permiso de cámara. Escribe el número del geositio.': ['No camera permission. Type the geosite number.', 'Sem permissão de câmera. Digite o número do geossítio.'],
    'No se pudo abrir la cámara en este dispositivo.': ['The camera could not be opened on this device.', 'Não foi possível abrir a câmera neste aparelho.'],
    'No se pudo iniciar el lector. Usa el número del geositio.': ['The scanner could not start. Use the geosite number.', 'Não foi possível iniciar o leitor. Use o número do geossítio.'],
    'Número del geositio (1 a 12)': ['Geosite number (1 to 12)', 'Número do geossítio (1 a 12)'],
    'Número del geositio': ['Geosite number', 'Número do geossítio'],
    'Ir a un geositio': ['Go to a geosite', 'Ir para um geossítio'],
    'El número está impreso en el cartel, junto al código QR.': ['The number is printed on the sign, next to the QR code.', 'O número está impresso na placa, junto ao código QR.'],
    'No existe un geositio con ese número': ['There is no geosite with that number', 'Não existe um geossítio com esse número'],
    'Corte geológico esquemático del cerro San Cristóbal de oeste a este, con el cuerpo intrusivo formando el núcleo de la cumbre y la Formación Abanico en los flancos.': ['Schematic west-to-east geological cross-section of San Cristóbal hill, with the intrusive body forming the core of the summit and the Abanico Formation on the flanks.', 'Corte geológico esquemático do morro San Cristóbal de oeste a leste, com o corpo intrusivo formando o núcleo do cume e a Formação Abanico nos flancos.'],
    'Exageración vertical ≈ 2,5 ×   ·   corte esquemático': ['Vertical exaggeration ≈ 2.5 ×   ·   schematic section', 'Exagero vertical ≈ 2,5 ×   ·   corte esquemático'],
    'Intrusivos hipabisales (Mh)': ['Hypabyssal intrusives (Mh)', 'Intrusivas hipabissais (Mh)'],
    'Formación Abanico (OlMa)': ['Abanico Formation (OlMa)', 'Formação Abanico (OlMa)'],
    'Depósitos no consolidados (Qs)': ['Unconsolidated deposits (Qs)', 'Depósitos não consolidados (Qs)'],
    'm s.n.m.': ['m a.s.l.', 'm alt.'],
    'O': ['W', 'O'],
    'Fotografía sin interpretar': ['Uninterpreted photograph', 'Fotografia sem interpretação'],
    'Comparador: desliza para ver la interpretación geológica': ['Comparison: slide to see the geological interpretation', 'Comparador: deslize para ver a interpretação geológica'],
    'Foto': ['Photo', 'Foto'],
    'Interpretada': ['Interpreted', 'Interpretada'],
    'Ver en pantalla completa': ['View full screen', 'Ver em tela cheia'],
    'desliza →': ['slide →', 'deslize →'],
    'Preparando el modelo…': ['Preparing the model…', 'Preparando o modelo…'],
    'Cargar modelo 3D (2,5 MB aprox.)': ['Load 3D model (about 2.5 MB)', 'Carregar modelo 3D (2,5 MB aprox.)'],
    'Modelo fotogramétrico del afloramiento': ['Photogrammetric model of the outcrop', 'Modelo fotogramétrico do afloramento'],
    'No se pudo descargar el modelo.': ['The model could not be downloaded.', 'Não foi possível baixar o modelo.'],
    'Girar solo': ['Auto-rotate', 'Girar sozinho'],
    'Corte transparente': ['Transparent cut', 'Corte transparente'],
    'Reencuadrar': ['Reset view', 'Reenquadrar'],
    'Posición del corte': ['Cut position', 'Posição do corte'],
    'Transparencia de la roca': ['Rock transparency', 'Transparência da rocha'],
    'Corte': ['Cut', 'Corte'],
    'Roca': ['Rock', 'Rocha'],
    'Mueve el control para cortar la roca y mirar dentro': ['Move the control to cut the rock and look inside', 'Mova o controle para cortar a rocha e olhar dentro'],
    'Pantalla completa': ['Full screen', 'Tela cheia'],
    'Este navegador no permite pantalla completa': ['This browser does not allow full screen', 'Este navegador não permite tela cheia'],
    'Panorámica esférica del punto de observación': ['Spherical panorama from the viewing point', 'Panorâmica esférica do ponto de observação'],
    'Abrir panorámica 360° (3 MB aprox.)': ['Open 360° panorama (about 3 MB)', 'Abrir panorâmica 360° (3 MB aprox.)'],
    'Cargando la panorámica…': ['Loading the panorama…', 'Carregando a panorâmica…'],
    'No se pudo cargar la panorámica.': ['The panorama could not be loaded.', 'Não foi possível carregar a panorâmica.'],
    'Opacidad de la interpretación': ['Interpretation opacity', 'Opacidade da interpretação'],
    'Interpretación': ['Interpretation', 'Interpretação'],
    'Mover con el teléfono': ['Move with the phone', 'Mover com o celular'],
    'Permiso denegado': ['Permission denied', 'Permissão negada'],
    'No se pudo usar el sensor': ['The sensor could not be used', 'Não foi possível usar o sensor'],
    'Idioma': ['Language', 'Idioma'],
    'Parada especial': ['Special stop', 'Parada especial'],
    'Parada': ['Stop', 'Parada'],
    'Capas de información': ['Information layers', 'Camadas de informação'],
    'Qué buscar en la maqueta': ['What to look for on the model', 'O que procurar na maquete'],
    'Fotografías': ['Photographs', 'Fotografias'],
    'Satélite': ['Satellite', 'Satélite'],
    'Calles': ['Streets', 'Ruas'],
    'Topográfico': ['Topographic', 'Topográfico'],
    'Geología': ['Geology', 'Geologia'],
    'trazado aproximado': ['approximate route', 'traçado aproximado'],
    'trazado por caminos de OpenStreetMap': ['route along OpenStreetMap paths', 'traçado pelos caminhos do OpenStreetMap'],
    'Intrusivo Hipabisal': ['Hypabyssal intrusion', 'Intrusivo hipabissal'],
    'Qué observar.': ['What to look for.', 'O que observar.'],
    'Satélite 2020 (SkySat)': ['Satellite 2020 (SkySat)', 'Satélite 2020 (SkySat)'],
    'Geomirador': ['Geo-viewpoint', 'Geomirante'],
    'Geomaqueta': ['Geo-model', 'Geomaquete'],
    'Punto de interés': ['Point of interest', 'Ponto de interesse'],
    'Límite del parque': ['Park boundary', 'Limite do parque'],
    'Senderos': ['Trails', 'Trilhas'],
    'Ciclovías': ['Bike paths', 'Ciclovias'],
    'Agua': ['Water', 'Água'],
    'Infraestructura': ['Facilities', 'Infraestrutura'],
    'Plan Parquemet: tipos de bosque': ['Parquemet plan: forest types', 'Plano Parquemet: tipos de floresta'],
    'Plan Parquemet: conservación': ['Parquemet plan: conservation', 'Plano Parquemet: conservação'],
    'Plan Parquemet: protección': ['Parquemet plan: protection', 'Plano Parquemet: proteção'],
    'Plan Parquemet: recreación e infraestructura': ['Parquemet plan: recreation and facilities', 'Plano Parquemet: recreação e infraestrutura'],
    'Plan Parquemet: rehabilitación ambiental': ['Parquemet plan: environmental rehabilitation', 'Plano Parquemet: reabilitação ambiental'],
    'Plan Parquemet: núcleos de restauración': ['Parquemet plan: restoration nuclei', 'Plano Parquemet: núcleos de restauração'],
    'Alto valor ecológico (bosque esclerófilo)': ['High ecological value (sclerophyllous forest)', 'Alto valor ecológico (floresta esclerófila)'],
    'Especies en categoría de conservación': ['Species with conservation status', 'Espécies em categoria de conservação'],
    'Árboles patrimoniales': ['Heritage trees', 'Árvores patrimoniais'],
    'Protección de suelos, canteras y cursos de agua': ['Protection of soils, quarries and watercourses', 'Proteção de solos, pedreiras e cursos de água'],
    'Zona de recreación': ['Recreation area', 'Área de recreação'],
    'Infraestructura gris': ['Grey infrastructure', 'Infraestrutura cinza'],
    'Naturalización': ['Naturalisation', 'Naturalização'],
    'Enriquecimiento': ['Enrichment planting', 'Enriquecimento'],
    'Revegetación': ['Revegetation', 'Revegetação'],
    'Núcleo de restauración nativa': ['Native restoration nucleus', 'Núcleo de restauração nativa'],
    'Bosque esclerófilo nativo': ['Native sclerophyllous forest', 'Floresta esclerófila nativa'],
    'Bosque exótico': ['Exotic forest', 'Floresta exótica'],
    'Bosque mixto': ['Mixed forest', 'Floresta mista'],
    'Acta Participación Ciudadana – Restauración Ladera (24.09.2026)': ['Minutes, Citizen Participation – Hillside Restoration (24.09.2026)', 'Ata Participação Cidadã – Restauração da Encosta (24.09.2026)'],
    'Digitalizado de la lámina: aproximado.': ['Digitised from the slide: approximate.', 'Digitalizado da lâmina: aproximado.'],
    'Fuente: Sernageomin': ['Source: Sernageomin', 'Fonte: Sernageomin'],
    'Sendero': ['Trail', 'Trilha'],
    'Ciclovía / ruta de bicicleta': ['Bike path / route', 'Ciclovia / rota de bicicleta'],
    'Curso o cuerpo de agua': ['Watercourse or water body', 'Curso ou corpo de água'],
    'Baños': ['Toilets', 'Banheiros'],
    'Agua potable': ['Drinking water', 'Água potável'],
    'Estacionamiento': ['Parking', 'Estacionamento'],
    'Refugio': ['Shelter', 'Abrigo'],
    'Restaurante': ['Restaurant', 'Restaurante'],
    'Café': ['Café', 'Café'],
    'Pileta': ['Fountain', 'Fonte'],
    'Información': ['Information', 'Informação'],
    'Zona de picnic': ['Picnic area', 'Área de piquenique'],
    'Atractivo': ['Attraction', 'Atração'],
    'Juegos infantiles': ['Playground', 'Parquinho'],
    'Piscina': ['Swimming pool', 'Piscina'],
    'Estación': ['Station', 'Estação'],
    'Funicular': ['Funicular', 'Funicular'],
    'Mirador': ['Viewpoint', 'Mirante'],
    'Capas sobre la maqueta': ['Layers on the model', 'Camadas sobre a maquete'],
    'Capa': ['Layer', 'Camada'],
    'Opacidad de la capa': ['Layer opacity', 'Opacidade da camada'],
    'No se pudo cargar la capa': ['The layer could not be loaded', 'Não foi possível carregar a camada'],
    'Georuta 1': ['Geo-route 1', 'Georrota 1'],
    'Georuta 2': ['Geo-route 2', 'Georrota 2'],
    'Formación Abanico': ['Abanico Formation', 'Formação Abanico'],
    'Formación Abanico: lavas y brechas': ['Abanico Formation: lavas and breccias', 'Formação Abanico: lavas e brechas'],
    'Intrusivo porfídico': ['Porphyritic intrusion', 'Intrusivo porfirítico'],
    'Depósitos coluviales': ['Colluvial deposits', 'Depósitos coluviais'],
    'Remoción en masa': ['Mass wasting', 'Movimento de massa'],
    'Depósitos fluviales': ['Fluvial deposits', 'Depósitos fluviais'],
    'Río Mapocho y sus depósitos': ['Mapocho River and its deposits', 'Rio Mapocho e seus depósitos'],
    'Depósitos antrópicos': ['Anthropogenic deposits', 'Depósitos antrópicos'],
    'Parque Metropolitano': ['Metropolitan Park', 'Parque Metropolitano'],
    'Tipos de bosque': ['Forest types', 'Tipos de floresta'],
    'Conservación': ['Conservation', 'Conservação'],
    'Rehabilitación ambiental': ['Environmental rehabilitation', 'Reabilitação ambiental'],
    'Depositos antropicos urbanos': ['Urban anthropogenic deposits', 'Depósitos antrópicos urbanos'],
    'Deposito Fluvial': ['Fluvial deposit', 'Depósito fluvial'],
    'Intrusivo Porfidico': ['Porphyritic intrusion', 'Intrusivo porfirítico'],
    'Depositos Aluviales': ['Alluvial deposits', 'Depósitos aluviais'],
    'Formacion Abanico': ['Abanico Formation', 'Formação Abanico'],
    'Depositos Coluviales': ['Colluvial deposits', 'Depósitos coluviais'],
    'Depositos de Remocion en masa': ['Mass-wasting deposits', 'Depósitos de movimento de massa'],
    'Depositos Aluviales Rio Mapocho': ['Mapocho River alluvial deposits', 'Depósitos aluviais do rio Mapocho'],
    'Deposito Fluvial Antiguo': ['Old fluvial deposit', 'Depósito fluvial antigo'],
    'Rio Mapocho': ['Mapocho River', 'Rio Mapocho']
  };

  const CARDINALES = {
    norte: ['north', 'norte'], noreste: ['northeast', 'nordeste'], este: ['east', 'leste'],
    sureste: ['southeast', 'sudeste'], sur: ['south', 'sul'], suroeste: ['southwest', 'sudoeste'],
    oeste: ['west', 'oeste'], noroeste: ['northwest', 'noroeste']
  };
  const card = c => (CARDINALES[c] || [c, c])[pos];
  /* "1,5 km" → "1.5 km" en inglés */
  const num = s => (idioma === 'en' ? s.replace(/(\d),(\d)/g, '$1.$2') : s);

  /* Textos que se arman por partes: [expresión, inglés, portugués]. */
  const PATRONES = [
    [/^Geositio (\d+)$/, 'Geosite $1', 'Geossítio $1'],
    [/^Geositio (\d+) →$/, 'Geosite $1 →', 'Geossítio $1 →'],
    [/^← Geositio (\d+)$/, '← Geosite $1', '← Geossítio $1'],
    [/^Geositio (\d+): (.+)$/, 'Geosite $1: $2', 'Geossítio $1: $2'],
    [/^Geositio (\d+) marcado como visitado$/, 'Geosite $1 marked as visited', 'Geossítio $1 marcado como visitado'],
    [/^Georuta (\d+)$/, 'Georoute $1', 'Georrota $1'],
    [/^(\d+) geositios$/, '$1 geosites', '$1 geossítios'],
    [/^(\d+) de (\d+) geositios$/, '$1 of $2 geosites', '$1 de $2 geossítios'],
    [/^(\d+) visitados$/, '$1 visited', '$1 visitados'],
    [/^Estás a ([^·]+)$/, m => [`You are ${num(m[1])} away`, `Você está a ${m[1]}`]],
    [/^hacia el (\w+)$/, m => [`to the ${card(m[1])}`, `para o ${card(m[1])}`]],
    [/^A (.+) hacia el (\w+)\.$/, m => [`${num(m[1])} away, to the ${card(m[2])}.`, `A ${m[1]}, para o ${card(m[2])}.`]],
    [/^Fotografía interpretada: (.+)$/, 'Interpreted photograph: $1', 'Fotografia interpretada: $1'],
    [/^Descargando… (.+)$/, 'Downloading… $1', 'Baixando… $1'],
    [/^Cargando (\d+ %)$/, 'Loading $1', 'Carregando $1'],
    [/^No se pudo abrir: (.+)$/, 'Could not open: $1', 'Não foi possível abrir: $1'],
    [/^No se pudo mostrar el modelo\. (.*)$/, 'The model could not be shown. $1', 'Não foi possível mostrar o modelo. $1']
  ];

  function t(s) {
    if (idioma === 'es' || typeof s !== 'string') return s;
    const k = s.trim();
    if (!k) return s;
    let r = UI[k] ? UI[k][pos] : (DATOS[k] !== undefined ? DATOS[k] : undefined);
    if (r === undefined) {
      for (const [re, en, pt] of PATRONES) {
        const m = k.match(re);
        if (!m) continue;
        if (typeof en === 'function') r = en(m)[pos];
        else r = k.replace(re, pos === 0 ? en : pt);
        break;
      }
    }
    /* "Mapa · GeoParquemet", "Estás a 80 m · hacia el norte": se traduce cada parte */
    if (r === undefined && k.indexOf(' · ') > 0) {
      const partes = k.split(' · ');
      const tr = partes.map(p => t(p));
      if (tr.some((p, i) => p !== partes[i])) r = tr.join(' · ');
    }
    if (r === undefined) return s;
    return s.replace(k, r);
  }

  /* ---------------------------------------------------------- los datos */
  const DATOS = (typeof I18N_DATOS !== 'undefined' && I18N_DATOS[idioma]) || {};

  /* Nombres del glosario y palabras con que se reconocen dentro de los textos
     (los términos se enlazan buscando estas palabras). */
  const GLOSARIO_NOMBRES = {
    en: {
      afanitica: ['Aphanitic', 'aphanitic'], andesita: ['Andesite', 'andesite andesitic'], anfibol: ['Amphibole', 'amphibole'],
      arcilla: ['Clay', 'clay clays'], calcita: ['Calcite', 'calcite'], contacto: ['Contact', 'contact'],
      cuenca: ['Basin', 'basin'], cuna: ['Wedge', 'wedge wedges'], dique: ['Dyke', 'dyke'],
      disyuncion: ['Jointing', 'jointing'], erosion: ['Erosion', 'erosion'], estria: ['Striation', 'striation striations'],
      exfoliacion: ['Exfoliation', 'exfoliation'], falla: ['Fault', 'fault faults'], fenocristal: ['Phenocryst', 'phenocryst phenocrysts'],
      fiamme: ['Fiamme', 'fiamme'], fractura: ['Fracture', 'fracture fractures'], hipabisal: ['Hypabyssal', 'hypabyssal'],
      lapilli: ['Lapilli', 'lapilli'], litico: ['Lithic', 'lithic lithics'], magnetita: ['Magnetite', 'magnetite'],
      manteo: ['Dip', 'dip dips'], meteorizacion: ['Weathering', 'weathering weathered'], microdiorita: ['Microdiorite', 'microdiorite'],
      piroclastico: ['Pyroclastic', 'pyroclastic'], piroxeno: ['Pyroxene', 'pyroxene pyroxenes'], plagioclasa: ['Plagioclase', 'plagioclase'],
      pomez: ['Pumice', 'pumice'], porfirica: ['Porphyritic', 'porphyritic'], rake: ['Rake', 'rake'],
      soldamiento: ['Welding', 'welding welded'], suelo: ['Soil', 'soil'], talud: ['Slope', 'slope'],
      toba: ['Tuff', 'tuff tuffs'], intrusivo: ['Intrusion', 'intrusion intrusive'], yeso: ['Gypsum', 'gypsum']
    },
    pt: {
      afanitica: ['Afanítica', 'afanítica'], andesita: ['Andesito', 'andesito andesítico andesítica'], anfibol: ['Anfibólio', 'anfibólio'],
      arcilla: ['Argila', 'argila argilas'], calcita: ['Calcita', 'calcita'], contacto: ['Contato', 'contato'],
      cuenca: ['Bacia', 'bacia'], cuna: ['Cunha', 'cunha cunhas'], dique: ['Dique', 'dique'],
      disyuncion: ['Disjunção', 'disjunção'], erosion: ['Erosão', 'erosão'], estria: ['Estria', 'estria estrias'],
      exfoliacion: ['Esfoliação', 'esfoliação'], falla: ['Falha', 'falha falhas'], fenocristal: ['Fenocristal', 'fenocristal fenocristais'],
      fiamme: ['Fiamme', 'fiamme'], fractura: ['Fratura', 'fratura fraturas'], hipabisal: ['Hipabissal', 'hipabissal hipabissais'],
      lapilli: ['Lápili', 'lápili'], litico: ['Lítico', 'lítico líticos'], magnetita: ['Magnetita', 'magnetita'],
      manteo: ['Mergulho', 'mergulho'], meteorizacion: ['Intemperismo', 'intemperismo intemperizada'], microdiorita: ['Microdiorito', 'microdiorito'],
      piroclastico: ['Piroclástico', 'piroclástico piroclástica'], piroxeno: ['Piroxênio', 'piroxênio piroxênios'], plagioclasa: ['Plagioclásio', 'plagioclásio'],
      pomez: ['Pedra-pomes', 'pomes'], porfirica: ['Porfirítica', 'porfirítica porfirítico'], rake: ['Rake', 'rake'],
      soldamiento: ['Soldagem', 'soldagem soldado'], suelo: ['Solo', 'solo'], talud: ['Talude', 'talude'],
      toba: ['Tufo', 'tufo tufos'], intrusivo: ['Intrusivo', 'intrusivo'], yeso: ['Gesso', 'gesso']
    }
  };
  const alias = clave => {
    const n = GLOSARIO_NOMBRES[idioma] && GLOSARIO_NOMBRES[idioma][clave];
    return n ? n[1].split(' ') : [];
  };

  function traducirDatos() {
    const recorrer = v => {
      if (Array.isArray(v)) {
        v.forEach((x, i) => { if (typeof x === 'string') { if (DATOS[x] !== undefined) v[i] = DATOS[x]; } else recorrer(x); });
      } else if (v && typeof v === 'object') {
        Object.keys(v).forEach(k => {
          const x = v[k];
          if (typeof x === 'string') { if (DATOS[x] !== undefined) v[k] = DATOS[x]; } else recorrer(x);
        });
      }
    };
    [UNIDADES, GEOSITIOS, PUNTOS, RUTAS, GLOSARIO, HISTORIA, PARADAS].forEach(recorrer);
    const nombres = GLOSARIO_NOMBRES[idioma] || {};
    Object.keys(nombres).forEach(k => { TITULOS_GLOSARIO[k] = nombres[k][0]; });
  }

  /* --------------------------------------------- traducción de la página */
  const ATRIBUTOS = ['aria-label', 'placeholder', 'title', 'alt'];
  const excluido = n => {
    for (let e = n.nodeType === 1 ? n : n.parentElement; e; e = e.parentElement) {
      if (e.hasAttribute && e.hasAttribute('data-sin-traducir')) return true;
      if (e.tagName === 'SCRIPT' || e.tagName === 'STYLE') return true;
    }
    return false;
  };
  function traducirTexto(n) {
    const v = n.nodeValue;
    if (!v || !/[A-Za-zÁÉÍÓÚáéíóúñ]/.test(v) || excluido(n)) return;
    const r = t(v);
    if (r !== v) n.nodeValue = r;
  }
  function traducirElemento(e) {
    if (excluido(e)) return;
    ATRIBUTOS.forEach(a => {
      const v = e.getAttribute(a);
      if (v) { const r = t(v); if (r !== v) e.setAttribute(a, r); }
    });
  }
  function traducirArbol(raiz) {
    if (raiz.nodeType === 3) { traducirTexto(raiz); return; }
    if (raiz.nodeType !== 1) return;
    if (excluido(raiz)) return;
    traducirElemento(raiz);
    raiz.querySelectorAll('[aria-label],[placeholder],[title],[alt]').forEach(traducirElemento);
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) traducirTexto(w.currentNode);
  }

  function iniciar() {
    document.documentElement.lang = idioma;
    if (idioma === 'es') return;
    traducirDatos();
    const arrancar = () => {
      traducirArbol(document.documentElement);
      new MutationObserver(cambios => {
        cambios.forEach(c => {
          if (c.type === 'childList') c.addedNodes.forEach(traducirArbol);
          else if (c.type === 'characterData') traducirTexto(c.target);
          else if (c.type === 'attributes') traducirElemento(c.target);
        });
      }).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ATRIBUTOS
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
  }

  function cambiar(nuevo) {
    if (!IDIOMAS[nuevo]) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(nuevo)); } catch (e) { /* sin almacenamiento */ }
    location.reload();
  }

  iniciar();

  return { idioma, IDIOMAS, t, cambiar, alias, voz: IDIOMAS[idioma].voz };
})();
