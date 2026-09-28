package ec.cue.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CrearClienteRequest(
		@NotBlank String nombre,
		String telefono) {
}
