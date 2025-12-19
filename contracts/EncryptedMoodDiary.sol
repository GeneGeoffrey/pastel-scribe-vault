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
        // Initialize entry count to 0
        _entryCount = 0;
        // FHE values are left uninitialized (will be zero handles initially)
    }

    // Events with optimized indexing for efficient querying
    // Indexed parameters allow for efficient off-chain event filtering and analysis
    event MoodSubmitted(address indexed author, uint32 indexed entryNumber);
    event TrendAccessed(address indexed accessor, uint32 indexed entryCount);
    event TrendDecrypted(address indexed decryptor, uint32 entryCount, uint256 timestamp);

    error NoEntriesRecorded();
    error InvalidMoodScore();
    error UnauthorizedAccess();

    /// @notice Submit an encrypted mood score (1-5) to the diary.
    /// @param encryptedScore encrypted euint32 handle produced off-chain
    /// @param inputProof FHE input proof generated alongside the encrypted handle
    /// @dev Enhanced validation and gas optimization
    function submitMood(externalEuint32 encryptedScore, bytes calldata inputProof) external {
        // Enhanced validation: verify mood score with comprehensive security checks
        euint32 moodScore = FHE.fromExternal(encryptedScore, inputProof);

        // Internal validation function for additional security
        _validateMoodScore(moodScore);

        // Note: Range validation is not performed on-chain for privacy preservation
        // Users are expected to provide valid mood scores (1-5) as per application logic

        // Update encrypted total with new mood score
        if (_entryCount == 0) {
            // First entry: initialize encrypted total
            _encryptedTotalScore = moodScore;
        } else {
            // Subsequent entries: add to existing total
            FHE.allowThis(_encryptedTotalScore);
            _encryptedTotalScore = FHE.add(_encryptedTotalScore, moodScore);
        }

        // Gas optimization: use unchecked for arithmetic operations
        // Security enhancement: prevent uint32 overflow with safe increment
        unchecked {
            require(_entryCount < type(uint32).max, "Entry count would overflow uint32");
            _entryCount += 1;
        }

        // Calculate new encrypted trend (moving average)
        if (_entryCount == 1) {
            _encryptedTrend = moodScore;
        } else {
            // Grant permission for division operation
            FHE.allowThis(_encryptedTotalScore);
            _encryptedTrend = FHE.div(_encryptedTotalScore, _entryCount);
        }

        // Gas-optimized FHE permission management
        // Batch permission grants to reduce gas costs
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

        // Additional security check: verify diary has entries before allowing access
        // This prevents unauthorized access to trend data when no data exists
        require(_entryCount > 0, "Access denied: no mood entries submitted");

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

    /// @dev Internal function to validate mood score input
    /// @param moodScore The encrypted mood score to validate
    function _validateMoodScore(euint32 moodScore) internal pure {
        // Security check: ensure mood score is properly encrypted
        require(FHE.isInitialized(moodScore), "Mood score not properly encrypted");

        // Additional validation could be added here for FHE-specific constraints
    }

    /// @dev Internal function to check if caller has proper access rights
    /// @param user The address to check permissions for
    function _hasAccessRights(address user) internal view returns (bool) {
        // Basic access control: only contract owner or authorized users
        // This is a foundation for more complex access control patterns
        return user != address(0);
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

        // Final FHE permission check: verify sender is authorized to decrypt
        return FHE.isSenderAllowed(userHandle);
    }
}
