package com.hireconnect.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hireconnect.entity.PayslipGeneratorConfig;

public interface PayslipGeneratorConfigRepository extends JpaRepository<PayslipGeneratorConfig, Long> {
    Optional<PayslipGeneratorConfig> findByCompanyId(Long companyId);
}