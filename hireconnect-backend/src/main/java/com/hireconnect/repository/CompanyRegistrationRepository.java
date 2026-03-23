package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hireconnect.entity.CompanyRegistration;

public interface CompanyRegistrationRepository extends JpaRepository<CompanyRegistration, Long> {

	  boolean existsByCompanyEmail(String companyEmail);
	  CompanyRegistration findByCompanyEmail(String companyEmail);
	  CompanyRegistration findByCompanyKey(String companyKey);
}
