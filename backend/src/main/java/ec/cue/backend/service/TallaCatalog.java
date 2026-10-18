package ec.cue.backend.service;

import java.util.Set;

/**
 * El frontend ya restringe los valores de talla; esto solo evita datos corruptos si algo
 * distinto al cliente oficial llama a la API.
 */
final class TallaCatalog {

	static final Set<String> VALIDAS = Set.of(
			"XS", "S", "M", "L", "XL", "XXL",
			"30","31","32","33","34","35","36","37","38", "39", "40","41", "42","43", "44", "45","46");

	private TallaCatalog() {
	}
}
