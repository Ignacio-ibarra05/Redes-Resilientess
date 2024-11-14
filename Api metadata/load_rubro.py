import geopandas as gpd
import requests
import json
import time
import os

# Cargar el archivo GeoJSON
file_path = 'locales.geojson'
locales_gdf = gpd.read_file(file_path)

# Tu clave de API
API_KEY = os.environ['API_GOOGLE']

# Función para obtener el tipo de local usando la API de Google Places
def obtener_tipo_local(lat, lon, nombre):
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lon}",
        "radius": 50,  # Radio en metros para buscar cerca
        "keyword": nombre,
        "key": API_KEY
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if data['results']:
            return data['results'][0].get('types', [])
    return []

# Agregar tipo de local a cada entrada
tipos_locales = []
for idx, row in locales_gdf.iterrows():
    lat, lon = row.geometry.y, row.geometry.x
    nombre = row['name']
    tipos = obtener_tipo_local(lat, lon, nombre)
    tipos_locales.append(tipos)
    time.sleep(1)  # Retraso para evitar límite de tasa en la API

# Agregar los tipos obtenidos al GeoDataFrame
locales_gdf['types'] = tipos_locales

# Guardar el resultado en un nuevo archivo GeoJSON
output_path = 'locales_con_rubro.geojson'
locales_gdf.to_file(output_path, driver="GeoJSON")
