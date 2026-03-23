package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.GlobalSystemSettings;

@Repository
public interface GlobalSystemSettingsRepository extends JpaRepository<GlobalSystemSettings, Long> {
    GlobalSystemSettings findTopByOrderByIdAsc();
}