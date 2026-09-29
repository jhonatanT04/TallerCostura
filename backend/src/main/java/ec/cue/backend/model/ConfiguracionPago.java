package ec.cue.backend.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "configuracion_pago")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionPago {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, precision = 10, scale = 2)
	@Builder.Default
	private BigDecimal precioMullos = BigDecimal.ZERO;

	@Column(nullable = false, precision = 10, scale = 2)
	@Builder.Default
	private BigDecimal precioAtaches = BigDecimal.ZERO;
}
