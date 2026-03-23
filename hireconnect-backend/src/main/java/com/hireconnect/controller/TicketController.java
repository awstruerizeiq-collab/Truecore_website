package com.hireconnect.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hireconnect.dto.request.TicketRequest;
import com.hireconnect.dto.response.ApiResponse;
import com.hireconnect.entity.Ticket;
import com.hireconnect.entity.User;
import com.hireconnect.service.TicketService;
import com.hireconnect.service.UserService;

@RestController
@RequestMapping({"/api/tickets", "/api/support-tickets"})

@CrossOrigin(origins = "*")
public class TicketController {
    
    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private UserService userService;
    
    public TicketController(TicketService ticketService) {
        super();
        this.ticketService = ticketService;
    }

    /**
     * Create a new ticket
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Ticket>> createTicket(
            @RequestBody TicketRequest request,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCodeHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        try {
            Ticket ticket = ticketService.createTicket(request);
            return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
        } catch (Exception e) {
            if (isUnauthenticatedError(e)) {
                try {
                    Long companyId = parseCompanyId(companyIdHeader);
                    Long actorId = parseLongOrNull(userIdHeader);
                    Ticket ticket = ticketService.createTicketByScope(
                            request, tenantCodeHeader, companyId, userNameHeader, actorId
                    );
                    return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
                } catch (Exception scopedException) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(scopedException.getMessage()));
                }
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get current user's tickets (employee view)
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<Ticket>>> getMyTickets() {
        try {
            List<Ticket> tickets = ticketService.getMyTickets();
            return ResponseEntity.ok(ApiResponse.success("Tickets fetched successfully", tickets));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get all tickets (admin view - filtered by company)
     * This endpoint automatically filters by the logged-in user's tenant/company
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Ticket>>> getAllTickets(
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCodeHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        try {
            // Get current user to determine access level
            User currentUser = userService.getCurrentUser();
            
            List<Ticket> tickets;

            // Global admin can view all tickets without tenant/company mapping
            if (currentUser.getRole() == User.Role.GLOBAL_ADMIN) {
                tickets = ticketService.getAllTickets();
                return ResponseEntity.ok(
                    ApiResponse.success("Tickets fetched successfully", tickets)
                );
            }
            
            // If admin, get all tickets for their company
            if (currentUser.getRole() == User.Role.ADMIN || Boolean.TRUE.equals(currentUser.getIsAdmin())) {
                String tenantCode = currentUser.getTenantCode();
                Long companyId = currentUser.getCompanyId();
                
                if (tenantCode == null || companyId == null) {
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Admin user not properly configured with tenant/company"));
                }
                
                tickets = ticketService.getAllTicketsByTenantCompany(tenantCode, companyId);
            } else {
                // Regular employee - only see their tickets
                tickets = ticketService.getMyTickets();
            }
            
            return ResponseEntity.ok(
                ApiResponse.success("Tickets fetched successfully", tickets)
            );
        } catch (Exception e) {
            if (isUnauthenticatedError(e)) {
                try {
                    Long companyId = parseCompanyIdOrNull(companyIdHeader);
                    List<Ticket> tickets;
                    if (isGlobalScopeRequest(tenantCodeHeader, companyId, userRoleHeader)) {
                        tickets = ticketService.getAllTicketsForGlobalAdmin();
                    } else {
                        tickets = ticketService.getAllTicketsByScope(tenantCodeHeader, companyId);
                    }
                    return ResponseEntity.ok(ApiResponse.success("Tickets fetched successfully", tickets));
                } catch (Exception scopedException) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Failed to fetch tickets: " + scopedException.getMessage()));
                }
            }
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch tickets: " + e.getMessage()));
        }
    }

    /**
     * Get ticket by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Ticket>> getTicketById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCodeHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        try {
            Ticket ticket = ticketService.getTicketById(id);
            return ResponseEntity.ok(ApiResponse.success("Ticket fetched successfully", ticket));
        } catch (Exception e) {
            if (isUnauthenticatedError(e)) {
                try {
                    Long companyId = parseCompanyIdOrNull(companyIdHeader);
                    Ticket ticket = isGlobalScopeRequest(tenantCodeHeader, companyId, userRoleHeader)
                            ? ticketService.getTicketByIdForGlobalAdmin(id)
                            : ticketService.getTicketByIdByScope(id, tenantCodeHeader, companyId);
                    return ResponseEntity.ok(ApiResponse.success("Ticket fetched successfully", ticket));
                } catch (Exception scopedException) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(scopedException.getMessage()));
                }
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Update ticket status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Ticket>> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCodeHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        try {
            String status = (String) request.get("status");
            Long assignedToId = request.get("assignedToId") != null ? 
                Long.parseLong(request.get("assignedToId").toString()) : null;
            
            Ticket ticket = ticketService.updateTicketStatus(id, status, assignedToId);
            return ResponseEntity.ok(ApiResponse.success("Ticket status updated successfully", ticket));
        } catch (Exception e) {
            if (isUnauthenticatedError(e)) {
                try {
                    String status = (String) request.get("status");
                    Long assignedToId = request.get("assignedToId") != null ?
                            Long.parseLong(request.get("assignedToId").toString()) : null;
                    Long companyId = parseCompanyIdOrNull(companyIdHeader);
                    Ticket ticket = isGlobalScopeRequest(tenantCodeHeader, companyId, userRoleHeader)
                            ? ticketService.updateTicketStatusForGlobalAdmin(id, status, assignedToId)
                            : ticketService.updateTicketStatusByScope(
                                id, status, assignedToId, tenantCodeHeader, companyId
                              );
                    return ResponseEntity.ok(ApiResponse.success("Ticket status updated successfully", ticket));
                } catch (Exception scopedException) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(scopedException.getMessage()));
                }
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Add comment to ticket
     */
    @PostMapping("/{id}/comment")
    public ResponseEntity<ApiResponse<Ticket>> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCodeHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "X-User-Name", required = false) String userNameHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        try {
            String comment = request.get("comment");
            ticketService.addComment(id, comment);
            Ticket updatedTicket = ticketService.getTicketById(id);
            return ResponseEntity.ok(ApiResponse.success("Comment added successfully", updatedTicket));
        } catch (Exception e) {
            if (isUnauthenticatedError(e)) {
                try {
                    String comment = request.get("comment");
                    Long companyId = parseCompanyIdOrNull(companyIdHeader);
                    Ticket updatedTicket;
                    if (isGlobalScopeRequest(tenantCodeHeader, companyId, userRoleHeader)) {
                        ticketService.addCommentForGlobalAdmin(id, comment, userNameHeader);
                        updatedTicket = ticketService.getTicketByIdForGlobalAdmin(id);
                    } else {
                        ticketService.addCommentByScope(id, comment, userNameHeader, tenantCodeHeader, companyId);
                        updatedTicket = ticketService.getTicketByIdByScope(id, tenantCodeHeader, companyId);
                    }
                    return ResponseEntity.ok(ApiResponse.success("Comment added successfully", updatedTicket));
                } catch (Exception scopedException) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(scopedException.getMessage()));
                }
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get ticket statistics (filtered by company for admins)
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<?>> getTicketStats() {
        try {
            var stats = ticketService.getTicketStats();
            return ResponseEntity.ok(ApiResponse.success("Stats fetched successfully", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTicket(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Code", required = false) String tenantCodeHeader,
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        try {
            ticketService.deleteTicket(id);
            return ResponseEntity.ok(ApiResponse.success("Ticket deleted successfully", null));
        } catch (Exception e) {
            if (isUnauthenticatedError(e)) {
                try {
                    Long companyId = parseCompanyIdOrNull(companyIdHeader);
                    if (isGlobalScopeRequest(tenantCodeHeader, companyId, userRoleHeader)) {
                        ticketService.deleteTicketForGlobalAdmin(id);
                    } else {
                        ticketService.deleteTicketByScope(id, tenantCodeHeader, companyId);
                    }
                    return ResponseEntity.ok(ApiResponse.success("Ticket deleted successfully", null));
                } catch (Exception scopedException) {
                    return mapDeleteError(scopedException);
                }
            }
            return mapDeleteError(e);
        }
    }

    private boolean isUnauthenticatedError(Exception e) {
        String msg = e == null || e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        return msg.contains("not authenticated")
                || msg.contains("current user")
                || msg.contains("user not found");
    }

    private Long parseCompanyId(String companyIdHeader) {
        if (companyIdHeader == null || companyIdHeader.trim().isEmpty()) {
            throw new RuntimeException("X-Company-Id header is required");
        }
        try {
            return Long.parseLong(companyIdHeader.trim());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid X-Company-Id header");
        }
    }

    private Long parseCompanyIdOrNull(String companyIdHeader) {
        if (companyIdHeader == null || companyIdHeader.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(companyIdHeader.trim());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid X-Company-Id header");
        }
    }

    private boolean isGlobalScopeRequest(String tenantCodeHeader, Long companyId, String userRoleHeader) {
        boolean noScopeHeaders = (tenantCodeHeader == null || tenantCodeHeader.trim().isEmpty()) && companyId == null;
        if (!noScopeHeaders) {
            return false;
        }
        return "GLOBAL_ADMIN".equalsIgnoreCase(String.valueOf(userRoleHeader).trim());
    }

    private Long parseLongOrNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private ResponseEntity<ApiResponse<String>> mapDeleteError(Exception e) {
        String message = e != null && e.getMessage() != null ? e.getMessage() : "Failed to delete ticket";
        String lower = message.toLowerCase();
        if (lower.contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Ticket not found"));
        }
        if (lower.contains("access denied")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(message));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }
}
