package ec.cue.backend.service;

import java.util.Set;

/**
 * El frontend ya restringe los valores de talla; esto solo evita datos corruptos si algo
 * distinto al cliente oficial llama a la API.
 */
final class TallaCatalog {

	static final Set<String> VALIDAS = Set.of(
			"XS", "S", "M", "L", "XL", "XXL",
			"36", "38", "40", "42", "44", "46");

	private TallaCatalog() {
	}
}
