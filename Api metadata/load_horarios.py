import requests
import geopandas as gpd
import json
from shapely.geometry import Point
import os

# Ruta al archivo GeoJSON
input_file = 'locales.geojson'
output_file = 'locales_con_horarios.geojson'

# Carga el archivo GeoJSON
locales_gdf = gpd.read_file(input_file)

# Inicializa la columna 'opening_hours' para evitar el error
locales_gdf['opening_hours'] = None

# Tu clave de API de Google
API_KEY = os.environ['API_GOOGLE']

# Función para obtener el Place ID usando Google Places Text Search
def get_place_id(name, location, api_key):
    search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": name,
        "location": f"{location.y},{location.x}",
        "key": api_key,
    }
    response = requests.get(search_url, params=params)
    if response.status_code == 200:
        results = response.json().get("results")
        if results:
            return results[0]["place_id"]
    return None

# Función para obtener el horario de atención usando Google Places Details
def get_opening_hours(place_id, api_key):
    details_url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "opening_hours",
        "key": api_key,
    }
    response = requests.get(details_url, params=params)
    if response.status_code == 200:
        result = response.json().get("result")
        if result and "opening_hours" in result:
            return result["opening_hours"].get("weekday_text", [])
    return None

# Agregar horarios al archivo GeoJSON
for idx, row in locales_gdf.iterrows():
    name = row["name"]
    location = row["geometry"]
    
    # Obtener el Place ID del local
    place_id = get_place_id(name, location, API_KEY)
    
    if place_id:
        # Obtener el horario de atención del local
        opening_hours = get_opening_hours(place_id, API_KEY)
        locales_gdf.at[idx, "opening_hours"] = opening_hours
    else:
        locales_gdf.at[idx, "opening_hours"] = "Horario no disponible"

# Guardar el archivo GeoJSON actualizado
locales_gdf.to_file(output_file, driver="GeoJSON")

print(f"Archivo actualizado guardado como {output_file}")
