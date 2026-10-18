package ec.cue.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.DayOfWeek;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import ec.cue.backend.dto.CalcularPagoRequest;
import ec.cue.backend.dto.ConfiguracionPagoRequest;
import ec.cue.backend.dto.CrearEmpleadoRequest;
import ec.cue.backend.dto.CrearRegistroRequest;
import ec.cue.backend.dto.EmpleadoResponse;
import ec.cue.backend.dto.OrdenPagoDTO;
import ec.cue.backend.model.EstadoPago;
import ec.cue.backend.repository.OrdenPagoRepository;
import ec.cue.backend.service.ConfiguracionPagoService;
import ec.cue.backend.service.EmpleadoService;
import ec.cue.backend.service.PagoService;
import ec.cue.backend.service.RegistroService;

// Previsualizar debe calcular exactamente lo mismo que /calcular sin guardar nada, porque la
// pantalla de pagos muestra ese resumen antes de que la ADMIN confirme.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PagoPrevisualizarTest {

	@LocalServerPort
	private int port;

	@Autowired
	private EmpleadoService empleadoService;

	@Autowired
	private RegistroService registroService;

	@Autowired
	private ConfiguracionPagoService configuracionPagoService;

	@Autowired
	private PagoService pagoService;

	@Autowired
	private OrdenPagoRepository ordenPagoRepository;

	private final HttpClient client = HttpClient.newHttpClient();

	@Test
	void previsualizarNoGuardaYCoincideConCalcular() {
		EmpleadoResponse empleado = empleadoService.crear(
				new CrearEmpleadoRequest("previa_empleado", "empleado123", "Empleado Previa", new BigDecimal("1.50")));
		configuracionPagoService.actualizar(new ConfiguracionPagoRequest(new BigDecimal("0.25"), new BigDecimal("0.10")));
		registroService.crear("previa_empleado", new CrearRegistroRequest("Verde", "M", 4, 2, 0));
		registroService.crear("previa_empleado", new CrearRegistroRequest("Rosa", "S", 0, 3, 5));
		LocalDate semanaInicio = LocalDate.now().with(DayOfWeek.MONDAY);
		long pagosAntes = ordenPagoRepository.count();

		OrdenPagoDTO previa = pagoService.previsualizar(empleado.id(), semanaInicio);

		assertEquals(pagosAntes, ordenPagoRepository.count());
		assertNull(previa.id());
		assertNull(previa.fechaPago());
		assertEquals(EstadoPago.PENDIENTE, previa.estado());
		assertEquals(0, new BigDecimal("6.00").compareTo(previa.montoBlusas()));
		assertEquals(0, new BigDecimal("1.25").compareTo(previa.montoMullos()));
		assertEquals(0, new BigDecimal("0.50").compareTo(previa.montoAtaches()));
		assertEquals(0, new BigDecimal("7.75").compareTo(previa.montoTotal()));

		OrdenPagoDTO pagado = pagoService.calcular(new CalcularPagoRequest(empleado.id(), semanaInicio));

		assertEquals(previa.semanaFin(), pagado.semanaFin());
		assertEquals(previa.totalBlusas(), pagado.totalBlusas());
		assertEquals(previa.totalConMullos(), pagado.totalConMullos());
		assertEquals(previa.totalConAtaches(), pagado.totalConAtaches());
		assertEquals(0, previa.montoBlusas().compareTo(pagado.montoBlusas()));
		assertEquals(0, previa.montoMullos().compareTo(pagado.montoMullos()));
		assertEquals(0, previa.montoAtaches().compareTo(pagado.montoAtaches()));
		assertEquals(0, previa.montoTotal().compareTo(pagado.montoTotal()));

		ResponseStatusException ex = assertThrows(ResponseStatusException.class,
				() -> pagoService.previsualizar(empleado.id(), semanaInicio));
		assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
	}

	@Test
	void previsualizarSinParametrosDevuelve400() throws Exception {
		HttpRequest login = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/login"))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"jefa\",\"password\":\"jefa1234\"}"))
				.build();
		String token = client.send(login, HttpResponse.BodyHandlers.ofString()).body()
				.replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");

		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/pagos/previsualizar?empleadoId=1"))
				.header("Authorization", "Bearer " + token)
				.GET()
				.build();

		assertEquals(400, client.send(request, HttpResponse.BodyHandlers.ofString()).statusCode());
	}
}
