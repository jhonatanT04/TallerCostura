package ec.cue.backend.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "registros_blusa")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroBlusa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@Column(nullable = false)
	private String color;

	@Column(nullable = false)
	private String talla;

	@Column(nullable = false)
	private boolean tieneMullos;

	@Column(nullable = false)
	private boolean tieneAtaches;

	@Column(nullable = false)
	private int cantidad;

	@Column(nullable = false)
	private Instant fechaRegistro;
}
