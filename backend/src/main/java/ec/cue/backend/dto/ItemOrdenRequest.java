package ec.cue.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ItemOrdenRequest(
		@NotBlank String color,
		@Min(value = 1, message = "La cantidad debe ser al menos 1") int cantidad,
		@NotNull @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0") BigDecimal precioUnitario) {
}
