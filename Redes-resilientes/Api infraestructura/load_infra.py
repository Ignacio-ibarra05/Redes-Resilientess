import osmnx as ox
import geopandas as gpd

# Define el área geográfica como la región metropolitana de Santiago
place = "Región Metropolitana de Santiago, Chile"

# Descargar todas las calles de la región
G = ox.graph_from_place(place, network_type="drive")

# Convertir el grafo a GeoDataFrames de nodos y aristas
nodes, edges = ox.graph_to_gdfs(G, nodes=True, edges=True)

# Filtrar solo las intersecciones (nodos donde se cruzan más de 2 calles)
intersections = nodes[nodes['street_count'] > 2]

# Exportar a GeoJSON
intersections.to_file("infraestructura.geojson", driver="GeoJSON")
