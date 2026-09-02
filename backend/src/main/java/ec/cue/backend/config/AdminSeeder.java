package ec.cue.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import ec.cue.backend.model.Role;
import ec.cue.backend.model.Usuario;
import ec.cue.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Las cuentas de empleados las crea la jefa, no hay auto-registro, así que si no existe ninguna
 * cuenta ADMIN al arrancar, se siembra una por defecto para poder acceder por primera vez.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;

	@Value("${admin.username:jefa}")
	private String adminUsername;

	@Value("${admin.password:jefa1234}")
	private String adminPassword;

	@Override
	public void run(String... args) {
		if (usuarioRepository.existsByRole(Role.ADMIN)) {
			return;
		}

		Usuario admin = Usuario.builder()
				.username(adminUsername)
				.password(passwordEncoder.encode(adminPassword))
				.nombreCompleto("Jefa")
				.role(Role.ADMIN)
				.activo(true)
				.build();
		usuarioRepository.save(admin);

		log.warn("No se encontró ninguna cuenta ADMIN; se sembró la cuenta por defecto username='{}'. "
				+ "Configura ADMIN_USERNAME/ADMIN_PASSWORD o cambia la contraseña cuanto antes.", adminUsername);
	}
}
