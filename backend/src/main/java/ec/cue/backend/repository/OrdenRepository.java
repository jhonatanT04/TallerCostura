package ec.cue.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.cue.backend.model.Orden;

public interface OrdenRepository extends JpaRepository<Orden, Long> {

	List<Orden> findAllByOrderByFechaCreacionDesc();

	List<Orden> findByClienteIdOrderByFechaCreacionDesc(Long clienteId);
}
