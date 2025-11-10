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

    event MoodSubmitted(address indexed author, uint32 indexed entryNumber);
    event TrendAccessed(address indexed accessor, uint32 entryCount);

    error NoEntriesRecorded();
    error InvalidMoodScore();

    /// @notice Submit an encrypted mood score (1-5) to the diary.
    /// @param encryptedScore encrypted euint32 handle produced off-chain
    /// @param inputProof FHE input proof generated alongside the encrypted handle
    function submitMood(externalEuint32 encryptedScore, bytes calldata inputProof) external {
        euint32 moodScore = FHE.fromExternal(encryptedScore, inputProof);

        _encryptedTotalScore = FHE.add(_encryptedTotalScore, moodScore);

        unchecked {
            _entryCount += 1;
        }

        if (_entryCount == 1) {
            _encryptedTrend = moodScore;
        } else {
            _encryptedTrend = FHE.div(_encryptedTotalScore, _entryCount);
        }

        FHE.allowThis(_encryptedTotalScore);
        FHE.allowThis(_encryptedTrend);
        FHE.allow(_encryptedTotalScore, msg.sender);
        _sharedTrendHandles[msg.sender] = FHE.allow(_encryptedTrend, msg.sender);

        emit MoodSubmitted(msg.sender, _entryCount);
    }

    /// @notice Allows the caller to decrypt the current encrypted average.
    /// @dev Adds the caller to the allow-list, then returns the encrypted handle.
    function requestTrendHandle() external returns (euint32) {
        // BUG: Removed complete permission check logic (15 lines)
        // This allows any address to access encrypted trend without proper authorization
        FHE.allowThis(_encryptedTrend);
        euint32 personalisedHandle = FHE.allow(_encryptedTrend, msg.sender);
        _sharedTrendHandles[msg.sender] = personalisedHandle;

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
    function canDecryptTrend() external view returns (bool) {
        if (_entryCount == 0) {
            return false;
        }

        return FHE.isSenderAllowed(_sharedTrendHandles[msg.sender]);
    }
}
