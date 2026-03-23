package com.hireconnect.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.entity.Leave;
import com.hireconnect.entity.User;
import com.hireconnect.repository.LeaveRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LeaveService {
    @Autowired
    private LeaveRepository leaveRepository;
    @Autowired
    private UserService userService;
    
    public List<Leave> getMyLeaves() {
        User currentUser = userService.getCurrentUser();
        return leaveRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }
    
    public List<Leave> getAllLeaves() {
        return leaveRepository.findAll();
    }
    
    public List<Leave> getPendingLeaves() {
        return leaveRepository.findByStatus(Leave.LeaveStatus.PENDING);
    }
    
    public Leave getLeaveById(Long id) {
        return leaveRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Leave not found"));
    }
    
    @Transactional
    public Leave applyLeave(Leave leave) {
        User currentUser = userService.getCurrentUser();
        
        leave.setUserId(currentUser.getId());
        leave.setStatus(Leave.LeaveStatus.PENDING);
        
        // Calculate total days
        if (leave.getStartDate() != null && leave.getEndDate() != null) {
            long days = ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1;
            leave.setTotalDays((int) days);
        }
        
        return leaveRepository.save(leave);
    }
    
    @Transactional
    public Leave approveLeave(Long leaveId, Long reviewedBy) {
        Leave leave = getLeaveById(leaveId);
        
        leave.setStatus(Leave.LeaveStatus.APPROVED);
        leave.setReviewedBy(reviewedBy);
        leave.setReviewedAt(LocalDateTime.now());
        
        return leaveRepository.save(leave);
    }
    
    @Transactional
    public Leave rejectLeave(Long leaveId, Long reviewedBy, String reason) {
        Leave leave = getLeaveById(leaveId);
        
        leave.setStatus(Leave.LeaveStatus.REJECTED);
        leave.setReviewedBy(reviewedBy);
        leave.setReviewedAt(LocalDateTime.now());
        if (reason != null) {
            leave.setReason(reason);
        }
        
        return leaveRepository.save(leave);
    }
    
    @Transactional
    public void deleteLeave(Long leaveId) {
        Leave leave = getLeaveById(leaveId);
        leaveRepository.delete(leave);
    }
    
//    public List<Leave> getLeavesByUserId(Long userId) {
//        return leaveRepository.findByUserIdOrderByCreatedAtDesc(userId);
//    }
    public List<Leave> getLeavesByUserId(Long userId){
    	return leaveRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    
}