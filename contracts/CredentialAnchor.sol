// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TrustRegistry.sol";

/**
 * @title CredentialAnchor
 * @dev Stores batch Merkle roots for verifiable credentials.
 * Enables issuing thousands of credentials in a single on-chain transaction.
 */
contract CredentialAnchor {
    TrustRegistry public immutable trustRegistry;

    struct BatchRecord {
        bytes32 merkleRoot;
        address issuer;
        string ipfsMetadataUri;
        uint256 totalCredentials;
        uint256 timestamp;
    }

    // Mapping from batchId => BatchRecord
    mapping(bytes32 => BatchRecord) private _batches;

    // Mapping from merkleRoot => batchId
    mapping(bytes32 => bytes32) private _rootToBatch;

    // Events
    event BatchAnchored(
        bytes32 indexed batchId,
        bytes32 indexed merkleRoot,
        address indexed issuer,
        string ipfsMetadataUri,
        uint256 totalCredentials,
        uint256 timestamp
    );

    constructor(address _trustRegistryAddress) {
        require(_trustRegistryAddress != address(0), "Invalid trust registry address");
        trustRegistry = TrustRegistry(_trustRegistryAddress);
    }

    /**
     * @notice Anchor a batch of credentials by submitting its Merkle root
     * @param merkleRoot The 32-byte Merkle root computed over the credential hashes
     * @param ipfsMetadataUri IPFS URI pointing to encrypted batch metadata / public manifest
     * @param totalCredentials Count of credentials represented in this Merkle tree
     */
    function anchorBatch(
        bytes32 merkleRoot,
        string calldata ipfsMetadataUri,
        uint256 totalCredentials
    ) external returns (bytes32 batchId) {
        require(trustRegistry.isIssuerTrusted(msg.sender), "Caller is not a trusted issuer");
        require(merkleRoot != bytes32(0), "Invalid Merkle root");
        require(_rootToBatch[merkleRoot] == bytes32(0), "Batch root already anchored");

        batchId = keccak256(abi.encodePacked(msg.sender, merkleRoot, block.timestamp));

        _batches[batchId] = BatchRecord({
            merkleRoot: merkleRoot,
            issuer: msg.sender,
            ipfsMetadataUri: ipfsMetadataUri,
            totalCredentials: totalCredentials,
            timestamp: block.timestamp
        });

        _rootToBatch[merkleRoot] = batchId;

        emit BatchAnchored(
            batchId,
            merkleRoot,
            msg.sender,
            ipfsMetadataUri,
            totalCredentials,
            block.timestamp
        );

        return batchId;
    }

    /**
     * @notice Verify if a specific Merkle root has been anchored on-chain
     */
    function isRootAnchored(bytes32 merkleRoot) external view returns (bool, bytes32 batchId, address issuer) {
        bytes32 id = _rootToBatch[merkleRoot];
        if (id == bytes32(0)) {
            return (false, bytes32(0), address(0));
        }
        return (true, id, _batches[id].issuer);
    }

    /**
     * @notice Get batch information by batch ID
     */
    function getBatch(bytes32 batchId) external view returns (
        bytes32 merkleRoot,
        address issuer,
        string memory ipfsMetadataUri,
        uint256 totalCredentials,
        uint256 timestamp
    ) {
        BatchRecord memory record = _batches[batchId];
        require(record.timestamp > 0, "Batch does not exist");
        return (
            record.merkleRoot,
            record.issuer,
            record.ipfsMetadataUri,
            record.totalCredentials,
            record.timestamp
        );
    }
}

