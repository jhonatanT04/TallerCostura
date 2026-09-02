package ec.cue.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CrearRegistroRequest(
		@NotBlank String color,
		@NotBlank String talla,
		boolean tieneMullos,
		boolean tieneAtaches,
		@Min(value = 1, message = "La cantidad debe ser al menos 1") int cantidad) {
}
