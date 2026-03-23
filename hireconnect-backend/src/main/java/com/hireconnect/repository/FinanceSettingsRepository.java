package com.hireconnect.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.FinanceSettings;

@Repository
public interface FinanceSettingsRepository extends JpaRepository<FinanceSettings, Long> {
    Optional<FinanceSettings> findByCompanyId(Long companyId);
}
