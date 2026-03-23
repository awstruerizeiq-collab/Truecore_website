package com.hireconnect.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hireconnect.dto.request.AssetRequest;
import com.hireconnect.dto.response.AssetResponse;
import com.hireconnect.dto.response.AssetStatsResponse;
import com.hireconnect.entity.Asset;
import com.hireconnect.entity.User;
import com.hireconnect.repository.AssetRepository;
import com.hireconnect.repository.UserRepository;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public AssetResponse createAsset(AssetRequest request) {
        // Validate that serial number doesn't already exist
        if (assetRepository.findBySerialNumber(request.getSerialNumber()).isPresent()) {
            throw new RuntimeException("Asset with serial number " + request.getSerialNumber() + " already exists");
        }
        
        // Validate that the employee exists in the system
        User employee = userRepository.findById(Long.parseLong(request.getEmployeeId()))
            .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));

        // Create new asset entity
        Asset asset = new Asset();
        asset.setEmployeeId(request.getEmployeeId());
        asset.setEmployeeName(employee.getFullName());
        asset.setDepartment(employee.getDepartment() != null ? employee.getDepartment() : "N/A");
        asset.setDateIssued(LocalDate.parse(request.getDateJoining()));
        asset.setAssetType(request.getAssetType());
        asset.setMakeModel(request.getMakeModel());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setAccessories(request.getAccessories());
        asset.setCondition(request.getCondition());
        
        // Set timestamps
        asset.setCreatedAt(LocalDate.now());
        asset.setUpdatedAt(LocalDate.now());

        // Save to database
        Asset savedAsset = assetRepository.save(asset);
        
        // Verify it was actually saved
        if (savedAsset.getId() == null) {
            throw new RuntimeException("Failed to save asset to database");
        }
        
        return convertToResponse(savedAsset);
    }

    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public AssetResponse getAssetById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id: " + id));
        return convertToResponse(asset);
    }

    @Transactional
    public AssetResponse updateAsset(Long id, AssetRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id: " + id));

        // Check if serial number is being changed and if new one already exists
        if (!asset.getSerialNumber().equals(request.getSerialNumber())) {
            if (assetRepository.findBySerialNumber(request.getSerialNumber()).isPresent()) {
                throw new RuntimeException("Asset with serial number " + request.getSerialNumber() + " already exists");
            }
        }

        // Validate employee exists
        User employee = userRepository.findById(Long.parseLong(request.getEmployeeId()))
            .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));

        // Update asset fields
        asset.setEmployeeId(request.getEmployeeId());
        asset.setEmployeeName(employee.getFullName());
        asset.setDepartment(employee.getDepartment() != null ? employee.getDepartment() : "N/A");
        asset.setDateIssued(LocalDate.parse(request.getDateJoining()));
        asset.setAssetType(request.getAssetType());
        asset.setMakeModel(request.getMakeModel());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setAccessories(request.getAccessories());
        asset.setCondition(request.getCondition());
        asset.setUpdatedAt(LocalDate.now());

        Asset updatedAsset = assetRepository.save(asset);
        return convertToResponse(updatedAsset);
    }

    @Transactional
    public void deleteAsset(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new RuntimeException("Asset not found with id: " + id);
        }
        assetRepository.deleteById(id);
    }

    @Transactional
    public void deleteMultipleAssets(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new RuntimeException("No asset IDs provided for deletion");
        }
        assetRepository.deleteAllById(ids);
    }

    public List<AssetResponse> searchAssets(String searchTerm, String assetType) {
        List<Asset> assets;

        if (assetType == null || assetType.equals("all")) {
            if (searchTerm == null || searchTerm.isEmpty()) {
                assets = assetRepository.findAll();
            } else {
                assets = assetRepository.searchAssets(searchTerm);
            }
        } else {
            if (searchTerm == null || searchTerm.isEmpty()) {
                assets = assetRepository.findByAssetType(assetType);
            } else {
                assets = assetRepository.searchAssetsByType(assetType, searchTerm);
            }
        }

        return assets.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public AssetStatsResponse getAssetStats() {
        AssetStatsResponse stats = new AssetStatsResponse();
        stats.setTotalAssets(assetRepository.count());
        stats.setLaptops(assetRepository.countByAssetType("laptop"));
        stats.setMobiles(assetRepository.countByAssetType("mobile"));
        stats.setTablets(assetRepository.countByAssetType("tablet"));
        stats.setSimCards(assetRepository.countByAssetType("sim"));
        stats.setOthers(assetRepository.countByAssetType("other"));
        return stats;
    }

    public List<AssetResponse> getAssetsByEmployeeId(String employeeId) {
        // Only return assets that actually exist in database
        List<Asset> assets = assetRepository.findByEmployeeId(employeeId);
        return assets.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private AssetResponse convertToResponse(Asset asset) {
        AssetResponse response = new AssetResponse();
        response.setId(asset.getId());
        response.setEmployeeId(asset.getEmployeeId());
        response.setEmployeeName(asset.getEmployeeName());
        response.setDepartment(asset.getDepartment());
        response.setDateIssued(asset.getDateIssued().toString());
        response.setAssetType(asset.getAssetType());
        response.setMakeModel(asset.getMakeModel());
        response.setSerialNumber(asset.getSerialNumber());
        response.setAccessories(asset.getAccessories());
        response.setCondition(asset.getCondition());
        return response;
    }
}