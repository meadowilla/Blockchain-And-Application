import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Token", function () {
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("Token");
    token = await TokenFactory.deploy("Group08", "G8", owner.address);
    await token.deployed();
  });

  it("Should set the correct name and symbol", async function () {
    expect(await token.name()).to.equal("Group08");
    expect(await token.symbol()).to.equal("G8");
  });

  it("Should set the correct owner", async function () {
    expect(await token.owner()).to.equal(owner.address);
  });

  it("Should mint tokens only by owner", async function () {
    const amountMinted = ethers.utils.parseUnits("1000", 18);
    await token.mint(amountMinted); // Owner mints 1000 tokens
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.be.deep.equal(amountMinted);
  });

  it("Should fail if non-owner tries to mint", async function () {
    try {
      await token.connect(addr1).mint(ethers.utils.parseUnits("1000", 18));
      // If it gets here, the test should fail
      expect.fail("Expected transaction to revert, but it succeeded");
    } catch (error) {
      // Check revert reason (optional)
      expect(error.message).to.include("OwnableUnauthorizedAccount");
    }
  });
});
