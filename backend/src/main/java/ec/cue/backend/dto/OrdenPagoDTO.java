package ec.cue.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import ec.cue.backend.model.EstadoPago;

public record OrdenPagoDTO(
		Long id,
		EmpleadoResponse empleado,
		LocalDate semanaInicio,
		LocalDate semanaFin,
		int totalBlusas,
		int totalConMullos,
		int totalConAtaches,
		BigDecimal montoBlusas,
		BigDecimal montoMullos,
		BigDecimal montoAtaches,
		BigDecimal montoTotal,
		EstadoPago estado,
		Instant fechaPago) {
}
