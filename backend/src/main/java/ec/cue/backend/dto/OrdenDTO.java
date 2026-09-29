package ec.cue.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrdenDTO(
		Long id,
		ClienteResponse cliente,
		Instant fechaCreacion,
		List<ItemOrdenDTO> items,
		int totalBlusas,
		BigDecimal total) {
}
