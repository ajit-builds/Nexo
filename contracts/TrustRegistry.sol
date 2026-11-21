// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustRegistry
 * @dev Authoritative on-chain registry of accredited universities and authorized employers.
 * Only listed, active institutions can issue verifiable credentials.
 */
contract TrustRegistry is Ownable {
    enum IssuerCategory { University, Employer, CertificationBody }

    struct IssuerInfo {
        string name;
        string registrationNumber;
        IssuerCategory category;
        bool isActive;
        address publicSigningAddress;
        uint256 registeredAt;
    }

    // Mapping from issuer address to IssuerInfo
    mapping(address => IssuerInfo) private _issuers;

    // List of registered issuer addresses for enumeration
    address[] private _issuerList;

    // Events
    event IssuerRegistered(
        address indexed issuerAddress,
        string name,
        string registrationNumber,
        IssuerCategory category,
        address publicSigningAddress
    );
    event IssuerStatusUpdated(address indexed issuerAddress, bool isActive);
    event IssuerSigningKeyUpdated(address indexed issuerAddress, address newSigningAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new accredited institution or employer
     */
    function registerIssuer(
        address issuerAddress,
        string calldata name,
        string calldata registrationNumber,
        IssuerCategory category,
        address publicSigningAddress
    ) external onlyOwner {
        require(issuerAddress != address(0), "Invalid issuer address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(!_issuers[issuerAddress].isActive, "Issuer already registered");

        _issuers[issuerAddress] = IssuerInfo({
            name: name,
            registrationNumber: registrationNumber,
            category: category,
            isActive: true,
            publicSigningAddress: publicSigningAddress != address(0) ? publicSigningAddress : issuerAddress,
            registeredAt: block.timestamp
        });

        _issuerList.push(issuerAddress);

        emit IssuerRegistered(
            issuerAddress,
            name,
            registrationNumber,
            category,
            _issuers[issuerAddress].publicSigningAddress
        );
    }

    /**
     * @notice Update an issuer's active status (suspend or re-enable)
     */
    function setIssuerStatus(address issuerAddress, bool isActive) external onlyOwner {
        require(_issuers[issuerAddress].registeredAt > 0, "Issuer not found");
        _issuers[issuerAddress].isActive = isActive;
        emit IssuerStatusUpdated(issuerAddress, isActive);
    }

    /**
     * @notice Update public signing address for an issuer
     */
    function updateIssuerSigningKey(address issuerAddress, address newSigningAddress) external onlyOwner {
        require(_issuers[issuerAddress].registeredAt > 0, "Issuer not found");
        require(newSigningAddress != address(0), "Invalid signing address");
        _issuers[issuerAddress].publicSigningAddress = newSigningAddress;
        emit IssuerSigningKeyUpdated(issuerAddress, newSigningAddress);
    }

    /**
     * @notice Check if an issuer is trusted and currently active
     */
    function isIssuerTrusted(address issuerAddress) external view returns (bool) {
        return _issuers[issuerAddress].isActive;
    }

    /**
     * @notice Retrieve details for a registered issuer
     */
    function getIssuer(address issuerAddress) external view returns (
        string memory name,
        string memory registrationNumber,
        IssuerCategory category,
        bool isActive,
        address publicSigningAddress,
        uint256 registeredAt
    ) {
        IssuerInfo memory info = _issuers[issuerAddress];
        require(info.registeredAt > 0, "Issuer not registered");
        return (
            info.name,
            info.registrationNumber,
            info.category,
            info.isActive,
            info.publicSigningAddress,
            info.registeredAt
        );
    }

    /**
     * @notice Return total count of registered issuers
     */
    function totalIssuers() external view returns (uint256) {
        return _issuerList.length;
    }

    /**
     * @notice Get issuer address at specific index
     */
    function getIssuerAtIndex(uint256 index) external view returns (address) {
        require(index < _issuerList.length, "Index out of bounds");
        return _issuerList[index];
    }
}

