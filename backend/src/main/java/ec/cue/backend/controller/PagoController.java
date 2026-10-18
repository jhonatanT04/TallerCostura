package ec.cue.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ec.cue.backend.dto.CalcularPagoRequest;
import ec.cue.backend.dto.OrdenPagoDTO;
import ec.cue.backend.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

	private final PagoService pagoService;

	@PostMapping("/calcular")
	public ResponseEntity<OrdenPagoDTO> calcular(@Valid @RequestBody CalcularPagoRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.calcular(request));
	}

	// Resumen previo a confirmar: calcula lo mismo que /calcular pero no guarda nada.
	@GetMapping("/previsualizar")
	public ResponseEntity<OrdenPagoDTO> previsualizar(@RequestParam Long empleadoId,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate semanaInicio) {
		return ResponseEntity.ok(pagoService.previsualizar(empleadoId, semanaInicio));
	}

	@GetMapping
	public ResponseEntity<List<OrdenPagoDTO>> listar() {
		return ResponseEntity.ok(pagoService.listar());
	}

	@GetMapping("/empleado/{empleadoId}")
	public ResponseEntity<List<OrdenPagoDTO>> porEmpleado(@PathVariable Long empleadoId) {
		return ResponseEntity.ok(pagoService.porEmpleado(empleadoId));
	}

	@GetMapping("/mios")
	public ResponseEntity<List<OrdenPagoDTO>> misPagos(Authentication authentication) {
		return ResponseEntity.ok(pagoService.misPagos(authentication.getName()));
	}
}
