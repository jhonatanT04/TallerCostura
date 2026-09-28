package ec.cue.backend.dto;

import java.math.BigDecimal;

public record ItemOrdenDTO(
		Long id,
		String color,
		int cantidad,
		BigDecimal precioUnitario,
		BigDecimal subtotal) {
}
