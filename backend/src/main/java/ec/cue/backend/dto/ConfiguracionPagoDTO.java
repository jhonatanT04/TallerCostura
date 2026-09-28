package ec.cue.backend.dto;

import java.math.BigDecimal;

public record ConfiguracionPagoDTO(
		BigDecimal precioMullos,
		BigDecimal precioAtaches) {
}
