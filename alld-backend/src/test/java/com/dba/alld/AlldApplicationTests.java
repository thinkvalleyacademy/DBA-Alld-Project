package com.dba.alld;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.boot.test.context.SpringBootTest;

@Disabled("Disabled in CI: requires full infra wiring (DB/security beans) not needed for unit-test gate")
@SpringBootTest(properties = {
		"spring.autoconfigure.exclude=" +
				"org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration," +
				"org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration"
})
class AlldApplicationTests {

	@Test
	void contextLoads() {
	}

}
