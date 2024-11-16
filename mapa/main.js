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
fetch('https://raw.githubusercontent.com/caracena/chile-geojson/refs/heads/master/13.geojson')
    .then(response => response.json())
    .then(data => {
        // Procesar nodos de la red vial y visualizarlos en clusters
        const nodosCluster = L.markerClusterGroup();

        data.features.forEach(feature => {
            const osmid = feature.properties.osmid;
            const coords = feature.geometry.coordinates;
            nodos[osmid] = coords;

            // Añadir nodos al cluster
            const marker = L.circleMarker([coords[1], coords[0]], {
                radius: 5,
                color: 'blue',
                fillColor: '#3388ff',
                fillOpacity: 0.8
            }).bindPopup(`<strong>ID:</strong> ${osmid}`);
            nodosCluster.addLayer(marker);
        });

        map.addLayer(nodosCluster);

        // Generar conexiones de forma asíncrona
        generarConexionesAsync(nodos, conexiones);

        // Cargar GeoJSON de locales comerciales
        return fetch('Api metadata/locales.geojson');
    })
    .then(response => response.json())
    .then(data => {
        // Procesar los locales comerciales y visualizarlos en clusters
        const localesCluster = L.markerClusterGroup();

        data.features.forEach(feature => {
            const localId = feature.properties.id;
            const coords = feature.geometry.coordinates;
            locales[localId] = coords;

            // Conectar el local al nodo más cercano
            const nodoCercano = encontrarNodoMasCercano(coords, nodos);
            conexiones.push([localId, nodoCercano]);

            // Añadir locales al cluster
            const marker = L.marker([coords[1], coords[0]], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    iconSize: [25, 25]
                })
            }).bindPopup(`
                <strong>Nombre:</strong> ${feature.properties.name}<br>
                <strong>Dirección:</strong> ${feature.properties.address}
            `);
            localesCluster.addLayer(marker);
        });

        map.addLayer(localesCluster);
        console.log("Locales conectados al grafo.");
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función asíncrona para generar conexiones
function generarConexionesAsync(nodos, conexiones) {
    const ids = Object.keys(nodos);
    let i = 0;
    let j = 0;

    function procesar() {
        const start = performance.now();

        while (i < ids.length) {
            while (j < ids.length) {
                if (i !== j) {
                    const id1 = ids[i];
                    const id2 = ids[j];
                    const distancia = calcularDistancia(nodos[id1], nodos[id2]);

                    if (distancia < 500) { // Umbral de 500 metros
                        conexiones.push([id1, id2]);
                    }
                }
                j++;
                if (performance.now() - start > 16) break; // Evitar bloqueo
            }

            if (j >= ids.length) {
                i++;
                j = i + 1;
            }

            if (performance.now() - start > 16) break;
        }

        if (i < ids.length) {
            setTimeout(procesar, 0); // Continuar en el siguiente ciclo de eventos
        } else {
            console.log("Conexiones generadas");
        }
    }

    procesar();
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
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    const nodoCercano = encontrarNodoMasCercano([lon, lat], nodos);
    alert(`Nodo más cercano: ${nodoCercano}`);
});
