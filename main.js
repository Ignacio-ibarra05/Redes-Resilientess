// Crear el mapa centrado en una ubicación predeterminada
const map = L.map('map').setView([-33.457, -70.649], 13); // Coordenadas de Santiago, Chile

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap contributors'
}).addTo(map);

// Función para cargar y visualizar un archivo GeoJSON
function cargarGeoJSON(url, opciones = {}) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Crear una capa de GeoJSON
            const capaGeoJSON = L.geoJSON(data, {
                style: opciones.estilo || {}, // Opcional: Estilo para geometrías
                pointToLayer: (feature, latlng) => {
                    return L.marker(latlng, {
                        icon: L.icon({
                            iconUrl: opciones.icono || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                            iconSize: [25, 25]
                        })
                    });
                },
                onEachFeature: (feature, layer) => {
                    // Agregar popup con las propiedades del elemento
                    const propiedades = Object.entries(feature.properties || {})
                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                        .join('<br>');
                    layer.bindPopup(`
                        <strong>Coordenadas:</strong> ${feature.geometry.coordinates.join(', ')}<br>
                        ${propiedades || 'Sin propiedades adicionales'}
                    `);
                }
            });

            // Añadir la capa al mapa
            capaGeoJSON.addTo(map);
            console.log(`GeoJSON cargado desde ${url}`);
        })
        .catch(error => console.error(`Error al cargar el archivo GeoJSON: ${url}`, error));
}

// Llamadas para cargar tus archivos GeoJSON
cargarGeoJSON('Api metadata/locales.geojson', {
    icono: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Icono personalizado
    estilo: { color: 'blue', weight: 2 } // Estilo para líneas o polígonos
});

// Función para cargar y visualizar un archivo GeoJSON
function cargarGeoJSON2(url, opciones = {}) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Crear una capa de GeoJSON
            const capaGeoJSON = L.geoJSON(data, {
                style: opciones.estilo || {}, // Opcional: Estilo para geometrías
                pointToLayer: (feature, latlng) => {
                    return L.marker(latlng, {
                        icon: L.icon({
                            iconUrl: opciones.icono || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                            iconSize: [25, 25]
                        })
                    });
                },
                onEachFeature: (feature, layer) => {
                    // Agregar popup con las propiedades del elemento
                    const propiedades = Object.entries(feature.properties || {})
                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                        .join('<br>');
                    layer.bindPopup(`
                        <strong>Coordenadas:</strong> ${feature.geometry.coordinates.join(', ')}<br>
                        ${propiedades || 'Sin propiedades adicionales'}
                    `);
                }
            });

            // Añadir la capa al mapa
            capaGeoJSON.addTo(map);
            console.log(`GeoJSON cargado desde ${url}`);
        })
        .catch(error => console.error(`Error al cargar el archivo GeoJSON: ${url}`, error));
}

// Cargar el archivo GeoJSON desde el enlace proporcionado
cargarGeoJSON2('https://raw.githubusercontent.com/caracena/chile-geojson/refs/heads/master/13.geojson', {
    estilo: { color: 'green', weight: 1 }, // Estilo para líneas o polígonos
    icono: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' // Icono para puntos (si aplica)
});
