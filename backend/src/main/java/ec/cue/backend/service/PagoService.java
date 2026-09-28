package ec.cue.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ec.cue.backend.dto.CalcularPagoRequest;
import ec.cue.backend.dto.EmpleadoResponse;
import ec.cue.backend.dto.OrdenPagoDTO;
import ec.cue.backend.model.ConfiguracionPago;
import ec.cue.backend.model.EstadoPago;
import ec.cue.backend.model.OrdenPago;
import ec.cue.backend.model.RegistroBlusa;
import ec.cue.backend.model.Role;
import ec.cue.backend.model.Usuario;
import ec.cue.backend.repository.OrdenPagoRepository;
import ec.cue.backend.repository.RegistroBlusaRepository;
import ec.cue.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class PagoService {

	private final OrdenPagoRepository ordenPagoRepository;
	private final UsuarioRepository usuarioRepository;
	private final RegistroBlusaRepository registroBlusaRepository;
	private final ConfiguracionPagoService configuracionPagoService;

	@Transactional
	public OrdenPagoDTO calcular(CalcularPagoRequest request) {
		Usuario usuario = usuarioRepository.findById(request.empleadoId())
				.filter(u -> u.getRole() == Role.EMPLEADO)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));

		LocalDate semanaInicio = request.semanaInicio();
		LocalDate semanaFin = semanaInicio.plusDays(6);

		if (ordenPagoRepository.existsByUsuarioIdAndSemanaInicio(usuario.getId(), semanaInicio)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Ya se generó el pago de la semana del " + semanaInicio + " para este empleado");
		}

		Instant inicio = semanaInicio.atStartOfDay(ZoneId.systemDefault()).toInstant();
		Instant fin = semanaFin.atTime(LocalTime.MAX).atZone(ZoneId.systemDefault()).toInstant();

		List<RegistroBlusa> registros = registroBlusaRepository
				.findByUsuarioIdAndFechaRegistroBetweenOrderByFechaRegistroDesc(usuario.getId(), inicio, fin);

		int totalBlusas = registros.stream().mapToInt(RegistroBlusa::getCantidad).sum();
		int totalConMullos = registros.stream().filter(RegistroBlusa::isTieneMullos).mapToInt(RegistroBlusa::getCantidad).sum();
		int totalConAtaches = registros.stream().filter(RegistroBlusa::isTieneAtaches).mapToInt(RegistroBlusa::getCantidad).sum();

		ConfiguracionPago configuracion = configuracionPagoService.obtenerEntidad();

		BigDecimal montoBlusas = usuario.getPagoPorBlusa().multiply(BigDecimal.valueOf(totalBlusas));
		BigDecimal montoMullos = configuracion.getPrecioMullos().multiply(BigDecimal.valueOf(totalConMullos));
		BigDecimal montoAtaches = configuracion.getPrecioAtaches().multiply(BigDecimal.valueOf(totalConAtaches));
		BigDecimal montoTotal = montoBlusas.add(montoMullos).add(montoAtaches);

		OrdenPago ordenPago = OrdenPago.builder()
				.usuario(usuario)
				.semanaInicio(semanaInicio)
				.semanaFin(semanaFin)
				.totalBlusas(totalBlusas)
				.totalConMullos(totalConMullos)
				.totalConAtaches(totalConAtaches)
				.montoBlusas(montoBlusas)
				.montoMullos(montoMullos)
				.montoAtaches(montoAtaches)
				.montoTotal(montoTotal)
				.estado(EstadoPago.PAGADO)
				.fechaPago(Instant.now())
				.build();
		ordenPago = ordenPagoRepository.save(ordenPago);

		return toDto(ordenPago);
	}

	@Transactional(readOnly = true)
	public List<OrdenPagoDTO> listar() {
		return ordenPagoRepository.findAllByOrderByFechaPagoDesc().stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<OrdenPagoDTO> porEmpleado(Long empleadoId) {
		if (!usuarioRepository.existsById(empleadoId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado");
		}

		return ordenPagoRepository.findByUsuarioIdOrderByFechaPagoDesc(empleadoId).stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<OrdenPagoDTO> misPagos(String username) {
		Usuario usuario = usuarioRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

		return ordenPagoRepository.findByUsuarioIdOrderByFechaPagoDesc(usuario.getId()).stream()
				.map(this::toDto)
				.toList();
	}

	private OrdenPagoDTO toDto(OrdenPago ordenPago) {
		Usuario usuario = ordenPago.getUsuario();
		EmpleadoResponse empleado = new EmpleadoResponse(usuario.getId(), usuario.getUsername(),
				usuario.getNombreCompleto(), usuario.isActivo(), usuario.getPagoPorBlusa());

		return new OrdenPagoDTO(
				ordenPago.getId(),
				empleado,
				ordenPago.getSemanaInicio(),
				ordenPago.getSemanaFin(),
				ordenPago.getTotalBlusas(),
				ordenPago.getTotalConMullos(),
				ordenPago.getTotalConAtaches(),
				ordenPago.getMontoBlusas(),
				ordenPago.getMontoMullos(),
				ordenPago.getMontoAtaches(),
				ordenPago.getMontoTotal(),
				ordenPago.getEstado(),
				ordenPago.getFechaPago());
	}
}
