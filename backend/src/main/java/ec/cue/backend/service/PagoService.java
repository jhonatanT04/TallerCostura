package ec.cue.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
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
		OrdenPago ordenPago = armarOrdenPago(request.empleadoId(), request.semanaInicio());
		ordenPago.setEstado(EstadoPago.PAGADO);
		ordenPago.setFechaPago(Instant.now());
		ordenPago = ordenPagoRepository.save(ordenPago);

		return toDto(ordenPago);
	}

	// Mismo cálculo que calcular, pero sin guardar: id y fechaPago quedan en null y el estado en
	// PENDIENTE. No es readOnly porque obtenerEntidad() puede insertar la configuración por defecto.
	@Transactional
	public OrdenPagoDTO previsualizar(Long empleadoId, LocalDate semanaInicio) {
		return toDto(armarOrdenPago(empleadoId, semanaInicio));
	}

	private OrdenPago armarOrdenPago(Long empleadoId, LocalDate semanaInicio) {
		Usuario usuario = usuarioRepository.findById(empleadoId)
				.filter(u -> u.getRole() == Role.EMPLEADO)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));

		LocalDate semanaFin = semanaInicio.plusDays(6);

		if (ordenPagoRepository.existsByUsuarioIdAndSemanaInicio(usuario.getId(), semanaInicio)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Ya se generó el pago de la semana del " + semanaInicio + " para este empleado");
		}

		Instant inicio = semanaInicio.atStartOfDay(ZoneId.systemDefault()).toInstant();
		Instant fin = semanaFin.atTime(LocalTime.MAX).atZone(ZoneId.systemDefault()).toInstant();

		List<RegistroBlusa> registros = registroBlusaRepository
				.findByUsuarioIdAndFechaRegistroBetweenOrderByFechaRegistroDesc(usuario.getId(), inicio, fin);

		int totalBlusas = registros.stream().mapToInt(RegistroBlusa::getCantidadConfeccion).sum();
		int totalConMullos = registros.stream().mapToInt(RegistroBlusa::getCantidadMullos).sum();
		int totalConAtaches = registros.stream().mapToInt(RegistroBlusa::getCantidadAtaches).sum();

		ConfiguracionPago configuracion = configuracionPagoService.obtenerEntidad();

		// Un pago no se puede deshacer, así que no se permite pagar trabajo con tarifa 0. Se juntan
		// todos los problemas en un mensaje para que la ADMIN los corrija de una vez.
		List<String> sinTarifa = new ArrayList<>();
		if (totalBlusas > 0 && usuario.getPagoPorBlusa().signum() == 0) {
			sinTarifa.add("El empleado " + usuario.getNombreCompleto() + " no tiene tarifa por blusa configurada");
		}
		if (totalConMullos > 0 && configuracion.getPrecioMullos().signum() == 0) {
			sinTarifa.add("No hay precio de mullos configurado");
		}
		if (totalConAtaches > 0 && configuracion.getPrecioAtaches().signum() == 0) {
			sinTarifa.add("No hay precio de ataches configurado");
		}
		if (!sinTarifa.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, String.join(". ", sinTarifa));
		}

		BigDecimal montoBlusas = usuario.getPagoPorBlusa().multiply(BigDecimal.valueOf(totalBlusas));
		BigDecimal montoMullos = configuracion.getPrecioMullos().multiply(BigDecimal.valueOf(totalConMullos));
		BigDecimal montoAtaches = configuracion.getPrecioAtaches().multiply(BigDecimal.valueOf(totalConAtaches));
		BigDecimal montoTotal = montoBlusas.add(montoMullos).add(montoAtaches);

		return OrdenPago.builder()
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
				.estado(EstadoPago.PENDIENTE)
				.build();
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
