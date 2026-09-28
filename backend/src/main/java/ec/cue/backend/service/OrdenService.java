package ec.cue.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ec.cue.backend.dto.ClienteResponse;
import ec.cue.backend.dto.CrearOrdenRequest;
import ec.cue.backend.dto.ItemOrdenDTO;
import ec.cue.backend.dto.ItemOrdenRequest;
import ec.cue.backend.dto.OrdenDTO;
import ec.cue.backend.model.Cliente;
import ec.cue.backend.model.Orden;
import ec.cue.backend.model.OrdenItem;
import ec.cue.backend.repository.ClienteRepository;
import ec.cue.backend.repository.OrdenRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdenService {

	private final OrdenRepository ordenRepository;
	private final ClienteRepository clienteRepository;

	@Transactional
	public OrdenDTO crear(CrearOrdenRequest request) {
		Cliente cliente = clienteRepository.findById(request.clienteId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

		Orden orden = Orden.builder()
				.cliente(cliente)
				.fechaCreacion(Instant.now())
				.build();

		for (ItemOrdenRequest itemRequest : request.items()) {
			orden.addItem(OrdenItem.builder()
					.color(itemRequest.color())
					.cantidad(itemRequest.cantidad())
					.precioUnitario(itemRequest.precioUnitario())
					.build());
		}

		orden = ordenRepository.save(orden);

		return toDto(orden);
	}

	@Transactional(readOnly = true)
	public List<OrdenDTO> listar() {
		return ordenRepository.findAllByOrderByFechaCreacionDesc().stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public OrdenDTO obtener(Long id) {
		Orden orden = ordenRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden no encontrada"));

		return toDto(orden);
	}

	@Transactional(readOnly = true)
	public List<OrdenDTO> ordenesPorCliente(Long clienteId) {
		if (!clienteRepository.existsById(clienteId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado");
		}

		return ordenRepository.findByClienteIdOrderByFechaCreacionDesc(clienteId).stream()
				.map(this::toDto)
				.toList();
	}

	private OrdenDTO toDto(Orden orden) {
		Cliente cliente = orden.getCliente();
		ClienteResponse clienteResponse = new ClienteResponse(cliente.getId(), cliente.getNombre(), cliente.getTelefono());

		List<ItemOrdenDTO> items = orden.getItems().stream()
				.map(item -> new ItemOrdenDTO(
						item.getId(),
						item.getColor(),
						item.getCantidad(),
						item.getPrecioUnitario(),
						item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad()))))
				.toList();

		int totalBlusas = items.stream().mapToInt(ItemOrdenDTO::cantidad).sum();
		BigDecimal total = items.stream()
				.map(ItemOrdenDTO::subtotal)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		return new OrdenDTO(orden.getId(), clienteResponse, orden.getFechaCreacion(), items, totalBlusas, total);
	}
}
