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

import ec.cue.backend.dto.CrearEmpleadoRequest;
import ec.cue.backend.dto.EmpleadoResponse;
import ec.cue.backend.dto.RegistroDTO;
import ec.cue.backend.service.EmpleadoService;
import ec.cue.backend.service.RegistroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/empleados")
@RequiredArgsConstructor
public class EmpleadoController {

	private final EmpleadoService empleadoService;
	private final RegistroService registroService;

	@PostMapping
	public ResponseEntity<EmpleadoResponse> crear(@Valid @RequestBody CrearEmpleadoRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(empleadoService.crear(request));
	}

	@GetMapping
	public ResponseEntity<List<EmpleadoResponse>> listar() {
		return ResponseEntity.ok(empleadoService.listar());
	}

	@GetMapping("/{id}/registros")
	public ResponseEntity<List<RegistroDTO>> registrosDeEmpleado(@PathVariable Long id) {
		return ResponseEntity.ok(registroService.registrosPorEmpleado(id));
	}
}
