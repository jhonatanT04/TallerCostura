package ec.cue.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ec.cue.backend.dto.CrearEmpleadoRequest;
import ec.cue.backend.dto.EmpleadoResponse;
import ec.cue.backend.model.Role;
import ec.cue.backend.model.Usuario;
import ec.cue.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmpleadoService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;

	public EmpleadoResponse crear(CrearEmpleadoRequest request) {
		if (usuarioRepository.existsByUsername(request.username())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El username ya está en uso");
		}

		Usuario usuario = Usuario.builder()
				.username(request.username())
				.password(passwordEncoder.encode(request.password()))
				.nombreCompleto(request.nombreCompleto())
				.role(Role.EMPLEADO)
				.activo(true)
				.build();
		usuario = usuarioRepository.save(usuario);

		return toResponse(usuario);
	}

	public List<EmpleadoResponse> listar() {
		return usuarioRepository.findByRole(Role.EMPLEADO).stream()
				.map(this::toResponse)
				.toList();
	}

	private EmpleadoResponse toResponse(Usuario usuario) {
		return new EmpleadoResponse(usuario.getId(), usuario.getUsername(), usuario.getNombreCompleto());
	}
}
