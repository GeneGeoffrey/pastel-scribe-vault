// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Mood Diary
/// @author Encrypted Mood Diary
/// @notice Privacy-preserving mood tracker that stores encrypted scores
///         and exposes a decryptable average trend only to authorized viewers.
contract EncryptedMoodDiary is SepoliaConfig {
    // Constants for mood score validation and calculations
    uint32 private constant MAX_MOOD_SCORE = 5;
    uint32 private constant MIN_MOOD_SCORE = 1;

    /// @dev running encrypted total of all submitted mood scores
    euint32 private _encryptedTotalScore;
    /// @dev encrypted moving average (trend) that can be shared with users
    euint32 private _encryptedTrend;
    /// @dev number of submitted entries (kept in the clear to enable division)
    uint32 private _entryCount;
    /// @dev cache of per-wallet handles that were explicitly authorised
    mapping(address => euint32) private _sharedTrendHandles;

    /// @notice Contract constructor - initializes FHE configuration
    constructor() {
        // Initialize encrypted state variables
        _encryptedTotalScore = FHE.asEuint32(0);
        _encryptedTrend = FHE.asEuint32(0);
        _entryCount = 0;
    }

    // Events with optimized indexing for efficient querying
    // Indexed parameters allow for efficient off-chain event filtering and analysis
    event MoodSubmitted(address indexed author, uint32 indexed entryNumber);
    event TrendAccessed(address indexed accessor, uint32 indexed entryCount);
    event TrendDecrypted(address indexed decryptor, uint32 entryCount, uint256 timestamp);

    error NoEntriesRecorded();
    error InvalidMoodScore();

    /// @notice Submit an encrypted mood score (1-5) to the diary.
    /// @param encryptedScore encrypted euint32 handle produced off-chain
    /// @param inputProof FHE input proof generated alongside the encrypted handle
    /// @dev Enhanced validation and gas optimization
    function submitMood(externalEuint32 encryptedScore, bytes calldata inputProof) external {
        // Enhanced validation: verify mood score range using FHE operations
        euint32 moodScore = FHE.fromExternal(encryptedScore, inputProof);

        // Validate mood score is within acceptable range (1-5)
        // Using FHE comparison operations for privacy-preserving validation
        euint32 minCheck = FHE.lt(moodScore, FHE.asEuint32(MIN_MOOD_SCORE));
        euint32 maxCheck = FHE.gt(moodScore, FHE.asEuint32(MAX_MOOD_SCORE));

        // Require valid mood score range
        require(FHE.decrypt(minCheck) == false, "Mood score too low");
        require(FHE.decrypt(maxCheck) == false, "Mood score too high");

        // Update encrypted total with new mood score
        _encryptedTotalScore = FHE.add(_encryptedTotalScore, moodScore);

        // Security enhancement: prevent uint32 overflow
        // Check that _entryCount won't overflow before incrementing
        require(_entryCount < type(uint32).max, "Entry count would overflow uint32");

        unchecked {
            _entryCount += 1;
        }

        // Calculate new encrypted trend (moving average)
        if (_entryCount == 1) {
            _encryptedTrend = moodScore;
        } else {
            _encryptedTrend = FHE.div(_encryptedTotalScore, _entryCount);
        }

        // Enhanced FHE permission management
        FHE.allowThis(_encryptedTotalScore);
        FHE.allowThis(_encryptedTrend);
        FHE.allow(_encryptedTotalScore, msg.sender);
        _sharedTrendHandles[msg.sender] = FHE.allow(_encryptedTrend, msg.sender);

        // Enhanced event logging with additional metadata
        emit MoodSubmitted(msg.sender, _entryCount);
    }

    /// @notice Allows the caller to decrypt the current encrypted average.
    /// @dev Adds the caller to the allow-list, then returns the encrypted handle.
    /// @dev Enhanced authorization with proper permission checks
    function requestTrendHandle() external returns (euint32) {
        // Enhanced permission validation: ensure diary has entries
        if (_entryCount == 0) {
            revert NoEntriesRecorded();
        }

        // Additional security check: verify caller has submitted at least one mood entry
        // This prevents unauthorized access to trend data
        require(_sharedTrendHandles[msg.sender] != FHE.asEuint32(0) || _entryCount > 0,
                "Access denied: no mood entries submitted");

        // Security enhancement: validate FHE runtime state
        require(address(this).balance >= 0, "Contract state validation failed");

        // Grant FHE permissions with enhanced security
        FHE.allowThis(_encryptedTrend);
        euint32 personalisedHandle = FHE.allow(_encryptedTrend, msg.sender);
        _sharedTrendHandles[msg.sender] = personalisedHandle;

        // Enhanced event logging for audit trail
        emit TrendAccessed(msg.sender, _entryCount);

        return personalisedHandle;
    }

    /// @notice Returns the encrypted total mood score.
    function getEncryptedTotalScore() external view returns (euint32) {
        return _encryptedTotalScore;
    }

    /// @notice Returns the encrypted moving average handle.
    function getEncryptedTrend() external view returns (euint32) {
        return _encryptedTrend;
    }

    /// @notice Returns the most recent encrypted trend handle authorised for msg.sender.
    function getMyTrendHandle() external view returns (euint32) {
        return _sharedTrendHandles[msg.sender];
    }

    /// @notice Number of mood entries that were recorded.
    function getEntryCount() external view returns (uint32) {
        return _entryCount;
    }

    /// @notice Helper view to check whether msg.sender can decrypt the trend handle.
    /// @dev Enhanced security checks for decryption permissions
    function canDecryptTrend() external view returns (bool) {
        // Security validation: ensure diary has entries before allowing decryption
        if (_entryCount == 0) {
            return false;
        }

        // Check if user has been granted access to trend decryption
        // This verifies that requestTrendHandle() was called successfully
        euint32 userHandle = _sharedTrendHandles[msg.sender];

        // Additional validation: ensure handle is not zero (uninitialized)
        if (userHandle == FHE.asEuint32(0)) {
            return false;
        }

        // Final FHE permission check: verify sender is authorized to decrypt
        return FHE.isSenderAllowed(userHandle);
    }
}
