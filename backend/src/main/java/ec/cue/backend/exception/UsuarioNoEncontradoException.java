package ec.cue.backend.exception;

public class UsuarioNoEncontradoException extends RuntimeException {

	public UsuarioNoEncontradoException(String username) {
		super("Usuario no encontrado: " + username);
	}
}