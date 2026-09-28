package ec.cue.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record ConfiguracionPagoRequest(
		@NotNull @DecimalMin(value = "0.0", message = "El precio no puede ser negativo") BigDecimal precioMullos,
		@NotNull @DecimalMin(value = "0.0", message = "El precio no puede ser negativo") BigDecimal precioAtaches) {
}
