package ec.cue.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.cue.backend.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

	List<Cliente> findAllByOrderByNombreAsc();
}
