package ec.cue.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.cue.backend.model.Role;
import ec.cue.backend.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByUsername(String username);

	boolean existsByUsername(String username);

	boolean existsByRole(Role role);

	List<Usuario> findByRole(Role role);
}
