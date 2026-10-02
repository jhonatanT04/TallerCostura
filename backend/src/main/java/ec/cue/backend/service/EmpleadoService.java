package ec.cue.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ec.cue.backend.dto.ActualizarPagoEmpleadoRequest;
import ec.cue.backend.dto.CambiarPasswordRequest;
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
				.pagoPorBlusa(request.pagoPorBlusa() != null ? request.pagoPorBlusa() : BigDecimal.ZERO)
				.build();
		usuario = usuarioRepository.save(usuario);

		return toResponse(usuario);
	}

	public List<EmpleadoResponse> listar() {
		return usuarioRepository.findByRoleAndEliminadoFalse(Role.EMPLEADO).stream()
				.map(this::toResponse)
				.toList();
	}

	public EmpleadoResponse activar(Long id) {
		Usuario usuario = buscarEmpleadoVigente(id);

		usuario.setActivo(true);
		usuario = usuarioRepository.save(usuario);

		return toResponse(usuario);
	}

	public EmpleadoResponse actualizarPago(Long id, ActualizarPagoEmpleadoRequest request) {
		Usuario usuario = buscarEmpleadoVigente(id);

		usuario.setPagoPorBlusa(request.pagoPorBlusa());
		usuario = usuarioRepository.save(usuario);

		return toResponse(usuario);
	}

	public void cambiarPassword(Long id, CambiarPasswordRequest request) {
		Usuario usuario = usuarioRepository.findById(id)
				.filter(u -> !u.isEliminado())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

		usuario.setPassword(passwordEncoder.encode(request.password()));
		usuarioRepository.save(usuario);
	}

	public void eliminar(Long id) {
		Usuario usuario = buscarEmpleadoVigente(id);

		usuario.setEliminado(true);
		usuarioRepository.save(usuario);
	}

	private Usuario buscarEmpleadoVigente(Long id) {
		return usuarioRepository.findById(id)
				.filter(u -> u.getRole() == Role.EMPLEADO && !u.isEliminado())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));
	}

	private EmpleadoResponse toResponse(Usuario usuario) {
		return new EmpleadoResponse(usuario.getId(), usuario.getUsername(), usuario.getNombreCompleto(),
				usuario.isActivo(), usuario.getPagoPorBlusa());
	}
}
