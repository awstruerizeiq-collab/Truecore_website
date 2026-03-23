package com.hireconnect.controller;

import com.hireconnect.dto.request.AssetRequest;
import com.hireconnect.dto.response.AssetResponse;
import com.hireconnect.dto.response.AssetStatsResponse;
import com.hireconnect.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = {"http://localhost:3000", "https://app.truecorehr.com"})
public class AssetController {

    @Autowired
    private AssetService assetService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAsset(@Valid @RequestBody AssetRequest request) {
        try {
            AssetResponse response = assetService.createAsset(request);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Asset issued successfully");
            result.put("data", response);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllAssets() {
        try {
            List<AssetResponse> assets = assetService.getAllAssets();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", assets);
            result.put("count", assets.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAssetById(@PathVariable Long id) {
        try {
            AssetResponse asset = assetService.getAssetById(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", asset);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAsset(
            @PathVariable Long id, 
            @Valid @RequestBody AssetRequest request) {
        try {
            AssetResponse response = assetService.updateAsset(id, request);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Asset updated successfully");
            result.put("data", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAsset(@PathVariable Long id) {
        try {
            assetService.deleteAsset(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Asset deleted successfully");
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> deleteMultipleAssets(
            @RequestBody Map<String, List<Long>> payload) {
        try {
            List<Long> ids = payload.get("ids");
            if (ids == null || ids.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "No asset IDs provided");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            assetService.deleteMultipleAssets(ids);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", ids.size() + " asset(s) deleted successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchAssets(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "all") String type) {
        try {
            List<AssetResponse> assets = assetService.searchAssets(search, type);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", assets);
            result.put("count", assets.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAssetStats() {
        try {
            AssetStatsResponse stats = assetService.getAssetStats();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", stats);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getAssetsByEmployee(@PathVariable String employeeId) {
        try {
            List<AssetResponse> assets = assetService.getAssetsByEmployeeId(employeeId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", assets);
            result.put("count", assets.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}