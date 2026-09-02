package ec.cue.backend.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import ec.cue.backend.dto.LoginRequest;
import ec.cue.backend.dto.LoginResponse;
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

	public LoginResponse login(LoginRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.username(), request.password()));

		Usuario usuario = usuarioRepository.findByUsername(request.username())
				.orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

		String token = jwtService.generateToken(usuario);
		return new LoginResponse(token, usuario.getRole(), usuario.getUsername(), usuario.getNombreCompleto());
	}
}
