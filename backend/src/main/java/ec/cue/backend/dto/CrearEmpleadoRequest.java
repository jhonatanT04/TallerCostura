package ec.cue.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrearEmpleadoRequest(
		@NotBlank String username,
		@NotBlank @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres") String password,
		@NotBlank String nombreCompleto) {
}
