function processResults (results, status, pagination, searchId, polygonKey) {
  // Por defecto, NO aplicar filtro de polígono para mantener compatibilidad con el original
  // Solo aplicar si el usuario lo habilita explícitamente Y el toggle existe
  var applyPolygonFilter = $("#polygonFilterToggle").length > 0 ? $("#polygonFilterToggle").prop("checked") : false;

  if (status !== google.maps.places.PlacesServiceStatus.OK) {
    if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      enable_btns();
      $("#resultadosLbl").effect("highlight", {}, 2000);
      console.log("No hay nuevos resultados");
    }
    else{
      alert("algo salió mal.");
    }
    return;
  } else {
    // SOLO aplicar filtro de polígono si está explícitamente activado
    if (polygonKey && polygons[polygonKey] && applyPolygonFilter) {
      console.log("⚠️ FILTRO DE POLÍGONO ACTIVADO - resultados antes:", results.length);
      results = filterResultsByPolygon(results, polygons[polygonKey].polygon);
      console.log("⚠️ FILTRO DE POLÍGONO ACTIVADO - resultados después:", results.length);
    } else if (polygonKey && polygons[polygonKey]) {
      console.log("✅ FILTRO DE POLÍGONO DESACTIVADO - manteniendo todos los resultados:", results.length);
    }
    
    // 🆕 MEJORADO: Crear marcadores con control de duplicados
    createMarkersWithDuplicateControl(results, searchId);
    
    // Actualizar el contador con el número REAL de lugares únicos
    var uniquePlacesCount = getUniquePlacesCount();
    $("#resultadosLbl").text(uniquePlacesCount);

    if (pagination.hasNextPage) {
        pagination.nextPage();
    }else{
      enable_btns();
      update_view();
      draw_circles();
      // Actualizar el label de resultados al finalizar la búsqueda
      $("#resultadosLbl").text(uniquePlacesCount);
      $("#resultadosLbl").effect("highlight", {}, 2000);
    }
  }
}

function filterResultsByPolygon(results, polygon) {
  return results.filter(function(place) {
    var latLng = new google.maps.LatLng(
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
    return google.maps.geometry.poly.containsLocation(latLng, polygon);
  });
}

// 🆕 NUEVA FUNCIÓN: Control mejorado de duplicados
function createMarkersWithDuplicateControl(places, searchId) {
  var bounds = new google.maps.LatLngBounds();
  var newMarkersCount = 0;
  var duplicateCount = 0;

  for (var i = 0, place; place = places[i]; i++) {
    // Obtener TODOS los marcadores existentes de TODAS las búsquedas
    var allExistingMarkers = [];
    for (var searchKey in searches) {
      if (searches[searchKey] && searches[searchKey].markers) {
        allExistingMarkers = allExistingMarkers.concat(searches[searchKey].markers);
      }
    }

    // Verificar si este lugar ya existe
    var isDuplicate = allExistingMarkers.some(function(marker) {
      return marker.place_id == place.place_id;
    });

    if (!isDuplicate) {
      // Solo crear marcador si no es duplicado
      var marker = new google.maps.Marker(markerData(place, searchId));
      searches[searchId]["markers"].push(marker);
      newMarkersCount++;
      
      console.log("✅ Nuevo lugar único:", place.name);
    } else {
      duplicateCount++;
      console.log("🔄 Lugar duplicado omitido:", place.name);
    }
  }
  
  console.log(`📊 Resumen de esta búsqueda:`);
  console.log(`   - Lugares recibidos: ${places.length}`);
  console.log(`   - Lugares nuevos agregados: ${newMarkersCount}`);
  console.log(`   - Lugares duplicados omitidos: ${duplicateCount}`);
}

// 🆕 NUEVA FUNCIÓN: Obtener conteo real de lugares únicos
function getUniquePlacesCount() {
  var allMarkers = [];
  var uniquePlaceIds = new Set();
  
  // Recolectar todos los marcadores
  for (var searchKey in searches) {
    if (searches[searchKey] && searches[searchKey].markers) {
      allMarkers = allMarkers.concat(searches[searchKey].markers);
    }
  }
  
  // Contar place_ids únicos
  allMarkers.forEach(function(marker) {
    if (marker.place_id) {
      uniquePlaceIds.add(marker.place_id);
    }
  });
  
  return uniquePlaceIds.size;
}

// Función original mantenida por compatibilidad
function createMarkers (places, searchId) {
  console.log("⚠️ Usando createMarkers original. Considera usar createMarkersWithDuplicateControl para mejor control de duplicados.");
  createMarkersWithDuplicateControl(places, searchId);
}