package ec.cue.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.cue.backend.model.RegistroBlusa;

public interface RegistroBlusaRepository extends JpaRepository<RegistroBlusa, Long> {

	List<RegistroBlusa> findByUsuarioIdOrderByFechaRegistroDesc(Long usuarioId);

	List<RegistroBlusa> findAllByOrderByFechaRegistroDesc();
}
