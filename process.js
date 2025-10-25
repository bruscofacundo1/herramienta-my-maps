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
    
    var initialCount = number_of_markers(searches);
    createMarkers(results, searchId);
    var finalCount = number_of_markers(searches);
    var newMarkers = finalCount - initialCount;
    
    console.log(`Procesando resultados: ${results.length} recibidos, ${newMarkers} nuevos marcadores agregados`);
    
    // Actualizar el contador de resultados inmediatamente después de agregar marcadores
    $("#resultadosLbl").text(finalCount);
    
    // Forzar una actualización visual del contador
    $("#resultadosLbl").effect("highlight", {}, 1000);

    if (pagination.hasNextPage) {
        pagination.nextPage();
    }else{
      enable_btns();
      update_view();
      draw_circles();
      // Actualizar el label de resultados al finalizar la búsqueda
      var totalCount = number_of_markers(searches);
      $("#resultadosLbl").text(totalCount); // Solo el número
      console.log(`Búsqueda completada. Total de marcadores: ${totalCount}`);
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

function createMarkers (places, searchId) {
  var bounds = new google.maps.LatLngBounds();
  var addedCount = 0;
  var duplicateCount = 0;

  for (var i = 0, place; place = places[i]; i++) {

    if(markers(searches).some(function( x) {return x.place_id == place.place_id})) {
      console.log(`Marcador duplicado omitido: ${place.name} (ID: ${place.place_id})`);
      duplicateCount++;
    }
    else{
      console.log(`Nuevo marcador agregado: ${place.name} (ID: ${place.place_id})`);
      addedCount++;

      var marker = new google.maps.Marker(markerData(place, searchId))
      searches[searchId]["markers"].push(marker);
    }
  }
  
  console.log(`Resumen de createMarkers: ${addedCount} nuevos, ${duplicateCount} duplicados de ${places.length} lugares recibidos`);
}