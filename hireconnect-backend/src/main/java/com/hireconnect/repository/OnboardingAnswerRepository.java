package com.hireconnect.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.OnboardingAnswer;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingAnswerRepository extends JpaRepository<OnboardingAnswer, Long> {
    
    List<OnboardingAnswer> findByUserId(Long userId);
    
    Optional<OnboardingAnswer> findByUserIdAndStep(Long userId, Integer step);
    
    @Query("SELECT o FROM OnboardingAnswer o WHERE o.userId = :userId ORDER BY o.submittedAt DESC")
    Optional<OnboardingAnswer> findLatestByUserId(@Param("userId") Long userId);
}