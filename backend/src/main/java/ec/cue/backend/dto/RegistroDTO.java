package ec.cue.backend.dto;

import java.time.Instant;

public record RegistroDTO(
		Long id,
		String color,
		String talla,
		boolean tieneMullos,
		boolean tieneAtaches,
		int cantidad,
		Instant fechaRegistro,
		EmpleadoResponse empleado) {
}
