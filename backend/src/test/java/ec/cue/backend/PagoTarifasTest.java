package ec.cue.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import ec.cue.backend.repository.OrdenPagoRepository;
import ec.cue.backend.service.ConfiguracionPagoService;
import ec.cue.backend.service.EmpleadoService;
import ec.cue.backend.service.PagoService;
import ec.cue.backend.service.RegistroService;

// Un pago no se puede deshacer: pagar trabajo con tarifa 0 debe fallar antes de guardar, tanto al
// previsualizar como al confirmar.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PagoTarifasTest {

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

	private final LocalDate semanaInicio = LocalDate.now().with(DayOfWeek.MONDAY);

	private void configurarPrecios(String mullos, String ataches) {
		configuracionPagoService.actualizar(new ConfiguracionPagoRequest(new BigDecimal(mullos), new BigDecimal(ataches)));
	}

	private EmpleadoResponse crearEmpleado(String username, String nombre, BigDecimal tarifa) {
		return empleadoService.crear(new CrearEmpleadoRequest(username, "empleado123", nombre, tarifa));
	}

	private ResponseStatusException assertConflicto(Runnable accion) {
		ResponseStatusException ex = assertThrows(ResponseStatusException.class, accion::run);
		assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
		return ex;
	}

	@Test
	void tarifaCeroConBlusasDevuelve409YNoGuarda() {
		configurarPrecios("0.25", "0.10");
		EmpleadoResponse empleado = crearEmpleado("tarifa_cero", "Ana Cero", null);
		registroService.crear("tarifa_cero", new CrearRegistroRequest("Verde", "M", 3, 0, 0));
		long pagosAntes = ordenPagoRepository.count();

		ResponseStatusException previa = assertConflicto(() -> pagoService.previsualizar(empleado.id(), semanaInicio));
		assertConflicto(() -> pagoService.calcular(new CalcularPagoRequest(empleado.id(), semanaInicio)));

		assertEquals("El empleado Ana Cero no tiene tarifa por blusa configurada", previa.getReason());
		assertEquals(pagosAntes, ordenPagoRepository.count());
	}

	@Test
	void tarifaCeroSinBlusasSePuedePagar() {
		configurarPrecios("0.25", "0.10");
		EmpleadoResponse empleado = crearEmpleado("tarifa_cero_mullos", "Bea Mullos", null);
		registroService.crear("tarifa_cero_mullos", new CrearRegistroRequest("Rosa", "S", 0, 2, 0));

		OrdenPagoDTO previa = pagoService.previsualizar(empleado.id(), semanaInicio);

		assertEquals(0, new BigDecimal("0.50").compareTo(previa.montoTotal()));
	}

	@Test
	void precioMullosCeroConMullosDevuelve409() {
		configurarPrecios("0", "0.10");
		EmpleadoResponse empleado = crearEmpleado("sin_precio_mullos", "Carla Mullos", new BigDecimal("1.00"));
		registroService.crear("sin_precio_mullos", new CrearRegistroRequest("Azul", "L", 1, 2, 0));

		ResponseStatusException ex = assertConflicto(() -> pagoService.previsualizar(empleado.id(), semanaInicio));

		assertEquals("No hay precio de mullos configurado", ex.getReason());
	}

	@Test
	void variosProblemasSeJuntanEnUnMensaje() {
		configurarPrecios("0", "0.00");
		EmpleadoResponse empleado = crearEmpleado("todo_cero", "Dora Cero", null);
		registroService.crear("todo_cero", new CrearRegistroRequest("Negro", "M", 1, 1, 1));

		ResponseStatusException ex = assertConflicto(() -> pagoService.previsualizar(empleado.id(), semanaInicio));

		assertEquals("El empleado Dora Cero no tiene tarifa por blusa configurada. "
				+ "No hay precio de mullos configurado. No hay precio de ataches configurado", ex.getReason());
	}

	@Test
	void patchTarifaCeroDevuelve400() throws Exception {
		EmpleadoResponse empleado = crearEmpleado("patch_cero", "Eva Patch", null);
		HttpRequest login = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/login"))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"jefa\",\"password\":\"jefa1234\"}"))
				.build();
		String token = client.send(login, HttpResponse.BodyHandlers.ofString()).body()
				.replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");

		HttpRequest request = HttpRequest.newBuilder(
				URI.create("http://localhost:" + port + "/api/empleados/" + empleado.id() + "/pago"))
				.header("Authorization", "Bearer " + token)
				.header("Content-Type", "application/json")
				.method("PATCH", HttpRequest.BodyPublishers.ofString("{\"pagoPorBlusa\":0}"))
				.build();

		assertEquals(400, client.send(request, HttpResponse.BodyHandlers.ofString()).statusCode());
	}
}
