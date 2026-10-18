package ec.cue.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record ActualizarPagoEmpleadoRequest(
		@NotNull @DecimalMin(value = "0.0", inclusive = false, message = "La tarifa por blusa debe ser mayor a 0") BigDecimal pagoPorBlusa) {
}
