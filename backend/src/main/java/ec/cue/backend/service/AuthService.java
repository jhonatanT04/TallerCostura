package ec.cue.backend.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ec.cue.backend.dto.LoginRequest;
import ec.cue.backend.dto.LoginResponse;
import ec.cue.backend.dto.RegisterRequest;
import ec.cue.backend.exception.UsuarioNoEncontradoException;
import ec.cue.backend.exception.UsuarioYaExisteException;
import ec.cue.backend.model.Role;
import ec.cue.backend.model.Usuario;
import ec.cue.backend.repository.UsuarioRepository;
import ec.cue.backend.security.JwtService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final AuthenticationManager authenticationManager;
	private final UsuarioRepository usuarioRepository;
	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;

	public LoginResponse login(LoginRequest request) {
		usuarioRepository.findByUsername(request.username())
				.orElseThrow(() -> new UsuarioNoEncontradoException(request.username()));

		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.username(), request.password()));

		Usuario usuario = usuarioRepository.findByUsername(request.username())
				.orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

		String token = jwtService.generateToken(usuario);
		return new LoginResponse(token, usuario.getRole(), usuario.getUsername(), usuario.getNombreCompleto());
	}

	public void register(RegisterRequest request) {
		usuarioRepository.findByUsername(request.username())
				.ifPresent(u -> {
					throw new UsuarioYaExisteException(request.username());
				});

		Usuario usuario = Usuario.builder()
				.username(request.username())
				.password(passwordEncoder.encode(request.password()))
				.nombreCompleto(request.nombreCompleto())
				.role(Role.EMPLEADO)
				.activo(false)
				.build();

		usuarioRepository.save(usuario);
	}
}
