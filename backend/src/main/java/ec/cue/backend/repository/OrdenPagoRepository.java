package ec.cue.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.cue.backend.model.OrdenPago;

public interface OrdenPagoRepository extends JpaRepository<OrdenPago, Long> {

	boolean existsByUsuarioIdAndSemanaInicio(Long usuarioId, LocalDate semanaInicio);

	List<OrdenPago> findAllByOrderByFechaPagoDesc();

	List<OrdenPago> findByUsuarioIdOrderByFechaPagoDesc(Long usuarioId);
}
