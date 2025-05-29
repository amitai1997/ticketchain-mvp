// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock contract for testing re-entrancy protection
contract MaliciousBuyer {
    address public marketplace;
    bool public attacking;
    uint256 public attackCount;
    
    constructor(address _marketplace) {
        marketplace = _marketplace;
    }
    
    function attack(uint256 listingId) external payable {
        attacking = true;
        attackCount = 0;
        
        // Call purchaseListing
        (bool success,) = marketplace.call{value: msg.value}(
            abi.encodeWithSignature("purchaseListing(uint256)", listingId)
        );
        require(success, "Attack failed");
    }
    
    // Receive function that attempts re-entrancy
    receive() external payable {
        if (attacking && attackCount < 2) {
            attackCount++;
            // Try to re-enter purchaseListing
            marketplace.call{value: 0}(
                abi.encodeWithSignature("purchaseListing(uint256)", 1)
            );
            // Don't revert on failure to allow testing
        }
    }
    
    // Fallback for any other calls
    fallback() external payable {
        // Do nothing
    }
}
