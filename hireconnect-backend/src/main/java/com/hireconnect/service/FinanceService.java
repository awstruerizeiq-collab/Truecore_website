package com.hireconnect.service;

import com.hireconnect.entity.Reimbursement;
import com.hireconnect.entity.TaxDeclaration;
import com.hireconnect.repository.ReimbursementRepository;
import com.hireconnect.repository.TaxDeclarationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FinanceService {
    
    private final ReimbursementRepository reimbursementRepository;
    private final TaxDeclarationRepository taxDeclarationRepository;
    private final UserService userService;

    public FinanceService(
        ReimbursementRepository reimbursementRepository,
        TaxDeclarationRepository taxDeclarationRepository,
        UserService userService
    ) {
        this.reimbursementRepository = reimbursementRepository;
        this.taxDeclarationRepository = taxDeclarationRepository;
        this.userService = userService;
    }
    
    // Reimbursement methods
    public List<Reimbursement> getReimbursements() {
        return reimbursementRepository.findByUserIdOrderByCreatedAtDesc(userService.getCurrentUser().getId());
    }
    
    public List<Reimbursement> getAllReimbursements() {
        return reimbursementRepository.findAllByOrderByCreatedAtDesc();
    }
    
    @Transactional
    public Reimbursement createReimbursement(Reimbursement reimbursement) {
        reimbursement.setUserId(userService.getCurrentUser().getId());
        reimbursement.setStatus(Reimbursement.ReimbursementStatus.PENDING);
        return reimbursementRepository.save(reimbursement);
    }
    
    @Transactional
    public void approveReimbursement(Long id, Long approvedBy) {
        Reimbursement reimbursement = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reimbursement not found"));
        
        Long approverId = resolveApproverId(approvedBy);
        reimbursement.setStatus(Reimbursement.ReimbursementStatus.APPROVED);
        reimbursement.setApprovedBy(approverId);
        reimbursement.setApprovedAt(LocalDateTime.now());
        reimbursementRepository.save(reimbursement);
    }
    
    @Transactional
    public void rejectReimbursement(Long id, Long approvedBy, String reason) {
        Reimbursement reimbursement = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reimbursement not found"));
        
        Long approverId = resolveApproverId(approvedBy);
        reimbursement.setStatus(Reimbursement.ReimbursementStatus.REJECTED);
        reimbursement.setApprovedBy(approverId);
        reimbursement.setApprovedAt(LocalDateTime.now());
        reimbursement.setRejectionReason(reason);
        reimbursementRepository.save(reimbursement);
    }
    
    @Transactional
    public void markReimbursementAsPaid(Long id) {
        Reimbursement reimbursement = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reimbursement not found"));
        
        reimbursement.setStatus(Reimbursement.ReimbursementStatus.PAID);
        reimbursement.setPaymentDate(java.time.LocalDate.now());
        reimbursementRepository.save(reimbursement);
    }
    
    // Tax Declaration methods
    public List<TaxDeclaration> getTaxDeclarations() {
        return taxDeclarationRepository.findByUserIdOrderByCreatedAtDesc(userService.getCurrentUser().getId());
    }
    
    public List<TaxDeclaration> getAllTaxDeclarations() {
        return taxDeclarationRepository.findAllByOrderByCreatedAtDesc();
    }
    
    @Transactional
    public TaxDeclaration createTaxDeclaration(TaxDeclaration taxDeclaration) {
        taxDeclaration.setUserId(userService.getCurrentUser().getId());
        taxDeclaration.setStatus(TaxDeclaration.TaxStatus.PENDING);
        return taxDeclarationRepository.save(taxDeclaration);
    }
    
    @Transactional
    public void approveTaxDeclaration(Long id, Long approvedBy) {
        TaxDeclaration taxDeclaration = taxDeclarationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tax declaration not found"));
        
        Long approverId = resolveApproverId(approvedBy);
        taxDeclaration.setStatus(TaxDeclaration.TaxStatus.APPROVED);
        taxDeclaration.setApprovedBy(approverId);
        taxDeclaration.setApprovedAt(LocalDateTime.now());
        taxDeclarationRepository.save(taxDeclaration);
    }
    
    @Transactional
    public void rejectTaxDeclaration(Long id, Long approvedBy, String reason) {
        TaxDeclaration taxDeclaration = taxDeclarationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tax declaration not found"));
        
        Long approverId = resolveApproverId(approvedBy);
        taxDeclaration.setStatus(TaxDeclaration.TaxStatus.REJECTED);
        taxDeclaration.setApprovedBy(approverId);
        taxDeclaration.setApprovedAt(LocalDateTime.now());
        taxDeclaration.setRejectionReason(reason);
        taxDeclarationRepository.save(taxDeclaration);
    }

    public Long getCurrentUserId() {
        return userService.getCurrentUser().getId();
    }

    private Long resolveApproverId(Long approvedBy) {
        return approvedBy != null ? approvedBy : getCurrentUserId();
    }
}
