
function processResults (results, status, pagination, searchId, polygonKey) {
  var applyPolygonFilter = $("#polygonFilterToggle").prop("checked");

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
    if (polygonKey && polygons[polygonKey] && applyPolygonFilter) {
      results = filterResultsByPolygon(results, polygons[polygonKey].polygon);
    }
    
    createMarkers(results, searchId);
    // Actualizar el contador de resultados inmediatamente después de agregar marcadores
    $("#resultadosLbl").text(number_of_markers(searches));

    if (pagination.hasNextPage) {
        pagination.nextPage();
    }else{
      enable_btns();
      update_view();
      draw_circles();
      // Actualizar el label de resultados al finalizar la búsqueda
      $("#resultadosLbl").text(number_of_markers(searches)); // Solo el número
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

  for (var i = 0, place; place = places[i]; i++) {

    if(markers(searches).some(function( x) {return x.place_id == place.place_id})) {
      console.log("repetido!");
    }
    else{
      console.log("no estaba...");

      var marker = new google.maps.Marker(markerData(place, searchId))
      searches[searchId]["markers"].push(marker);
    }
  }
}

