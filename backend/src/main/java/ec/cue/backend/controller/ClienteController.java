package ec.cue.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ec.cue.backend.dto.ClienteResponse;
import ec.cue.backend.dto.CrearClienteRequest;
import ec.cue.backend.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

	private final ClienteService clienteService;

	@PostMapping
	public ResponseEntity<ClienteResponse> crear(@Valid @RequestBody CrearClienteRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(request));
	}

	@GetMapping
	public ResponseEntity<List<ClienteResponse>> listar() {
		return ResponseEntity.ok(clienteService.listar());
	}
}
