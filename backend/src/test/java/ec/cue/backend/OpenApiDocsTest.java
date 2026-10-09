package ec.cue.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OpenApiDocsTest {

	@LocalServerPort
	private int port;

	private final HttpClient client = HttpClient.newBuilder()
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();

	private HttpResponse<String> get(String path) throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
		return client.send(request, HttpResponse.BodyHandlers.ofString());
	}

	@Test
	void apiDocsArePublicAndDescribeTheApi() throws Exception {
		HttpResponse<String> response = get("/v3/api-docs");

		assertEquals(200, response.statusCode());
		assertTrue(response.body().contains("\"/api/auth/login\""));
		assertTrue(response.body().contains("\"/api/pagos/calcular\""));
		assertTrue(response.body().contains("bearerAuth"));
	}

	@Test
	void swaggerUiIsPublic() throws Exception {
		HttpResponse<String> response = get("/swagger-ui.html");

		assertEquals(200, response.statusCode());
		assertTrue(response.body().contains("swagger-ui"));
	}
}
