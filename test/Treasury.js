const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Treasury", function () {
  async function deploy() {
    const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy();
    await treasury.connect(otherAccount1).storeFunds({ value: 100 });

    return { treasury, owner, otherAccount1, otherAccount2 };
  }

  async function deployV2() {
    const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy();

    return { treasury, owner, otherAccount1, otherAccount2 };
  }

  async function deployVotesYES() {
    const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory("Treasury", owner);
    const treasury = await Treasury.deploy();

    await treasury.connect(otherAccount1).storeFunds({ value: 100 });
    await treasury.connect(otherAccount2).storeFunds({ value: 1000 });
    await treasury.connect(owner).initiateWithdrawal(10, "Test", 120);
    await treasury.connect(otherAccount1).vote(1, 1, 1);
    await treasury.connect(otherAccount2).vote(1, 10, 1);

    return { treasury, owner, otherAccount1, otherAccount2 };
  }

  async function deployVotesNO() {
    const [owner, otherAccount1, otherAccount2, otherAccount3] =
      await ethers.getSigners();

    const Treasury = await ethers.getContractFactory("Treasury", owner);
    const treasury = await Treasury.deploy();

    await treasury.connect(otherAccount1).storeFunds({ value: 100 });
    await treasury.connect(otherAccount2).storeFunds({ value: 1000 });
    await treasury.connect(owner).initiateWithdrawal(10, "Test", 120);
    await treasury.connect(otherAccount1).vote(1, 1, 1);
    await treasury.connect(otherAccount2).vote(1, 10, 0);

    return { treasury, owner, otherAccount1, otherAccount2, otherAccount3 };
  }

  describe("UnlockTokens", function () {
    it("Should revert if the msg.sender has not participated", async function () {
      const { treasury, otherAccount1, otherAccount3 } = await loadFixture(
        deployVotesNO
      );
      await expect(
        treasury.connect(otherAccount3).unlockTokens(1, otherAccount1)
      ).to.revertedWith("Not stakeholder");
    });
    it("Should transfer the funds to the specified address", async function () {
      const { treasury, otherAccount1, otherAccount3 } = await loadFixture(
        deployVotesNO
      );
      time.increase(160);
      await expect(
        treasury.connect(otherAccount1).unlockTokens(1, otherAccount3)
      ).to.changeTokenBalances(treasury, [treasury, otherAccount3], [-1, 1]);
    });
  });

  describe("StoreFunds", function () {
    it("Should revet if msg.value is 0", async function () {
      const { treasury } = await loadFixture(deploy);

      await expect(treasury.storeFunds({ value: 0 })).to.be.revertedWith(
        "Not enough ether sent"
      );
    });
    it("Should transfer funds to stakeholder", async function () {
      const { treasury, otherAccount1 } = await loadFixture(deployV2);

      await expect(
        treasury.connect(otherAccount1).storeFunds({ value: 100 })
      ).to.changeTokenBalance(treasury, otherAccount1, 1);
    });
  });

  describe("ExecuteWithdrawal", function () {
    it("Should revert if more people voted for no", async function () {
      const { treasury, owner, otherAccount2 } = await loadFixture(
        deployVotesNO
      );

      time.increase(130);
      await expect(
        treasury.connect(owner).executeWithdrawal(1, otherAccount2)
      ).to.be.revertedWith("The withdrawal is voted for NO");
    });
    it("Should translfer the funds to the specified address", async function () {
      const { treasury, owner, otherAccount2 } = await loadFixture(
        deployVotesYES
      );

      time.increase(130);
      await expect(
        treasury.connect(owner).executeWithdrawal(1, otherAccount2)
      ).to.changeEtherBalances([treasury, otherAccount2], [-10, 10]);
    });
  });

  describe("InitiateWithdrawal", function () {
    it("Should revert if the amount is too high", async function () {
      const { treasury } = await loadFixture(deploy);

      await expect(
        treasury.initiateWithdrawal(1000, "Test", 120)
      ).to.be.revertedWith("Amount is too high");
    });
    it("Should revert if amount is 0", async function () {
      const { treasury } = await loadFixture(deploy);
      await expect(
        treasury.initiateWithdrawal(0, "Test", 120)
      ).to.be.revertedWith("Noting to withdraw");
    });
    it("Should revert if voting duration is 0", async function () {
      const { treasury } = await loadFixture(deploy);
      await expect(
        treasury.initiateWithdrawal(10, "Test", 0)
      ).to.be.revertedWith("Increase voting duration");
    });
  });

  describe("Vote", function () {
    it("Should revert if id is 0", async function () {
      const { treasury, otherAccount1 } = await loadFixture(deploy);

      await treasury.initiateWithdrawal(10, "Test", 120);

      await expect(
        treasury.connect(otherAccount1).vote(0, 1, 0)
      ).to.be.revertedWith("Not active");
    });
    it("Should revert if the stakeholder does not have enough tokens", async function () {
      const { treasury, otherAccount1 } = await loadFixture(deploy);

      await treasury.initiateWithdrawal(10, "Test", 120);

      await expect(
        treasury.connect(otherAccount1).vote(1, 10000, 0)
      ).to.be.revertedWith("Not enough tokens");
    });
    it("Should transfer tokens to the contract then vote is called no", async function () {
      const { treasury, otherAccount1 } = await loadFixture(deploy);

      await treasury.initiateWithdrawal(10, "Test", 120);
      await expect(
        treasury.connect(otherAccount1).vote(1, 1, 0)
      ).to.changeTokenBalances(treasury, [treasury, otherAccount1], [1, -1]);
    });
    it("Should transfer tokens to the contract then vote is called yes", async function () {
      const { treasury, otherAccount1 } = await loadFixture(deploy);

      await treasury.initiateWithdrawal(10, "Test", 120);
      await expect(
        treasury.connect(otherAccount1).vote(1, 1, 1)
      ).to.changeTokenBalances(treasury, [treasury, otherAccount1], [1, -1]);
    });

    it("Should revert if it is called by not stakeholder", async function () {
      const { treasury, otherAccount2 } = await loadFixture(deploy);
      await treasury.initiateWithdrawal(10, "Test", 120);

      await expect(
        treasury.connect(otherAccount2).vote(1, 1, 0)
      ).to.be.revertedWith("Not stakeholder");
    });
  });
});
