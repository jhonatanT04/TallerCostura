package ec.cue.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import ec.cue.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final UserDetailsService userDetailsService;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return new org.springframework.security.authentication.ProviderManager(provider);
	}

	// El navegador no puede mandar el JWT al abrir una página, así que la documentación usa HTTP
	// Basic con las mismas credenciales de la app; solo una cuenta ADMIN puede verla.
	@Bean
	@Order(1)
	public SecurityFilterChain docsSecurityFilterChain(HttpSecurity http, AuthenticationManager authenticationManager)
			throws Exception {
		http
				.securityMatcher("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
				.authenticationManager(authenticationManager)
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.httpBasic(basic -> basic.realmName("Documentacion Costureria"))
				.authorizeHttpRequests(auth -> auth.anyRequest().hasRole("ADMIN"));

		return http.build();
	}

	@Bean
	@Order(2)
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(eh -> eh
						.authenticationEntryPoint((req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
						.accessDeniedHandler((req, res, ex) -> res.sendError(HttpServletResponse.SC_FORBIDDEN)))
				.authorizeHttpRequests(auth -> auth
						// sendError (404, 403, 500…) reenvía a /error sin el JWT; si no se permite, ese
						// reenvío responde 401 y el frontend cierra la sesión.
						.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
						.requestMatchers("/api/auth/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/ping").permitAll()
						.requestMatchers("/api/empleados/**").hasRole("ADMIN")
						.requestMatchers("/api/clientes/**").hasRole("ADMIN")
						.requestMatchers("/api/ordenes/**").hasRole("ADMIN")
						.requestMatchers("/api/configuracion-pago/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.GET, "/api/pagos/mios").hasRole("EMPLEADO")
						.requestMatchers("/api/pagos/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.GET, "/api/registros").hasRole("ADMIN")
						.requestMatchers(HttpMethod.GET, "/api/registros/getForDate").hasRole("ADMIN")
						.requestMatchers(HttpMethod.POST, "/api/registros").hasRole("EMPLEADO")
						.requestMatchers(HttpMethod.GET, "/api/registros/mios").hasRole("EMPLEADO")						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(List.of(
            "https://taller-costura-gray.vercel.app",
			"http://localhost:5173"
        ));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
}
