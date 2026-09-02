package ec.cue.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ec.cue.backend.dto.CrearRegistroRequest;
import ec.cue.backend.dto.EmpleadoResponse;
import ec.cue.backend.dto.RegistroDTO;
import ec.cue.backend.model.RegistroBlusa;
import ec.cue.backend.model.Usuario;
import ec.cue.backend.repository.RegistroBlusaRepository;
import ec.cue.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RegistroService {

	private final RegistroBlusaRepository registroBlusaRepository;
	private final UsuarioRepository usuarioRepository;

	public RegistroDTO crear(String username, CrearRegistroRequest request) {
		if (!TallaCatalog.VALIDAS.contains(request.talla())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Talla inválida: " + request.talla());
		}

		Usuario usuario = usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

		RegistroBlusa registro = RegistroBlusa.builder()
				.usuario(usuario)
				.color(request.color())
				.talla(request.talla())
				.tieneMullos(request.tieneMullos())
				.tieneAtaches(request.tieneAtaches())
				.cantidad(request.cantidad())
				.fechaRegistro(Instant.now())
				.build();
		registro = registroBlusaRepository.save(registro);

		return toDto(registro);
	}

	public List<RegistroDTO> misRegistros(String username) {
		Usuario usuario = usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

		return registroBlusaRepository.findByUsuarioIdOrderByFechaRegistroDesc(usuario.getId()).stream()
				.map(this::toDto)
				.toList();
	}

	public List<RegistroDTO> todos() {
		return registroBlusaRepository.findAllByOrderByFechaRegistroDesc().stream()
				.map(this::toDto)
				.toList();
	}

	public List<RegistroDTO> registrosPorEmpleado(Long empleadoId) {
		if (!usuarioRepository.existsById(empleadoId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado");
		}

		return registroBlusaRepository.findByUsuarioIdOrderByFechaRegistroDesc(empleadoId).stream()
				.map(this::toDto)
				.toList();
	}

	private RegistroDTO toDto(RegistroBlusa registro) {
		Usuario usuario = registro.getUsuario();
		EmpleadoResponse empleado = new EmpleadoResponse(usuario.getId(), usuario.getUsername(), usuario.getNombreCompleto());
		return new RegistroDTO(
				registro.getId(),
				registro.getColor(),
				registro.getTalla(),
				registro.isTieneMullos(),
				registro.isTieneAtaches(),
				registro.getCantidad(),
				registro.getFechaRegistro(),
				empleado);
	}
}
