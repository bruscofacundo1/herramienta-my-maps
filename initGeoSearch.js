// Mapa de expansión de palabras clave
const KEYWORD_EXPANSION_MAP = {
  "ferreteria": ["ferreterías", "ferretero", "herramientas", "bricolaje", "tornillos", "clavos", "materiales de construcción"],
  "pintureria": ["pinturas", "pinturerías", "colores", "decoración", "latex", "esmaltes"],
  "farmacia": ["farmacias", "farmacéutico", "medicamentos", "droguería", "parafarmacia"],
  "supermercado": ["supermercados", "alimentos", "comestibles", "tienda de comestibles", "hipermercado"],
  "veterinaria": ["veterinarias", "veterinario", "mascotas", "animales", "clínica veterinaria"],
  "panaderia": ["panaderías", "pan", "pastelería", "confitería", "facturas"],
  "carniceria": ["carnicerías", "carne", "frigorífico", "cortes de carne"],
  "gomería": ["gomerías", "neumáticos", "llantas", "vulcanización", "cubiertas"],
  // Agrega más categorías según sea necesario
};

/**
 * Expande una lista de palabras clave de entrada a una lista más amplia de términos de búsqueda.
 * @param {string[]} inputKeywords - Las palabras clave ingresadas por el usuario.
 * @returns {string[]} Una lista de palabras clave expandidas.
 */
function expandKeywords(inputKeywords) {
  let expanded = new Set();

  inputKeywords.forEach(inputKeyword => {
    // 1. Agregar la palabra clave original (limpia)
    const normalizedKeyword = inputKeyword.trim().toLowerCase();
    expanded.add(normalizedKeyword);

    // 2. Buscar en el mapa de expansión
    const expansionTerms = KEYWORD_EXPANSION_MAP[normalizedKeyword];
    if (expansionTerms) {
      expansionTerms.forEach(term => expanded.add(term));
    }
    
    // 3. Si no hay expansión, se añade la palabra clave original (ya está en el paso 1)
  });

  // Convertir el Set a Array y filtrar vacíos por seguridad
  return Array.from(expanded).filter(k => k !== "");
}


function startGeoSearch(center, radius, searchId, polygonKey) {
  var service = new google.maps.places.PlacesService(map);
  
  // Reiniciar el contador de resultados y limpiar búsquedas anteriores
  clear_searches(); // Esta función ahora también actualiza el contador a 0

  // Obtener las palabras clave de los inputs
  var rawKeywords = $('input[name^=keywords]').map(function(idx, elem) {
    return $(elem).val();
  }).get();
  
  // Filtrar palabras clave vacías
  rawKeywords = rawKeywords.filter(function(k) { return k.trim() !== ""; });

  if (rawKeywords.length === 0) {
    alert("Por favor, introduce al menos una palabra clave.");
    enable_btns();
    return;
  }
  
  console.log("Palabras clave originales:", rawKeywords);

  // Iterar sobre cada palabra clave para iniciar la búsqueda
  rawKeywords.forEach(function(originalKeyword) {
    var searchId = guid();
    
    // 1. Verificar si la palabra clave tiene expansiones definidas
    const normalizedKeyword = originalKeyword.trim().toLowerCase();
    const expansionTerms = KEYWORD_EXPANSION_MAP[normalizedKeyword];
    
    if (expansionTerms && expansionTerms.length > 0) {
      // *** CASO 1: Palabra clave con expansiones ***
      console.log("Iniciando búsqueda expandida para: " + originalKeyword);
      
      // Crear la entrada en el objeto searches (usando la keyword original)
      var search = {center: center, radius: radius, keyword: originalKeyword, markers: []};
      searches[searchId] = search;

      // Usar la función expandKeywords para obtener todos los términos de búsqueda correctamente normalizados
      var allSearchTerms = expandKeywords([originalKeyword]);
      console.log("  -> Términos de búsqueda expandidos:", allSearchTerms);
      
      allSearchTerms.forEach(function(searchTerm) {
        console.log("  -> Buscando: " + searchTerm);
        
        var searchRadius = radius - (radius / 4);

        service.nearbySearch({
          location: center,
          radius: searchRadius,
          keyword: searchTerm,
        }, function(results, status, pagination){
          processResults(results, status, pagination, searchId, polygonKey);
        });
      });
    } else {
      // *** CASO 2: Palabra clave sin expansiones (búsqueda simple como el original) ***
      console.log("Iniciando búsqueda simple para: " + originalKeyword);
      
      // Crear la entrada en el objeto searches
      var search = {center: center, radius: radius, keyword: originalKeyword, markers: []};
      searches[searchId] = search;

      // Realizar una única búsqueda con la palabra clave original (como en el código original)
      var searchRadius = radius - (radius / 4);

      service.nearbySearch({
        location: center,
        radius: searchRadius,
        keyword: originalKeyword,
      }, function(results, status, pagination){
        processResults(results, status, pagination, searchId, polygonKey);
      });
    }
  });
  
  disable_btns(); // Deshabilitar botones al iniciar la búsqueda, se habilitan en processResults.
}

function startCircleSearch(circle) {
  var center = circle.getCenter();
  var radius = circle.getRadius();
  var searchId = guid(); // No se usa directamente aquí, se usa en startGeoSearch

  // El código actual no tiene un listener directo en el mapa para iniciar la búsqueda,
  // sino que usa botones (asumo). La función startGeoSearch está diseñada para ser llamada
  // desde el evento de clic del mapa (como en el original) o desde un botón.
  
  // Para replicar la funcionalidad original de búsqueda al hacer clic en el mapa:
  // 1. El listener del mapa en map.js debe ser restaurado.
  // 2. Este listener debe llamar a startGeoSearch.
  
  // Como el usuario tiene una lógica de dibujo de círculos y polígonos, 
  // la función `startGeoSearch` será el motor de búsqueda.
  
  // Llamar al motor de búsqueda con los parámetros del círculo
  startGeoSearch(center, radius, searchId, null);
}

function searchInCircle(key) {
  var circleData = circles[key];
  if (circleData) {
    // Usar la función de inicio de búsqueda del círculo
    startCircleSearch(circleData.circle);
  }
}

function searchInPolygon(key) {
  var polygonData = polygons[key];
  if (polygonData) {
    // 1. Calcular el centroide y el radio que engloba el polígono.
    // Esto es complejo y propenso a errores. Para simplificar,
    // usaremos la lógica de búsqueda por círculo en el centro del polígono
    // con un radio que lo cubra, como se hace en el código original.
    
    // Obtener los límites del polígono
    var bounds = new google.maps.LatLngBounds();
    polygonData.polygon.getPath().getArray().forEach(function(point) {
      bounds.extend(point);
    });
    
    var center = bounds.getCenter();
    // Calcular el radio como la mitad de la diagonal del bounding box (aproximación)
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var distance = google.maps.geometry.spherical.computeDistanceBetween(ne, sw);
    var radius = distance / 2;
    
    // Usar la función de inicio de búsqueda del círculo con el polígonoKey
    // El polígonoKey se usa en process.js para aplicar el filtro (si está activado)
    startGeoSearch(center, radius, guid(), key);
  }
}