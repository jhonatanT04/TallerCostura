package ec.cue.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ec.cue.backend.dto.ConfiguracionPagoDTO;
import ec.cue.backend.dto.ConfiguracionPagoRequest;
import ec.cue.backend.service.ConfiguracionPagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/configuracion-pago")
@RequiredArgsConstructor
public class ConfiguracionPagoController {

	private final ConfiguracionPagoService configuracionPagoService;

	@GetMapping
	public ResponseEntity<ConfiguracionPagoDTO> obtener() {
		return ResponseEntity.ok(configuracionPagoService.obtener());
	}

	@PutMapping
	public ResponseEntity<ConfiguracionPagoDTO> actualizar(@Valid @RequestBody ConfiguracionPagoRequest request) {
		return ResponseEntity.ok(configuracionPagoService.actualizar(request));
	}
}
