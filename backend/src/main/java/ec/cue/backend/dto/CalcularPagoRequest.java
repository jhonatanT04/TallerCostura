package ec.cue.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record CalcularPagoRequest(
		@NotNull Long empleadoId,
		@NotNull LocalDate semanaInicio) {
}
