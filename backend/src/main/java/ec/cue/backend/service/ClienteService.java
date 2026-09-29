package ec.cue.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import ec.cue.backend.dto.ClienteResponse;
import ec.cue.backend.dto.CrearClienteRequest;
import ec.cue.backend.model.Cliente;
import ec.cue.backend.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClienteService {

	private final ClienteRepository clienteRepository;

	public ClienteResponse crear(CrearClienteRequest request) {
		Cliente cliente = Cliente.builder()
				.nombre(request.nombre())
				.telefono(request.telefono())
				.build();
		cliente = clienteRepository.save(cliente);

		return toResponse(cliente);
	}

	public List<ClienteResponse> listar() {
		return clienteRepository.findAllByOrderByNombreAsc().stream()
				.map(this::toResponse)
				.toList();
	}

	private ClienteResponse toResponse(Cliente cliente) {
		return new ClienteResponse(cliente.getId(), cliente.getNombre(), cliente.getTelefono());
	}
}
