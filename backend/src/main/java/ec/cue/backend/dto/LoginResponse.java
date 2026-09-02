package ec.cue.backend.dto;

import ec.cue.backend.model.Role;

public record LoginResponse(
		String token,
		Role role,
		String username,
		String nombreCompleto) {
}
