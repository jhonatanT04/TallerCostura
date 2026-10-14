package ec.cue.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CrearRegistroRequest(
		@NotBlank String color,
		@NotBlank String talla,
		@Min(value = 0, message = "La cantidad de confección no puede ser negativa") int cantidadConfeccion,
		@Min(value = 0, message = "La cantidad de mullos no puede ser negativa") int cantidadMullos,
		@Min(value = 0, message = "La cantidad de ataches no puede ser negativa") int cantidadAtaches) {
}
