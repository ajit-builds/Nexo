// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TrustRegistry.sol";

/**
 * @title RevocationRegistry
 * @dev On-chain registry for instant invalidation of credentials.
 * Checked by verifiers before accepting any credential.
 */
contract RevocationRegistry {
    TrustRegistry public immutable trustRegistry;

    struct RevocationRecord {
        bool isRevoked;
        address revokedBy;
        string reason;
        uint256 revokedAt;
    }

    // Mapping from credentialHash (unique ID or SHA-256 fingerprint) => RevocationRecord
    mapping(bytes32 => RevocationRecord) private _revocations;

    // Events
    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );
    event RevocationCancelled(bytes32 indexed credentialHash, address indexed cancelledBy);

    constructor(address _trustRegistryAddress) {
        require(_trustRegistryAddress != address(0), "Invalid trust registry address");
        trustRegistry = TrustRegistry(_trustRegistryAddress);
    }

    /**
     * @notice Revoke a previously issued credential
     * @param credentialHash The cryptographic hash or unique identifier of the credential
     * @param reason The reason for revocation (e.g. "Degree cancelled due to academic fraud")
     */
    function revokeCredential(bytes32 credentialHash, string calldata reason) external {
        require(trustRegistry.isIssuerTrusted(msg.sender), "Caller is not an authorized issuer");
        require(credentialHash != bytes32(0), "Invalid credential hash");
        require(!_revocations[credentialHash].isRevoked, "Credential already revoked");

        _revocations[credentialHash] = RevocationRecord({
            isRevoked: true,
            revokedBy: msg.sender,
            reason: reason,
            revokedAt: block.timestamp
        });

        emit CredentialRevoked(credentialHash, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Check whether a credential has been revoked
     */
    function checkRevocation(bytes32 credentialHash) external view returns (
        bool isRevoked,
        address revokedBy,
        string memory reason,
        uint256 revokedAt
    ) {
        RevocationRecord memory record = _revocations[credentialHash];
        return (record.isRevoked, record.revokedBy, record.reason, record.revokedAt);
    }

    /**
     * @notice Cancel a revocation in case of administrative rectification
     */
    function cancelRevocation(bytes32 credentialHash) external {
        RevocationRecord storage record = _revocations[credentialHash];
        require(record.isRevoked, "Credential is not revoked");
        require(record.revokedBy == msg.sender, "Only the revoking issuer can cancel revocation");

        record.isRevoked = false;
        emit RevocationCancelled(credentialHash, msg.sender);
    }
}

