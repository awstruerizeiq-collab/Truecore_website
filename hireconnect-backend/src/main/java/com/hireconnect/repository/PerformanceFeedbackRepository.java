package com.hireconnect.repository;

import com.hireconnect.entity.PerformanceFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PerformanceFeedbackRepository extends JpaRepository<PerformanceFeedback, Long> {
    List<PerformanceFeedback> findByPerformanceDataId(Long performanceDataId);
}