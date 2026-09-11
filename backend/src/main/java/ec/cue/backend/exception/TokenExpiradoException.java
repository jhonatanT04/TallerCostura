package ec.cue.backend.exception;

public class TokenExpiradoException extends RuntimeException {

	public TokenExpiradoException() {
		super("El token ha expirado");
	}
}