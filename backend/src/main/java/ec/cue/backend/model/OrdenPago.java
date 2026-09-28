package ec.cue.backend.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "ordenes_pago")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenPago {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@Column(nullable = false)
	private LocalDate semanaInicio;

	@Column(nullable = false)
	private LocalDate semanaFin;

	@Column(nullable = false)
	private int totalBlusas;

	@Column(nullable = false)
	private int totalConMullos;

	@Column(nullable = false)
	private int totalConAtaches;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal montoBlusas;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal montoMullos;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal montoAtaches;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal montoTotal;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private EstadoPago estado;

	@Column(nullable = false)
	private Instant fechaPago;
}
