package ec.cue.backend.dto;

import java.time.Instant;

public record RegistroDTO(
		Long id,
		String color,
		String talla,
		int cantidadConfeccion,
		int cantidadMullos,
		int cantidadAtaches,
		Instant fechaRegistro,
		EmpleadoResponse empleado) {
}
