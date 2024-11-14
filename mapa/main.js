// Crear el mapa centrado en Santiago
const map = L.map('map').setView([-33.457, -70.649], 13);

// Agregar capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap contributors'
}).addTo(map);

// Variables para nodos y conexiones
let nodos = {};
let conexiones = [];
let locales = {};

// Cargar GeoJSON de calles (red vial)
fetch('Api infraestructura/infraestructura.geojson')
    .then(response => response.json())
    .then(data => {
        // Procesar nodos de la red vial
        data.features.forEach(features => {
            const osmid = features.properties.osmid;
            const coords = features.geometry.coordinates;
            nodos[osmid] = coords;

            // Visualizar nodos en el mapa
            L.circleMarker([coords[1], coords[0]], {
                radius: 5,
                color: 'blue',
                fillColor: '#3388ff',
                fillOpacity: 0.8
            }).bindPopup(`<strong>ID:</strong> ${osmid}`).addTo(map);
        });

        // Generar conexiones entre nodos de la red vial
        generarConexiones(nodos, conexiones);

        // Cargar GeoJSON de locales comerciales
        return fetch('Api metadata/locales.geojson');
    })
    .then(response => response.json())
    .then(data => {
        // Procesar los locales comerciales
        data.features.forEach(features => {
            const localId = features.properties.id;
            const coords = features.geometry.coordinates;
            locales[localId] = coords;

            // Conectar el local al nodo más cercano en la red vial
            const nodoCercano = encontrarNodoMasCercano(coords, nodos);
            conexiones.push([localId, nodoCercano]);

            // Visualizar locales en el mapa
            L.marker([coords[1], coords[0]], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    iconSize: [25, 25]
                })
            }).bindPopup(`<strong>Nombre:</strong> ${features.properties.name}<br>
                          <strong>Dirección:</strong> ${features.ssproperties.address}`).addTo(map);
        });

        console.log("Locales conectados al grafo.");
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para generar conexiones entre nodos de la red vial
function generarConexiones(nodos, conexiones) {
    const ids = Object.keys(nodos);
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const id1 = ids[i];
            const id2 = ids[j];
            const distancia = calcularDistancia(nodos[id1], nodos[id2]);

            // Establecer umbral para crear conexiones
            if (distancia < 500) { // 500 metros
                conexiones.push([id1, id2]);
            }
        }
    }
}

// Función para calcular la distancia entre dos coordenadas
function calcularDistancia(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

// Función para encontrar el nodo más cercano a un punto dado
function encontrarNodoMasCercano(coord, nodos) {
    let nodoCercano = null;
    let distanciaMinima = Infinity;

    for (const [id, nodoCoord] of Object.entries(nodos)) {
        const distancia = calcularDistancia(coord, nodoCoord);
        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            nodoCercano = id;
        }
    }

    return nodoCercano;
}

// Escuchar el evento de clic en el mapa para seleccionar un punto de inicio
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    const nodoCercano = encontrarNodoMasCercano([lon, lat], nodos);
    alert(`Nodo más cercano: ${nodoCercano}`);
});
