package ec.cue.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

	private static final String BEARER = "bearerAuth";

	@Bean
	public OpenAPI costureriaOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("Costurería API")
						.version("v1")
						.description("API REST del taller de costura: empleados, registros de blusas, "
								+ "clientes, órdenes y pago semanal. Inicia sesión en POST /api/auth/login, "
								+ "copia el token y pégalo en el botón Authorize."))
				.components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
						.type(SecurityScheme.Type.HTTP)
						.scheme("bearer")
						.bearerFormat("JWT")))
				.addSecurityItem(new SecurityRequirement().addList(BEARER));
	}
}
