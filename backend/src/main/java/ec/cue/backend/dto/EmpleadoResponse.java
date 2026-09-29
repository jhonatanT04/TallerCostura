package ec.cue.backend.dto;

import java.math.BigDecimal;

public record EmpleadoResponse(
		Long id,
		String username,
		String nombreCompleto,
		boolean activo,
		BigDecimal pagoPorBlusa) {
}
