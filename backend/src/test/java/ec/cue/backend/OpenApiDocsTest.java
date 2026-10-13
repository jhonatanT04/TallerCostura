package ec.cue.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import ec.cue.backend.dto.CrearEmpleadoRequest;
import ec.cue.backend.service.EmpleadoService;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OpenApiDocsTest {

	private static final String ADMIN = "jefa:jefa1234";

	@LocalServerPort
	private int port;

	@Autowired
	private EmpleadoService empleadoService;

	private final HttpClient client = HttpClient.newHttpClient();

	private HttpResponse<String> get(String path, String credenciales) throws Exception {
		HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET();
		if (credenciales != null) {
			request.header("Authorization",
					"Basic " + Base64.getEncoder().encodeToString(credenciales.getBytes(StandardCharsets.UTF_8)));
		}
		return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

	@Test
	void docsRequireCredentials() throws Exception {
		for (String path : new String[] { "/v3/api-docs", "/swagger-ui.html", "/swagger-ui/index.html" }) {
			HttpResponse<String> response = get(path, null);

			assertEquals(401, response.statusCode(), path);
			assertTrue(response.headers().firstValue("WWW-Authenticate").orElse("").startsWith("Basic"), path);
		}
	}

	@Test
	void docsRejectNonAdmin() throws Exception {
		empleadoService.crear(new CrearEmpleadoRequest("docs_empleado", "empleado123", "Empleado Docs", null));

		assertEquals(403, get("/v3/api-docs", "docs_empleado:empleado123").statusCode());
		assertEquals(401, get("/v3/api-docs", "jefa:incorrecta").statusCode());
	}

	@Test
	void adminCanReadDocs() throws Exception {
		HttpResponse<String> apiDocs = get("/v3/api-docs", ADMIN);
		assertEquals(200, apiDocs.statusCode());
		assertTrue(apiDocs.body().contains("\"/api/auth/login\""));
		assertTrue(apiDocs.body().contains("\"/api/pagos/calcular\""));
		assertTrue(apiDocs.body().contains("bearerAuth"));

		HttpResponse<String> ui = get("/swagger-ui/index.html", ADMIN);
		assertEquals(200, ui.statusCode());
		assertTrue(ui.body().contains("swagger-ui"));
	}
}
