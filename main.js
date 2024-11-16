// Crear el mapa centrado en una ubicación predeterminada
const map = L.map('map').setView([-33.457, -70.649], 13); // Coordenadas de Santiago, Chile

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap contributors'
}).addTo(map);

// Objeto para almacenar las capas de GeoJSON
const capasGeoJSON = {};

// Función para cargar y visualizar un archivo GeoJSON
function cargarGeoJSON(url, nombre, opciones = {}) {
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

            // Almacenar la capa para control dinámico
            capasGeoJSON[nombre] = capaGeoJSON;

            // Añadir inicialmente la capa al mapa
            capaGeoJSON.addTo(map);

            // Crear una entrada en el selector
            agregarSelector(nombre);
        })
        .catch(error => console.error(`Error al cargar el archivo GeoJSON: ${url}`, error));
}

// Función para agregar una entrada al selector
function agregarSelector(nombre) {
    const selector = document.getElementById('selector');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = nombre;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = nombre;
    label.textContent = nombre;

    // Manejar el evento de cambio
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            capasGeoJSON[nombre].addTo(map); // Agregar capa al mapa
        } else {
            map.removeLayer(capasGeoJSON[nombre]); // Quitar capa del mapa
        }
    });

    // Añadir checkbox y etiqueta al selector
    selector.appendChild(checkbox);
    selector.appendChild(label);
    selector.appendChild(document.createElement('br'));
}

// Contenedor para el selector
const selectorDiv = document.createElement('div');
selectorDiv.id = 'selector';
selectorDiv.style.position = 'absolute';
selectorDiv.style.top = '10px';
selectorDiv.style.right = '10px';
selectorDiv.style.backgroundColor = 'white';
selectorDiv.style.padding = '10px';
selectorDiv.style.border = '1px solid #ccc';
selectorDiv.style.zIndex = '1000';
selectorDiv.style.fontFamily = 'Arial, sans-serif';
selectorDiv.innerHTML = '<strong>Capas Informacion:</strong><br>';
document.body.appendChild(selectorDiv);

// Llamadas para cargar tus archivos GeoJSON
cargarGeoJSON('https://raw.githubusercontent.com/caracena/chile-geojson/refs/heads/master/13.geojson', 'Infraestructura', {
    estilo: { color: 'red', weight: 1, dashArray: '5,5' }
});

cargarGeoJSON('Api metadata/locales.geojson', 'Locales Comerciales', {
    icono: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    estilo: { color: 'blue', weight: 2 }
});
