package ec.cue.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import ec.cue.backend.dto.CrearEmpleadoRequest;
import ec.cue.backend.service.EmpleadoService;

// El frontend cierra la sesión ante cualquier 401, así que un usuario autenticado nunca debe
// recibir 401 por un endpoint inexistente o sin permiso.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ErrorStatusTest {

	@LocalServerPort
	private int port;

	@Autowired
	private EmpleadoService empleadoService;

	private final HttpClient client = HttpClient.newHttpClient();

	private String login(String username, String password) throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/login"))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(
						"{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
				.build();
		String body = client.send(request, HttpResponse.BodyHandlers.ofString()).body();
		return body.replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
	}

	private HttpResponse<String> get(String path, String token) throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
				.header("Authorization", "Bearer " + token)
				.GET()
				.build();
		return client.send(request, HttpResponse.BodyHandlers.ofString());
	}

	@Test
	void endpointInexistenteDevuelve404() throws Exception {
		String token = login("jefa", "jefa1234");

		assertEquals(404, get("/api/no-existe", token).statusCode());
	}

	@Test
	void endpointSinPermisoDevuelve403() throws Exception {
		empleadoService.crear(new CrearEmpleadoRequest("error_empleado", "empleado123", "Empleado Error", null));
		String token = login("error_empleado", "empleado123");

		assertEquals(403, get("/api/empleados", token).statusCode());
	}
}
