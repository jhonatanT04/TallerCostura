package ec.cue.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record CrearOrdenRequest(
		@NotNull Long clienteId,
		@NotEmpty(message = "La orden debe tener al menos un grupo de blusas") @Valid List<ItemOrdenRequest> items) {
}
