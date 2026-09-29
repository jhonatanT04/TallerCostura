package ec.cue.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record ActualizarPagoEmpleadoRequest(
		@NotNull @DecimalMin(value = "0.0", message = "El pago por blusa no puede ser negativo") BigDecimal pagoPorBlusa) {
}
