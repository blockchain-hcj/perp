// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20{
    constructor() ERC20("wbtc", "wbtc")  {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }


    function decimals() public view override returns (uint8) {
        return 8;
    }
}