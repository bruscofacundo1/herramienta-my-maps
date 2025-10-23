var map;
var searches = {};
var circles = [];
var mapClickListener = null; // Listener de clic único para el mapa

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function initMap() {
  var bs_as = {lat: -34.6037, lng: -58.3816}

  map = new google.maps.Map(document.getElementById('map'), {
    center: bs_as,
    zoom: 12
  });

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
    map.setZoom(12);
  });

  // Inicializar herramientas de dibujo
  initDrawingTools();
  
  // Inicializar búsqueda geográfica
  initGeoSearch();

  // Cargar polígonos y círculos guardados
  loadPolygons();
  loadCircles();
}

// Función para habilitar el dibujo de círculos
function enableCircleDrawing() {
  // Remover el listener anterior si existe
  if (mapClickListener) {
    google.maps.event.removeListener(mapClickListener);
    mapClickListener = null;
  }
  
  // Añadir listener para clics en el mapa
  mapClickListener = google.maps.event.addListener(map, 'click', function(event) {
    if (window.drawingMode === 'circle') {
      addPointToCircle(event.latLng);
    }
  });
}

// Función para deshabilitar el dibujo de círculos
function disableCircleDrawing() {
  // Remover el listener de clic específico para círculos
  if (mapClickListener) {
    google.maps.event.removeListener(mapClickListener);
    mapClickListener = null;
  }
}

