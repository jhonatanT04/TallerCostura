# El frontend ya restringe los valores de talla; esto solo evita datos corruptos si algo
# distinto al cliente oficial llama a la API.
TALLAS_VALIDAS = frozenset(
    ["XS", "S", "M", "L", "XL", "XXL"] + [str(n) for n in range(30, 47)]
)
