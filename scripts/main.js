// Crear el mapa centrado en una ubicación predeterminada
const map = L.map('map').setView([-33.457, -70.649], 13); // Coordenadas de Santiago, Chile

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap contributors'
}).addTo(map);

// Variables para almacenamiento
const comunas = {}; // Almacenar capas por comuna
const localesMarkers = []; // Almacenar marcadores de locales
let userLocationMarker = null; // Almacenar el marcador de la ubicación del usuario
let routingControl = null; // Control de ruta

function obtenerUbicacionUsuario() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                ubicarUsuarioEnMapa(latitude, longitude);
            },
            (error) => {
                console.error('Error al obtener la ubicación del usuario:', error.message);
                solicitarUbicacionManual();
            }
        );
    } else {
        alert('La geolocalización no está soportada en este navegador.');
        solicitarUbicacionManual();
    }
}

// Función para solicitar la ubicación manualmente
function solicitarUbicacionManual() {
    const latitud = parseFloat(prompt('Ingresa tu latitud:', '-33.457'));
    const longitud = parseFloat(prompt('Ingresa tu longitud:', '-70.649'));

    if (!isNaN(latitud) && !isNaN(longitud)) {
        ubicarUsuarioEnMapa(latitud, longitud);
    } else {
        alert('Coordenadas inválidas. No se pudo establecer tu ubicación.');
    }
}

// Función para ubicar al usuario en el mapa
function ubicarUsuarioEnMapa(latitud, longitud) {
    // Centrar el mapa en la ubicación del usuario
    map.setView([latitud, longitud], 15);

    // Agregar un marcador para la ubicación del usuario
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker); // Eliminar marcador previo
    }

    userLocationMarker = L.marker([latitud, longitud], {
        icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
            iconSize: [30, 30]
        })
    }).bindPopup('<strong>Tu ubicación</strong>').addTo(map);
}

// Función para cargar y visualizar un archivo GeoJSON
function cargarGeoJSON(url, opciones = {}) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Crear una capa de GeoJSON
            const capaGeoJSON = L.geoJSON(data, {
                style: opciones.estilo || { color: 'blue', weight: 2, fillOpacity: 0.2 },
                onEachFeature: (feature, layer) => {
                    // Obtener el valor de la comuna
                    const comuna = feature.properties.Comuna || 'Desconocida';

                    // Crear la capa de la comuna si no existe
                    if (!comunas[comuna]) {
                        comunas[comuna] = {
                            layer: L.layerGroup(),
                            polygon: layer.getBounds() // Obtener el polígono de la comuna
                        };
                    }

                    // Agregar el elemento a la capa de la comuna
                    comunas[comuna].layer.addLayer(layer);

                    // Agregar popup con propiedades
                    const propiedades = Object.entries(feature.properties || {})
                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                        .join('<br>');
                    layer.bindPopup(`
                        <strong>Comuna:</strong> ${comuna}<br>
                        ${propiedades || 'Sin propiedades adicionales'}
                    `);
                }
            });

            // Las capas de comunas no se agregan al mapa inicialmente
            crearFiltroComunas();
        })
        .catch(error => console.error(`Error al cargar el archivo GeoJSON: ${url}`, error));
}

function filtrarLocales(comuna) {
    // Eliminar todos los marcadores del mapa
    localesMarkers.forEach(({ marker }) => map.removeLayer(marker));

    // Obtener el selector de locales
    const selectorLocales = document.getElementById('locales');
    selectorLocales.innerHTML = '<option value="">-- Selecciona un local --</option>'; // Resetear contenido

    // Si la comuna está habilitada, mostrar los locales dentro de su polígono
    if (comunas[comuna]) {
        const { polygon } = comunas[comuna];

        localesMarkers.forEach(({ marker, coordinates, name, id }) => {
            const latlng = L.latLng(coordinates[1], coordinates[0]);

            if (polygon.contains(latlng)) {
                // Agregar el marcador al mapa si está dentro del polígono
                marker.addTo(map);

                // Agregar el local al selector
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                selectorLocales.appendChild(option);
            }
        });
    }
}


// Función para crear el filtro por comuna
function crearFiltroComunas() {
    const selector = document.getElementById('filtro-comunas');
    selector.innerHTML = ''; // Limpiar contenido previo

    // Ordenar las comunas alfabéticamente
    const comunasOrdenadas = Object.keys(comunas).sort();

    comunasOrdenadas.forEach(comuna => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = comuna;
        checkbox.checked = false; // Inicia deshabilitada

        const label = document.createElement('label');
        label.htmlFor = comuna;
        label.textContent = comuna;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                comunas[comuna].layer.addTo(map); // Mostrar capa
                filtrarLocales(comuna); // Filtrar locales dentro de la comuna
            } else {
                map.removeLayer(comunas[comuna].layer); // Ocultar capa
                localesMarkers.forEach(({ marker }) => map.removeLayer(marker)); // Eliminar los marcadores
            }
        });

        selector.appendChild(checkbox);
        selector.appendChild(label);
        selector.appendChild(document.createElement('br'));
    });
}

// Función para cargar los locales
function cargarLocales(url) {
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            // Procesar cada local
            data.features.forEach((feature) => {
                const { coordinates } = feature.geometry;
                const { id, name, address } = feature.properties;

                // Crear un marcador para el local
                const marker = L.marker([coordinates[1], coordinates[0]], {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                        iconSize: [25, 25]
                    })
                }).bindPopup(`
                    <strong>Nombre:</strong> ${name}<br>
                    <strong>Dirección:</strong> ${address}
                `);

                // Agregar el marcador al mapa
                marker.addTo(map);

                // Almacenar el marcador
                localesMarkers.push({
                    id,
                    name,
                    address,
                    coordinates,
                    marker
                });
            });

            // Actualizar el selector con los locales cargados
            actualizarSelectorLocales();
        })
        .catch((error) => console.error(`Error al cargar los locales: ${url}`, error));
}

// Función para actualizar el selector con los locales en localesMarkers
function actualizarSelectorLocales() {
    const selectorLocales = document.getElementById('locales');
    selectorLocales.innerHTML = '<option value="">-- Selecciona un local --</option>'; // Resetear contenido

    localesMarkers.forEach((local) => {
        const option = document.createElement('option');
        option.value = local.id;
        option.textContent = local.name;
        selectorLocales.appendChild(option);
    });
}

// Función para calcular la ruta
function calcularRuta() {
    const selector = document.getElementById('locales');
    const localSeleccionado = localesMarkers.find(
        (local) => local.id === parseInt(selector.value)
    );

    if (!localSeleccionado) {
        alert('Por favor, selecciona un local.');
        return;
    }

    if (!userLocationMarker) {
        alert('Por favor, establece tu ubicación primero.');
        return;
    }

    const [localLng, localLat] = localSeleccionado.coordinates;

    // Eliminar cualquier ruta previa
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Agregar una nueva ruta
    routingControl = L.Routing.control({
        waypoints: [
            userLocationMarker.getLatLng(), // Ubicación del usuario
            L.latLng(localLat, localLng) // Ubicación del local
        ],
        routeWhileDragging: true,
        createMarker: function (i, waypoint, n) {
            const icons = [
                'https://cdn-icons-png.flaticon.com/512/447/447031.png', // Usuario
                'https://cdn-icons-png.flaticon.com/512/149/149071.png' // Local
            ];
            return L.marker(waypoint.latLng, {
                icon: L.icon({
                    iconUrl: icons[i],
                    iconSize: [30, 30]
                })
            });
        }
    }).addTo(map);
}

// Agregar evento al botón de calcular ruta
document.getElementById('calcularRuta').addEventListener('click', calcularRuta);

// Cargar los archivos GeoJSON
cargarGeoJSON('https://raw.githubusercontent.com/caracena/chile-geojson/refs/heads/master/13.geojson'); // Archivo de comunas
cargarLocales('Api metadata/locales.geojson'); // Archivo de locales

// Llamar a la función para obtener la ubicación del usuario
obtenerUbicacionUsuario();
