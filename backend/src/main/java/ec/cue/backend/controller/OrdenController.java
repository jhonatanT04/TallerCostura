package ec.cue.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ec.cue.backend.dto.CrearOrdenRequest;
import ec.cue.backend.dto.OrdenDTO;
import ec.cue.backend.service.OrdenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenController {

	private final OrdenService ordenService;

	@PostMapping
	public ResponseEntity<OrdenDTO> crear(@Valid @RequestBody CrearOrdenRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(ordenService.crear(request));
	}

	@GetMapping
	public ResponseEntity<List<OrdenDTO>> listar() {
		return ResponseEntity.ok(ordenService.listar());
	}

	@GetMapping("/{id}")
	public ResponseEntity<OrdenDTO> obtener(@PathVariable Long id) {
		return ResponseEntity.ok(ordenService.obtener(id));
	}

	@GetMapping("/cliente/{clienteId}")
	public ResponseEntity<List<OrdenDTO>> ordenesPorCliente(@PathVariable Long clienteId) {
		return ResponseEntity.ok(ordenService.ordenesPorCliente(clienteId));
	}
}
