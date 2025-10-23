function buscar(tag, address){
  for (i = 0; i < address.length; i++){
    if (address[i]["types"].includes(tag)){
      var val = address[i]["long_name"];
      return safe(val);
    }
  }
  return "--";
}

function getDetails(){
  var all_markers = markers(searches);
  var markersToUpdate = all_markers.filter(function(x) { return x.updated != "yes"; });
  
  if (markersToUpdate.length === 0) {
    alert("Todos los marcadores ya tienen detalles actualizados.");
    return;
  }
  
  // Mostrar barra de progreso
  showDetailedProgress(markersToUpdate.length, "Actualizando Detalles", "Preparando actualización...");
  
  if (all_markers.some(function(x){return x.updated != "yes"})){
    document.getElementById("details").disabled = true;
    setTimeout(function(){document.getElementById("details").disabled = false; getDetails();},7000);
  }

  var service = new google.maps.places.PlacesService(map);
  var processedCount = 0;
  limit = 10;
  
  for (var i = 0; i < all_markers.length; i++) {
    if (all_markers[i].updated != "yes" && limit > 0){
      console.log("details for " + (i+1))
      limit = limit - 1;
      
      // Actualizar progreso con el nombre del lugar actual
      updateProgressText("Procesando: " + (all_markers[i].name || "Lugar " + (i+1)));
      
      service.getDetails({placeId: all_markers[i].place_id}, function(details, status){
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          console.log("cuota de detalles máxima alcanzada, no se pudo actualizar item");
          
          // Incrementar progreso incluso en caso de error
          processedCount++;
          incrementProgress("Error en lugar " + processedCount);

        }else{
          var id = details.place_id;
          for (var j = 0; j < all_markers.length; j++) {
            if (all_markers[j].place_id == id){
              var marker = all_markers[j];
            }
          }
          marker.country = buscar("country", details.address_components)
          marker.postal_code = buscar("postal_code", details.address_components);
          marker.postal_code_suffix = buscar("postal_code_suffix", details.address_components);
          marker.street_number = buscar("street_number", details.address_components);
          marker.route = buscar("route", details.address_components);
          marker.sublocality_level_1 = buscar("sublocality_level_1", details.address_components);
          marker.administrative_area_level_2 = buscar("administrative_area_level_2", details.address_components);
          marker.administrative_area_level_1 = buscar("administrative_area_level_1", details.address_components);

          marker.telefono = safe(details["international_phone_number"]);
          marker.direccion_completa = safe(details["formatted_address"]);
          marker.website = details["website"] || '';
          marker.rating = details.rating; // CALIFICACION (valor numérico)
          marker.calificacion_total = details.user_ratings_total; // CALIFICACION TOTAL (número de reseñas)

          var emailsFound = [];
          var fieldsToCheck = [
            details.website,
            details.formatted_address,
            details.international_phone_number,
            details.name,
            details.vicinity
          ];
          
          fieldsToCheck.forEach(function(field) {
            if (field && typeof field === 'string') {
              var emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
              var matches = field.match(emailRegex);
              if (matches) {
                matches.forEach(function(email) {
                  if (emailsFound.indexOf(email.toLowerCase()) === -1) {
                    emailsFound.push(email.toLowerCase());
                  }
                });
              }
            }
          });
          
          marker.emails = emailsFound.length > 0 ? emailsFound.join(", ") : '';
          if("opening_hours" in details && "weekday_text" in details["opening_hours"]){
            marker.horarios =  details["opening_hours"]["weekday_text"].join("|").replace(/,/g, "|");
          }
          
          marker.updated = "yes";
          
          // Incrementar progreso
          processedCount++;
          incrementProgress(marker.name || "Lugar actualizado");

          // Verificar si todos los marcadores han sido procesados
          if (processedCount === markersToUpdate.length) {
            hideProgressBar();
          }
        }

      });
    }
  }
  update_view();
  // Si no hay marcadores para actualizar, ocultar la barra de progreso inmediatamente
  if (markersToUpdate.length === 0) {
    hideProgressBar();
  }
};
