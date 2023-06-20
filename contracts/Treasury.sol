// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Treasury is ERC20 {

    uint256 private id;
    uint256 public totalBalance;
    address public owner;
    // takeholder address => amount they send
    mapping(address => uint256) public stakeholders;
    // id of WithdrawalRequest => WithdrawalRequest
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    // Stakeholder address => WithdrawalRequest.id => amount of tokens
    mapping(address => mapping(uint256 => uint256)) public voteForWithdrawalRequest;
    // Stakeholder address => amount of tokens they have
    mapping(address => uint256) public stakeholdersTokens;
    address[] public stakeholdersArray;

    event StoreFunds(address _sender, uint256 _value);
    event InitiateWithdrawal(uint256 indexed _id, uint256 _amount);
    event Vote(uint256 indexed _id, bool vote);
    event ExecuteWithdrawal(uint256 _id, address _to);

    struct WithdrawalRequest {
        uint256 id;
        uint256 amount;
        string description;
        uint256 votingDuration;
        uint256 initializationTime;
        uint256 yes;
        uint256 no;
    }

    constructor() ERC20("YoanToken", "YOT") {
        owner = msg.sender;
        _mint(msg.sender, 100000);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyStakeholders() {
        bool isFound = false;
        for(uint256 i = 0; i < stakeholdersArray.length; i++) {
            if(msg.sender == stakeholdersArray[i]) {
                isFound = true;
            }
        }
        if(!isFound) {
            revert("Not stakeholder");
        }
        _;
    }

    modifier activeWithdrawalRequest(uint256 _id) {
        require(withdrawalRequests[_id].initializationTime + withdrawalRequests[_id].votingDuration > block.timestamp, "Not active");
        _;
    }

    modifier notActiveWithdrawalRequest(uint256 _id) {
        require(withdrawalRequests[_id].initializationTime + withdrawalRequests[_id].votingDuration < block.timestamp, "Active");
        _;
    }

    function storeFunds() public payable {
        require(msg.value >= 1, "Not enough ether sent");
        uint256 amount = msg.value / 100;
        totalBalance += msg.value;
        stakeholders[msg.sender] = msg.value;
        stakeholdersArray.push(msg.sender);
        stakeholdersTokens[msg.sender] = amount;
        _transfer(owner, msg.sender, amount);
        emit StoreFunds(msg.sender, msg.value);
    }

    function initiateWithdrawal(uint256 _amount, string memory _description, uint256 _votingDuration) public onlyOwner {
        require(totalBalance >= _amount, "Amount is too high");
        require(_amount >= 1, "Noting to withdraw");
        require(_votingDuration >= 1, "Increase voting duration");
        id++;
        withdrawalRequests[id] = WithdrawalRequest(id, _amount, _description, _votingDuration, block.timestamp, 0, 0);
        emit InitiateWithdrawal(id, _amount);
    }

    function vote(uint256 _id, uint256 _tokenAmount, bool _vote) public activeWithdrawalRequest(_id) onlyStakeholders {
        require(id > 0, "Enter a valid id");
        require(_tokenAmount > 0, "Cannot send 0 tokens");
        require(stakeholdersTokens[msg.sender] >= _tokenAmount, "Not enough tokens");
        if(_vote) {
            withdrawalRequests[_id].yes += _tokenAmount;
            _transfer(msg.sender, address(this), _tokenAmount);
            stakeholdersTokens[msg.sender] -= _tokenAmount;
            voteForWithdrawalRequest[msg.sender][_id] = _tokenAmount;
        }
        if(!_vote) {
            withdrawalRequests[_id].no += _tokenAmount;
            _transfer(msg.sender, address(this), _tokenAmount);
            stakeholdersTokens[msg.sender] -= _tokenAmount;
            voteForWithdrawalRequest[msg.sender][_id] = _tokenAmount;
        }
        emit Vote(_id, _vote);
    }

    function executeWithdrawal(uint256 _id, address _to) public onlyOwner notActiveWithdrawalRequest(_id) {
        require(withdrawalRequests[_id].yes > withdrawalRequests[_id].no, "The withdrawal is voted for NO");
        uint256 amount = withdrawalRequests[_id].amount;
        withdrawalRequests[_id].amount = 0;
        totalBalance -= amount;
        (bool success,) = payable(_to).call{value: amount}("");
        require(success, "Not successful");
        emit ExecuteWithdrawal(_id, _to);
    }

    function unlockTokens(uint256 _id, address _to) public onlyStakeholders notActiveWithdrawalRequest(_id) {
        uint256 amount = voteForWithdrawalRequest[msg.sender][_id];
        _transfer(address(this), _to, amount);
    }

    receive() external payable  {
        totalBalance += msg.value;
    }
}
