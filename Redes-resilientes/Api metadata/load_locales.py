import requests
import json

# Guardar los datos en un archivo JSON
def save_data_to_json(data, filename='data.json'):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# Obtener datos desde la API
def fetch_data():
    url = "https://consumidores.pluxee.cl/locales/cabecera/16"
    params = {
        "latitude": -33.4569400,
        "longitude": -70.6482700,
        "distance": 40000,
        # Otros parámetros si son necesarios
    }
    
    response = requests.get(url, params=params)

    # url = "https://consumidores.pluxee.cl/locales/cabecera/16?latitude=-33.4569400&longitude=-70.6482700&originLatitude=&originLongitude=&distance=40000&searchField=&category=&notVisited=&favorite=&near=&priceFrom=&priceTo=&open=&pageNumber=&pageSize=&userId=&sortBy=&last=&_=1729102575387"

    # response = requests.get(url)
    
    if response.status_code == 200:
        return response.json()  # Suponiendo que la API retorna un JSON
    else:
        print(f"Error al obtener los datos de la API: {response.status_code}")
        return []

def save_data_to_geojson(data, filename='restaurantes.geojson'):
    geojson_data = {
        "type": "FeatureCollection",
        "features": []
    }

    for item in data:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [item['longitude'], item['latitude']]  # GeoJSON usa [longitud, latitud]
            },
            "properties": {
                "id": item['id'],
                "name": item['name'],
                "address": item['address'],
                "online_payment": item['onlinePayment'],
                "votes": item['votes'],
                "enable_to_like": item['enableToLike'],
                "external_id": item['externalId']
            }
        }
        geojson_data["features"].append(feature)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, ensure_ascii=False, indent=4)

# Programa principal
if __name__ == "__main__":
    data = fetch_data()  # Obtén los datos desde la API
    # print(data)

    if data:
        # save_data_to_json(data, 'locales.json')  # Guardar datos en un archivo JSON
        save_data_to_geojson(data, 'locales.geojson')  # Guardar datos en un archivo GeoJSON