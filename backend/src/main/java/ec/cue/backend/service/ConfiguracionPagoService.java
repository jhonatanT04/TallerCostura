package ec.cue.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ec.cue.backend.dto.ConfiguracionPagoDTO;
import ec.cue.backend.dto.ConfiguracionPagoRequest;
import ec.cue.backend.model.ConfiguracionPago;
import ec.cue.backend.repository.ConfiguracionPagoRepository;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ConfiguracionPagoService {

	private final ConfiguracionPagoRepository configuracionPagoRepository;

	@Transactional
	public ConfiguracionPagoDTO obtener() {
		return toDto(obtenerEntidad());
	}

	@Transactional
	public ConfiguracionPagoDTO actualizar(ConfiguracionPagoRequest request) {
		ConfiguracionPago configuracion = obtenerEntidad();
		configuracion.setPrecioMullos(request.precioMullos());
		configuracion.setPrecioAtaches(request.precioAtaches());
		configuracion = configuracionPagoRepository.save(configuracion);

		return toDto(configuracion);
	}

	ConfiguracionPago obtenerEntidad() {
		return configuracionPagoRepository.findAll().stream()
				.findFirst()
				.orElseGet(() -> configuracionPagoRepository.save(ConfiguracionPago.builder().build()));
	}

	private ConfiguracionPagoDTO toDto(ConfiguracionPago configuracion) {
		return new ConfiguracionPagoDTO(configuracion.getPrecioMullos(), configuracion.getPrecioAtaches());
	}
}
