package ec.cue.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrearEmpleadoRequest(
		@NotBlank String username,
		@NotBlank @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres") String password,
		@NotBlank String nombreCompleto,
		@DecimalMin(value = "0.0", message = "El pago por blusa no puede ser negativo") BigDecimal pagoPorBlusa) {
}
