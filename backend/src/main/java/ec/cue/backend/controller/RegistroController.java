package ec.cue.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ec.cue.backend.dto.CrearRegistroRequest;
import ec.cue.backend.dto.RegistroDTO;
import ec.cue.backend.service.RegistroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/registros")
@RequiredArgsConstructor
public class RegistroController {

	private final RegistroService registroService;

	@PostMapping
	public ResponseEntity<RegistroDTO> crear(Authentication authentication, @Valid @RequestBody CrearRegistroRequest request) {
		RegistroDTO dto = registroService.crear(authentication.getName(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(dto);
	}

	@GetMapping("/mios")
	public ResponseEntity<List<RegistroDTO>> mios(Authentication authentication) {
		return ResponseEntity.ok(registroService.misRegistros(authentication.getName()));
	}

	@GetMapping
	public ResponseEntity<List<RegistroDTO>> todos() {
		return ResponseEntity.ok(registroService.todos());
	}
}
