package com.hireconnect.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.GlobalAdmin;

@Repository
public interface GlobalAdminRepository extends JpaRepository<GlobalAdmin, Long> {
    Optional<GlobalAdmin> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<GlobalAdmin> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
